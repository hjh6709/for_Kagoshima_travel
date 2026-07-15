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
