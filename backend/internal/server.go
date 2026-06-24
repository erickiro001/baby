package server

import (
	"time"

	"baby-backend/internal/config"
	"baby-backend/internal/database"
	"baby-backend/internal/handlers"
	"baby-backend/internal/middleware"
	"baby-backend/internal/services"
	"baby-backend/internal/utils"

	"github.com/gin-gonic/gin"
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

	// Init handlers
	authHandler := handlers.NewAuthHandler(authService)

	// Setup Gin
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()

	// Global middleware
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(middleware.CORS())
	r.Use(middleware.SecurityHeaders())
	r.Use(middleware.NoCache())
	r.Use(middleware.SizeLimit(1 << 20)) // 1 MB max request body

	// Health check
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API v1
	v1 := r.Group("/api/v1")
	{
		// Public routes (rate limited)
		auth := v1.Group("/auth")
		auth.Use(middleware.RateLimiter(10, time.Minute)) // 10 req/min per IP
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}

		// Protected routes
		protected := v1.Group("")
		protected.Use(middleware.JWTAuth())
		{
			protected.GET("/profile", authHandler.Profile)
		}
	}

	// Start server
	if err := r.Run(":" + cfg.ServerPort); err != nil {
		panic("failed to start server: " + err.Error())
	}
}
