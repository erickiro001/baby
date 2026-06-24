package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Username     string         `gorm:"uniqueIndex;size:64;not null" json:"username"`
	Name         string         `gorm:"size:64;not null;default:''" json:"name"`
	Email        string         `gorm:"uniqueIndex;size:128;not null" json:"email"`
	PasswordHash string         `gorm:"size:256;not null" json:"-"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}
