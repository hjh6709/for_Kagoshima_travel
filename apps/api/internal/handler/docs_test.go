package handler

import (
	"encoding/json"
	"testing"
)

func TestOpenAPISpecDocumentsCurrentPublicRoutes(t *testing.T) {
	var spec struct {
		Paths map[string]json.RawMessage `json:"paths"`
	}
	if err := json.Unmarshal(openapiSpec, &spec); err != nil {
		t.Fatalf("openapi.json is invalid: %v", err)
	}

	for _, path := range []string{
		"/healthz",
		"/readyz",
		"/api/auth/forgot-password",
		"/api/auth/change-password",
		"/api/auth/account",
		"/api/auth/logout",
		"/api/trips/{tripID}/places/search",
		"/api/trips/{tripID}/checklists",
		"/api/trips/checklists/{checklistID}",
	} {
		if _, ok := spec.Paths[path]; !ok {
			t.Errorf("openapi.json does not document %s", path)
		}
	}
}
