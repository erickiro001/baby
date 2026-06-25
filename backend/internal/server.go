package server

import (
	"time"

	"baby-backend/internal/config"
	"baby-backend/internal/database"
	"baby-backend/internal/handlers"
	"baby-backend/internal/middleware"
	"baby-backend/internal/services"
	"baby-backend/internal/utils"

	_ "baby-backend/docs"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func Run(cfg *config.Config) {
	// Parse JWT expiration duration
	jwtExpire, err := time.ParseDuration(cfg.JWTExpire)
	if err != nil {
		panic("invalid JWT_EXPIRE duration: " + cfg.JWTExpire)
	}

	// Init JWT secret
	utils.InitJWT(cfg.JWTSecret)

	// Init database
	database.Init(cfg.DBPath)
	defer database.Close()

	// Init services
	authService := services.NewAuthService(jwtExpire)
	babySvc := &services.BabyService{}
	healthSvc := &services.HealthService{}
	timelineSvc := &services.TimelineService{}
	albumSvc := &services.AlbumService{}
	familySvc := &services.FamilyService{}
	capsuleSvc := &services.CapsuleService{}
	milestoneSvc := &services.MilestoneService{}
	creativeWorkSvc := &services.CreativeWorkService{}

	// Init handlers
	authHandler := handlers.NewAuthHandler(authService)
	babyHandler := handlers.NewBabyHandler(babySvc)
	healthHandler := handlers.NewHealthHandler(healthSvc)
	timelineHandler := handlers.NewTimelineHandler(timelineSvc)
	albumHandler := handlers.NewAlbumHandler(albumSvc)
	familyHandler := handlers.NewFamilyHandler(familySvc)
	capsuleHandler := handlers.NewCapsuleHandler(capsuleSvc)
	milestoneHandler := handlers.NewMilestoneHandler(milestoneSvc)
	creativeWorkHandler := handlers.NewCreativeWorkHandler(creativeWorkSvc)
	uploadHandler := handlers.NewUploadHandler(cfg)

	// Setup Gin
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()

	// Swagger UI — registered before CSP/NoCache to avoid blocking its assets
	swagger := r.Group("/swagger")
	{
		swagger.GET("/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	}

	// Static file serving for uploaded files
	r.Static("/uploads", cfg.UploadDir)

	// Global middleware — applies to ALL routes
	r.Use(middleware.RequestID())                      // 1. tag every request
	r.Use(gin.Logger())                                // 2. log with request_id
	r.Use(gin.Recovery())                              // 3. panic recovery
	r.Use(middleware.RequestTimeout(30 * time.Second)) // 4. 30s deadline per request
	r.Use(middleware.CORS())                           // 5. cross-origin

	// Health check
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API v1
	v1 := r.Group("/api/v1")
	v1.Use(middleware.SecurityHeaders())                             // security headers
	v1.Use(middleware.HSTS(0))                                       // API-only: HSTS
	v1.Use(middleware.CSP("default-src 'none'; frame-ancestors 'none'")) // API-only: CSP
	v1.Use(middleware.NoCache())                                     // API-only: no caching
	{
		// Public routes (rate limited)
		auth := v1.Group("/auth")
		auth.Use(middleware.RateLimiter(10, time.Minute)) // 10 req/min per IP
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}

		// File upload — independent, 10MB, no JSON body size limit
		uploadGroup := v1.Group("/upload")
		uploadGroup.Use(middleware.JWTAuth())
		{
			uploadGroup.POST("", uploadHandler.Upload)
		}

		// Protected routes (1MB JSON body limit)
		protected := v1.Group("")
		protected.Use(middleware.JWTAuth())
		protected.Use(middleware.SizeLimit(1 << 20)) // 1 MB for JSON APIs
		{
			// Auth
			protected.GET("/profile", authHandler.Profile)
			protected.PATCH("/profile", authHandler.UpdateProfile)

			// Babies
			protected.GET("/babies", babyHandler.List)
			protected.GET("/babies/:id", babyHandler.Get)
			protected.POST("/babies", babyHandler.Create)
			protected.PUT("/babies/:id", babyHandler.Update)
			protected.DELETE("/babies/:id", babyHandler.Delete)

			// Health Records
			protected.GET("/babies/:id/health", healthHandler.List)
			protected.POST("/babies/:id/health", healthHandler.Create)
			protected.DELETE("/babies/:id/health/:hid", healthHandler.Delete)

			// Timeline
			protected.GET("/timeline", timelineHandler.List)
			protected.GET("/timeline/:id", timelineHandler.Get)
			protected.POST("/timeline", timelineHandler.Create)
			protected.DELETE("/timeline/:id", timelineHandler.Delete)
			protected.PATCH("/timeline/:id/featured", timelineHandler.ToggleFeatured)

			// Likes
			protected.POST("/timeline/:id/like", timelineHandler.ToggleLike)

			// Comments
			protected.POST("/timeline/:id/comments", timelineHandler.AddComment)
			protected.DELETE("/timeline/:id/comments/:commentId", timelineHandler.DeleteComment)

			// Albums
			protected.GET("/albums", albumHandler.List)
			protected.POST("/albums", albumHandler.Create)
			protected.GET("/albums/:id/photos", albumHandler.GetPhotos)
			protected.POST("/albums/:id/photos", albumHandler.AddPhotos)
			protected.DELETE("/albums/:id/photos", albumHandler.RemovePhotos)
			protected.PUT("/albums/:id/cover", albumHandler.UpdateCover)
			protected.DELETE("/albums/:id", albumHandler.Delete)

			// Family
			protected.GET("/family", familyHandler.List)
			protected.POST("/family", familyHandler.Create)
			protected.PATCH("/family/:id", familyHandler.Update)
			protected.POST("/family/:id/invites", familyHandler.CreateInvite)

			// Capsules
			protected.GET("/capsules", capsuleHandler.List)
			protected.POST("/capsules", capsuleHandler.Create)
			protected.POST("/capsules/:id/open", capsuleHandler.Open)

			// Milestones
			protected.GET("/babies/:id/milestones", milestoneHandler.List)
			protected.POST("/babies/:id/milestones", milestoneHandler.Create)
			protected.DELETE("/babies/:id/milestones/:mid", milestoneHandler.Delete)

			// Creative Works
			protected.GET("/babies/:id/works", creativeWorkHandler.List)
			protected.POST("/babies/:id/works", creativeWorkHandler.Create)
			protected.DELETE("/babies/:id/works/:wid", creativeWorkHandler.Delete)
		}
	}

	// Start server
	if err := r.Run(":" + cfg.ServerPort); err != nil {
		panic("failed to start server: " + err.Error())
	}
}
