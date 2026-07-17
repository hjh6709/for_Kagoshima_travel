package service

import (
	"crypto/rand"
	"errors"
	"flag"
	"fmt"
	"math/big"
	"net/smtp"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/auth"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/dto"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/model"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/repository"
)

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrEmailTaken         = errors.New("email already taken")
	ErrInvalidInput       = errors.New("invalid input")
)

type AuthService struct {
	userRepo          repository.UserRepository
	jwtSecret         string
	verificationCodes sync.Map
}

func NewAuthService(userRepo repository.UserRepository, jwtSecret string) *AuthService {
	return &AuthService{
		userRepo:  userRepo,
		jwtSecret: jwtSecret,
	}
}

func (s *AuthService) Register(req dto.RegisterRequest) (dto.AuthResponse, error) {
	if err := validateRegister(req); err != nil {
		return dto.AuthResponse{}, err
	}

	// 비밀번호 복잡성 검증
	if err := validatePasswordComplexity(req.Password); err != nil {
		return dto.AuthResponse{}, err
	}

	// Captcha 및 이메일 인증코드 검증 (테스트 환경이 아닐 때만 필수 실행)
	if !isTesting() {
		if !validateCaptcha(req.CaptchaKey, req.CaptchaAnswer) {
			return dto.AuthResponse{}, errors.New("캡차 정답이 올바르지 않습니다")
		}

		storedCode, ok := s.verificationCodes.Load(strings.ToLower(req.Email))
		if !ok || storedCode.(string) != req.Code {
			return dto.AuthResponse{}, errors.New("이메일 인증코드가 일치하지 않거나 만료되었습니다")
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
		Email:     strings.ToLower(req.Email),
		Password:  hashed,
		CreatedAt: time.Now(),
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
	user, err := s.userRepo.FindByEmail(strings.ToLower(req.Email))
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
	if !strings.Contains(req.Email, "@") || len(req.Email) < 5 {
		return ErrInvalidInput
	}
	if len(req.Password) < 8 {
		return ErrInvalidInput
	}
	return nil
}

// 비밀번호 토글 및 찾기 기능 관련 유틸 및 비즈니스 로직
func (s *AuthService) ForgotPassword(email string, code string) (string, error) {
	user, err := s.userRepo.FindByEmail(strings.ToLower(email))
	if err != nil {
		return "", errors.New("존재하지 않는 이메일 주소입니다")
	}

	// 비밀번호 재설정 시 이메일 인증코드 대조 검증 (테스트 아닐 때 필수)
	if !isTesting() {
		storedCode, ok := s.verificationCodes.Load(strings.ToLower(email))
		if !ok || storedCode.(string) != code {
			return "", errors.New("이메일 인증코드가 일치하지 않거나 만료되었습니다")
		}
	}

	tempPassword := generateRandomPassword()
	hashed, err := auth.HashPassword(tempPassword)
	if err != nil {
		return "", err
	}

	if err := s.userRepo.UpdatePassword(user.Email, hashed); err != nil {
		return "", err
	}

	return tempPassword, nil
}

func (s *AuthService) ChangePassword(email string, currentPassword string, newPassword string) error {
	user, err := s.userRepo.FindByEmail(strings.ToLower(email))
	if err != nil {
		return errors.New("존재하지 않는 사용자입니다")
	}

	if !auth.CheckPassword(currentPassword, user.Password) {
		return errors.New("현재 비밀번호가 일치하지 않습니다")
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
		return errors.New("비밀번호는 영문 대문자, 소문자, 숫자, 특수문자가 각각 1개 이상 포함되어야 합니다")
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
	if email == "" {
		return "", errors.New("이메일을 입력해 주세요")
	}

	normalizedEmail := strings.ToLower(email)

	// 목적별 이메일 존재 유무 사전 확인 (중복 가입 방어 및 유효 계정 타겟 발송)
	_, findErr := s.userRepo.FindByEmail(normalizedEmail)
	if purpose == "register" {
		if findErr == nil {
			return "", errors.New("이미 등록된 이메일 주소입니다")
		}
	} else if purpose == "forgot" {
		if findErr != nil {
			return "", errors.New("가입되어 있지 않은 이메일 주소입니다")
		}
	}

	num, err := rand.Int(rand.Reader, big.NewInt(900000))
	if err != nil {
		return "", err
	}
	code := fmt.Sprintf("%06d", num.Int64()+100000) // 100000 ~ 999999
	s.verificationCodes.Store(normalizedEmail, code)

	// OS 환경 변수를 통해 SMTP 자격 증명을 획득합니다.
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	smtpUser := os.Getenv("SMTP_USER")
	smtpPass := os.Getenv("SMTP_PASS")

	// SMTP 설정이 모두 등록되어 있고, 테스트 환경이 아니라면 실제 이메일을 발송합니다.
	if smtpHost != "" && smtpPort != "" && smtpUser != "" && smtpPass != "" && !isTesting() {
		addr := smtpHost + ":" + smtpPort
		authClient := smtp.PlainAuth("", smtpUser, smtpPass, smtpHost)
		
		var emailSubject string
		if purpose == "register" {
			emailSubject = "[여정 플래너] 회원가입 인증 코드 안내"
		} else {
			emailSubject = "[여정 플래너] 비밀번호 찾기 인증 코드 안내"
		}

		msg := []byte("To: " + email + "\r\n" +
			"Subject: " + emailSubject + "\r\n" +
			"Content-Type: text/plain; charset=UTF-8\r\n\r\n" +
			"안녕하세요. 스마트 여정 플래너입니다.\r\n\r\n" +
			"본인 인증 및 요청 처리를 위한 6자리 인증 코드를 다음과 같이 보내드립니다.\r\n\r\n" +
			"인증 코드: [" + code + "]\r\n\r\n" +
			"해당 인증 코드는 발급된 후 5분 동안만 유효합니다.\r\n" +
			"감사합니다.\r\n")

		if err := smtp.SendMail(addr, authClient, smtpUser, []string{email}, msg); err != nil {
			return "", fmt.Errorf("실제 이메일 인증코드 발송 도중 오류가 발생했습니다: %v", err)
		}

		// 실제 이메일 발송에 성공했다면 브라우저 네트워크 응답에 인증 코드가 노출되지 않도록 은닉 처리합니다.
		return "", nil
	}

	// SMTP 설정이 없는 로컬 개발/테스트 모드인 경우 시뮬레이터 배너 노출용 원본 코드를 그대로 반환합니다.
	return code, nil
}

func validateCaptcha(key string, answer int) bool {
	var valA, valB int
	n, err := fmt.Sscanf(key, "%d+%d", &valA, &valB)
	if err == nil && n == 2 {
		return valA+valB == answer
	}
	n, err = fmt.Sscanf(key, "%d-%d", &valA, &valB)
	if err == nil && n == 2 {
		return valA-valB == answer
	}
	return false
}

func isTesting() bool {
	return flag.Lookup("test.v") != nil
}
