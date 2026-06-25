package handlers

import (
	"strings"

	"baby-backend/internal/database"
	"baby-backend/internal/models"
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

	// 从数据库读取最新 name 和 avatar，而非 JWT 中的旧值
	var user models.User
	name := ""
	avatar := ""
	if err := database.DB.Select("name", "avatar").First(&user, userID).Error; err == nil {
		name = user.Name
		if name == "" {
			name = user.Username
		}
		avatar = user.Avatar
	} else {
		// fallback to JWT
		n, _ := c.Get("name")
		if s, ok := n.(string); ok { name = s }
	}

	utils.Success(c, gin.H{
		"id":       userID,
		"username": username,
		"name":     name,
		"avatar":   avatar,
	})
}

func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	var input services.UpdateProfileInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	userID, _ := c.Get("user_id")
	profile, err := h.authService.UpdateProfile(userID.(uint), input)
	if err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	utils.Success(c, profile)
}

// @Summary      修改密码
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Param        input body services.ChangePasswordInput true "新旧密码"
// @Success      200 {object} utils.APIResponse
// @Security     BearerAuth
// @Router       /profile/password [put]
func (h *AuthHandler) ChangePassword(c *gin.Context) {
	var input services.ChangePasswordInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	userID, _ := c.Get("user_id")
	if err := h.authService.ChangePassword(userID.(uint), input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	utils.SuccessMessage(c, "密码修改成功")
}
