package database

import (
	"log"

	"baby-backend/internal/models"

	"golang.org/x/crypto/bcrypt"
)

func seed() {
	log.Println("Seeding demo data...")

	// ─── Demo User ───
	hash, _ := bcrypt.GenerateFromPassword([]byte("123456"), 12)
	user := models.User{
		Username:     "xixibaba",
		Name:         "嘻嘻爸爸",
		Email:        "xixibaba@example.com",
		PasswordHash: string(hash),
	}
	DB.Create(&user)

	// ─── Demo Baby ───
	baby := models.Baby{
		UserID:      user.ID,
		Name:        "嘻嘻",
		Birthday:    "2024-06-13",
		Gender:      "girl",
		BloodType:   "O",
		BirthWeight: "13kg",
		BirthHeight: "90cm",
		Notes:       "爱笑的小公主",
	}
	DB.Create(&baby)

	// ─── Family Space ───
	space := models.FamilySpace{
		OwnerID:    user.ID,
		Name:       "嘻嘻的家",
		InviteCode: "TANG2026",
	}
	DB.Create(&space)

	member := models.FamilyMember{
		SpaceID:    space.ID,
		UserID:     user.ID,
		Name:       "嘻嘻爸爸",
		Role:       "爸爸",
		Permission: "edit",
		IsOwner:    true,
	}
	DB.Create(&member)

	// ─── Invite ───
	DB.Create(&models.InviteRecord{
		SpaceID:    space.ID,
		Code:       "TANG2026",
		Role:       "爸爸",
		Permission: "edit",
		Status:     "active",
	})

	// ─── Timeline Entries ───
	entries := []models.TimelineEntry{
		{
			BabyID: baby.ID, AuthorID: user.ID, AuthorName: "嘻嘻爸爸",
			Type: "photo", Date: "2026-06-23T08:30:00",
			Description: "今天去公园野餐啦，嘻嘻看到了好多小花花！",
			Images:      models.StringSlice{"https://picsum.photos/seed/tang01/400/300", "https://picsum.photos/seed/tang02/400/400", "https://picsum.photos/seed/tang03/400/350", "https://picsum.photos/seed/tang04/400/300"},
			Featured:    true,
			Tags:        models.StringSlice{"#公园时光", "#野餐"},
			LikesCount:  15,
		},
		{
			BabyID: baby.ID, AuthorID: user.ID, AuthorName: "嘻嘻爸爸",
			Type: "milestone", Date: "2026-06-22T14:00:00",
			Description:    "嘻嘻今天终于学会爬了！从客厅这头爬到那头，好激动！",
			Featured:       true,
			Tags:           models.StringSlice{"#第一次爬行", "#大事件"},
			MilestoneTitle: "嘻嘻会爬了！",
			LikesCount:     32,
		},
		{
			BabyID: baby.ID, AuthorID: user.ID, AuthorName: "嘻嘻爸爸",
			Type: "video", Date: "2026-06-21T19:20:00",
			Description: "嘻嘻第一次吃辅食的视频，小表情太丰富了！",
			ImageURL:    "https://picsum.photos/seed/tangvid/400/225",
			Tags:        models.StringSlice{"#辅食日记", "#第一次"},
			LikesCount:  24,
		},
		{
			BabyID: baby.ID, AuthorID: user.ID, AuthorName: "嘻嘻爸爸",
			Type: "text", Date: "2026-06-20T21:00:00",
			Description: "今天带嘻嘻去做了六个月体检，医生说发育得很好。还打了疫苗，嘻嘻就哭了一下下，很快就笑了，真勇敢！",
			Tags:        models.StringSlice{"#体检", "#疫苗接种"},
			LikesCount:  8,
		},
		{
			BabyID: baby.ID, AuthorID: user.ID, AuthorName: "嘻嘻爸爸",
			Type: "photo", Date: "2026-06-10T16:00:00",
			Description: "第一次带嘻嘻去海边，她听到海浪声一脸懵",
			Images:      models.StringSlice{"https://picsum.photos/seed/tangbeach1/400/300", "https://picsum.photos/seed/tangbeach2/400/400", "https://picsum.photos/seed/tangbeach3/400/350"},
			Tags:        models.StringSlice{"#海边", "#第一次"},
			LikesCount:  28,
		},
		{
			BabyID: baby.ID, AuthorID: user.ID, AuthorName: "嘻嘻爸爸",
			Type: "photo", Date: "2026-05-23T09:00:00",
			Description: "满月的小嘻嘻，那时候好小一只",
			Images:      models.StringSlice{"https://picsum.photos/seed/tangmoon/400/400"},
			Featured:    true,
			Tags:        models.StringSlice{"#回忆", "#满月"},
			LikesCount:  52,
		},
	}
	for i := range entries {
		DB.Create(&entries[i])

		// Add a comment to first entry
		if i == 0 {
			DB.Create(&models.EntryComment{
				EntryID:    entries[i].ID,
				UserID:     user.ID,
				AuthorName: "嘻嘻爸爸",
				Text:       "照片拍得真好！",
			})
		}
	}

	// ─── Event Albums ───
	albums := []models.EventAlbum{
		{UserID: user.ID, Title: "周岁生日派对", CoverImage: "https://picsum.photos/seed/birthday1/300/300", PhotoCount: 24, Description: "嘻嘻一岁生日，全家团聚"},
		{UserID: user.ID, Title: "三亚旅行", CoverImage: "https://picsum.photos/seed/sanya1/300/300", PhotoCount: 18, Description: "第一次带宝宝看大海"},
		{UserID: user.ID, Title: "满月纪念", CoverImage: "https://picsum.photos/seed/fullmoon1/300/300", PhotoCount: 12, Description: "嘻嘻满月啦"},
	}
	for i := range albums {
		DB.Create(&albums[i])
	}

	// ─── Milestones ───
	milestones := []models.Milestone{
		{BabyID: baby.ID, Type: "milestone", Title: "第一次翻身", Date: "2024-08-20", Description: "在床上自己翻过去了"},
		{BabyID: baby.ID, Type: "milestone", Title: "第一次叫妈妈", Date: "2024-10-05", Description: "声音甜甜的"},
		{BabyID: baby.ID, Type: "milestone", Title: "第一次游泳", Date: "2026-05-01", Description: "在婴儿游泳池里扑腾"},
		{BabyID: baby.ID, Type: "event", Title: "百日宴", Date: "2024-09-21", Description: "全家庆祝嘻嘻100天"},
		{BabyID: baby.ID, Type: "event", Title: "满月酒", Date: "2024-07-13", Description: "亲朋好友来祝贺"},
	}
	for i := range milestones {
		DB.Create(&milestones[i])
	}

	// ─── Capsules ───
	capsules := []models.Capsule{
		{UserID: user.ID, Title: "给十八岁的你", ContentType: "text", Content: "亲爱的宝贝，当你打开这封信的时候...", UnlockDate: "2044-06-01", CreatedDate: "2026-06-01", IsOpened: false},
		{UserID: user.ID, Title: "周岁纪念视频", ContentType: "video", Content: "video_url", UnlockDate: "2026-12-15", CreatedDate: "2026-03-15", IsOpened: false},
	}
	for i := range capsules {
		DB.Create(&capsules[i])
	}

	// ─── Creative Works ───
	works := []models.CreativeWork{
		{BabyID: baby.ID, Title: "手指画小鸟", Type: "drawing", Description: "嘻嘻第一次用手指画画，画了一只彩色的小鸟", Images: models.StringSlice{"https://picsum.photos/seed/creative1/400/400"}, Date: "2026-05-10"},
		{BabyID: baby.ID, Title: "乐高小房子", Type: "lego", Description: "用大块乐高搭了一座小房子", Images: models.StringSlice{"https://picsum.photos/seed/creative2/400/400"}, Date: "2026-04-20"},
		{BabyID: baby.ID, Title: "母亲节手工卡", Type: "handcraft", Description: "手掌印做的爱心卡片，送给妈妈的礼物", Images: models.StringSlice{"https://picsum.photos/seed/creative3/400/400"}, Date: "2026-03-08"},
		{BabyID: baby.ID, Title: "沙滩城堡", Type: "sandart", Description: "在三亚海边用沙子堆的城堡", Images: models.StringSlice{"https://picsum.photos/seed/creative4/400/400"}, Date: "2026-02-15"},
	}
	for i := range works {
		DB.Create(&works[i])
	}

	// ─── Health Records ───
	records := []models.HealthRecord{
		{BabyID: baby.ID, Date: "2024-06-13", Weight: p(3.2), Height: p(50.0), HeadCircumference: p(34.0), Note: "出生"},
		{BabyID: baby.ID, Date: "2024-07-13", Weight: p(4.8), Height: p(55.0), HeadCircumference: p(37.0), Note: "满月"},
		{BabyID: baby.ID, Date: "2024-09-21", Weight: p(6.2), Height: p(61.0), HeadCircumference: p(40.0), Note: "百日"},
		{BabyID: baby.ID, Date: "2024-12-13", Weight: p(7.8), Height: p(68.0), HeadCircumference: p(42.0), Note: "六个月"},
		{BabyID: baby.ID, Date: "2025-06-13", Weight: p(10.5), Height: p(78.0), HeadCircumference: p(46.0), Note: "周岁"},
		{BabyID: baby.ID, Date: "2025-12-13", Weight: p(12.0), Height: p(85.0), HeadCircumference: p(47.0), Note: "十八个月"},
		{BabyID: baby.ID, Date: "2026-06-23", Weight: p(13.0), Height: p(90.0), HeadCircumference: p(48.0), Note: "两周岁"},
	}
	for i := range records {
		DB.Create(&records[i])
	}

	log.Println("Demo data seeded successfully")
}

func p(v float64) *float64 {
	return &v
}
