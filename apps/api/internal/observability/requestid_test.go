package observability

import (
	"context"
	"log/slog"
	"testing"
)

func TestNewRequestIDIsUniqueAndNonEmpty(t *testing.T) {
	seen := make(map[string]bool)
	for i := 0; i < 100; i++ {
		id := NewRequestID()
		if id == "" {
			t.Fatal("NewRequestID() returned empty string")
		}
		if seen[id] {
			t.Fatalf("NewRequestID() returned duplicate %q", id)
		}
		seen[id] = true
	}
}

func TestRequestIDRoundTripsThroughContext(t *testing.T) {
	ctx := WithRequestID(context.Background(), "req-123")

	if got := RequestIDFromContext(ctx); got != "req-123" {
		t.Errorf("RequestIDFromContext() = %q, want req-123", got)
	}
}

func TestRequestIDFromContextIsEmptyWhenAbsent(t *testing.T) {
	if got := RequestIDFromContext(context.Background()); got != "" {
		t.Errorf("RequestIDFromContext() = %q, want empty", got)
	}
}

func TestLoggerFromContextFallsBackToDefault(t *testing.T) {
	if LoggerFromContext(context.Background()) == nil {
		t.Fatal("LoggerFromContext() must never return nil")
	}
}

func TestLoggerRoundTripsThroughContext(t *testing.T) {
	logger := slog.Default().With("scope", "test")
	ctx := WithLogger(context.Background(), logger)

	if LoggerFromContext(ctx) != logger {
		t.Error("LoggerFromContext() did not return the stored logger")
	}
}
