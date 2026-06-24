package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"gorm.io/gorm"
)

// ═══════════════════════════════════════════
// Custom types for JSON columns
// ═══════════════════════════════════════════

type StringSlice []string

func (s StringSlice) Value() (driver.Value, error) {
	if s == nil {
		return "[]", nil
	}
	return json.Marshal(s)
}

func (s *StringSlice) Scan(value interface{}) error {
	if value == nil {
		*s = nil
		return nil
	}
	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return errors.New("failed to scan StringSlice")
	}
	if len(bytes) == 0 || string(bytes) == "[]" {
		*s = nil
		return nil
	}
	return json.Unmarshal(bytes, s)
}

// ═══════════════════════════════════════════
// Baby 宝宝档案
// ═══════════════════════════════════════════

type Baby struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	UserID       uint           `gorm:"index;not null" json:"user_id"`
	Name         string         `gorm:"size:64;not null" json:"name"`
	Birthday     string         `gorm:"size:16;not null" json:"birthday"` // "2006-01-02"
	Gender       string         `gorm:"size:8;not null" json:"gender"`   // "boy" | "girl"
	Avatar       string         `gorm:"size:512" json:"avatar"`
	BloodType    string         `gorm:"size:8" json:"blood_type"`
	BirthWeight  string         `gorm:"size:16" json:"birth_weight"`
	BirthHeight  string         `gorm:"size:16" json:"birth_height"`
	Notes        string         `gorm:"size:512" json:"notes"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

// ═══════════════════════════════════════════
// FamilySpace 家庭空间
// ═══════════════════════════════════════════

type FamilySpace struct {
	ID         uint           `gorm:"primaryKey" json:"id"`
	OwnerID    uint           `gorm:"index;not null" json:"owner_id"`
	Name       string         `gorm:"size:128;not null" json:"name"`
	InviteCode string         `gorm:"size:32;uniqueIndex;not null" json:"invite_code"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
	Members    []FamilyMember `gorm:"foreignKey:SpaceID" json:"members,omitempty"`
}

type FamilyMember struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	SpaceID    uint      `gorm:"index;not null" json:"space_id"`
	UserID     uint      `gorm:"index;not null" json:"user_id"`
	Name       string    `gorm:"size:64;not null" json:"name"`
	Avatar     string    `gorm:"size:512" json:"avatar"`
	Role       string    `gorm:"size:32;not null" json:"role"`
	Permission string    `gorm:"size:16;not null;default:view" json:"permission"` // "edit" | "view"
	IsOwner    bool      `gorm:"not null;default:false" json:"is_owner"`
	JoinedAt   time.Time `json:"joined_at"`
}

// ═══════════════════════════════════════════
// InviteRecord 邀请记录
// ═══════════════════════════════════════════

type InviteRecord struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	SpaceID     uint      `gorm:"index;not null" json:"space_id"`
	Code        string    `gorm:"size:32;index;not null" json:"code"`
	Role        string    `gorm:"size:32" json:"role"`
	Permission  string    `gorm:"size:16;not null;default:view" json:"permission"`
	Status      string    `gorm:"size:16;not null;default:active" json:"status"` // "active" | "used" | "expired"
	UsedByUserID *uint    `json:"used_by"`
	UsedAt      *time.Time `json:"used_at"`
	CreatedAt   time.Time `json:"created_at"`
}

// ═══════════════════════════════════════════
// TimelineEntry 时间线动态 （多态卡片）
// ═══════════════════════════════════════════

type TimelineEntry struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	BabyID         uint           `gorm:"index;not null" json:"baby_id"`
	AuthorID       uint           `gorm:"index;not null" json:"author_id"`
	AuthorName     string         `gorm:"size:64;not null" json:"author_name"`
	AuthorAvatar   string         `gorm:"size:512" json:"author_avatar"`
	Type           string         `gorm:"size:16;not null" json:"type"` // "photo" | "video" | "text" | "milestone"
	Date           string         `gorm:"size:32;not null" json:"date"`
	Description    string         `gorm:"size:2048" json:"description"`
	Images         StringSlice    `gorm:"type:text" json:"images,omitempty"`
	ImageURL       string         `gorm:"size:512" json:"image_url,omitempty"`
	Featured       bool           `gorm:"not null;default:false" json:"featured"`
	Tags           StringSlice    `gorm:"type:text" json:"tags,omitempty"`
	MilestoneTitle string         `gorm:"size:256" json:"milestone_title,omitempty"`
	LikesCount     int            `gorm:"not null;default:0" json:"likes"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations (loaded via Preload)
	Comments []EntryComment `gorm:"foreignKey:EntryID" json:"comments,omitempty"`

	// Computed (filled by AfterFind)
	AlbumIDs []uint `gorm:"-" json:"album_ids,omitempty"`
}

func (t *TimelineEntry) AfterFind(tx *gorm.DB) error {
	var ids []uint
	tx.Table("album_photos").Where("entry_id = ?", t.ID).Pluck("album_id", &ids)
	if len(ids) > 0 {
		t.AlbumIDs = ids
	}
	return nil
}

// ═══════════════════════════════════════════
// EntryComment 动态评论
// ═══════════════════════════════════════════

type EntryComment struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	EntryID      uint      `gorm:"index;not null" json:"entry_id"`
	UserID       uint      `gorm:"index;not null" json:"user_id"`
	AuthorName   string    `gorm:"size:64;not null" json:"author_name"`
	AuthorAvatar string    `gorm:"size:512" json:"author_avatar"`
	Text         string    `gorm:"size:1024;not null" json:"text"`
	CreatedAt    time.Time `json:"timestamp"`
}

// ═══════════════════════════════════════════
// EntryLike 动态点赞
// ═══════════════════════════════════════════

type EntryLike struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	EntryID   uint      `gorm:"uniqueIndex:uk_entry_user;index;not null" json:"entry_id"`
	UserID    uint      `gorm:"uniqueIndex:uk_entry_user;not null" json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
}

