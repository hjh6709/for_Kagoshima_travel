# Map Planner Go API

사용자 인증과 여행·장소·일정·항공편·체크리스트·공유 데이터를 관리하는 REST API입니다. production은 Supabase PostgreSQL을 사용하고 Oracle Cloud VM에서 systemd로 실행됩니다.

## 로컬 실행

```bash
cp .env.example .env
go run ./cmd/api
```

`DATABASE_URL`이 없으면 인메모리 저장소를 사용합니다. PostgreSQL 저장소와 migration까지 확인하려면 루트의 `docker-compose.yml`을 사용하고 [`../../docs/LOCAL_DEVELOPMENT_RUNBOOK.md`](../../docs/LOCAL_DEVELOPMENT_RUNBOOK.md)를 따릅니다.

## 주요 환경변수

| 이름 | 역할 |
| --- | --- |
| `APP_ENV` | `production`이면 필수 보안 설정을 강제 |
| `PORT` | 기본 `8080` |
| `DATABASE_URL` | PostgreSQL 연결 문자열, production 필수 |
| `JWT_SECRET` | 세션 JWT 서명, production에서 32자 이상 |
| `ALLOWED_ORIGINS` | 허용할 HTTPS 웹 Origin 목록 |
| `GOOGLE_MAPS_API_KEY` | Places API (New) 서버 키 |
| SMTP 관련 변수 | 회원가입·비밀번호 복구 인증 메일 |
| `DISCORD_WEBHOOK_URL` | 선택적인 서버 오류 알림 |

실제 값은 `.env` 또는 배포 Secret에만 저장합니다. production에서는 `AUTH_TEST_BYPASS`가 설정되어 있으면 서버가 시작되지 않습니다.

## API 문서

- 실행 중 Swagger UI: `GET /docs`
- OpenAPI JSON: `GET /openapi.json`
- 저장소 원본: `internal/handler/openapi.json`

공개 엔드포인트는 인증 시작과 `GET /api/share/{token}`에 제한됩니다. 여행 변경·장소 검색·체크리스트 변경은 인증과 여행 소유권 검사가 필요합니다.

## 데이터베이스

- 새 DB 초기화: `schema.sql`
- 운영 DB 증분 변경: `internal/db/migrations/*.sql`
- API 시작 시 migration을 파일명 순서로 반복 적용

새 migration은 재실행 가능해야 하며 기존 데이터가 있는 production에서도 안전해야 합니다.

## 검증

```bash
go test ./... -count=1
go test -race ./... -count=1
go vet ./...
test -z "$(gofmt -l .)"
```

공유 DTO나 필드를 변경하면 `internal/server/share_security_test.go`를 포함한 공개 데이터 경계 테스트를 반드시 확인합니다.
