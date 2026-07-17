package service

import (
	"crypto/rand"
	"errors"
	"math/big"
	"strings"
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
	userRepo  repository.UserRepository
	jwtSecret string
}

func NewAuthService(userRepo repository.UserRepository, jwtSecret string) *AuthService {
	return &AuthService{userRepo: userRepo, jwtSecret: jwtSecret}
}

func (s *AuthService) Register(req dto.RegisterRequest) (dto.AuthResponse, error) {
	if err := validateRegister(req); err != nil {
		return dto.AuthResponse{}, err
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
func (s *AuthService) ForgotPassword(email string) (string, error) {
	user, err := s.userRepo.FindByEmail(strings.ToLower(email))
	if err != nil {
		return "", errors.New("존재하지 않는 이메일 주소입니다")
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

	if len(newPassword) < 8 {
		return errors.New("새 비밀번호는 8자 이상이어야 합니다")
	}

	hashed, err := auth.HashPassword(newPassword)
	if err != nil {
		return err
	}

	return s.userRepo.UpdatePassword(user.Email, hashed)
}

func generateRandomPassword() string {
	const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@"
	ret := make([]byte, 8)
	for i := range ret {
		num, _ := cryptoRandInt(int64(len(letters)))
		ret[i] = letters[num]
	}
	return string(ret)
}

func cryptoRandInt(max int64) (int64, error) {
	nBig, err := rand.Int(rand.Reader, big.NewInt(max))
	if err != nil {
		return 0, err
	}
	return nBig.Int64(), nil
}
