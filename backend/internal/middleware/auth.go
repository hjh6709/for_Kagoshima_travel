package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/hanjeonghyun/for-kagoshima-travel/backend/internal/auth"
	"github.com/hanjeonghyun/for-kagoshima-travel/backend/internal/httpjson"
)

type contextKey string

const ClaimsKey contextKey = "claims"

func RequireAuth(secret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := extractBearer(r)
			if token == "" {
				httpjson.WriteError(w, http.StatusUnauthorized, "인증이 필요합니다.")
				return
			}

			claims, err := auth.ParseToken(token, secret)
			if err != nil {
				httpjson.WriteError(w, http.StatusUnauthorized, "유효하지 않은 토큰입니다.")
				return
			}

			ctx := context.WithValue(r.Context(), ClaimsKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func GetClaims(r *http.Request) *auth.Claims {
	claims, _ := r.Context().Value(ClaimsKey).(*auth.Claims)
	return claims
}

func extractBearer(r *http.Request) string {
	v := r.Header.Get("Authorization")
	if !strings.HasPrefix(v, "Bearer ") {
		return ""
	}
	return strings.TrimPrefix(v, "Bearer ")
}
