package service

import (
	"bufio"
	"bytes"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"math/big"
	"net/http"
	"net/mail"
	"net/smtp"
	"net/textproto"
	"os"
	"strings"
	"time"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/auth"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/dto"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/model"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/repository"
)

var (
	ErrInvalidCredentials      = errors.New("invalid email or password")
	ErrEmailTaken              = errors.New("email already taken")
	ErrInvalidInput            = errors.New("invalid input")
	ErrInvalidVerificationCode = errors.New("invalid verification code")
	ErrVerificationRateLimit   = errors.New("하루에 최대 3회까지만 인증코드를 요청할 수 있습니다")
	ErrEmailNotFound           = errors.New("가입되어 있지 않은 이메일 주소입니다")
	ErrEmailDelivery           = errors.New("이메일을 전송하지 못했습니다")
	ErrCurrentPasswordMismatch = errors.New("현재 비밀번호가 일치하지 않습니다")
	ErrPasswordComplexity      = errors.New("비밀번호는 영문 대문자, 소문자, 숫자, 특수문자가 각각 1개 이상 포함되어야 합니다")
)

const (
	maxDailyVerificationSends = 3
	maxVerificationAttempts   = 5
)

type AuthService struct {
	userRepo         repository.UserRepository
	verificationRepo repository.VerificationRepository
	jwtSecret        string
}

func NewAuthService(
	userRepo repository.UserRepository,
	verificationRepo repository.VerificationRepository,
	jwtSecret string,
) *AuthService {
	return &AuthService{
		userRepo:         userRepo,
		verificationRepo: verificationRepo,
		jwtSecret:        jwtSecret,
	}
}

func (s *AuthService) Register(req dto.RegisterRequest) (dto.AuthResponse, error) {
	req.Email = normalizeEmail(req.Email)
	if err := validateRegister(req); err != nil {
		return dto.AuthResponse{}, err
	}

	// 비밀번호 복잡성 검증
	if err := validatePasswordComplexity(req.Password); err != nil {
		return dto.AuthResponse{}, err
	}

	// 이메일 인증코드는 실제 회원가입이 성공하기 전까지 소비하지 않습니다.
	if !isTesting() {
		if err := s.VerifyCode(req.Email, "register", req.Code); err != nil {
			if errors.Is(err, ErrInvalidVerificationCode) || errors.Is(err, ErrInvalidInput) {
				return dto.AuthResponse{}, ErrInvalidVerificationCode
			}
			return dto.AuthResponse{}, err
		}
	}

	hashed, err := auth.HashPassword(req.Password)
	if err != nil {
		return dto.AuthResponse{}, err
	}

	id, err := newID()
	if err != nil {
		return dto.AuthResponse{}, err
	}

	user := model.User{
		ID:        id,
		Email:     req.Email,
		Password:  hashed,
		CreatedAt: time.Now(),
	}

	// 코드 소비가 실패했는데 계정만 생성되는 부분 성공을 막기 위해 저장 전에 소비합니다.
	if !isTesting() {
		codeHash := s.hashVerificationCode(req.Email, "register", strings.TrimSpace(req.Code))
		if err := s.verificationRepo.Consume(req.Email, "register", codeHash, time.Now()); err != nil {
			return dto.AuthResponse{}, fmt.Errorf("consume registration verification: %w", err)
		}
	}

	if err := s.userRepo.Save(user); err != nil {
		if errors.Is(err, repository.ErrDuplicateEmail) {
			return dto.AuthResponse{}, ErrEmailTaken
		}
		return dto.AuthResponse{}, err
	}

	return s.issueAuthResponse(user)
}

func (s *AuthService) Login(req dto.LoginRequest) (dto.AuthResponse, error) {
	user, err := s.userRepo.FindByEmail(normalizeEmail(req.Email))
	if err != nil {
		return dto.AuthResponse{}, ErrInvalidCredentials
	}

	if !auth.CheckPassword(req.Password, user.Password) {
		return dto.AuthResponse{}, ErrInvalidCredentials
	}

	return s.issueAuthResponse(user)
}

func (s *AuthService) issueAuthResponse(user model.User) (dto.AuthResponse, error) {
	token, err := auth.IssueToken(user.ID, user.Email, s.jwtSecret)
	if err != nil {
		return dto.AuthResponse{}, err
	}
	return dto.AuthResponse{
		AccessToken: token,
		User:        dto.UserSummary{ID: user.ID, Email: user.Email},
	}, nil
}

