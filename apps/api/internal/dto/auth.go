package dto

type RegisterRequest struct {
	Email         string `json:"email"`
	Password      string `json:"password"`
	Code          string `json:"code"`
	CaptchaAnswer int    `json:"captchaAnswer"`
	CaptchaKey    string `json:"captchaKey"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	AccessToken string      `json:"accessToken"`
	User        UserSummary `json:"user"`
}

type AuthSessionResponse struct {
	User UserSummary `json:"user"`
}

type UserSummary struct {
	ID    string `json:"id"`
	Email string `json:"email"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email"`
	Code  string `json:"code"`
}

type ForgotPasswordResponse struct {
	TemporaryPassword string `json:"temporaryPassword"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword"`
}

type SendVerificationCodeRequest struct {
	Email   string `json:"email"`
	Purpose string `json:"purpose"` // "register" 또는 "forgot" 목적 분기
}

type SendVerificationCodeResponse struct {
	Code string `json:"code"`
}

type VerifyCodeRequest struct {
	Email string `json:"email"`
	Code  string `json:"code"`
}
