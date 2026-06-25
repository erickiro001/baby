package services

import (
	"errors"
	"time"

	"baby-backend/internal/database"
	"baby-backend/internal/models"

	"gorm.io/gorm"
)

// ═══ Album ═══

type AlbumService struct{}

func (s *AlbumService) List(userID uint) ([]models.EventAlbum, error) {
	var albums []models.EventAlbum
	err := database.DB.Where("user_id = ?", userID).Order("created_at DESC").Find(&albums).Error
	return albums, err
}

func (s *AlbumService) Create(userID uint, input CreateAlbumInput) (*models.EventAlbum, error) {
	album := models.EventAlbum{
		UserID:      userID,
		Title:       input.Title,
		CoverImage:  input.CoverImage,
		Description: input.Description,
	}
	err := database.DB.Create(&album).Error
	return &album, err
}

func (s *AlbumService) AddPhotos(albumID uint, entryIDs []uint) error {
	for _, entryID := range entryIDs {
		ap := models.AlbumPhoto{
			AlbumID: albumID,
			EntryID: entryID,
			AddedAt: time.Now(),
		}
		err := database.DB.Create(&ap).Error
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			continue
		}
		if err != nil {
			return err
		}
	}
	// update photo_count
	var count int64
	database.DB.Model(&models.AlbumPhoto{}).Where("album_id = ?", albumID).Count(&count)
	database.DB.Model(&models.EventAlbum{}).Where("id = ?", albumID).Update("photo_count", count)

	// auto-set cover: if album has no cover, use the earliest photo (by date)
	var album models.EventAlbum
	if err := database.DB.First(&album, albumID).Error; err != nil {
		return err
	}
	if album.CoverImage == "" {
		// find the earliest entry by date among all album photos
		var earliest models.TimelineEntry
		err := database.DB.
			Joins("JOIN album_photos ON album_photos.entry_id = timeline_entries.id").
			Where("album_photos.album_id = ?", albumID).
			Order("timeline_entries.date ASC").
			First(&earliest).Error
		if err == nil {
			cover := earliest.ImageURL
			if cover == "" && len(earliest.Images) > 0 {
				cover = earliest.Images[0]
			}
			if cover != "" {
				database.DB.Model(&models.EventAlbum{}).Where("id = ?", albumID).Update("cover_image", cover)
			}
		}
	}
	return nil
}

func (s *AlbumService) RemovePhotos(albumID uint, entryIDs []uint) error {
	database.DB.Where("album_id = ? AND entry_id IN ?", albumID, entryIDs).Delete(&models.AlbumPhoto{})
	var count int64
	database.DB.Model(&models.AlbumPhoto{}).Where("album_id = ?", albumID).Count(&count)
	database.DB.Model(&models.EventAlbum{}).Where("id = ?", albumID).Update("photo_count", count)
	return nil
}

func (s *AlbumService) GetPhotos(albumID uint) ([]models.TimelineEntry, error) {
	var entryIDs []uint
	database.DB.Model(&models.AlbumPhoto{}).Where("album_id = ?", albumID).Pluck("entry_id", &entryIDs)
	if len(entryIDs) == 0 {
		return []models.TimelineEntry{}, nil
	}
	var entries []models.TimelineEntry
	err := database.DB.Where("id IN ?", entryIDs).Preload("Comments").Order("date DESC").Find(&entries).Error
	return entries, err
}

func (s *AlbumService) Delete(albumID uint) error {
	database.DB.Where("album_id = ?", albumID).Delete(&models.AlbumPhoto{})
	result := database.DB.Delete(&models.EventAlbum{}, albumID)
	if result.RowsAffected == 0 {
		return errors.New("album not found")
	}
	return result.Error
}

func (s *AlbumService) UpdateCover(albumID uint, coverImage string) error {
	result := database.DB.Model(&models.EventAlbum{}).Where("id = ?", albumID).Update("cover_image", coverImage)
	if result.RowsAffected == 0 {
		return errors.New("album not found")
	}
	return result.Error
}

type CreateAlbumInput struct {
	Title       string `json:"title" binding:"required"`
	CoverImage  string `json:"cover_image"`
	Description string `json:"description"`
}

// ═══ Family ═══

type FamilyService struct{}

func (s *FamilyService) List(userID uint) ([]models.FamilySpace, error) {
	var spaces []models.FamilySpace
	// Spaces where user is member
	subQuery := database.DB.Table("family_members").Select("space_id").Where("user_id = ?", userID)
	err := database.DB.Where("id IN (?) OR owner_id = ?", subQuery, userID).
		Preload("Members").Order("created_at DESC").Find(&spaces).Error
	return spaces, err
}

func (s *FamilyService) Create(userID uint, input CreateSpaceInput) (*models.FamilySpace, error) {
	space := models.FamilySpace{
		OwnerID:    userID,
		Name:       input.Name,
		InviteCode: input.InviteCode,
	}
	err := database.DB.Create(&space).Error
	if err != nil {
		return nil, err
	}
	// auto-add owner as member
	member := models.FamilyMember{
		SpaceID:    space.ID,
		UserID:     userID,
		Name:       input.OwnerName,
		Role:       "主人",
		Permission: "edit",
		IsOwner:    true,
	}
	database.DB.Create(&member)
	space.Members = []models.FamilyMember{member}
	return &space, nil
}

