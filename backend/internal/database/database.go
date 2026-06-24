package database

import (
	"log"
	"os"
	"path/filepath"

	"baby-backend/internal/models"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Init(dbPath string) {
	// ensure data directory exists
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		log.Fatalf("Failed to create data directory: %v", err)
	}

	var err error
	DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Auto-migrate all models
	if err := DB.AutoMigrate(
		&models.User{},
		&models.Baby{},
		&models.FamilySpace{},
		&models.FamilyMember{},
		&models.InviteRecord{},
		&models.TimelineEntry{},
		&models.EntryComment{},
		&models.EntryLike{},
		&models.EventAlbum{},
		&models.AlbumPhoto{},
		&models.Milestone{},
		&models.Capsule{},
		&models.CreativeWork{},
		&models.HealthRecord{},
	); err != nil {
		log.Fatalf("Failed to auto-migrate: %v", err)
	}

	// Seed demo data if database is empty
	var userCount int64
	DB.Model(&models.User{}).Count(&userCount)
	if userCount == 0 {
		seed()
	}

	log.Println("Database connected and migrated successfully")
}

func Close() {
	sqlDB, err := DB.DB()
	if err != nil {
		log.Printf("Failed to get underlying sql.DB: %v", err)
		return
	}
	if err := sqlDB.Close(); err != nil {
		log.Printf("Failed to close database: %v", err)
	}
}