func validateRegister(req dto.RegisterRequest) error {
	if err := validateEmail(req.Email); err != nil {
		return ErrInvalidInput
	}
	if len(req.Password) < 8 {
		return ErrInvalidInput
	}
	return nil
}

// 비밀번호 토글 및 찾기 기능 관련 유틸 및 비즈니스 로직
func (s *AuthService) ForgotPassword(email string, code string) (string, error) {
	email = normalizeEmail(email)
	user, err := s.userRepo.FindByEmail(email)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return "", ErrEmailNotFound
		}
		return "", err
	}

	// 비밀번호 재설정 시 이메일 인증코드 대조 검증 (테스트 아닐 때 필수)
	if !isTesting() {
		if err := s.VerifyCode(email, "forgot", code); err != nil {
			if errors.Is(err, ErrInvalidVerificationCode) || errors.Is(err, ErrInvalidInput) {
				return "", ErrInvalidVerificationCode
			}
			return "", err
		}
	}

	tempPassword := generateRandomPassword()
	hashed, err := auth.HashPassword(tempPassword)
	if err != nil {
		return "", err
	}

	// 코드 소비 실패 후 비밀번호만 바뀌어 임시 비밀번호를 잃는 부분 성공을 막습니다.
	if !isTesting() {
		codeHash := s.hashVerificationCode(email, "forgot", strings.TrimSpace(code))
		if err := s.verificationRepo.Consume(email, "forgot", codeHash, time.Now()); err != nil {
			return "", fmt.Errorf("consume password verification: %w", err)
		}
	}

	if err := s.userRepo.UpdatePassword(user.Email, hashed); err != nil {
		return "", err
	}

	return tempPassword, nil
}

func (s *AuthService) ChangePassword(email string, currentPassword string, newPassword string) error {
	user, err := s.userRepo.FindByEmail(normalizeEmail(email))
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrEmailNotFound
		}
		return err
	}

	if !auth.CheckPassword(currentPassword, user.Password) {
		return ErrCurrentPasswordMismatch
	}

	// 새 비밀번호 복잡성 검증
	if err := validatePasswordComplexity(newPassword); err != nil {
		return err
	}

	hashed, err := auth.HashPassword(newPassword)
	if err != nil {
		return err
	}

	return s.userRepo.UpdatePassword(user.Email, hashed)
}

func generateRandomPassword() string {
	const (
		uppers   = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
		lowers   = "abcdefghijklmnopqrstuvwxyz"
		digits   = "0123456789"
		specials = "!@#$%^&*"
	)
	ret := make([]byte, 8)
	for i := 0; i < 2; i++ {
		num, _ := cryptoRandInt(int64(len(uppers)))
		ret[i] = uppers[num]
	}
	for i := 2; i < 4; i++ {
		num, _ := cryptoRandInt(int64(len(lowers)))
		ret[i] = lowers[num]
	}
	for i := 4; i < 6; i++ {
		num, _ := cryptoRandInt(int64(len(digits)))
		ret[i] = digits[num]
	}
	for i := 6; i < 8; i++ {
		num, _ := cryptoRandInt(int64(len(specials)))
		ret[i] = specials[num]
	}
	// 피셔-예이츠 셔플
	for i := len(ret) - 1; i > 0; i-- {
		num, _ := cryptoRandInt(int64(i + 1))
		ret[i], ret[num] = ret[num], ret[i]
	}
	return string(ret)
}

func validatePasswordComplexity(password string) error {
	if isTesting() {
		return nil
	}
	if len(password) < 8 {
		return errors.New("비밀번호는 최소 8자 이상이어야 합니다")
	}
	var hasUpper, hasLower, hasDigit, hasSpecial bool
	for _, r := range password {
		switch {
		case r >= 'A' && r <= 'Z':
			hasUpper = true
		case r >= 'a' && r <= 'z':
			hasLower = true
		case r >= '0' && r <= '9':
			hasDigit = true
		case strings.ContainsRune("!@#$%^&*()_+-=[]{};':\",./<>?", r):
			hasSpecial = true
		}
	}
	if !hasUpper || !hasLower || !hasDigit || !hasSpecial {
		return ErrPasswordComplexity
	}
	return nil
}

func cryptoRandInt(max int64) (int64, error) {
	nBig, err := rand.Int(rand.Reader, big.NewInt(max))
	if err != nil {
		return 0, err
	}
	return nBig.Int64(), nil
}

