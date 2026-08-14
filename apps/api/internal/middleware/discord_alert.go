package middleware

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"runtime/debug"
	"time"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/observability"
)

type responseWriterWrapper struct {
	http.ResponseWriter
	statusCode   int
	bytesWritten int
}

func (w *responseWriterWrapper) WriteHeader(code int) {
	w.statusCode = code
	w.ResponseWriter.WriteHeader(code)
}

func (w *responseWriterWrapper) Write(b []byte) (int, error) {
	n, err := w.ResponseWriter.Write(b)
	w.bytesWritten += n
	return n, err
}

func DiscordAlert(next http.Handler) http.Handler {
	webhookURL := os.Getenv("DISCORD_WEBHOOK_URL")

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		wrapper := &responseWriterWrapper{
			ResponseWriter: w,
			statusCode:     http.StatusOK,
		}

		defer func() {
			if err := recover(); err != nil {
				stack := debug.Stack()
				errMsg := fmt.Sprintf("%v", err)
				requestID := observability.RequestIDFromContext(r.Context())

				// 웹훅이 없거나 실패해도 흔적은 반드시 남긴다.
				observability.LoggerFromContext(r.Context()).Error("panic recovered",
					slog.String("panic", errMsg),
					slog.String("method", r.Method),
					slog.String("path", r.URL.Path),
					slog.String("stack", string(stack)),
				)

				sendDiscordAlert(webhookURL, r, errMsg, string(stack), requestID)

				w.Header().Set("Content-Type", "application/json; charset=utf-8")
				w.WriteHeader(http.StatusInternalServerError)
				_, _ = w.Write([]byte(`{"error":"Internal Server Error"}`))
			}
		}()

		next.ServeHTTP(wrapper, r)

		if wrapper.statusCode == http.StatusInternalServerError {
			sendDiscordAlert(webhookURL, r, "Status 500 Internal Server Error", "API returned 500 Status Code",
				observability.RequestIDFromContext(r.Context()))
		}
	})
}

type discordEmbedField struct {
	Name   string `json:"name"`
	Value  string `json:"value"`
	Inline bool   `json:"inline"`
}

type discordEmbed struct {
	Title       string              `json:"title"`
	Description string              `json:"description"`
	Color       int                 `json:"color"`
	Fields      []discordEmbedField `json:"fields"`
	Timestamp   string              `json:"timestamp"`
}

type discordPayload struct {
	Embeds []discordEmbed `json:"embeds"`
}

func sendDiscordAlert(url string, r *http.Request, errMsg string, stack string, requestID string) {
	if url == "" {
		return
	}

	if len(stack) > 1000 {
		stack = stack[:1000] + "\n...[truncated]"
	}

	embed := discordEmbed{
		Title:       "🚨 API 서버 에러 감지 (travel-api)",
		Description: fmt.Sprintf("**Error Message:**\n```\n%s\n```", errMsg),
		Color:       16711680,
		Fields: []discordEmbedField{
			{Name: "Request ID", Value: requestID, Inline: true},
			{Name: "Method", Value: r.Method, Inline: true},
			{Name: "URL", Value: r.URL.Path, Inline: true},
			{Name: "Client IP", Value: getIP(r), Inline: true},
			{Name: "Stack Trace", Value: fmt.Sprintf("```go\n%s\n```", stack), Inline: false},
		},
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	}

	payload := discordPayload{
		Embeds: []discordEmbed{embed},
	}

	jsonBytes, err := json.Marshal(payload)
	if err != nil {
		return
	}

	go func() {
		resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonBytes))
		if err != nil {
			return
		}
		_ = resp.Body.Close()
	}()
}
