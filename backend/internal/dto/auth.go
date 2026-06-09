package dto

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	AccessToken string      `json:"accessToken"`
	User        UserSummary `json:"user"`
}

type UserSummary struct {
	ID    string `json:"id"`
	Email string `json:"email"`
}
