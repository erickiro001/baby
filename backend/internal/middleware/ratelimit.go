package middleware

import (
	"sync"
	"time"

	"baby-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

// RateLimiter is a simple in-memory token bucket rate limiter per IP
func RateLimiter(limit int, window time.Duration) gin.HandlerFunc {
	type bucket struct {
		tokens  int
		lastRef time.Time
	}

	var (
		mu      sync.Mutex
		buckets = make(map[string]*bucket)
	)

	// cleanup goroutine
	go func() {
		ticker := time.NewTicker(window * 2)
		defer ticker.Stop()
		for range ticker.C {
			mu.Lock()
			now := time.Now()
			for ip, b := range buckets {
				if now.Sub(b.lastRef) > window*2 {
					delete(buckets, ip)
				}
			}
			mu.Unlock()
		}
	}()

	return func(c *gin.Context) {
		ip := c.ClientIP()

		mu.Lock()
		b, ok := buckets[ip]
		if !ok {
			b = &bucket{tokens: limit - 1, lastRef: time.Now()}
			buckets[ip] = b
			mu.Unlock()
			c.Next()
			return
		}

		// refill tokens based on elapsed time
		elapsed := time.Since(b.lastRef)
		refill := int(elapsed / window * time.Duration(limit))
		if refill > 0 {
			b.tokens += refill
			if b.tokens > limit {
				b.tokens = limit
			}
			b.lastRef = time.Now()
		}

		if b.tokens > 0 {
			b.tokens--
			mu.Unlock()
			c.Next()
			return
		}

		mu.Unlock()
		utils.Error(c, 429, 429, "too many requests, please try again later")
		c.Abort()
	}
}