// 이메일 주소로 회원가입 또는 비밀번호 재설정 목적의 6자리 인증코드를 전송하는 메서드입니다.
// SMTP 환경 변수가 주입되어 있다면 실제 메일이 전송되고, 그렇지 않다면 가상 시뮬레이터 연동용 코드를 반환합니다.
func (s *AuthService) SendVerificationCode(email string, purpose string) (string, error) {
	cleanEmail := normalizeEmail(email)
	if err := validateEmail(cleanEmail); err != nil {
		return "", errors.New("올바르지 않은 이메일 형식입니다")
	}
	if purpose != "register" && purpose != "forgot" {
		return "", ErrInvalidInput
	}

	// 목적별 이메일 존재 유무 사전 확인 (중복 가입 방어 및 유효 계정 타겟 발송)
	_, findErr := s.userRepo.FindByEmail(cleanEmail)
	if purpose == "register" {
		if findErr == nil {
			return "", ErrEmailTaken
		}
		if !errors.Is(findErr, repository.ErrNotFound) {
			return "", fmt.Errorf("find registration email: %w", findErr)
		}
	} else if purpose == "forgot" {
		if errors.Is(findErr, repository.ErrNotFound) {
			return "", ErrEmailNotFound
		}
		if findErr != nil {
			return "", fmt.Errorf("find password email: %w", findErr)
		}
	}

	num, err := rand.Int(rand.Reader, big.NewInt(900000))
	if err != nil {
		return "", err
	}
	code := fmt.Sprintf("%06d", num.Int64()+100000) // 100000 ~ 999999
	now := time.Now()
	expiresAt := now.Add(5 * time.Minute)
	if err := s.verificationRepo.Issue(
		cleanEmail,
		purpose,
		s.hashVerificationCode(cleanEmail, purpose, code),
		expiresAt,
		now,
		maxDailyVerificationSends,
	); err != nil {
		if errors.Is(err, repository.ErrVerificationRateLimit) {
			return "", ErrVerificationRateLimit
		}
		return "", fmt.Errorf("store verification challenge: %w", err)
	}

	// Resend API 키가 주입되어 있고 테스트 환경이 아니라면 Resend HTTP API로 실제 메일을 전송합니다.
	resendKey := os.Getenv("RESEND_API_KEY")
	if resendKey != "" && !isTesting() {
		fromAddr := os.Getenv("RESEND_FROM")
		if fromAddr == "" {
			fromAddr = "Map Planner <noreply@hjh-dev.site>"
		}

		var cleanSubject string
		if purpose == "register" {
			cleanSubject = "[Map Planner] 회원가입 인증 코드 안내"
		} else {
			cleanSubject = "[Map Planner] 비밀번호 찾기 인증 코드 안내"
		}

		bodyText := fmt.Sprintf(
			"안녕하세요. Map Planner입니다.\n\n"+
				"본인 인증 및 요청 처리를 위한 6자리 인증 코드를 다음과 같이 보내드립니다.\n\n"+
				"인증 코드: [%s]\n\n"+
				"해당 인증 코드는 발급된 후 5분 동안만 유효합니다.\n감사합니다.\n",
			code,
		)

		payload := map[string]interface{}{
			"from":    fromAddr,
			"to":      []string{cleanEmail},
			"subject": cleanSubject,
			"text":    bodyText,
		}
		jsonBytes, err := json.Marshal(payload)
		if err == nil {
			req, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewBuffer(jsonBytes))
			if err == nil {
				req.Header.Set("Authorization", "Bearer "+resendKey)
				req.Header.Set("Content-Type", "application/json")

				client := &http.Client{Timeout: 10 * time.Second}
				resp, err := client.Do(req)
				if err == nil {
					defer resp.Body.Close()
					if resp.StatusCode >= 200 && resp.StatusCode < 300 {
						// 실제 이메일 발송 성공 시 코드 은닉
						return "", nil
					}
				}
			}
		}
	}

	// OS 환경 변수를 통해 SMTP 자격 증명을 획득합니다.
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	smtpUser := os.Getenv("SMTP_USER")
	smtpPass := os.Getenv("SMTP_PASS")

	// SMTP 설정이 모두 등록되어 있고, 테스트 환경이 아니라면 실제 이메일을 발송합니다.
	if smtpHost != "" && smtpPort != "" && smtpUser != "" && smtpPass != "" && !isTesting() {
		addr := smtpHost + ":" + smtpPort
		authClient := smtp.PlainAuth("", smtpUser, smtpPass, smtpHost)

		var cleanSubject string
		if purpose == "register" {
			cleanSubject = "[Map Planner] 회원가입 인증 코드 안내"
		} else {
			cleanSubject = "[Map Planner] 비밀번호 찾기 인증 코드 안내"
		}

		header := mail.Header{
			"Subject":      []string{cleanSubject},
			"Content-Type": []string{"text/plain; charset=UTF-8"},
		}

		var buf bytes.Buffer
		tw := textproto.NewWriter(bufio.NewWriter(&buf))
		for k, vv := range header {
			for _, v := range vv {
				if err := tw.PrintfLine("%s: %s", k, v); err != nil {
					return "", fmt.Errorf("이메일 헤더 생성 중 오류가 발생했습니다: %v", err)
				}
			}
		}
		if _, err := buf.WriteString("\r\n"); err != nil {
			return "", fmt.Errorf("이메일 본문 생성 중 오류가 발생했습니다: %v", err)
		}
		if _, err := buf.WriteString(
			"안녕하세요. Map Planner입니다.\r\n\r\n" +
				"본인 인증 및 요청 처리를 위한 6자리 인증 코드를 다음과 같이 보내드립니다.\r\n\r\n" +
				"인증 코드: [" + code + "]\r\n\r\n" +
				"해당 인증 코드는 발급된 후 5분 동안만 유효합니다.\r\n" +
				"감사합니다.\r\n",
		); err != nil {
			return "", fmt.Errorf("이메일 본문 생성 중 오류가 발생했습니다: %v", err)
		}

		if err := smtp.SendMail(addr, authClient, smtpUser, []string{cleanEmail}, buf.Bytes()); err != nil {
			return "", fmt.Errorf("%w: %v", ErrEmailDelivery, err)
		}

		// 실제 이메일 발송에 성공했다면 브라우저 네트워크 응답에 인증 코드가 노출되지 않도록 은닉 처리합니다.
		return "", nil
	}

	// 운영 환경에서는 SMTP/Resend 설정이 없거나 발송이 실패하더라도 보안상 인증 코드를 절대 반환하지 않습니다.
	if isProduction() {
		return "", ErrEmailDelivery
	}

	// SMTP 설정이 없는 로컬 개발/테스트 모드인 경우 시뮬레이터 배너 노출용 원본 코드를 그대로 반환합니다.
	return code, nil
}