// ═══════════════════════════════════════════
// EventAlbum 事件相册
// ═══════════════════════════════════════════

type EventAlbum struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	UserID      uint           `gorm:"index;not null" json:"user_id"`
	Title       string         `gorm:"size:256;not null" json:"title"`
	CoverImage  string         `gorm:"size:512" json:"cover_image"`
	PhotoCount  int            `gorm:"not null;default:0" json:"photo_count"`
	Description string         `gorm:"size:1024" json:"description"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

// AlbumPhoto 相册-照片关联表 （N:N between EventAlbum and TimelineEntry）
type AlbumPhoto struct {
	ID      uint      `gorm:"primaryKey" json:"id"`
	AlbumID uint      `gorm:"uniqueIndex:uk_album_entry;not null" json:"album_id"`
	EntryID uint      `gorm:"uniqueIndex:uk_album_entry;not null" json:"entry_id"`
	AddedAt time.Time `json:"added_at"`
}

// ═══════════════════════════════════════════
// Milestone 成长里程碑
// ═══════════════════════════════════════════

type Milestone struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	BabyID      uint      `gorm:"index;not null" json:"baby_id"`
	Type        string    `gorm:"size:16;not null" json:"type"` // "milestone" | "event"
	Title       string    `gorm:"size:256;not null" json:"title"`
	Date        string    `gorm:"size:16;not null" json:"date"`
	Description string    `gorm:"size:1024" json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

// ═══════════════════════════════════════════
// Capsule 时间胶囊
// ═══════════════════════════════════════════

type Capsule struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	UserID      uint      `gorm:"index;not null" json:"user_id"`
	Title       string    `gorm:"size:256;not null" json:"title"`
	ContentType string    `gorm:"size:16;not null" json:"content_type"` // "text" | "photo" | "video"
	Content     string    `gorm:"type:text" json:"content"`
	UnlockDate  string    `gorm:"size:16;not null" json:"unlock_date"`
	CreatedDate string    `gorm:"size:16;not null" json:"created_date"`
	IsOpened    bool      `gorm:"not null;default:false" json:"is_opened"`
	CreatedAt   time.Time `json:"created_at"`
}

// ═══════════════════════════════════════════
// CreativeWork 创意作品
// ═══════════════════════════════════════════

type CreativeWork struct {
	ID          uint        `gorm:"primaryKey" json:"id"`
	BabyID      uint        `gorm:"index;not null" json:"baby_id"`
	Title       string      `gorm:"size:256;not null" json:"title"`
	Type        string      `gorm:"size:32;not null" json:"type"` // "drawing" | "handcraft" | "lego" | "sandart" | "photo" | "video" | "other"
	Description string      `gorm:"size:1024" json:"description"`
	Images      StringSlice `gorm:"type:text" json:"images,omitempty"`
	ImageURL    string      `gorm:"size:512" json:"image_url,omitempty"`
	Date        string      `gorm:"size:16;not null" json:"date"`
	CreatedAt   time.Time   `json:"created_at"`
}

// ═══════════════════════════════════════════
// HealthRecord 健康记录
// ═══════════════════════════════════════════

type HealthRecord struct {
	ID               uint      `gorm:"primaryKey" json:"id"`
	BabyID           uint      `gorm:"index;not null" json:"baby_id"`
	Date             string    `gorm:"size:16;not null" json:"date"`
	Weight           *float64  `json:"weight,omitempty"`
	Height           *float64  `json:"height,omitempty"`
	HeadCircumference *float64 `json:"head_circumference,omitempty"`
	Note             string    `gorm:"size:512" json:"note"`
	CreatedAt        time.Time `json:"created_at"`
}
