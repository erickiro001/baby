package services

import (
	"errors"
	"strings"

	"baby-backend/internal/database"
	"baby-backend/internal/models"

	"gorm.io/gorm"
)

// ═══ Timeline ═══

type TimelineService struct{}

func (s *TimelineService) List(babyID uint, userID uint, filter FilterInput) ([]models.TimelineEntry, error) {
	tx := database.DB.Where("baby_id = ?", babyID)

	switch filter.Type {
	case "featured":
		tx = tx.Where("featured = ?", true)
	case "member":
		tx = tx.Where("author_name = ?", filter.Name)
	case "content":
		tx = tx.Where("type = ?", filter.ContentType)
	}

	var entries []models.TimelineEntry
	err := tx.Preload("Comments").Order("date DESC").Find(&entries).Error
	if err != nil {
		return nil, err
	}

	// Compute liked flag per entry for the current user
	if userID > 0 {
		entryIDs := make([]uint, len(entries))
		for i, e := range entries {
			entryIDs[i] = e.ID
		}
		var likedIDs []uint
		database.DB.Model(&models.EntryLike{}).Where("user_id = ? AND entry_id IN ?", userID, entryIDs).Pluck("entry_id", &likedIDs)
		likedSet := make(map[uint]bool, len(likedIDs))
		for _, id := range likedIDs {
			likedSet[id] = true
		}
		for i := range entries {
			entries[i].Liked = likedSet[entries[i].ID]
		}
	}

	return entries, nil
}

func (s *TimelineService) GetByID(id uint) (*models.TimelineEntry, error) {
	var entry models.TimelineEntry
	err := database.DB.Preload("Comments").First(&entry, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errors.New("entry not found")
	}
	return &entry, err
}

func (s *TimelineService) Create(userID uint, input CreateEntryInput) (*models.TimelineEntry, error) {
	// Look up current user name & avatar
	var user models.User
	authorName := ""
	authorAvatar := ""
	if err := database.DB.Select("name", "avatar", "username").First(&user, userID).Error; err == nil {
		authorName = user.Name
		if authorName == "" {
			authorName = user.Username
		}
		authorAvatar = user.Avatar
	}

	entry := models.TimelineEntry{
		BabyID:         input.BabyID,
		AuthorID:       userID,
		AuthorName:     authorName,
		AuthorAvatar:   authorAvatar,
		Type:           input.Type,
		Date:           input.Date,
		Description:    input.Description,
		Images:         input.Images,
		ImageURL:       input.ImageURL,
		VideoURL:       input.VideoURL,
		Tags:           prefixHashTags(input.Tags),
		MilestoneTitle: input.MilestoneTitle,
	}
	err := database.DB.Create(&entry).Error
	return &entry, err
}

func (s *TimelineService) Delete(id uint) error {
	result := database.DB.Delete(&models.TimelineEntry{}, id)
	if result.RowsAffected == 0 {
		return errors.New("entry not found")
	}
	// 清理 album_photos 关联并重新计算各相册的 photo_count
	database.DB.Where("entry_id = ?", id).Delete(&models.AlbumPhoto{})
	// 重新计算所有相册的 photo_count（简单方案：全量重算）
	rows, err := database.DB.Raw(`
		UPDATE event_albums
		SET photo_count = (SELECT COUNT(*) FROM album_photos WHERE album_photos.album_id = event_albums.id AND album_photos.deleted_at IS NULL)
		WHERE deleted_at IS NULL
	`).Rows()
	if err != nil {
		return err
	}
	rows.Close()
	return nil
}

func (s *TimelineService) ToggleFeatured(id uint) (*models.TimelineEntry, error) {
	var entry models.TimelineEntry
	if err := database.DB.First(&entry, id).Error; err != nil {
		return nil, errors.New("entry not found")
	}
	entry.Featured = !entry.Featured
	err := database.DB.Save(&entry).Error
	return &entry, err
}

// ═══ Like ═══

func (s *TimelineService) ToggleLike(entryID, userID uint) (bool, error) {
	var like models.EntryLike
	err := database.DB.Where("entry_id = ? AND user_id = ?", entryID, userID).First(&like).Error
	if err == nil {
		// Unlike
		database.DB.Delete(&like)
		database.DB.Model(&models.TimelineEntry{}).Where("id = ?", entryID).
			UpdateColumn("likes_count", gorm.Expr("likes_count - 1"))
		return false, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return false, err
	}
	// Like
	database.DB.Create(&models.EntryLike{EntryID: entryID, UserID: userID})
	database.DB.Model(&models.TimelineEntry{}).Where("id = ?", entryID).
		UpdateColumn("likes_count", gorm.Expr("likes_count + 1"))
	return true, nil
}

// ═══ Comment ═══

func (s *TimelineService) AddComment(entryID, userID uint, text string) (*models.EntryComment, error) {
	var user models.User
	authorName := ""
	authorAvatar := ""
	if err := database.DB.Select("name", "avatar", "username").First(&user, userID).Error; err == nil {
		authorName = user.Name
		if authorName == "" {
			authorName = user.Username
		}
		authorAvatar = user.Avatar
	}

	comment := models.EntryComment{
		EntryID:      entryID,
		UserID:       userID,
		AuthorName:   authorName,
		AuthorAvatar: authorAvatar,
		Text:         text,
	}
	err := database.DB.Create(&comment).Error
	return &comment, err
}

func (s *TimelineService) DeleteComment(commentID uint) error {
	result := database.DB.Delete(&models.EntryComment{}, commentID)
	if result.RowsAffected == 0 {
		return errors.New("comment not found")
	}
	return result.Error
}

// ═══ Input types ═══

type FilterInput struct {
	Type        string `json:"type" form:"type"`
	Name        string `json:"name" form:"name"`
	ContentType string `json:"content_type" form:"content_type"`
}

type CreateEntryInput struct {
	BabyID         uint     `json:"baby_id" binding:"required"`
	Type           string   `json:"type" binding:"required,oneof=photo video text milestone"`
	Date           string   `json:"date" binding:"required"`
	Description    string   `json:"description"`
	Images         []string `json:"images"`
	ImageURL       string   `json:"image_url"`
	VideoURL       string   `json:"video_url"`
	Tags           []string `json:"tags"`
	MilestoneTitle string   `json:"milestone_title"`
}

func prefixHashTags(tags []string) models.StringSlice {
	if tags == nil {
		return nil
	}
	out := make(models.StringSlice, 0, len(tags))
	for _, t := range tags {
		t = strings.TrimSpace(t)
		if t == "" {
			continue
		}
		if !strings.HasPrefix(t, "#") {
			t = "#" + t
		}
		out = append(out, t)
	}
	return out
}
