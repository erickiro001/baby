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
	Email    string `json:"email"`
}

func NewAuthService(jwtExpire time.Duration) *AuthService {
	return &AuthService{JWTExpireDuration: jwtExpire}
}

func (s *AuthService) Register(input RegisterInput) (*AuthResult, error) {
	// check if username already exists
	var existing models.User
	err := database.DB.Where("username = ?", input.Username).First(&existing).Error
	if err == nil {
		return nil, errors.New("username already taken")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errors.New("database error")
	}

	// check if email already exists
	err = database.DB.Where("email = ?", input.Email).First(&existing).Error
	if err == nil {
		return nil, errors.New("email already registered")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errors.New("database error")
	}

	// hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcryptCost)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}

	// create user
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

	// generate JWT
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
			Email:    user.Email,
		},
	}, nil
}

func (s *AuthService) Login(input LoginInput) (*AuthResult, error) {
	// find user by username or email
	var user models.User
	err := database.DB.Where("username = ? OR email = ?", input.Username, input.Username).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errors.New("invalid username or password")
	}
	if err != nil {
		return nil, errors.New("database error")
	}

	// verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		return nil, errors.New("invalid username or password")
	}

	displayName := user.Name
	if displayName == "" {
		displayName = user.Username
	}

	// generate JWT
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
			Email:    user.Email,
		},
	}, nil
}
