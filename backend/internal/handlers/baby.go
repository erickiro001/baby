package handlers

import (
	"strconv"

	"baby-backend/internal/models"
	"baby-backend/internal/services"
	"baby-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

var _ = models.Baby{} // swagger type reference

// ─────────── Baby ───────────

// BabyHandler handles baby profile CRUD.
type BabyHandler struct {
	svc *services.BabyService
}

// NewBabyHandler creates a BabyHandler.
func NewBabyHandler(svc *services.BabyService) *BabyHandler { return &BabyHandler{svc: svc} }

// @Summary      宝宝列表
// @Description  获取当前用户下的所有宝宝。
// @Tags         Baby
// @Produce      json
// @Success      200 {object} utils.APIResponse{data=[]models.Baby}
// @Security     BearerAuth
// @Router       /babies [get]
func (h *BabyHandler) List(c *gin.Context) {
	babies, err := h.svc.List(getUserID(c))
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.Success(c, babies)
}

// @Summary      宝宝详情
// @Description  按 ID 获取单个宝宝。
// @Tags         Baby
// @Produce      json
// @Param        id  path  int  true  "宝宝 ID"
// @Success      200 {object} utils.APIResponse{data=models.Baby}
// @Security     BearerAuth
// @Router       /babies/{id} [get]
func (h *BabyHandler) Get(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	baby, err := h.svc.GetByID(uint(id), getUserID(c))
	if err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	utils.Success(c, baby)
}

// @Summary      添加宝宝
// @Description  创建一个新的宝宝档案。
// @Tags         Baby
// @Accept       json
// @Produce      json
// @Param        input body services.CreateBabyInput true "宝宝信息"
// @Success      200 {object} utils.APIResponse{data=models.Baby}
// @Security     BearerAuth
// @Router       /babies [post]
func (h *BabyHandler) Create(c *gin.Context) {
	var input services.CreateBabyInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	baby, err := h.svc.Create(getUserID(c), input)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.Success(c, baby)
}

// @Summary      编辑宝宝
// @Tags         Baby
// @Accept       json
// @Produce      json
// @Param        id     path  int                     true "宝宝 ID"
// @Param        input  body  services.UpdateBabyInput true "更新字段"
// @Success      200    {object} utils.APIResponse{data=models.Baby}
// @Security     BearerAuth
// @Router       /babies/{id} [put]
func (h *BabyHandler) Update(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	var input services.UpdateBabyInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	baby, err := h.svc.Update(uint(id), getUserID(c), input)
	if err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	utils.Success(c, baby)
}

// @Summary      删除宝宝
// @Tags         Baby
// @Produce      json
// @Param        id  path  int  true  "宝宝 ID"
// @Success      200 {object} utils.APIResponse
// @Security     BearerAuth
// @Router       /babies/{id} [delete]
func (h *BabyHandler) Delete(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	if err := h.svc.Delete(uint(id), getUserID(c)); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	utils.SuccessMessage(c, "deleted")
}

// ─────────── Health ───────────

// HealthHandler handles health records.
type HealthHandler struct{ svc *services.HealthService }

// NewHealthHandler creates a HealthHandler.
func NewHealthHandler(svc *services.HealthService) *HealthHandler { return &HealthHandler{svc: svc} }

// @Summary      健康记录列表
// @Description  获取指定宝宝的所有健康记录，按日期升序。
// @Tags         Health
// @Produce      json
// @Param        id  path  int  true  "宝宝 ID"
// @Success      200 {object} utils.APIResponse{data=[]models.HealthRecord}
// @Security     BearerAuth
// @Router       /babies/{id}/health [get]
func (h *HealthHandler) List(c *gin.Context) {
	babyID, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	records, err := h.svc.List(uint(babyID))
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.Success(c, records)
}

// @Summary      添加健康记录
// @Tags         Health
// @Accept       json
// @Produce      json
// @Param        id     path  int                         true "宝宝 ID"
// @Param        input  body  services.CreateHealthInput  true "健康数据"
// @Success      200    {object} utils.APIResponse{data=models.HealthRecord}
// @Security     BearerAuth
// @Router       /babies/{id}/health [post]
func (h *HealthHandler) Create(c *gin.Context) {
	var input services.CreateHealthInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	record, err := h.svc.Create(input)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}
	utils.Success(c, record)
}

// @Summary      删除健康记录
// @Tags         Health
// @Produce      json
// @Param        id   path  int  true  "宝宝 ID"
// @Param        hid  path  int  true  "健康记录 ID"
// @Success      200  {object} utils.APIResponse
// @Security     BearerAuth
// @Router       /babies/{id}/health/{hid} [delete]
func (h *HealthHandler) Delete(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("hid"), 10, 64)
	if err := h.svc.Delete(uint(id)); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	utils.SuccessMessage(c, "deleted")
}
