package service

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"io"
	"strings"
)

var randomReader io.Reader = rand.Reader

func newID() (string, error) {
	b := make([]byte, 16)
	if _, err := io.ReadFull(randomReader, b); err != nil {
		return "", err
	}
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16]), nil
}

func newShareToken() (string, error) {
	b := make([]byte, 24)
	if _, err := io.ReadFull(randomReader, b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

func sameID(a, b string) bool {
	return strings.EqualFold(strings.ReplaceAll(a, "-", ""), strings.ReplaceAll(b, "-", ""))
}
