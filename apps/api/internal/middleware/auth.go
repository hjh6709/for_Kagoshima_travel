package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/auth"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/httpjson"
)

type contextKey string

const ClaimsKey contextKey = "claims"

// SessionCookieName is shared with the auth handler so browsers can keep the
// JWT in an HttpOnly cookie instead of exposing it to JavaScript storage.
const SessionCookieName = "map_planner_session"

type ClaimsValidator func(context.Context, *auth.Claims) bool

func RequireAuth(secret string, validate ClaimsValidator) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := extractBearer(r)
			if token == "" {
				if cookie, err := r.Cookie(SessionCookieName); err == nil {
					token = cookie.Value
				}
			}
			if token == "" {
				httpjson.WriteError(w, http.StatusUnauthorized, "인증이 필요합니다.")
				return
			}

			claims, err := auth.ParseToken(token, secret)
			if err != nil {
				httpjson.WriteError(w, http.StatusUnauthorized, "유효하지 않은 토큰입니다.")
				return
			}
			if validate != nil && !validate(r.Context(), claims) {
				httpjson.WriteError(w, http.StatusUnauthorized, "로그인 세션이 만료되었습니다.")
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
