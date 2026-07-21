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
		case errors.Is(err, service.ErrPasswordComplexity):
			httpjson.WriteError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, service.ErrInvalidInput):
			httpjson.WriteError(w, http.StatusBadRequest, "이메일 또는 비밀번호가 올바르지 않습니다.")
		default:
			// 커스텀 리턴 에러(예: 8자 미만, 인증코드 불일치)는 400 Bad Request 로 메시지 전달
			if err.Error() != "" {
				httpjson.WriteError(w, http.StatusBadRequest, err.Error())
			} else {
				httpjson.WriteError(w, http.StatusInternalServerError, "서버 오류가 발생했습니다.")
			}
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

func (h *AuthHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req dto.ForgotPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpjson.WriteError(w, http.StatusBadRequest, "요청 형식이 올바르지 않습니다.")
		return
	}

	tempPass, err := h.authService.ForgotPassword(req.Email, req.Code)
	if err != nil {
		httpjson.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	httpjson.Write(w, http.StatusOK, dto.ForgotPasswordResponse{
		TemporaryPassword: tempPass,
	})
}

func (h *AuthHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	if claims == nil {
		httpjson.WriteError(w, http.StatusUnauthorized, "인증이 필요합니다.")
		return
	}

	var req dto.ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpjson.WriteError(w, http.StatusBadRequest, "요청 형식이 올바르지 않습니다.")
		return
	}

	err := h.authService.ChangePassword(claims.Email, req.CurrentPassword, req.NewPassword)
	if err != nil {
		httpjson.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	httpjson.Write(w, http.StatusOK, map[string]string{"message": "비밀번호가 성공적으로 변경되었습니다."})
}

func (h *AuthHandler) SendVerificationCode(w http.ResponseWriter, r *http.Request) {
	var req dto.SendVerificationCodeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpjson.WriteError(w, http.StatusBadRequest, "요청 형식이 올바르지 않습니다.")
		return
	}

	code, err := h.authService.SendVerificationCode(req.Email, req.Purpose)
	if err != nil {
		httpjson.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	httpjson.Write(w, http.StatusOK, dto.SendVerificationCodeResponse{Code: code})
}

func (h *AuthHandler) VerifyCode(w http.ResponseWriter, r *http.Request) {
	var req dto.VerifyCodeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpjson.WriteError(w, http.StatusBadRequest, "요청 형식이 올바르지 않습니다.")
		return
	}

	if err := h.authService.VerifyCode(req.Email, req.Code); err != nil {
		httpjson.WriteError(w, http.StatusBadRequest, "인증 코드가 일치하지 않거나 만료되었습니다.")
		return
	}

	httpjson.Write(w, http.StatusOK, map[string]bool{"verified": true})
}
