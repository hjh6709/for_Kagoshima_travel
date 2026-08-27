package model

import "time"

type User struct {
	ID                  string     `json:"id"`
	Email               string     `json:"email"`
	Password            string     `json:"-"` // bcrypt hash, JSON 직렬화에서 제외
	TokenVersion        int        `json:"-"`
	FailedLoginAttempts int        `json:"-"` // 로그인 브루트포스 잠금용, 절대 응답에 노출하지 않는다
	LockedUntil         *time.Time `json:"-"`
	CreatedAt           time.Time  `json:"createdAt"`
}

type ShareLink struct {
	ID        string     `json:"id"`
	TripID    string     `json:"tripId"`
	Token     string     `json:"token"`
	CreatedAt time.Time  `json:"createdAt"`
	ExpiresAt *time.Time `json:"expiresAt,omitempty"`
}
