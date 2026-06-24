package main

import (
	"log"

	"baby-backend/internal/config"
	server "baby-backend/internal"
)

func main() {
	cfg := config.Load()

	log.Printf("Starting server on port %s...", cfg.ServerPort)
	server.Run(cfg)
}
