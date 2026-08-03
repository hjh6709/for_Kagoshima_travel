package httpjson

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestDecodeRequestRejectsUnknownAndMultipleJSONValues(t *testing.T) {
	for _, body := range []string{
		`{"name":"trip","unexpected":true}`,
		`{"name":"trip"} {"name":"second"}`,
	} {
		req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(body))
		recorder := httptest.NewRecorder()
		var payload struct {
			Name string `json:"name"`
		}
		if DecodeRequest(recorder, req, &payload) {
			t.Fatalf("DecodeRequest(%q) = true, want false", body)
		}
		if recorder.Code != http.StatusBadRequest {
			t.Fatalf("DecodeRequest(%q) status = %d, want 400", body, recorder.Code)
		}
	}
}

func TestDecodeRequestRejectsOversizedBody(t *testing.T) {
	body := `{"name":"` + strings.Repeat("a", maxRequestBodyBytes) + `"}`
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(body))
	recorder := httptest.NewRecorder()
	var payload map[string]string
	if DecodeRequest(recorder, req, &payload) {
		t.Fatal("DecodeRequest() = true, want false")
	}
	if recorder.Code != http.StatusRequestEntityTooLarge {
		t.Fatalf("DecodeRequest() status = %d, want 413", recorder.Code)
	}
}
