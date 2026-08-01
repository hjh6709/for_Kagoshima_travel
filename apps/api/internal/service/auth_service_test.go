package service

import (
	"errors"
	"flag"
	"testing"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/dto"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/repository"
)

func useRuntimeAuthValidation(t *testing.T) {
	t.Helper()
	originalFlags := flag.CommandLine
	flag.CommandLine = flag.NewFlagSet("auth-runtime-test", flag.ContinueOnError)
	t.Cleanup(func() {
		flag.CommandLine = originalFlags
	})
}

func TestVerifiedSignupCodeRemainsValidUntilRegistration(t *testing.T) {
	useRuntimeAuthValidation(t)
	t.Setenv("APP_ENV", "development")
	t.Setenv("RESEND_API_KEY", "")
	t.Setenv("SMTP_HOST", "")
	t.Setenv("SMTP_PORT", "")
	t.Setenv("SMTP_USER", "")
	t.Setenv("SMTP_PASS", "")

	authService := NewAuthService(repository.NewMemoryUserRepository(), "test-jwt-secret")
	email := "verified-signup@example.com"
	code, err := authService.SendVerificationCode(email, "register")
	if err != nil {
		t.Fatalf("SendVerificationCode: %v", err)
	}
	if err := authService.VerifyCode(email, code); err != nil {
		t.Fatalf("VerifyCode: %v", err)
	}

	_, err = authService.Register(dto.RegisterRequest{
		Email:         email,
		Password:      "Strong1!Password",
		Code:          code,
		CaptchaAnswer: 7,
		CaptchaKey:    "3+4",
	})
	if err != nil {
		t.Fatalf("Register after VerifyCode: %v", err)
	}
	if err := authService.VerifyCode(email, code); !errors.Is(err, ErrInvalidVerificationCode) {
		t.Fatalf("VerifyCode after successful registration = %v, want ErrInvalidVerificationCode", err)
	}
}
