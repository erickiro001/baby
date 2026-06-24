package handlers

import (
	"strings"

	"baby-backend/internal/services"
	"baby-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

// AuthHandler handles authentication requests.
type AuthHandler struct {
	authService *services.AuthService
}

// NewAuthHandler creates an AuthHandler.
func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// @Summary      用户注册
// @Description  创建新帐号，返回 JWT token。用户名和邮箱均需唯一。
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Param        input body services.RegisterInput true "注册信息"
// @Success      200   {object} utils.APIResponse{data=services.AuthResult}
// @Failure      400   {object} utils.APIResponse
// @Failure      500   {object} utils.APIResponse
// @Router       /auth/register [post]
func (h *AuthHandler) Register(c *gin.Context) {
	var input services.RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, "invalid input: "+err.Error())
		return
	}
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

// @Summary      用户登录
// @Description  支持用户名或邮箱登录，成功返回 JWT token。
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Param        input body services.LoginInput true "登录信息"
// @Success      200 {object} utils.APIResponse{data=services.AuthResult}
// @Failure      401 {object} utils.APIResponse
// @Failure      500 {object} utils.APIResponse
// @Router       /auth/login [post]
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

// @Summary      当前用户信息
// @Description  返回已登录用户的 id 和 username。
// @Tags         Auth
// @Produce      json
// @Success      200 {object} utils.APIResponse
// @Security     BearerAuth
// @Router       /profile [get]
func (h *AuthHandler) Profile(c *gin.Context) {
	userID, _ := c.Get("user_id")
	username, _ := c.Get("username")

	utils.Success(c, gin.H{
		"id":       userID,
		"username": username,
	})
}
