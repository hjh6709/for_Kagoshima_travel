package model

import "time"

type User struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	Password  string    `json:"-"` // bcrypt hash, JSON 직렬화에서 제외
	CreatedAt time.Time `json:"createdAt"`
}

type ShareLink struct {
	ID        string     `json:"id"`
	TripID    string     `json:"tripId"`
	Token     string     `json:"token"`
	CreatedAt time.Time  `json:"createdAt"`
	ExpiresAt *time.Time `json:"expiresAt,omitempty"`
}
