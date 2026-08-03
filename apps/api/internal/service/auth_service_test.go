package service

import (
	"errors"
	"testing"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/dto"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/repository"
)

func useRuntimeAuthValidation(t *testing.T) {
	t.Helper()
	t.Setenv("AUTH_TEST_BYPASS", "")
}

func TestVerifiedSignupCodeRemainsValidUntilRegistration(t *testing.T) {
	useRuntimeAuthValidation(t)
	t.Setenv("APP_ENV", "development")
	t.Setenv("RESEND_API_KEY", "")
	t.Setenv("SMTP_HOST", "")
	t.Setenv("SMTP_PORT", "")
	t.Setenv("SMTP_USER", "")
	t.Setenv("SMTP_PASS", "")

	verificationRepo := repository.NewMemoryVerificationRepository()
	authService := NewAuthService(repository.NewMemoryUserRepository(), verificationRepo, "test-jwt-secret")
	email := "verified-signup@example.com"
	code, err := authService.SendVerificationCode(email, "register")
	if err != nil {
		t.Fatalf("SendVerificationCode: %v", err)
	}
	if err := authService.VerifyCode(email, "register", code); err != nil {
		t.Fatalf("VerifyCode: %v", err)
	}

	_, err = authService.Register(dto.RegisterRequest{
		Email:    email,
		Password: "Strong1!Password",
		Code:     code,
	})
	if err != nil {
		t.Fatalf("Register after VerifyCode: %v", err)
	}
	if err := authService.VerifyCode(email, "register", code); !errors.Is(err, ErrInvalidVerificationCode) {
		t.Fatalf("VerifyCode after successful registration = %v, want ErrInvalidVerificationCode", err)
	}
}

func TestRegisterCanonicalizesEmailBeforeVerificationSaveAndConsumption(t *testing.T) {
	useRuntimeAuthValidation(t)
	t.Setenv("APP_ENV", "development")

	userRepo := repository.NewMemoryUserRepository()
	verificationRepo := repository.NewMemoryVerificationRepository()
	authService := NewAuthService(userRepo, verificationRepo, "test-jwt-secret")
	code, err := authService.SendVerificationCode("traveler@example.com", "register")
	if err != nil {
		t.Fatalf("SendVerificationCode: %v", err)
	}

	response, err := authService.Register(dto.RegisterRequest{
		Email:    "  Traveler@Example.com  ",
		Password: "Strong1!Password",
		Code:     code,
	})
	if err != nil {
		t.Fatalf("Register: %v", err)
	}
	if response.User.Email != "traveler@example.com" {
		t.Fatalf("registered email = %q, want canonical email", response.User.Email)
	}
	if err := authService.VerifyCode("traveler@example.com", "register", code); !errors.Is(err, ErrInvalidVerificationCode) {
		t.Fatalf("VerifyCode after canonicalized registration = %v, want ErrInvalidVerificationCode", err)
	}
	if _, err := userRepo.FindByEmail("traveler@example.com"); err != nil {
		t.Fatalf("FindByEmail canonical email: %v", err)
	}
}

func TestVerificationCodeSupportsValidEmailSpecialCharacters(t *testing.T) {
	useRuntimeAuthValidation(t)
	t.Setenv("APP_ENV", "development")

	authService := NewAuthService(
		repository.NewMemoryUserRepository(),
		repository.NewMemoryVerificationRepository(),
		"test-jwt-secret",
	)
	code, err := authService.SendVerificationCode("travel&cafe@example.com", "register")
	if err != nil {
		t.Fatalf("SendVerificationCode: %v", err)
	}
	if err := authService.VerifyCode("travel&cafe@example.com", "register", code); err != nil {
		t.Fatalf("VerifyCode: %v", err)
	}
}

func TestVerificationCodeSurvivesAuthServiceRecreation(t *testing.T) {
	useRuntimeAuthValidation(t)
	t.Setenv("APP_ENV", "development")

	verificationRepo := repository.NewMemoryVerificationRepository()
	firstService := NewAuthService(repository.NewMemoryUserRepository(), verificationRepo, "test-jwt-secret")
	code, err := firstService.SendVerificationCode("restart@example.com", "register")
	if err != nil {
		t.Fatalf("SendVerificationCode: %v", err)
	}

	recreatedService := NewAuthService(repository.NewMemoryUserRepository(), verificationRepo, "test-jwt-secret")
	if err := recreatedService.VerifyCode("restart@example.com", "register", code); err != nil {
		t.Fatalf("VerifyCode after service recreation: %v", err)
	}
}

func TestVerificationCodeLocksAfterRepeatedFailures(t *testing.T) {
	useRuntimeAuthValidation(t)
	t.Setenv("APP_ENV", "development")

	authService := NewAuthService(
		repository.NewMemoryUserRepository(),
		repository.NewMemoryVerificationRepository(),
		"test-jwt-secret",
	)
	code, err := authService.SendVerificationCode("attempts@example.com", "register")
	if err != nil {
		t.Fatalf("SendVerificationCode: %v", err)
	}

	for attempt := 0; attempt < maxVerificationAttempts; attempt++ {
		if err := authService.VerifyCode("attempts@example.com", "register", "000000"); !errors.Is(err, ErrInvalidVerificationCode) {
			t.Fatalf("VerifyCode failure %d = %v, want ErrInvalidVerificationCode", attempt+1, err)
		}
	}
	if err := authService.VerifyCode("attempts@example.com", "register", code); !errors.Is(err, ErrInvalidVerificationCode) {
		t.Fatalf("VerifyCode after lock = %v, want ErrInvalidVerificationCode", err)
	}
}

func TestVerificationSendLimitSurvivesAuthServiceRecreation(t *testing.T) {
	useRuntimeAuthValidation(t)
	t.Setenv("APP_ENV", "development")

	verificationRepo := repository.NewMemoryVerificationRepository()
	for request := 0; request < maxDailyVerificationSends; request++ {
		authService := NewAuthService(repository.NewMemoryUserRepository(), verificationRepo, "test-jwt-secret")
		if _, err := authService.SendVerificationCode("limited@example.com", "register"); err != nil {
			t.Fatalf("SendVerificationCode request %d: %v", request+1, err)
		}
	}

	authService := NewAuthService(repository.NewMemoryUserRepository(), verificationRepo, "test-jwt-secret")
	if _, err := authService.SendVerificationCode("limited@example.com", "register"); !errors.Is(err, ErrVerificationRateLimit) {
		t.Fatalf("SendVerificationCode over limit = %v, want ErrVerificationRateLimit", err)
	}
}
