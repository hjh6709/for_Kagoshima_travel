package handler

import (
	"errors"
	"log"
	"net/http"
	"time"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/dto"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/httpjson"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/middleware"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/service"
)

type AuthHandler struct {
	authService  *service.AuthService
	secureCookie bool
}

func (h *AuthHandler) service(r *http.Request) *service.AuthService {
	return h.authService.WithContext(r.Context())
}

func NewAuthHandler(authService *service.AuthService, secureCookie bool) *AuthHandler {
	return &AuthHandler{authService: authService, secureCookie: secureCookie}
}

func preventAuthResponseCaching(w http.ResponseWriter) {
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Pragma", "no-cache")
}

func (h *AuthHandler) setSessionCookie(w http.ResponseWriter, accessToken string) {
	http.SetCookie(w, &http.Cookie{
		Name:     middleware.SessionCookieName,
		Value:    accessToken,
		Path:     "/",
		MaxAge:   int((24 * time.Hour).Seconds()),
		Expires:  time.Now().Add(24 * time.Hour),
		HttpOnly: true,
		Secure:   h.secureCookie,
		SameSite: http.SameSiteLaxMode,
	})
}

func (h *AuthHandler) clearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     middleware.SessionCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		Expires:  time.Unix(1, 0),
		HttpOnly: true,
		Secure:   h.secureCookie,
		SameSite: http.SameSiteLaxMode,
	})
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	preventAuthResponseCaching(w)
	var req dto.RegisterRequest
	if !httpjson.DecodeRequest(w, r, &req) {
		return
	}

	res, err := h.service(r).Register(req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrEmailTaken):
			httpjson.WriteError(w, http.StatusConflict, "이미 사용 중인 이메일입니다.")
		case errors.Is(err, service.ErrPasswordComplexity):
			httpjson.WriteError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, service.ErrInvalidInput):
			httpjson.WriteError(w, http.StatusBadRequest, "이메일 또는 비밀번호가 올바르지 않습니다.")
		case errors.Is(err, service.ErrInvalidVerificationCode):
			httpjson.WriteError(w, http.StatusBadRequest, "이메일 인증코드가 일치하지 않거나 만료되었습니다.")
		default:
			log.Printf("register user: %v", err)
			httpjson.WriteError(w, http.StatusInternalServerError, "회원가입을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.")
		}
		return
	}

	h.setSessionCookie(w, res.AccessToken)
	httpjson.Write(w, http.StatusCreated, res)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	preventAuthResponseCaching(w)
	var req dto.LoginRequest
	if !httpjson.DecodeRequest(w, r, &req) {
		return
	}

	res, err := h.service(r).Login(req)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			httpjson.WriteError(w, http.StatusUnauthorized, "이메일 또는 비밀번호가 올바르지 않습니다.")
			return
		}
		httpjson.WriteError(w, http.StatusInternalServerError, "서버 오류가 발생했습니다.")
		return
	}

	h.setSessionCookie(w, res.AccessToken)
	httpjson.Write(w, http.StatusOK, res)
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	preventAuthResponseCaching(w)
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

func (h *AuthHandler) Logout(w http.ResponseWriter, _ *http.Request) {
	preventAuthResponseCaching(w)
	h.clearSessionCookie(w)
	w.WriteHeader(http.StatusNoContent)
}

func (h *AuthHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	preventAuthResponseCaching(w)
	var req dto.ForgotPasswordRequest
	if !httpjson.DecodeRequest(w, r, &req) {
		return
	}

	tempPass, err := h.service(r).ForgotPassword(req.Email, req.Code)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrEmailNotFound):
			httpjson.WriteError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, service.ErrInvalidVerificationCode), errors.Is(err, service.ErrInvalidInput):
			httpjson.WriteError(w, http.StatusBadRequest, "이메일 인증코드가 일치하지 않거나 만료되었습니다.")
		default:
			log.Printf("reset password: %v", err)
			httpjson.WriteError(w, http.StatusInternalServerError, "비밀번호 재설정을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.")
		}
		return
	}

	httpjson.Write(w, http.StatusOK, dto.ForgotPasswordResponse{
		TemporaryPassword: tempPass,
	})
}