func (s *FamilyService) CreateInvite(spaceID uint, input CreateInviteInput) (*models.InviteRecord, error) {
	invite := models.InviteRecord{
		SpaceID:    spaceID,
		Code:       input.Code,
		Role:       input.Role,
		Permission: input.Permission,
		Status:     "active",
	}
	err := database.DB.Create(&invite).Error
	return &invite, err
}

func (s *FamilyService) Update(spaceID uint, name string) error {
	return database.DB.Model(&models.FamilySpace{}).Where("id = ?", spaceID).Update("name", name).Error
}

type CreateSpaceInput struct {
	Name       string `json:"name" binding:"required"`
	InviteCode string `json:"invite_code" binding:"required"`
	OwnerName  string `json:"owner_name" binding:"required"`
}

type CreateInviteInput struct {
	Code       string `json:"code" binding:"required"`
	Role       string `json:"role"`
	Permission string `json:"permission" binding:"required,oneof=edit view"`
}

// ═══ Capsule ═══

type CapsuleService struct{}

func (s *CapsuleService) List(userID uint) ([]models.Capsule, error) {
	var capsules []models.Capsule
	err := database.DB.Where("user_id = ?", userID).Order("created_date DESC").Find(&capsules).Error
	return capsules, err
}

func (s *CapsuleService) Create(userID uint, input CreateCapsuleInput) (*models.Capsule, error) {
	c := models.Capsule{
		UserID:      userID,
		Title:       input.Title,
		ContentType: input.ContentType,
		Content:     input.Content,
		UnlockDate:  input.UnlockDate,
		CreatedDate: input.CreatedDate,
	}
	err := database.DB.Create(&c).Error
	return &c, err
}

func (s *CapsuleService) Open(id uint) error {
	result := database.DB.Model(&models.Capsule{}).Where("id = ?", id).Update("is_opened", true)
	if result.RowsAffected == 0 {
		return errors.New("capsule not found")
	}
	return result.Error
}

type CreateCapsuleInput struct {
	Title       string `json:"title" binding:"required"`
	ContentType string `json:"content_type" binding:"required,oneof=text photo video"`
	Content     string `json:"content" binding:"required"`
	UnlockDate  string `json:"unlock_date" binding:"required"`
	CreatedDate string `json:"created_date" binding:"required"`
}

// ═══ Milestone ═══

type MilestoneService struct{}

func (s *MilestoneService) List(babyID uint) ([]models.Milestone, error) {
	var ms []models.Milestone
	err := database.DB.Where("baby_id = ?", babyID).Order("date DESC").Find(&ms).Error
	return ms, err
}

func (s *MilestoneService) Create(input CreateMilestoneInput) (*models.Milestone, error) {
	m := models.Milestone{
		BabyID:      input.BabyID,
		Type:        input.Type,
		Title:       input.Title,
		Date:        input.Date,
		Description: input.Description,
	}
	err := database.DB.Create(&m).Error
	return &m, err
}

func (s *MilestoneService) Delete(id uint) error {
	result := database.DB.Delete(&models.Milestone{}, id)
	if result.RowsAffected == 0 {
		return errors.New("milestone not found")
	}
	return result.Error
}

type CreateMilestoneInput struct {
	BabyID      uint   `json:"baby_id" binding:"required"`
	Type        string `json:"type" binding:"required,oneof=milestone event"`
	Title       string `json:"title" binding:"required"`
	Date        string `json:"date" binding:"required"`
	Description string `json:"description"`
}

// ═══ CreativeWork ═══

type CreativeWorkService struct{}

func (s *CreativeWorkService) List(babyID uint) ([]models.CreativeWork, error) {
	var works []models.CreativeWork
	err := database.DB.Where("baby_id = ?", babyID).Order("date DESC").Find(&works).Error
	return works, err
}

func (s *CreativeWorkService) Create(input CreateCreativeWorkInput) (*models.CreativeWork, error) {
	w := models.CreativeWork{
		BabyID:      input.BabyID,
		Title:       input.Title,
		Type:        input.Type,
		Description: input.Description,
		Images:      input.Images,
		ImageURL:    input.ImageURL,
		Date:        input.Date,
	}
	err := database.DB.Create(&w).Error
	return &w, err
}

func (s *CreativeWorkService) Delete(id uint) error {
	result := database.DB.Delete(&models.CreativeWork{}, id)
	if result.RowsAffected == 0 {
		return errors.New("work not found")
	}
	return result.Error
}

type CreateCreativeWorkInput struct {
	BabyID      uint     `json:"baby_id" binding:"required"`
	Title       string   `json:"title" binding:"required"`
	Type        string   `json:"type" binding:"required,oneof=drawing handcraft lego sandart photo video other"`
	Description string   `json:"description"`
	Images      []string `json:"images"`
	ImageURL    string   `json:"image_url"`
	Date        string   `json:"date" binding:"required"`
}
