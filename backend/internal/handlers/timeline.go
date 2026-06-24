package handlers

import (
	"strconv"

	"baby-backend/internal/models"
	"baby-backend/internal/services"
	"baby-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

var _ = models.TimelineEntry{} // swagger type reference

// ─────────── Timeline ───────────

// TimelineHandler handles timeline entries, likes and comments.
type TimelineHandler struct{ svc *services.TimelineService }

// NewTimelineHandler creates a TimelineHandler.
func NewTimelineHandler(svc *services.TimelineService) *TimelineHandler {
	return &TimelineHandler{svc: svc}
}

// @Summary      时间线列表
// @Description  按 baby_id 查询时间线动态，支持筛选：type=all|featured|member|content，member 时需传 name，content 时需传 content_type。
// @Tags         Timeline
// @Produce      json
// @Param        baby_id      query  int     true   "宝宝 ID"
// @Param        type         query  string  false  "筛选类型: all | featured | member | content"
// @Param        name         query  string  false  "当 type=member 时，按成员名筛选"
// @Param        content_type query  string  false  "当 type=content 时，内容类型: photo | video | text | milestone"
// @Success      200 {object} utils.APIResponse{data=[]models.TimelineEntry}
// @Security     BearerAuth
// @Router       /timeline [get]
func (h *TimelineHandler) List(c *gin.Context) {
	babyID, _ := strconv.ParseUint(c.Query("baby_id"), 10, 64)
	if babyID == 0 {
		utils.BadRequest(c, "baby_id is required")
		return
	}
	var filter services.FilterInput
	c.ShouldBindQuery(&filter)
	entries, err := h.svc.List(uint(babyID), getUserID(c), filter)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.Success(c, entries)
}

// @Summary      单条动态详情
// @Tags         Timeline
// @Produce      json
// @Param        id  path  int  true  "动态 ID"
// @Success      200 {object} utils.APIResponse{data=models.TimelineEntry}
// @Security     BearerAuth
// @Router       /timeline/{id} [get]
func (h *TimelineHandler) Get(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	entry, err := h.svc.GetByID(uint(id))
	if err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	utils.Success(c, entry)
}

// @Summary      发布动态
// @Tags         Timeline
// @Accept       json
// @Produce      json
// @Param        input body services.CreateEntryInput true "动态内容"
// @Success      200   {object} utils.APIResponse{data=models.TimelineEntry}
// @Security     BearerAuth
// @Router       /timeline [post]
func (h *TimelineHandler) Create(c *gin.Context) {
	var input services.CreateEntryInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	entry, err := h.svc.Create(getUserID(c), getAuthorName(c), input)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.Success(c, entry)
}

// @Summary      删除动态
// @Tags         Timeline
// @Produce      json
// @Param        id  path  int  true  "动态 ID"
// @Success      200 {object} utils.APIResponse
// @Security     BearerAuth
// @Router       /timeline/{id} [delete]
func (h *TimelineHandler) Delete(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	if err := h.svc.Delete(uint(id)); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	utils.SuccessMessage(c, "deleted")
}

// @Summary      切换精选状态
// @Tags         Timeline
// @Produce      json
// @Param        id  path  int  true  "动态 ID"
// @Success      200 {object} utils.APIResponse{data=models.TimelineEntry}
// @Security     BearerAuth
// @Router       /timeline/{id}/featured [patch]
func (h *TimelineHandler) ToggleFeatured(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	entry, err := h.svc.ToggleFeatured(uint(id))
	if err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	utils.Success(c, entry)
}

// ─────────── Like ───────────

// @Summary      点赞 / 取消点赞
// @Description  同一条动态重复调用会在点赞 / 取消之间切换。返回当前 liked 状态。
// @Tags         Timeline
// @Produce      json
// @Param        id  path  int  true  "动态 ID"
// @Success      200 {object} utils.APIResponse
// @Security     BearerAuth
// @Router       /timeline/{id}/like [post]
func (h *TimelineHandler) ToggleLike(c *gin.Context) {
	entryID, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	liked, err := h.svc.ToggleLike(uint(entryID), getUserID(c))
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.Success(c, gin.H{"liked": liked})
}

// ─────────── Comment ───────────

// @Summary      添加评论
// @Tags         Timeline
// @Accept       json
// @Produce      json
// @Param        id    path  int    true "动态 ID"
// @Param        input body  object{text=string} true "评论内容"
// @Success      200   {object} utils.APIResponse{data=models.EntryComment}
// @Security     BearerAuth
// @Router       /timeline/{id}/comments [post]
func (h *TimelineHandler) AddComment(c *gin.Context) {
	entryID, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	var input struct {
		Text string `json:"text" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	comment, err := h.svc.AddComment(uint(entryID), getUserID(c), getAuthorName(c), input.Text)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.Success(c, comment)
}

// @Summary      删除评论
// @Tags         Timeline
// @Produce      json
// @Param        id        path  int  true  "动态 ID"
// @Param        commentId path  int  true  "评论 ID"
// @Success      200 {object} utils.APIResponse
// @Security     BearerAuth
// @Router       /timeline/{id}/comments/{commentId} [delete]
func (h *TimelineHandler) DeleteComment(c *gin.Context) {
	commentID, _ := strconv.ParseUint(c.Param("commentId"), 10, 64)
	if err := h.svc.DeleteComment(uint(commentID)); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	utils.SuccessMessage(c, "deleted")
}

// ─────────── Helpers (shared across handlers) ───────────

func getUserID(c *gin.Context) uint {
	v, _ := c.Get("user_id")
	if v == nil {
		return 0
	}
	return v.(uint)
}

func getAuthorName(c *gin.Context) string {
	v, _ := c.Get("name")
	if v != nil {
		if s, ok := v.(string); ok && s != "" {
			return s
		}
	}
	// fallback to username
	u, _ := c.Get("username")
	if u != nil {
		if s, ok := u.(string); ok {
			return s
		}
	}
	return ""
}
