package server

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
)

func TestReadyRouteReportsServiceAvailability(t *testing.T) {
	t.Setenv("APP_ENV", "")
	t.Setenv("DATABASE_URL", "")

	server, err := New()
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	t.Cleanup(server.Close)

	request := httptest.NewRequest(http.MethodGet, "/readyz", nil)
	recorder := httptest.NewRecorder()
	server.Routes().ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}
}

// DATABASE_URL로 Postgres에 붙었을 때 서버가 그 커넥션 풀을 실제로 들고 있어야
// /readyz가 DB를 ping하고, Close()가 풀을 닫는다. 예전에는 New() 안에서
// `pool, err := ...`로 바깥 변수를 가려서 s.pool이 늘 nil이었고, /readyz는
// DB가 죽어 있어도 항상 ready를 돌려줬다(배포 검증 게이트가 무력화됨).
func TestNewKeepsPostgresPoolForReadinessCheck(t *testing.T) {
	if os.Getenv("TEST_DATABASE_URL") == "" {
		t.Skip("TEST_DATABASE_URL is not set")
	}
	setServerTestEnv(t)
	t.Setenv("APP_ENV", "")

	srv := newTestServer(t)
	if srv.pool == nil {
		t.Fatal("server.pool = nil, want the connected Postgres pool so /readyz can ping the database")
	}
}
