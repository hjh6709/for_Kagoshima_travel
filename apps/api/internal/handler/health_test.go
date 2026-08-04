package handler

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

type stubReadinessChecker struct {
	err error
}

func (s stubReadinessChecker) Ping(context.Context) error {
	return s.err
}

func TestHealthReturnsOKWithoutCheckingDependencies(t *testing.T) {
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/healthz", nil)

	Health(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}
	if body := recorder.Body.String(); !strings.Contains(body, `"status":"ok"`) {
		t.Fatalf("body = %q, want ok status", body)
	}
}

func TestReadinessReturnsServiceUnavailableWithoutLeakingDependencyError(t *testing.T) {
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/readyz", nil)

	Readiness(stubReadinessChecker{err: errors.New("postgres password=secret connection failed")}).ServeHTTP(recorder, request)

	if recorder.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusServiceUnavailable)
	}
	if body := recorder.Body.String(); !strings.Contains(body, `"status":"unavailable"`) {
		t.Fatalf("body = %q, want unavailable status", body)
	}
	if body := recorder.Body.String(); strings.Contains(body, "password") || strings.Contains(body, "secret") {
		t.Fatalf("body leaked dependency error: %q", body)
	}
}

func TestReadinessReturnsOKWhenDependenciesAreAvailable(t *testing.T) {
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/readyz", nil)

	Readiness(stubReadinessChecker{}).ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}
	if body := recorder.Body.String(); !strings.Contains(body, `"status":"ready"`) {
		t.Fatalf("body = %q, want ready status", body)
	}
}
