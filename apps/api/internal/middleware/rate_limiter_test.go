package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"golang.org/x/time/rate"
)

func TestRateLimiter(t *testing.T) {
	rl := NewRateLimiter(rate.Limit(10), 3)
	defer rl.Close()

	dummyHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	limiterHandler := rl.Limit(dummyHandler)

	for i := 0; i < 3; i++ {
		req := httptest.NewRequest("GET", "http://example.com/api/test", nil)
		req.RemoteAddr = "192.168.1.1:12345"
		rec := httptest.NewRecorder()

		limiterHandler.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Errorf("요청 %d: 기대값 200 OK, 결과값 %d", i+1, rec.Code)
		}
	}

	req := httptest.NewRequest("GET", "http://example.com/api/test", nil)
	req.RemoteAddr = "192.168.1.1:12345"
	rec := httptest.NewRecorder()

	limiterHandler.ServeHTTP(rec, req)

	if rec.Code != http.StatusTooManyRequests {
		t.Errorf("4번째 요청: 기대값 429 Too Many Requests, 결과값 %d", rec.Code)
	}

	reqDiff := httptest.NewRequest("GET", "http://example.com/api/test", nil)
	reqDiff.RemoteAddr = "192.168.1.2:12345"
	recDiff := httptest.NewRecorder()

	limiterHandler.ServeHTTP(recDiff, reqDiff)

	if recDiff.Code != http.StatusOK {
		t.Errorf("다른 IP 요청: 기대값 200 OK, 결과값 %d", recDiff.Code)
	}

	time.Sleep(310 * time.Millisecond)
	reqRetry := httptest.NewRequest("GET", "http://example.com/api/test", nil)
	reqRetry.RemoteAddr = "192.168.1.1:12345"
	recRetry := httptest.NewRecorder()

	limiterHandler.ServeHTTP(recRetry, reqRetry)

	if recRetry.Code != http.StatusOK {
		t.Errorf("대기 후 재요청: 기대값 200 OK, 결과값 %d", recRetry.Code)
	}
}

func TestGetIPTrustsForwardedHeaderOnlyFromLoopbackProxy(t *testing.T) {
	direct := httptest.NewRequest(http.MethodGet, "http://example.com", nil)
	direct.RemoteAddr = "198.51.100.10:4567"
	direct.Header.Set("X-Forwarded-For", "203.0.113.20")
	if got := getIP(direct); got != "198.51.100.10" {
		t.Fatalf("direct request IP = %q, want remote address", got)
	}

	// Caddy(우리가 실제로 쓰는 reverse proxy)는 X-Forwarded-For를 덮어쓰지 않고
	// 자신이 관찰한 진짜 클라이언트 IP를 맨 뒤에 "추가"만 한다. 우리가 신뢰할
	// 수 있는 값은 그 마지막 값뿐이다 — 앞쪽 값은 클라이언트가 원래 요청에
	// 마음대로 넣어 보낼 수 있다.
	proxied := httptest.NewRequest(http.MethodGet, "http://example.com", nil)
	proxied.RemoteAddr = "127.0.0.1:8080"
	proxied.Header.Set("X-Forwarded-For", "203.0.113.20, 198.51.100.99")
	if got := getIP(proxied); got != "198.51.100.99" {
		t.Fatalf("proxied request IP = %q, want the last (proxy-appended) forwarded IP", got)
	}
}

func TestGetIPIgnoresClientSpoofedLeadingForwardedFor(t *testing.T) {
	// 공격자가 매 요청마다 X-Forwarded-For 맨 앞을 임의의 값으로 바꿔 보내도,
	// Caddy가 실제로 관찰해 붙인 마지막 IP가 그대로면 같은 클라이언트로
	// 인식돼서 레이트리밋 버킷을 우회할 수 없어야 한다.
	first := httptest.NewRequest(http.MethodGet, "http://example.com", nil)
	first.RemoteAddr = "127.0.0.1:8080"
	first.Header.Set("X-Forwarded-For", "1.2.3.4, 198.51.100.99")

	second := httptest.NewRequest(http.MethodGet, "http://example.com", nil)
	second.RemoteAddr = "127.0.0.1:8080"
	second.Header.Set("X-Forwarded-For", "9.9.9.9, 198.51.100.99")

	got1, got2 := getIP(first), getIP(second)
	if got1 != got2 {
		t.Fatalf("spoofed leading X-Forwarded-For changed the rate-limit key: %q != %q", got1, got2)
	}
	if got1 != "198.51.100.99" {
		t.Fatalf("getIP() = %q, want the trusted proxy-appended IP", got1)
	}
}
