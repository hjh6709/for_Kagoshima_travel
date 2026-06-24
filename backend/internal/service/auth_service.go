package service

import (
	"errors"
	"strings"
	"time"

	"github.com/hanjeonghyun/for-kagoshima-travel/backend/internal/auth"
	"github.com/hanjeonghyun/for-kagoshima-travel/backend/internal/dto"
	"github.com/hanjeonghyun/for-kagoshima-travel/backend/internal/model"
	"github.com/hanjeonghyun/for-kagoshima-travel/backend/internal/repository"
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
