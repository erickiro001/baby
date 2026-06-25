package services

import (
	"errors"
	"strings"
	"time"

	"baby-backend/internal/database"
	"baby-backend/internal/models"
	"baby-backend/internal/utils"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

const bcryptCost = 12

type AuthService struct {
	JWTExpireDuration time.Duration
}

type RegisterInput struct {
	Username string `json:"username" binding:"required,min=3,max=64"`
	Name     string `json:"name" binding:"max=64"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6,max=128"`
}

type LoginInput struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type AuthResult struct {
	Token string       `json:"token"`
	User  UserSafeView `json:"user"`
}

type UserSafeView struct {
	ID       uint   `json:"id"`
	Username string `json:"username"`
	Name     string `json:"name"`
	Avatar   string `json:"avatar"`
	Email    string `json:"email"`
}

type UpdateProfileInput struct {
	Name   string `json:"name" binding:"max=64"`
	Avatar string `json:"avatar" binding:"max=512"`
}

type ChangePasswordInput struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=6,max=128"`
}

func NewAuthService(jwtExpire time.Duration) *AuthService {
	return &AuthService{JWTExpireDuration: jwtExpire}
}

func (s *AuthService) Register(input RegisterInput) (*AuthResult, error) {
	var existing models.User
	err := database.DB.Where("username = ?", input.Username).First(&existing).Error
	if err == nil {
		return nil, errors.New("username already taken")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errors.New("database error")
	}

	err = database.DB.Where("email = ?", input.Email).First(&existing).Error
	if err == nil {
		return nil, errors.New("email already registered")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errors.New("database error")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcryptCost)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}

	displayName := input.Username
	if input.Name != "" {
		displayName = strings.TrimSpace(input.Name)
	}

	user := models.User{
		Username:     input.Username,
		Name:         displayName,
		Email:        input.Email,
		PasswordHash: string(hash),
	}

	if err := database.DB.Create(&user).Error; err != nil {
		return nil, errors.New("failed to create user")
	}

	token, err := utils.GenerateToken(user.ID, user.Username, displayName, s.JWTExpireDuration)
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	return &AuthResult{
		Token: token,
		User: UserSafeView{
			ID:       user.ID,
			Username: user.Username,
			Name:     displayName,
			Avatar:   user.Avatar,
			Email:    user.Email,
		},
	}, nil
}

func (s *AuthService) Login(input LoginInput) (*AuthResult, error) {
	var user models.User
	err := database.DB.Where("username = ? OR email = ?", input.Username, input.Username).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errors.New("invalid username or password")
	}
	if err != nil {
		return nil, errors.New("database error")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		return nil, errors.New("invalid username or password")
	}

	displayName := user.Name
	if displayName == "" {
		displayName = user.Username
	}

	token, err := utils.GenerateToken(user.ID, user.Username, displayName, s.JWTExpireDuration)
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	return &AuthResult{
		Token: token,
		User: UserSafeView{
			ID:       user.ID,
			Username: user.Username,
			Name:     displayName,
			Avatar:   user.Avatar,
			Email:    user.Email,
		},
	}, nil
}

func (s *AuthService) UpdateProfile(userID uint, input UpdateProfileInput) (*UserSafeView, error) {
	updates := map[string]interface{}{}
	if input.Name != "" {
		updates["name"] = strings.TrimSpace(input.Name)
	}
	if input.Avatar != "" {
		updates["avatar"] = input.Avatar
	}
	if len(updates) == 0 {
		return nil, errors.New("nothing to update")
	}

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		return nil, errors.New("user not found")
	}
	if err := database.DB.Model(&user).Updates(updates).Error; err != nil {
		return nil, errors.New("failed to update profile")
	}

	database.DB.First(&user, userID)

	return &UserSafeView{
		ID:       user.ID,
		Username: user.Username,
		Name:     user.Name,
		Avatar:   user.Avatar,
		Email:    user.Email,
	}, nil
}

func (s *AuthService) ChangePassword(userID uint, input ChangePasswordInput) error {
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		return errors.New("user not found")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.OldPassword)); err != nil {
		return errors.New("原密码错误")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcryptCost)
	if err != nil {
		return errors.New("failed to hash password")
	}
	user.PasswordHash = string(hash)
	return database.DB.Save(&user).Error
}
