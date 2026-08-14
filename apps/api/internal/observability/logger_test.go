package observability

import (
	"bytes"
	"encoding/json"
	"strings"
	"testing"
)

func TestNewLoggerWritesJSONInProduction(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("LOG_LEVEL", "info")

	var buf bytes.Buffer
	NewLogger(&buf).Info("hello", "key", "value")

	var entry map[string]any
	if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
		t.Fatalf("production log must be JSON, got %q (err %v)", buf.String(), err)
	}
	if entry["msg"] != "hello" {
		t.Errorf("msg = %v, want hello", entry["msg"])
	}
	if entry["key"] != "value" {
		t.Errorf("key = %v, want value", entry["key"])
	}
}

func TestNewLoggerUsesTextOutsideProduction(t *testing.T) {
	t.Setenv("APP_ENV", "")
	t.Setenv("ENV", "")

	var buf bytes.Buffer
	NewLogger(&buf).Info("hello")

	if json.Valid(bytes.TrimSpace(buf.Bytes())) {
		t.Errorf("non-production log should be text, got JSON: %q", buf.String())
	}
	if !strings.Contains(buf.String(), "hello") {
		t.Errorf("log must contain message, got %q", buf.String())
	}
}

func TestNewLoggerRespectsLogLevel(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("LOG_LEVEL", "warn")

	var buf bytes.Buffer
	logger := NewLogger(&buf)
	logger.Info("dropped")
	logger.Warn("kept")

	if strings.Contains(buf.String(), "dropped") {
		t.Errorf("info must be filtered at warn level, got %q", buf.String())
	}
	if !strings.Contains(buf.String(), "kept") {
		t.Errorf("warn must be emitted, got %q", buf.String())
	}
}

func TestNewLoggerDefaultsToInfoOnUnknownLevel(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("LOG_LEVEL", "chatty")

	var buf bytes.Buffer
	logger := NewLogger(&buf)
	logger.Debug("dropped")
	logger.Info("kept")

	if strings.Contains(buf.String(), "dropped") {
		t.Errorf("debug must be filtered at default level, got %q", buf.String())
	}
	if !strings.Contains(buf.String(), "kept") {
		t.Errorf("info must be emitted, got %q", buf.String())
	}
}