func (h *AuthHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	preventAuthResponseCaching(w)
	claims := middleware.GetClaims(r)
	if claims == nil {
		httpjson.WriteError(w, http.StatusUnauthorized, "인증이 필요합니다.")
		return
	}

	var req dto.ChangePasswordRequest
	if !httpjson.DecodeRequest(w, r, &req) {
		return
	}

	res, err := h.service(r).ChangePassword(claims.Email, req.CurrentPassword, req.NewPassword)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrEmailNotFound),
			errors.Is(err, service.ErrCurrentPasswordMismatch),
			errors.Is(err, service.ErrPasswordComplexity):
			httpjson.WriteError(w, http.StatusBadRequest, err.Error())
		default:
			log.Printf("change password: %v", err)
			httpjson.WriteError(w, http.StatusInternalServerError, "비밀번호 변경을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.")
		}
		return
	}

	h.setSessionCookie(w, res.AccessToken)
	httpjson.Write(w, http.StatusOK, res)
}

func (h *AuthHandler) DeleteAccount(w http.ResponseWriter, r *http.Request) {
	preventAuthResponseCaching(w)
	claims := middleware.GetClaims(r)
	if claims == nil {
		httpjson.WriteError(w, http.StatusUnauthorized, "인증이 필요합니다.")
		return
	}

	var req dto.DeleteAccountRequest
	if !httpjson.DecodeRequest(w, r, &req) {
		return
	}
	if req.CurrentPassword == "" {
		httpjson.WriteError(w, http.StatusBadRequest, "현재 비밀번호를 입력해 주세요.")
		return
	}

	if err := h.service(r).DeleteAccount(claims.UserID, claims.Email, req.CurrentPassword); err != nil {
		switch {
		case errors.Is(err, service.ErrEmailNotFound):
			httpjson.WriteError(w, http.StatusNotFound, "계정을 찾을 수 없습니다.")
		case errors.Is(err, service.ErrCurrentPasswordMismatch):
			httpjson.WriteError(w, http.StatusBadRequest, err.Error())
		default:
			log.Printf("delete account: %v", err)
			httpjson.WriteError(w, http.StatusInternalServerError, "계정을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.")
		}
		return
	}

	h.clearSessionCookie(w)
	w.WriteHeader(http.StatusNoContent)
}

func (h *AuthHandler) SendVerificationCode(w http.ResponseWriter, r *http.Request) {
	preventAuthResponseCaching(w)
	var req dto.SendVerificationCodeRequest
	if !httpjson.DecodeRequest(w, r, &req) {
		return
	}

	code, err := h.service(r).SendVerificationCode(req.Email, req.Purpose)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrEmailTaken):
			httpjson.WriteError(w, http.StatusConflict, "이미 등록된 이메일 주소입니다.")
		case errors.Is(err, service.ErrEmailNotFound):
			httpjson.WriteError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, service.ErrVerificationRateLimit):
			httpjson.WriteError(w, http.StatusTooManyRequests, err.Error())
		case errors.Is(err, service.ErrInvalidInput):
			httpjson.WriteError(w, http.StatusBadRequest, "이메일 주소 또는 인증 목적이 올바르지 않습니다.")
		case errors.Is(err, service.ErrEmailDelivery):
			log.Printf("send verification email: %v", err)
			httpjson.WriteError(w, http.StatusBadGateway, "인증 메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.")
		default:
			log.Printf("prepare verification email: %v", err)
			httpjson.WriteError(w, http.StatusInternalServerError, "인증 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.")
		}
		return
	}

	httpjson.Write(w, http.StatusOK, dto.SendVerificationCodeResponse{Code: code})
}

func (h *AuthHandler) VerifyCode(w http.ResponseWriter, r *http.Request) {
	preventAuthResponseCaching(w)
	var req dto.VerifyCodeRequest
	if !httpjson.DecodeRequest(w, r, &req) {
		return
	}

	purpose := req.Purpose
	if purpose == "" {
		purpose = "register"
	}

	if err := h.service(r).VerifyCode(req.Email, purpose, req.Code); err != nil {
		if errors.Is(err, service.ErrInvalidVerificationCode) || errors.Is(err, service.ErrInvalidInput) {
			httpjson.WriteError(w, http.StatusBadRequest, "인증 코드가 일치하지 않거나 만료되었습니다.")
			return
		}
		log.Printf("verify email code: %v", err)
		httpjson.WriteError(w, http.StatusInternalServerError, "인증 요청을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.")
		return
	}

	httpjson.Write(w, http.StatusOK, map[string]bool{"verified": true})
}
