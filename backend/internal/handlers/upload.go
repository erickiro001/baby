package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"baby-backend/internal/config"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const maxUploadSize = 10 << 20 // 10 MB

// UploadHandler handles independent file uploads.
type UploadHandler struct {
	uploadDir string
}

func NewUploadHandler(cfg *config.Config) *UploadHandler {
	return &UploadHandler{uploadDir: cfg.UploadDir}
}

type UploadResponse struct {
	URL      string `json:"url"`
	Filename string `json:"filename"`
	Size     int64  `json:"size"`
}

func (h *UploadHandler) Upload(c *gin.Context) {
	// Pre-check Content-Length to reject oversized uploads early
	if c.Request.ContentLength > maxUploadSize {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{
			"code":    413,
			"message": fmt.Sprintf("文件过大 (%d bytes)，最大允许 10MB", c.Request.ContentLength),
		})
		return
	}

	// Parse multipart form with explicit memory limit
	// Files > 1MB go to temp disk, not memory
	if err := c.Request.ParseMultipartForm(maxUploadSize); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无法解析上传文件: " + err.Error(),
		})
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请选择要上传的文件",
		})
		return
	}
	defer file.Close()

	// MIME whitelist
	mime := header.Header.Get("Content-Type")
	if !strings.HasPrefix(mime, "image/") && !strings.HasPrefix(mime, "video/") {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "不支持的文件类型: " + mime,
		})
		return
	}

	ext := filepath.Ext(header.Filename)
	if ext == "" {
		ext = ".bin"
	}

	filename := fmt.Sprintf("%s_%s%s",
		time.Now().Format("20060102"),
		uuid.New().String()[:8],
		strings.ToLower(ext),
	)

	if err := os.MkdirAll(h.uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "服务器错误: 无法创建存储目录",
		})
		return
	}

	dst := filepath.Join(h.uploadDir, filename)
	f, err := os.Create(dst)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "服务器错误: 无法保存文件",
		})
		return
	}
	defer f.Close()

	written, err := io.Copy(f, file)
	if err != nil {
		os.Remove(dst)
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "服务器错误: 文件写入失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "上传成功",
		"data": UploadResponse{
			URL:      "/uploads/" + filename,
			Filename: filename,
			Size:     written,
		},
	})
}
