package handler

import (
	"net/http"

	"github.com/hanjeonghyun/for-kagoshima-travel/backend/internal/httpjson"
)

func Health(w http.ResponseWriter, _ *http.Request) {
	httpjson.Write(w, http.StatusOK, map[string]string{"status": "ok"})
}
