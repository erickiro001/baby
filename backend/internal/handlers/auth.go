package handlers

import (
	"strings"

	"baby-backend/internal/services"
	"baby-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authService *services.AuthService
}

func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var input services.RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, "invalid input: "+err.Error())
		return
	}

	// trim whitespace
	input.Username = strings.TrimSpace(input.Username)
	input.Email = strings.TrimSpace(strings.ToLower(input.Email))

	result, err := h.authService.Register(input)
	if err != nil {
		msg := err.Error()
		switch msg {
		case "username already taken", "email already registered":
			utils.BadRequest(c, msg)
		default:
			utils.InternalError(c, msg)
		}
		return
	}

	utils.Success(c, result)
}

func (h *AuthHandler) Login(c *gin.Context) {
	var input services.LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, "invalid input: "+err.Error())
		return
	}

	input.Username = strings.TrimSpace(input.Username)

	result, err := h.authService.Login(input)
	if err != nil {
		msg := err.Error()
		if msg == "invalid username or password" {
			utils.Unauthorized(c, msg)
		} else {
			utils.InternalError(c, msg)
		}
		return
	}

	utils.Success(c, result)
}

// Profile returns the current user's info (requires JWT auth)
func (h *AuthHandler) Profile(c *gin.Context) {
	userID, _ := c.Get("user_id")
	username, _ := c.Get("username")

	utils.Success(c, gin.H{
		"id":       userID,
		"username": username,
	})
}