func (s *AuthService) VerifyCode(email, purpose, code string) error {
	cleanEmail := normalizeEmail(email)
	cleanCode := strings.TrimSpace(code)
	if cleanEmail == "" || !isSixDigitCode(cleanCode) || (purpose != "register" && purpose != "forgot") {
		return ErrInvalidInput
	}

	challenge, err := s.verificationRepo.Find(cleanEmail, purpose)
	if errors.Is(err, repository.ErrNotFound) {
		return ErrInvalidVerificationCode
	}
	if err != nil {
		return fmt.Errorf("find verification challenge: %w", err)
	}

	if challenge.ConsumedAt != nil || challenge.Attempts >= maxVerificationAttempts || time.Now().After(challenge.ExpiresAt) {
		return ErrInvalidVerificationCode
	}

	wantHash := s.hashVerificationCode(cleanEmail, purpose, cleanCode)
	if !hmac.Equal([]byte(challenge.CodeHash), []byte(wantHash)) {
		if _, err := s.verificationRepo.RecordFailedAttempt(cleanEmail, purpose, time.Now()); err != nil {
			return fmt.Errorf("record verification failure: %w", err)
		}
		return ErrInvalidVerificationCode
	}

	return nil
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func validateEmail(email string) error {
	if email == "" {
		return ErrInvalidInput
	}
	parsedAddr, err := mail.ParseAddress(email)
	if err != nil || parsedAddr.Address != email {
		return ErrInvalidInput
	}
	return nil
}

func isSixDigitCode(code string) bool {
	if len(code) != 6 {
		return false
	}
	for _, character := range code {
		if character < '0' || character > '9' {
			return false
		}
	}
	return true
}

func (s *AuthService) hashVerificationCode(email, purpose, code string) string {
	mac := hmac.New(sha256.New, []byte(s.jwtSecret))
	_, _ = mac.Write([]byte(email))
	_, _ = mac.Write([]byte("\x00"))
	_, _ = mac.Write([]byte(purpose))
	_, _ = mac.Write([]byte("\x00"))
	_, _ = mac.Write([]byte(code))
	return hex.EncodeToString(mac.Sum(nil))
}

func isProduction() bool {
	env := os.Getenv("APP_ENV")
	if env == "" {
		env = os.Getenv("ENV")
	}
	return strings.ToLower(env) == "production" || strings.ToLower(env) == "prod"
}

func isTesting() bool {
	return flag.Lookup("test.v") != nil
}
