package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/httpjson"
)

type ReadinessChecker interface {
	Ping(context.Context) error
}

const readinessTimeout = 2 * time.Second

func Health(w http.ResponseWriter, _ *http.Request) {
	httpjson.Write(w, http.StatusOK, map[string]string{"status": "ok"})
}

func Readiness(checker ReadinessChecker) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), readinessTimeout)
		defer cancel()

		if checker != nil {
			if err := checker.Ping(ctx); err != nil {
				httpjson.Write(w, http.StatusServiceUnavailable, map[string]string{"status": "unavailable"})
				return
			}
		}

		httpjson.Write(w, http.StatusOK, map[string]string{"status": "ready"})
	}
}
