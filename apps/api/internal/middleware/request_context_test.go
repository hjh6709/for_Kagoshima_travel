package middleware

import (
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/observability"
)

func testLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(io.Discard, nil))
}

func TestRequestContextGeneratesIDWhenHeaderMissing(t *testing.T) {
	var seen string
	handler := RequestContext(testLogger())(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		seen = observability.RequestIDFromContext(r.Context())
	}))

	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/api/trips", nil))

	if seen == "" {
		t.Fatal("handler context must carry a request ID")
	}
	if got := recorder.Header().Get(observability.RequestIDHeader); got != seen {
		t.Errorf("response header = %q, want %q", got, seen)
	}
}

func TestRequestContextReusesIncomingHeader(t *testing.T) {
	var seen string
	handler := RequestContext(testLogger())(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		seen = observability.RequestIDFromContext(r.Context())
	}))

	request := httptest.NewRequest(http.MethodGet, "/api/trips", nil)
	request.Header.Set(observability.RequestIDHeader, "client-supplied-id")
	handler.ServeHTTP(httptest.NewRecorder(), request)

	if seen != "client-supplied-id" {
		t.Errorf("request ID = %q, want client-supplied-id", seen)
	}
}

func TestRequestContextRejectsUnsafeIncomingHeader(t *testing.T) {
	for name, raw := range map[string]string{
		"too long": "0123456789012345678901234567890123456789012345678901234567890123456789",
		"space":    "has space",
		"symbol":   "abc;rm -rf",
	} {
		t.Run(name, func(t *testing.T) {
			var seen string
			handler := RequestContext(testLogger())(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				seen = observability.RequestIDFromContext(r.Context())
			}))

			request := httptest.NewRequest(http.MethodGet, "/api/trips", nil)
			request.Header.Set(observability.RequestIDHeader, raw)
			handler.ServeHTTP(httptest.NewRecorder(), request)

			if seen == raw {
				t.Errorf("unsafe request ID %q must be replaced", raw)
			}
			if seen == "" {
				t.Error("a replacement request ID must still be generated")
			}
		})
	}
}

func TestRequestContextPutsLoggerInContext(t *testing.T) {
	handler := RequestContext(testLogger())(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if observability.LoggerFromContext(r.Context()) == nil {
			t.Error("context logger must be available to handlers")
		}
	}))

	handler.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/api/trips", nil))
}
