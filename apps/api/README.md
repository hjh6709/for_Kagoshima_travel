# Go Backend

여행 공유 앱의 API 서버입니다.

현재는 사용자 입력형 Beta를 위한 2차 확장 준비물이며, 1차 Vercel 정적 PWA 배포에는 사용하지 않습니다.

목표 구조:

```text
여행 준비자
  -> 이메일/비밀번호 로그인
  -> 여행, 일정, 숙소, 골프장, 긴급 정보 입력
  -> 부모님/가족용 공유 링크 생성

부모님/가족
  -> 공유 링크로 읽기 전용 조회
  -> 로그인 없음
```

## 실행

PostgreSQL을 함께 실행하려면 루트 디렉터리에서 먼저 DB를 띄웁니다.

```bash
docker compose up -d postgres
```

그다음 API 서버를 실행합니다.

```bash
cd apps/api
go run ./cmd/api
```

기본 포트는 `8080`입니다.

## 환경변수

```bash
cd apps/api
cp .env.example .env
```

주요 값:

- `APP_ENV`: `development`, `test`, `production`
- `PORT`: API 서버 포트
- `DATABASE_URL`: PostgreSQL 연결 문자열. 루트 `docker-compose.yml`의 PostgreSQL을 사용할 때는 `localhost:5433`을 사용
- `JWT_SECRET`: JWT 서명 비밀키
- `ALLOWED_ORIGINS`: CORS 허용 origin

실제 `.env` 파일은 커밋하지 않습니다.

## 빌드

```bash
cd apps/api
go build -o bin/api ./cmd/api
```

Go 백엔드는 Spring Boot의 executable jar처럼 단독 실행 바이너리로 배포합니다. 별도 WAS는 사용하지 않습니다.

## 현재 엔드포인트

- `GET /healthz`
- `GET /docs`
- `GET /openapi.json`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/share/{token}`
- `GET /api/trips`
- `POST /api/trips`
- `GET /api/trips/{tripID}`
- `PATCH /api/trips/{tripID}`
- `DELETE /api/trips/{tripID}`
- `POST /api/trips/{tripID}/share`
- `GET /api/trips/{tripID}/schedules`
- `GET /api/trips/{tripID}/places`
- `GET /api/trips/{tripID}/routes`

`/api/trips` 계열 엔드포인트는 `Authorization: Bearer <token>` 헤더가 필요합니다.
`/api/share/{token}`은 부모님/가족용 읽기 전용 공개 조회 엔드포인트이며 로그인 없이 접근합니다.
`DATABASE_URL`이 설정되면 PostgreSQL을 사용하고, 설정하지 않으면 개발용 in-memory 저장소를 사용합니다.

## 구조

스프링 부트의 전형적인 계층 구조를 Go 방식으로 옮겼습니다.

```text
handler     표현 계층: HTTP 요청/응답 처리
service     서비스 계층: 비즈니스 로직과 DTO 변환
repository  영속성 계층: 데이터 조회/저장
model       DB 저장 기준 도메인 모델
dto         API 요청/응답 모델
```

## 인증/인가 방향

스프링 시큐리티의 인증/인가 개념을 Go에서는 middleware로 구현합니다.

- 인증: 이메일/비밀번호 로그인 후 JWT 발급
- 비밀번호: bcrypt 해시 저장
- 인가: JWT에 포함된 역할을 middleware에서 확인
- 관리자 API: `admin` 역할만 접근
- 가족 공유: 로그인 대신 공유 토큰 기반 읽기 전용 접근
- 소셜 로그인: 초기 Beta에서는 제외하고, 상용 서비스 검증 이후 Google/Kakao/Apple 로그인을 검토
