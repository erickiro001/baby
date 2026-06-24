package main

import (
	"log"

	"baby-backend/internal/config"
	server "baby-backend/internal"

	_ "baby-backend/docs" // swagger docs
)

// @title           Baby Backend API
// @version         1.0
// @description     宝宝时光 · 家庭馆 — 宝宝成长记录与家庭共享后端 API
// @termsOfService  https://github.com

// @contact.name   API Support
// @contact.email  support@example.com

// @license.name  MIT
// @license.url   https://opensource.org/licenses/MIT

// @host      localhost:8080
// @BasePath  /api/v1

// @securityDefinitions.apikey BearerAuth
// @in                         header
// @name                       Authorization
// @description                JWT Bearer Token. Format: "Bearer <token>"

func main() {
	cfg := config.Load()

	log.Printf("Starting server on port %s...", cfg.ServerPort)
	server.Run(cfg)
}
