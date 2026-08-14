// Package observability는 로그와 요청 추적에 필요한 공용 도구를 모은다.
package observability

import (
	"io"
	"log/slog"
	"os"
	"strings"
)

// NewLogger는 환경에 맞는 구조화 로거를 만든다.
//
// 프로덕션은 JSON으로 남겨 journalctl/로그 수집기가 파싱할 수 있게 하고,
// 로컬에서는 사람이 읽기 쉬운 text로 남긴다.
func NewLogger(w io.Writer) *slog.Logger {
	options := &slog.HandlerOptions{Level: parseLevel(os.Getenv("LOG_LEVEL"))}
	if isProduction() {
		return slog.New(slog.NewJSONHandler(w, options))
	}
	return slog.New(slog.NewTextHandler(w, options))
}

func parseLevel(raw string) slog.Level {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "debug":
		return slog.LevelDebug
	case "warn", "warning":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}

func isProduction() bool {
	env := os.Getenv("APP_ENV")
	if env == "" {
		env = os.Getenv("ENV")
	}
	env = strings.ToLower(env)
	return env == "production" || env == "prod"
}
