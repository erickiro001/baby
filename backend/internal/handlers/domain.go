package handlers

import (
	"strconv"

	"baby-backend/internal/models"
	"baby-backend/internal/services"
	"baby-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

var _ = models.EventAlbum{} // swagger type reference

// ─────────── Album ───────────

// AlbumHandler handles event albums.
type AlbumHandler struct{ svc *services.AlbumService }

// NewAlbumHandler creates an AlbumHandler.
func NewAlbumHandler(svc *services.AlbumService) *AlbumHandler { return &AlbumHandler{svc: svc} }

// @Summary      相册列表
// @Tags         Album
// @Produce      json
// @Success      200 {object} utils.APIResponse{data=[]models.EventAlbum}
// @Security     BearerAuth
// @Router       /albums [get]
func (h *AlbumHandler) List(c *gin.Context) {
	albums, err := h.svc.List(getUserID(c))
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.Success(c, albums)
}

// @Summary      创建相册
// @Tags         Album
// @Accept       json
// @Produce      json
// @Param        input body services.CreateAlbumInput true "相册信息"
// @Success      200   {object} utils.APIResponse{data=models.EventAlbum}
// @Security     BearerAuth
// @Router       /albums [post]
func (h *AlbumHandler) Create(c *gin.Context) {
	var input services.CreateAlbumInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	album, err := h.svc.Create(getUserID(c), input)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.Success(c, album)
}

// @Summary      添加照片到相册
// @Tags         Album
// @Accept       json
// @Produce      json
// @Param        id    path  int                     true "相册 ID"
// @Param        input body  object{entry_ids=[]int} true "动态 ID 列表"
// @Success      200   {object} utils.APIResponse
// @Security     BearerAuth
// @Router       /albums/{id}/photos [post]
func (h *AlbumHandler) AddPhotos(c *gin.Context) {
	albumID, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	var input struct {
		EntryIDs []uint `json:"entry_ids" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	if err := h.svc.AddPhotos(uint(albumID), input.EntryIDs); err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.SuccessMessage(c, "photos added")
}

// @Summary      从相册移除照片
// @Tags         Album
// @Accept       json
// @Produce      json
// @Param        id    path  int                     true "相册 ID"
// @Param        input body  object{entry_ids=[]int} true "动态 ID 列表"
// @Success      200   {object} utils.APIResponse
// @Security     BearerAuth
// @Router       /albums/{id}/photos [delete]
func (h *AlbumHandler) RemovePhotos(c *gin.Context) {
	albumID, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	var input struct {
		EntryIDs []uint `json:"entry_ids" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	if err := h.svc.RemovePhotos(uint(albumID), input.EntryIDs); err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.SuccessMessage(c, "photos removed")
}

// @Summary      获取相册内照片
// @Tags         Album
// @Produce      json
// @Param        id  path  int  true  "相册 ID"
// @Success      200 {object} utils.APIResponse{data=[]models.TimelineEntry}
// @Security     BearerAuth
// @Router       /albums/{id}/photos [get]
func (h *AlbumHandler) GetPhotos(c *gin.Context) {
	albumID, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	entries, err := h.svc.GetPhotos(uint(albumID))
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.Success(c, entries)
}

// @Summary      删除事件相册
// @Tags         Album
// @Produce      json
// @Param        id  path  int  true  "相册 ID"
// @Success      200 {object} utils.APIResponse
// @Security     BearerAuth
// @Router       /albums/{id} [delete]
func (h *AlbumHandler) Delete(c *gin.Context) {
	albumID, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	if err := h.svc.Delete(uint(albumID)); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	utils.SuccessMessage(c, "deleted")
}

// @Summary      更新相册封面
// @Tags         Album
// @Accept       json
// @Produce      json
// @Param        id    path  int                          true "相册 ID"
// @Param        input body  object{cover_image=string}    true "封面图片URL"
// @Success      200   {object} utils.APIResponse
// @Security     BearerAuth
// @Router       /albums/{id}/cover [put]
func (h *AlbumHandler) UpdateCover(c *gin.Context) {
	albumID, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	var input struct {
		CoverImage string `json:"cover_image" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	if err := h.svc.UpdateCover(uint(albumID), input.CoverImage); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	utils.SuccessMessage(c, "cover updated")
}

// ─────────── Family ───────────

// FamilyHandler handles family spaces.
type FamilyHandler struct{ svc *services.FamilyService }

// NewFamilyHandler creates a FamilyHandler.
func NewFamilyHandler(svc *services.FamilyService) *FamilyHandler { return &FamilyHandler{svc: svc} }

// @Summary      家庭空间列表
// @Tags         Family
// @Produce      json
// @Success      200 {object} utils.APIResponse{data=[]models.FamilySpace}
// @Security     BearerAuth
// @Router       /family [get]
func (h *FamilyHandler) List(c *gin.Context) {
	spaces, err := h.svc.List(getUserID(c))
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.Success(c, spaces)
}

// @Summary      创建家庭空间
// @Tags         Family
// @Accept       json
// @Produce      json
// @Param        input body services.CreateSpaceInput true "空间信息"
// @Success      200   {object} utils.APIResponse{data=models.FamilySpace}
// @Security     BearerAuth
// @Router       /family [post]
func (h *FamilyHandler) Create(c *gin.Context) {
	var input services.CreateSpaceInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	space, err := h.svc.Create(getUserID(c), input)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.Success(c, space)
}

// @Summary      创建邀请码
// @Tags         Family
// @Accept       json
// @Produce      json
// @Param        id    path  int                         true "空间 ID"
// @Param        input body  services.CreateInviteInput  true "邀请码信息"
// @Success      200   {object} utils.APIResponse{data=models.InviteRecord}
// @Security     BearerAuth
// @Router       /family/{id}/invites [post]
func (h *FamilyHandler) CreateInvite(c *gin.Context) {
	spaceID, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	var input services.CreateInviteInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	invite, err := h.svc.CreateInvite(uint(spaceID), input)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.Success(c, invite)
}

func (h *FamilyHandler) Update(c *gin.Context) {
	spaceID, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	var input struct {
		Name string `json:"name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	if err := h.svc.Update(uint(spaceID), input.Name); err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.SuccessMessage(c, "updated")
}

// ─────────── Capsule ───────────

// CapsuleHandler handles time capsules.
type CapsuleHandler struct{ svc *services.CapsuleService }

// NewCapsuleHandler creates a CapsuleHandler.
func NewCapsuleHandler(svc *services.CapsuleService) *CapsuleHandler {
	return &CapsuleHandler{svc: svc}
}

// @Summary      时间胶囊列表
// @Tags         Capsule
// @Produce      json
// @Success      200 {object} utils.APIResponse{data=[]models.Capsule}
// @Security     BearerAuth
// @Router       /capsules [get]
func (h *CapsuleHandler) List(c *gin.Context) {
	capsules, err := h.svc.List(getUserID(c))
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.Success(c, capsules)
}

// @Summary      创建时间胶囊
// @Tags         Capsule
// @Accept       json
// @Produce      json
// @Param        input body services.CreateCapsuleInput true "胶囊内容"
// @Success      200   {object} utils.APIResponse{data=models.Capsule}
// @Security     BearerAuth
// @Router       /capsules [post]
func (h *CapsuleHandler) Create(c *gin.Context) {
	var input services.CreateCapsuleInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	capsule, err := h.svc.Create(getUserID(c), input)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.Success(c, capsule)
}

// @Summary      开启胶囊
// @Tags         Capsule
// @Produce      json
// @Param        id  path  int  true  "胶囊 ID"
// @Success      200 {object} utils.APIResponse
// @Security     BearerAuth
// @Router       /capsules/{id}/open [post]
func (h *CapsuleHandler) Open(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	if err := h.svc.Open(uint(id)); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	utils.SuccessMessage(c, "capsule opened")
}

// ─────────── Milestone ───────────

// MilestoneHandler handles growth milestones.
type MilestoneHandler struct{ svc *services.MilestoneService }

// NewMilestoneHandler creates a MilestoneHandler.
func NewMilestoneHandler(svc *services.MilestoneService) *MilestoneHandler {
	return &MilestoneHandler{svc: svc}
}

// @Summary      里程碑列表
// @Tags         Milestone
// @Produce      json
// @Param        id  path  int  true  "宝宝 ID"
// @Success      200 {object} utils.APIResponse{data=[]models.Milestone}
// @Security     BearerAuth
// @Router       /babies/{id}/milestones [get]
func (h *MilestoneHandler) List(c *gin.Context) {
	babyID, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	milestones, err := h.svc.List(uint(babyID))
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.Success(c, milestones)
}

// @Summary      添加里程碑
// @Tags         Milestone
// @Accept       json
// @Produce      json
// @Param        id    path  int                            true "宝宝 ID"
// @Param        input body  services.CreateMilestoneInput  true "里程碑"
// @Success      200   {object} utils.APIResponse{data=models.Milestone}
// @Security     BearerAuth
// @Router       /babies/{id}/milestones [post]
func (h *MilestoneHandler) Create(c *gin.Context) {
	var input services.CreateMilestoneInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	ms, err := h.svc.Create(input)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.Success(c, ms)
}

// @Summary      删除里程碑
// @Tags         Milestone
// @Produce      json
// @Param        id   path  int  true  "宝宝 ID"
// @Param        mid  path  int  true  "里程碑 ID"
// @Success      200  {object} utils.APIResponse
// @Security     BearerAuth
// @Router       /babies/{id}/milestones/{mid} [delete]
func (h *MilestoneHandler) Delete(c *gin.Context) {
	mid, _ := strconv.ParseUint(c.Param("mid"), 10, 64)
	if err := h.svc.Delete(uint(mid)); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	utils.SuccessMessage(c, "deleted")
}

// ─────────── CreativeWork ───────────

// CreativeWorkHandler handles creative works.
type CreativeWorkHandler struct{ svc *services.CreativeWorkService }

// NewCreativeWorkHandler creates a CreativeWorkHandler.
func NewCreativeWorkHandler(svc *services.CreativeWorkService) *CreativeWorkHandler {
	return &CreativeWorkHandler{svc: svc}
}

// @Summary      创意作品列表
// @Tags         CreativeWork
// @Produce      json
// @Param        id  path  int  true  "宝宝 ID"
// @Success      200 {object} utils.APIResponse{data=[]models.CreativeWork}
// @Security     BearerAuth
// @Router       /babies/{id}/works [get]
func (h *CreativeWorkHandler) List(c *gin.Context) {
	babyID, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	works, err := h.svc.List(uint(babyID))
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.Success(c, works)
}

// @Summary      添加创意作品
// @Tags         CreativeWork
// @Accept       json
// @Produce      json
// @Param        id    path  int                               true "宝宝 ID"
// @Param        input body  services.CreateCreativeWorkInput  true "作品信息"
// @Success      200   {object} utils.APIResponse{data=models.CreativeWork}
// @Security     BearerAuth
// @Router       /babies/{id}/works [post]
func (h *CreativeWorkHandler) Create(c *gin.Context) {
	var input services.CreateCreativeWorkInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	work, err := h.svc.Create(input)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.Success(c, work)
}

// @Summary      删除创意作品
// @Tags         CreativeWork
// @Produce      json
// @Param        id   path  int  true  "宝宝 ID"
// @Param        wid  path  int  true  "作品 ID"
// @Success      200  {object} utils.APIResponse
// @Security     BearerAuth
// @Router       /babies/{id}/works/{wid} [delete]
func (h *CreativeWorkHandler) Delete(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("wid"), 10, 64)
	if err := h.svc.Delete(uint(id)); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	utils.SuccessMessage(c, "deleted")
}
