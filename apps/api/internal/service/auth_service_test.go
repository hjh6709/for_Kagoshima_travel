package service

import (
	"errors"
	"testing"
	"time"

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

func TestLoginLocksAccountAfterRepeatedFailuresEvenWithCorrectPassword(t *testing.T) {
	t.Setenv("AUTH_TEST_BYPASS", "1")

	userRepo := repository.NewMemoryUserRepository()
	authService := NewAuthService(userRepo, repository.NewMemoryVerificationRepository(), "test-jwt-secret")

	const email = "locktest@example.com"
	const password = "Strong1!Password"
	if _, err := authService.Register(dto.RegisterRequest{Email: email, Password: password}); err != nil {
		t.Fatalf("Register(): %v", err)
	}

	for attempt := 0; attempt < maxLoginAttempts; attempt++ {
		_, err := authService.Login(dto.LoginRequest{Email: email, Password: "wrong-password"})
		if !errors.Is(err, ErrInvalidCredentials) {
			t.Fatalf("Login failure %d = %v, want ErrInvalidCredentials", attempt+1, err)
		}
	}

	// maxLoginAttempts번의 실패로 잠긴 뒤에는, 올바른 비밀번호를 넣어도 막혀야 한다 —
	// 그렇지 않으면 잠금 자체가 무의미하다.
	if _, err := authService.Login(dto.LoginRequest{Email: email, Password: password}); !errors.Is(err, ErrAccountLocked) {
		t.Fatalf("Login with correct password while locked = %v, want ErrAccountLocked", err)
	}
}

func TestLoginResetsFailedAttemptsAfterSuccess(t *testing.T) {
	t.Setenv("AUTH_TEST_BYPASS", "1")

	userRepo := repository.NewMemoryUserRepository()
	authService := NewAuthService(userRepo, repository.NewMemoryVerificationRepository(), "test-jwt-secret")

	const email = "reset-attempts@example.com"
	const password = "Strong1!Password"
	if _, err := authService.Register(dto.RegisterRequest{Email: email, Password: password}); err != nil {
		t.Fatalf("Register(): %v", err)
	}

	// 잠금 임계값보다 적게 실패시킨 뒤 성공하면, 카운터가 그대로 남아있지 않고 지워져야 한다.
	if _, err := authService.Login(dto.LoginRequest{Email: email, Password: "wrong-password"}); !errors.Is(err, ErrInvalidCredentials) {
		t.Fatalf("Login failure = %v, want ErrInvalidCredentials", err)
	}
	if _, err := authService.Login(dto.LoginRequest{Email: email, Password: password}); err != nil {
		t.Fatalf("Login success = %v, want nil", err)
	}

	stored, err := userRepo.FindByEmail(email)
	if err != nil {
		t.Fatalf("FindByEmail(): %v", err)
	}
	if stored.FailedLoginAttempts != 0 || stored.LockedUntil != nil {
		t.Fatalf("after successful login: FailedLoginAttempts=%d LockedUntil=%v, want 0 and nil",
			stored.FailedLoginAttempts, stored.LockedUntil)
	}
}

func TestLoginAllowsAttemptAfterLockWindowExpires(t *testing.T) {
	t.Setenv("AUTH_TEST_BYPASS", "1")

	userRepo := repository.NewMemoryUserRepository()
	authService := NewAuthService(userRepo, repository.NewMemoryVerificationRepository(), "test-jwt-secret")

	const email = "expired-lock@example.com"
	const password = "Strong1!Password"
	if _, err := authService.Register(dto.RegisterRequest{Email: email, Password: password}); err != nil {
		t.Fatalf("Register(): %v", err)
	}

	// 이미 만료된 잠금 상태를 직접 만든다 (음수 lockFor로 과거 시각에 잠기게 함) —
	// 실제로는 시간이 지나 잠금이 풀린 상황과 같다.
	if _, err := userRepo.RecordFailedLogin(email, time.Now(), 1, -time.Hour); err != nil {
		t.Fatalf("RecordFailedLogin(): %v", err)
	}

	if _, err := authService.Login(dto.LoginRequest{Email: email, Password: password}); err != nil {
		t.Fatalf("Login() after lock window expired = %v, want nil", err)
	}
}

func TestForgotPasswordNeverExposesTemporaryPasswordInProduction(t *testing.T) {
	t.Setenv("RESEND_API_KEY", "")
	t.Setenv("SMTP_HOST", "")
	t.Setenv("SMTP_PORT", "")
	t.Setenv("SMTP_USER", "")
	t.Setenv("SMTP_PASS", "")

	userRepo := repository.NewMemoryUserRepository()
	verificationRepo := repository.NewMemoryVerificationRepository()
	authService := NewAuthService(userRepo, verificationRepo, "test-jwt-secret")

	const email = "forgot-prod@example.com"
	t.Setenv("APP_ENV", "development")
	t.Setenv("AUTH_TEST_BYPASS", "1")
	if _, err := authService.Register(dto.RegisterRequest{Email: email, Password: "Strong1!Password"}); err != nil {
		t.Fatalf("Register(): %v", err)
	}
	code, err := authService.SendVerificationCode(email, "forgot")
	if err != nil {
		t.Fatalf("SendVerificationCode(): %v", err)
	}

	// 이메일 서비스(Resend/SMTP) 설정이 없는 운영 환경에서는, 인증 코드는 실제로
	// 유효해도 새로 발급한 임시 비밀번호를 응답으로 절대 돌려주면 안 된다 —
	// SendVerificationCode의 코드 은닉 규칙과 대칭이어야 한다.
	t.Setenv("APP_ENV", "production")
	t.Setenv("AUTH_TEST_BYPASS", "")
	if tempPassword, err := authService.ForgotPassword(email, code); !errors.Is(err, ErrEmailDelivery) || tempPassword != "" {
		t.Fatalf("ForgotPassword() in production without email service = (%q, %v), want (\"\", ErrEmailDelivery)", tempPassword, err)
	}
}

func TestForgotPasswordFallsBackToReturningPasswordInDevelopment(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	t.Setenv("AUTH_TEST_BYPASS", "1")
	t.Setenv("RESEND_API_KEY", "")
	t.Setenv("SMTP_HOST", "")
	t.Setenv("SMTP_PORT", "")
	t.Setenv("SMTP_USER", "")
	t.Setenv("SMTP_PASS", "")

	userRepo := repository.NewMemoryUserRepository()
	authService := NewAuthService(userRepo, repository.NewMemoryVerificationRepository(), "test-jwt-secret")

	const email = "forgot-dev@example.com"
	if _, err := authService.Register(dto.RegisterRequest{Email: email, Password: "Strong1!Password"}); err != nil {
		t.Fatalf("Register(): %v", err)
	}

	tempPassword, err := authService.ForgotPassword(email, "000000")
	if err != nil {
		t.Fatalf("ForgotPassword(): %v", err)
	}
	if tempPassword == "" {
		t.Fatal("ForgotPassword() in development without email service returned empty password, want the dev-fallback password")
	}
}
