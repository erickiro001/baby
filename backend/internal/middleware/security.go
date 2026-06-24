package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// SecurityHeaders sets common security headers
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		ct := c.GetHeader("Content-Type")

		// XSS protection — only for HTML responses
		if strings.Contains(ct, "text/html") || ct == "" {
			c.Header("X-XSS-Protection", "1; mode=block")
		}

		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-Download-Options", "noopen")
		c.Header("X-Permitted-Cross-Domain-Policies", "none")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")

		c.Next()
	}
}

// HSTS sets Strict-Transport-Security for HTTPS-only environments.
// maxAge: duration in seconds the browser should remember to only use HTTPS.
// Set to 0 to disable (e.g., during local development).
func HSTS(maxAge int) gin.HandlerFunc {
	return func(c *gin.Context) {
		if maxAge > 0 && c.Request.TLS != nil {
			h := "max-age=" + itoa(maxAge) + "; includeSubDomains"
			c.Header("Strict-Transport-Security", h)
		}
		c.Next()
	}
}

// CSP sets Content-Security-Policy header.
// Pass empty string to disable. Skips paths starting with the given prefix.
func CSP(policy string, skipPrefixes ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if policy == "" {
			c.Next()
			return
		}
		for _, prefix := range skipPrefixes {
			if len(c.Request.URL.Path) >= len(prefix) && c.Request.URL.Path[:len(prefix)] == prefix {
				c.Next()
				return
			}
		}
		c.Header("Content-Security-Policy", policy)
		c.Next()
	}
}

// itoa is a simple int to string helper to avoid importing strconv
func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	var buf [12]byte
	i := len(buf)
	neg := n < 0
	if neg {
		n = -n
	}
	for n > 0 {
		i--
		buf[i] = byte('0' + n%10)
		n /= 10
	}
	if neg {
		i--
		buf[i] = '-'
	}
	return string(buf[i:])
}

// NoCache prevents caching for sensitive endpoints (API)
func NoCache() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
		c.Header("Pragma", "no-cache")
		c.Header("Expires", "0")
		c.Next()
	}
}

// SizeLimit limits request body size to prevent large payload attacks
func SizeLimit(maxBytes int64) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxBytes)
		c.Next()
	}
}
