package middleware

import (
	"net"
	"net/http"
	"sync"
	"time"

	"golang.org/x/time/rate"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/httpjson"
)

type client struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

type RateLimiter struct {
	mu      sync.RWMutex
	clients map[string]*client
	rate    rate.Limit
	burst   int
}

func NewRateLimiter(r rate.Limit, b int) *RateLimiter {
	rl := &RateLimiter{
		clients: make(map[string]*client),
		rate:    r,
		burst:   b,
	}

	go rl.cleanup()

	return rl
}

func (rl *RateLimiter) Limit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := getIP(r)

		rl.mu.Lock()
		c, exists := rl.clients[ip]
		if !exists {
			c = &client{
				limiter: rate.NewLimiter(rl.rate, rl.burst),
			}
			rl.clients[ip] = c
		}
		c.lastSeen = time.Now()
		rl.mu.Unlock()

		if !c.limiter.Allow() {
			httpjson.WriteError(w, http.StatusTooManyRequests, "요청 횟수가 너무 많습니다. 잠시 후 다시 시도해주세요.")
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (rl *RateLimiter) cleanup() {
	for {
		time.Sleep(1 * time.Minute)
		rl.mu.Lock()
		for ip, client := range rl.clients {
			if time.Since(client.lastSeen) > 3*time.Minute {
				delete(rl.clients, ip)
			}
		}
		rl.mu.Unlock()
	}
}

func getIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		if ip, _, err := net.SplitHostPort(xff); err == nil {
			return ip
		}
		return xff
	}
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return ip
}
