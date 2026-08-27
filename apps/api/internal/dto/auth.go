package dto

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Code     string `json:"code"`
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
	// 운영 환경(Resend/SMTP로 실제 발송 성공)에서는 항상 빈 문자열이고
	// Delivered=true입니다 — 크리덴셜을 API 응답에 남기지 않기 위해서입니다.
	// 이메일 설정이 없는 로컬 개발 환경에서만 화면에 바로 보여주기 위해 채워집니다.
	TemporaryPassword string `json:"temporaryPassword"`
	Delivered         bool   `json:"delivered"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword"`
}

type DeleteAccountRequest struct {
	CurrentPassword string `json:"currentPassword"`
}

type SendVerificationCodeRequest struct {
	Email   string `json:"email"`
	Purpose string `json:"purpose"` // "register" 또는 "forgot" 목적 분기
}

type SendVerificationCodeResponse struct {
	Code string `json:"code"`
}

type VerifyCodeRequest struct {
	Email   string `json:"email"`
	Purpose string `json:"purpose"`
	Code    string `json:"code"`
}
