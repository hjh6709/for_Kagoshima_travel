package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/dto"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/httpjson"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/middleware"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/service"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req dto.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpjson.WriteError(w, http.StatusBadRequest, "요청 형식이 올바르지 않습니다.")
		return
	}

	res, err := h.authService.Register(req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrEmailTaken):
			httpjson.WriteError(w, http.StatusConflict, "이미 사용 중인 이메일입니다.")
		case errors.Is(err, service.ErrInvalidInput):
			httpjson.WriteError(w, http.StatusBadRequest, "이메일 또는 비밀번호가 올바르지 않습니다.")
		default:
			httpjson.WriteError(w, http.StatusInternalServerError, "서버 오류가 발생했습니다.")
		}
		return
	}

	httpjson.Write(w, http.StatusCreated, res)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req dto.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpjson.WriteError(w, http.StatusBadRequest, "요청 형식이 올바르지 않습니다.")
		return
	}

	res, err := h.authService.Login(req)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			httpjson.WriteError(w, http.StatusUnauthorized, "이메일 또는 비밀번호가 올바르지 않습니다.")
			return
		}
		httpjson.WriteError(w, http.StatusInternalServerError, "서버 오류가 발생했습니다.")
		return
	}

	httpjson.Write(w, http.StatusOK, res)
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	if claims == nil {
		httpjson.WriteError(w, http.StatusUnauthorized, "인증이 필요합니다.")
		return
	}

	httpjson.Write(w, http.StatusOK, dto.AuthSessionResponse{
		User: dto.UserSummary{
			ID:    claims.UserID,
			Email: claims.Email,
		},
	})
}
