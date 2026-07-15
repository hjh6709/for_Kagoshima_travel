# 로컬 개발 런북

이 문서는 로컬에서 웹앱과 API 서버를 띄워 기능을 확인할 때 사용하는 절차를 정리합니다.

## 기본 포트

| 구성 요소 | 기본 주소 | 비고 |
| --- | --- | --- |
| Web | `http://localhost:5173` | Vite 기본 포트 |
| API | `http://localhost:8080` | `PORT` 환경변수로 변경 가능 |
| PostgreSQL | `localhost:5433` | Docker Compose가 호스트 `5433`을 컨테이너 `5432`로 연결 |

이미 `8080`이나 `3000`을 다른 프로젝트에서 쓰고 있어도, 웹은 기본적으로 `5173`을 사용하므로 `3000`과 충돌하지 않습니다.

## 최초 1회 준비

루트 디렉터리에서 실행합니다.

```bash
npm --prefix apps/web install
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
```

Docker Compose로 PostgreSQL을 사용할 경우 `apps/api/.env`의 `DATABASE_URL`은 아래 값을 사용합니다.

```env
# 1. 로컬 Docker 컨테이너 DB 사용 시
DATABASE_URL=postgres://postgres:postgres@localhost:5433/kagoshima_travel?sslmode=disable

# 2. 원격 Supabase 개발용 DB 연결 시 (추천)
DATABASE_URL=postgresql://postgres.[Project-ID]:[PW]@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres
```

## DB 실행 (로컬 DB 구동 시만 해당)

```bash
docker compose up -d postgres
```

DB가 떠 있는지 확인합니다.

```bash
docker compose ps
```

## API 서버 실행

기본 포트 `8080`을 사용할 때:

```bash
npm run api:dev
```

`8080`을 이미 쓰고 있을 때는 다른 포트를 지정합니다.

```bash
PORT=8081 npm run api:dev
```

이 경우 `apps/web/.env`도 같은 API 주소를 보도록 수정합니다.

```env
VITE_API_BASE_URL=http://localhost:8081
```

API 서버 확인:

```bash
curl http://localhost:8081/healthz
```

기본 포트 `8080`으로 띄웠다면 `8081` 대신 `8080`을 사용합니다.

## 웹 개발 서버 실행

```bash
npm run web:dev
```

기본 접속 주소:

```text
http://localhost:5173
```

`5173`을 이미 쓰고 있으면 Vite가 다음 포트를 안내합니다. 포트를 직접 지정하려면 아래처럼 실행합니다.

```bash
npm run web:dev -- --port 5174
```

웹 포트를 바꿨고 API의 CORS 설정을 엄격하게 확인해야 한다면 `apps/api/.env`의 `ALLOWED_ORIGINS`도 맞춥니다.

```env
ALLOWED_ORIGINS=http://localhost:5174
```

## 자주 쓰는 검증 명령

루트에서 실행합니다.

```bash
npm run web:typecheck
npm run web:build
npm run api:test
npm run api:test:race
npm run api:vet
npm run api:gofmt:check
```

전체 기본 검증:

```bash
npm run check
```

## 로컬 실행 순서 요약

8080을 사용하지 못하는 상황에서는 아래 순서로 실행합니다.

터미널 1:

```bash
docker compose up -d postgres
PORT=8081 npm run api:dev
```

터미널 2:

```bash
npm run web:dev
```

설정 파일:

```env
# apps/web/.env
VITE_API_BASE_URL=http://localhost:8081
```

```env
# apps/api/.env
PORT=8081
DATABASE_URL=postgres://postgres:postgres@localhost:5433/kagoshima_travel?sslmode=disable
ALLOWED_ORIGINS=http://localhost:5173
```

## 문제 해결

### API 포트가 이미 사용 중일 때

증상:

```text
listen tcp :8080: bind: address already in use
```

해결:

```bash
PORT=8081 npm run api:dev
```

그리고 `apps/web/.env`의 `VITE_API_BASE_URL`도 같은 포트로 변경합니다.

### 웹에서 API 주소 오류가 보일 때

증상:

```text
API 주소가 설정되지 않았습니다. VITE_API_BASE_URL을 확인해주세요.
```

해결:

```bash
cp apps/web/.env.example apps/web/.env
```

API 포트를 바꿨다면 `apps/web/.env`의 값을 수정합니다.

### DB 연결이 실패할 때

Docker Compose DB를 사용한다면 호스트 포트는 `5433`입니다.

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5433/kagoshima_travel?sslmode=disable
```

DB 컨테이너 상태를 확인합니다.

```bash
docker compose ps
```

### 의존성 버전이 lockfile과 다를 때

Dependabot merge 직후처럼 로컬 `node_modules`가 오래된 경우가 있습니다. 이때는 lockfile 기준으로 다시 설치합니다.

```bash
npm --prefix apps/web ci
```
