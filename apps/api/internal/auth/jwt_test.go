package auth

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func TestIssueAndParseTokenPreservesSessionVersion(t *testing.T) {
	token, err := IssueToken("user-1", "traveler@example.com", 4, "test-secret")
	if err != nil {
		t.Fatalf("IssueToken: %v", err)
	}
	claims, err := ParseToken(token, "test-secret")
	if err != nil {
		t.Fatalf("ParseToken: %v", err)
	}
	if claims.UserID != "user-1" || claims.Subject != "user-1" || claims.TokenVersion != 4 {
		t.Fatalf("claims = %#v, want matching subject and token version", claims)
	}
}

func TestParseTokenRejectsLegacyClaimsWithoutIssuerAndAudience(t *testing.T) {
	legacy := Claims{
		UserID: "user-1",
		Email:  "traveler@example.com",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
			Subject:   "user-1",
		},
	}
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, legacy).SignedString([]byte("test-secret"))
	if err != nil {
		t.Fatalf("sign legacy token: %v", err)
	}
	if _, err := ParseToken(token, "test-secret"); err == nil {
		t.Fatal("ParseToken accepted token without required issuer and audience")
	}
}
