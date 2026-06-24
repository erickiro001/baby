package middleware

import (
	"context"
	"time"

	"github.com/gin-gonic/gin"
)

// RequestTimeout injects a context deadline into each request.
// Handlers that respect c.Request.Context() will stop when the deadline expires.
// For hard timeout enforcement, use http.Server ReadTimeout/WriteTimeout instead.
func RequestTimeout(d time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), d)
		defer cancel()

		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}
