package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const (
	tokenTTL      = 24 * time.Hour
	tokenIssuer   = "map-planner-api"
	tokenAudience = "map-planner-web"
)

type Claims struct {
	UserID       string `json:"userId"`
	Email        string `json:"email"`
	TokenVersion int    `json:"tokenVersion"`
	jwt.RegisteredClaims
}

var ErrInvalidToken = errors.New("invalid token")

func IssueToken(userID, email string, tokenVersion int, secret string) (string, error) {
	claims := Claims{
		UserID:       userID,
		Email:        email,
		TokenVersion: tokenVersion,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(tokenTTL)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   userID,
			Issuer:    tokenIssuer,
			Audience:  jwt.ClaimStrings{tokenAudience},
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(secret))
}

func ParseToken(tokenStr, secret string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(
		tokenStr,
		&Claims{},
		func(*jwt.Token) (any, error) { return []byte(secret), nil },
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
		jwt.WithIssuer(tokenIssuer),
		jwt.WithAudience(tokenAudience),
	)
	if err != nil || !token.Valid {
		return nil, ErrInvalidToken
	}
	claims, ok := token.Claims.(*Claims)
	if !ok || claims.UserID == "" || claims.Subject != claims.UserID || claims.Email == "" {
		return nil, ErrInvalidToken
	}
	return claims, nil
}
