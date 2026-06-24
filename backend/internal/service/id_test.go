package service

import (
	"errors"
	"testing"
)

type failingReader struct{}

func (failingReader) Read([]byte) (int, error) {
	return 0, errors.New("random source failed")
}

func TestNewIDReturnsRandomError(t *testing.T) {
	original := randomReader
	randomReader = failingReader{}
	t.Cleanup(func() { randomReader = original })

	if _, err := newID(); err == nil {
		t.Fatal("newID error = nil, want random source error")
	}
}

func TestNewShareTokenReturnsRandomError(t *testing.T) {
	original := randomReader
	randomReader = failingReader{}
	t.Cleanup(func() { randomReader = original })

	if _, err := newShareToken(); err == nil {
		t.Fatal("newShareToken error = nil, want random source error")
	}
}
