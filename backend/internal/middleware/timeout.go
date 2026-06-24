package middleware

import (
	"time"

	"baby-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

// RequestTimeout sets a deadline on the request context.
// If the handler doesn't complete within the timeout, the request is aborted with 504.
func RequestTimeout(d time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		done := make(chan struct{})
		timer := time.AfterFunc(d, func() {
			close(done)
		})
		defer timer.Stop()

		go func() {
			c.Next()
			close(done)
		}()

		select {
		case <-done:
			// request completed or timed out
		case <-c.Request.Context().Done():
			// client disconnected
		}

		if c.Writer.Written() {
			return
		}

		// If we get here, the handler didn't write a response — timeout
		utils.Error(c, 504, 504, "request timeout")
	}
}
