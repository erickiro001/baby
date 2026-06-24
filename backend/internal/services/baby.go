package services

import (
	"errors"

	"baby-backend/internal/database"
	"baby-backend/internal/models"

	"gorm.io/gorm"
)

// ═══ Baby ═══

type BabyService struct{}

func (s *BabyService) List(userID uint) ([]models.Baby, error) {
	var babies []models.Baby
	err := database.DB.Where("user_id = ?", userID).Order("created_at DESC").Find(&babies).Error
	return babies, err
}

func (s *BabyService) GetByID(id uint, userID uint) (*models.Baby, error) {
	var baby models.Baby
	err := database.DB.Where("id = ? AND user_id = ?", id, userID).First(&baby).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errors.New("baby not found")
	}
	return &baby, err
}

func (s *BabyService) Create(userID uint, input CreateBabyInput) (*models.Baby, error) {
	baby := models.Baby{
		UserID:      userID,
		Name:        input.Name,
		Birthday:    input.Birthday,
		Gender:      input.Gender,
		Avatar:      input.Avatar,
		BloodType:   input.BloodType,
		BirthWeight: input.BirthWeight,
		BirthHeight: input.BirthHeight,
		Notes:       input.Notes,
	}
	err := database.DB.Create(&baby).Error
	return &baby, err
}

func (s *BabyService) Update(id, userID uint, input UpdateBabyInput) (*models.Baby, error) {
	var baby models.Baby
	if err := database.DB.Where("id = ? AND user_id = ?", id, userID).First(&baby).Error; err != nil {
		return nil, errors.New("baby not found")
	}
	if input.Name != nil {
		baby.Name = *input.Name
	}
	if input.Birthday != nil {
		baby.Birthday = *input.Birthday
	}
	if input.Gender != nil {
		baby.Gender = *input.Gender
	}
	if input.Avatar != nil {
		baby.Avatar = *input.Avatar
	}
	if input.BloodType != nil {
		baby.BloodType = *input.BloodType
	}
	if input.BirthWeight != nil {
		baby.BirthWeight = *input.BirthWeight
	}
	if input.BirthHeight != nil {
		baby.BirthHeight = *input.BirthHeight
	}
	if input.Notes != nil {
		baby.Notes = *input.Notes
	}
	err := database.DB.Save(&baby).Error
	return &baby, err
}

func (s *BabyService) Delete(id, userID uint) error {
	result := database.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Baby{})
	if result.RowsAffected == 0 {
		return errors.New("baby not found")
	}
	return result.Error
}

type CreateBabyInput struct {
	Name        string `json:"name" binding:"required"`
	Birthday    string `json:"birthday" binding:"required"`
	Gender      string `json:"gender" binding:"required,oneof=boy girl"`
	Avatar      string `json:"avatar"`
	BloodType   string `json:"blood_type"`
	BirthWeight string `json:"birth_weight"`
	BirthHeight string `json:"birth_height"`
	Notes       string `json:"notes"`
}

type UpdateBabyInput struct {
	Name        *string `json:"name"`
	Birthday    *string `json:"birthday"`
	Gender      *string `json:"gender"`
	Avatar      *string `json:"avatar"`
	BloodType   *string `json:"blood_type"`
	BirthWeight *string `json:"birth_weight"`
	BirthHeight *string `json:"birth_height"`
	Notes       *string `json:"notes"`
}

// ═══ HealthRecord ═══

type HealthService struct{}

func (s *HealthService) List(babyID uint) ([]models.HealthRecord, error) {
	var records []models.HealthRecord
	err := database.DB.Where("baby_id = ?", babyID).Order("date ASC").Find(&records).Error
	return records, err
}

func (s *HealthService) Create(input CreateHealthInput) (*models.HealthRecord, error) {
	r := models.HealthRecord{
		BabyID:           input.BabyID,
		Date:             input.Date,
		Weight:           input.Weight,
		Height:           input.Height,
		HeadCircumference: input.HeadCircumference,
		Note:             input.Note,
	}
	err := database.DB.Create(&r).Error
	return &r, err
}

func (s *HealthService) Delete(id uint) error {
	result := database.DB.Delete(&models.HealthRecord{}, id)
	if result.RowsAffected == 0 {
		return errors.New("record not found")
	}
	return result.Error
}

type CreateHealthInput struct {
	BabyID           uint     `json:"baby_id" binding:"required"`
	Date             string   `json:"date" binding:"required"`
	Weight           *float64 `json:"weight"`
	Height           *float64 `json:"height"`
	HeadCircumference *float64 `json:"head_circumference"`
	Note             string   `json:"note"`
}
