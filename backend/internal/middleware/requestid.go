package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const requestIDHeader = "X-Request-ID"

// RequestID generates a unique ID per request and sets it in:
//   - response header (X-Request-ID)
//   - gin context (key: "request_id")
//
// If the client sends an X-Request-ID header, it is reused.
func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		rid := c.GetHeader(requestIDHeader)
		if rid == "" {
			rid = uuid.New().String()
		}

		c.Set("request_id", rid)
		c.Header(requestIDHeader, rid)
		c.Next()
	}
}
