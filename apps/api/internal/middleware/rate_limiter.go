package middleware

import (
	"net"
	"net/http"
	"strings"
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
	mu       sync.RWMutex
	clients  map[string]*client
	rate     rate.Limit
	burst    int
	stop     chan struct{}
	stopOnce sync.Once
}

func NewRateLimiter(r rate.Limit, b int) *RateLimiter {
	rl := &RateLimiter{
		clients: make(map[string]*client),
		rate:    r,
		burst:   b,
		stop:    make(chan struct{}),
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
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()
	for {
		select {
		case <-ticker.C:
			rl.mu.Lock()
			for ip, client := range rl.clients {
				if time.Since(client.lastSeen) > 3*time.Minute {
					delete(rl.clients, ip)
				}
			}
			rl.mu.Unlock()
		case <-rl.stop:
			return
		}
	}
}

func (rl *RateLimiter) Close() {
	rl.stopOnce.Do(func() { close(rl.stop) })
}

func getIP(r *http.Request) string {
	remoteIP := parseRemoteIP(r.RemoteAddr)
	if remoteIP != nil && remoteIP.IsLoopback() {
		// 우리 배포 구성(Caddy → 127.0.0.1:8080)의 reverse_proxy는
		// X-Forwarded-For를 덮어쓰지 않고 자신이 실제로 관찰한 클라이언트
		// IP를 맨 뒤에 "추가"만 한다. 앞쪽 값들은 클라이언트가 원본 요청에
		// 마음대로 써서 보낼 수 있는 값이라 신뢰할 수 없다 — 이전 코드처럼
		// 첫 번째 값을 쓰면, 공격자가 요청마다 X-Forwarded-For 앞부분을
		// 바꿔 보내는 것만으로 IP당 레이트리밋(로그인 시도 포함)을 완전히
		// 우회할 수 있었다. 우리가 신뢰할 수 있는 값은 이 프록시가 직접
		// 붙인 마지막 값뿐이므로 그것만 쓴다.
		values := strings.Split(r.Header.Get("X-Forwarded-For"), ",")
		forwarded := strings.TrimSpace(values[len(values)-1])
		if forwardedIP := net.ParseIP(forwarded); forwardedIP != nil {
			return forwardedIP.String()
		}
	}
	if remoteIP != nil {
		return remoteIP.String()
	}
	return r.RemoteAddr
}

func parseRemoteIP(remoteAddr string) net.IP {
	ip, _, err := net.SplitHostPort(remoteAddr)
	if err != nil {
		return net.ParseIP(remoteAddr)
	}
	return net.ParseIP(ip)
}
