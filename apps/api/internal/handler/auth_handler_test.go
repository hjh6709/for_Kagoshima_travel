package handler

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/model"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/repository"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/service"
)

type failingUserRepository struct {
	saveError error
}

func (r failingUserRepository) FindByEmail(string) (model.User, error) {
	return model.User{}, repository.ErrNotFound
}

func (r failingUserRepository) Save(model.User) error {
	return r.saveError
}

func (r failingUserRepository) UpdatePassword(string, string) error {
	return nil
}

func TestRegisterDoesNotExposeInternalRepositoryError(t *testing.T) {
	internalError := errors.New("database host secret.internal failed")
	authService := service.NewAuthService(
		failingUserRepository{saveError: internalError},
		repository.NewMemoryVerificationRepository(),
		"test-jwt-secret",
	)
	handler := NewAuthHandler(authService)
	request := httptest.NewRequest(
		http.MethodPost,
		"/api/auth/register",
		strings.NewReader(`{"email":"traveler@example.com","password":"Strong1!Password","code":"123456"}`),
	)
	response := httptest.NewRecorder()

	handler.Register(response, request)

	if response.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusInternalServerError)
	}
	if strings.Contains(response.Body.String(), internalError.Error()) {
		t.Fatalf("response exposed internal error: %s", response.Body.String())
	}
}

func TestSendVerificationCodeMapsDeliveryFailureToSafeGatewayError(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	authService := service.NewAuthService(
		repository.NewMemoryUserRepository(),
		repository.NewMemoryVerificationRepository(),
		"test-jwt-secret",
	)
	handler := NewAuthHandler(authService)
	request := httptest.NewRequest(
		http.MethodPost,
		"/api/auth/send-verification-code",
		strings.NewReader(`{"email":"traveler@example.com","purpose":"register"}`),
	)
	response := httptest.NewRecorder()

	handler.SendVerificationCode(response, request)

	if response.Code != http.StatusBadGateway {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusBadGateway)
	}
	if !strings.Contains(response.Body.String(), "잠시 후 다시 시도") {
		t.Fatalf("response = %s, want retry guidance", response.Body.String())
	}
}
