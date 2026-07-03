# 기술 설계서 (Tech Design)

이 문서는 가고시마 여행 앱의 프론트엔드, 백엔드, 데이터, 지도, 배포 전략을 한곳에 정리합니다.

## 1. 기술 스택

| 영역 | 선택 | 이유 |
| --- | --- | --- |
| 앱 형태 | PWA | 갤럭시와 iPhone 모두 URL로 접근하고 홈 화면에 추가 가능 |
| 프론트엔드 | React | 컴포넌트 기반으로 부모님용 화면과 관리자 화면을 함께 만들기 좋음 |
| 빌드 도구 | Vite | 개발 서버와 빌드 속도가 빠르고 설정이 단순함 |
| 언어 | TypeScript | 일정, 장소, 루트 데이터 구조를 안전하게 다루기 좋음 |
| 1차 데이터 | 정적 TypeScript 데이터 | 서버 비용 없이 바로 배포 가능 |
| 2차 백엔드 | Go | API 서버를 단단하고 단순하게 만들기 좋고 배포가 쉬움 |
| 2차 DB | PostgreSQL | 일정, 장소, 루트, 공유 권한 같은 관계형 데이터에 적합 |
| 2차 API | REST JSON API | PWA와 관리자 페이지에서 호출하기 단순함 |
| 2차 인증 | Go API + JWT | PWA, 관리자 페이지, 가족 공유 페이지에서 사용하기 단순함 |
| 지도 | Google Maps 외부 링크 우선 | API 비용 없이 길찾기와 장소 확인 가능 |
| 프론트 배포 | Vercel Hobby 우선 | 정적 PWA를 무료로 배포하기 쉽고 Vite 설정이 단순함 |
| 백엔드 배포 | 비용 여유 생길 때 Fly.io Tokyo 검토 | 한국/일본 사용자 지연시간을 줄일 수 있음 |

## 0. 비용 우선 개발 전략

현재 목표는 비용을 최대한 줄이면서 부모님이 실제 여행에서 쓸 수 있는 앱을 완성하는 것이다.

### 1차 무료 MVP

```text
React PWA
  -> 정적 TypeScript 여행 데이터
  -> localStorage 체크리스트
  -> Google Maps 외부 링크
  -> Vercel Hobby 무료 배포
```

포함:
- 부모님용 홈, 일정, 지도 링크, 정보, 체크리스트, 긴급 화면
- 맛집/관광지 후보 목록
- 추천 루트 표시
- PWA 홈 화면 추가
- 오프라인 캐시

제외:
- 서버 배포
- PostgreSQL 운영 DB
- 관리자 로그인
- 실시간 업데이트
- 가족 공유 권한 제어

운영 방식:
- 여행 정보 변경 시 코드의 데이터 파일을 수정하고 다시 배포한다.
- 민감정보는 공개 링크에 올릴지 신중히 판단한다.
- 예약번호, 가족 전화번호, 보험 정보는 최소화하거나 앱에 넣기 전 한 번 더 검토한다.

### 2차 사용자 입력형 Beta

```text
React PWA
  -> Go REST API
  -> PostgreSQL
  -> 관리자 페이지
  -> 가족 공유 링크
```

필요해지는 시점:
- 제작자가 정확한 숙소, 골프장, 일정 정보를 모르는 상태에서 나중에 직접 입력해야 할 때
- 사용자가 자신의 여행 데이터를 직접 입력해야 할 때
- 가족이나 부모님에게 로그인 없는 공유 링크를 보내야 할 때
- 민감정보를 공개 링크와 관리자 화면에서 분리해야 할 때

Go 백엔드 코드는 2차 확장 준비물로 유지하되, 당장 운영 배포하지 않는다. 초기 인증은 이메일/비밀번호를 우선하고, 소셜 로그인은 상용화 검증 이후 검토한다.

## 1-1. REST API 방식과 MVC 방식 선택

스프링 MVC처럼 서버가 HTML을 만들어서 브라우저에 전달하는 방식도 가능하지만, 이 프로젝트는 REST API 방식을 기본으로 한다.

### REST API 방식

```text
React PWA -> Go API -> PostgreSQL
```

역할:
- React가 화면과 사용자 인터랙션을 담당한다.
- Go API는 일정, 장소, 루트, 긴급 정보 같은 데이터를 JSON으로 제공한다.
- 관리자 페이지도 React 화면으로 만들고, Go API를 호출해 데이터를 생성, 수정, 삭제한다.

이 프로젝트에 적합한 이유:
- 부모님 갤럭시와 제작자 iPhone에서 같은 PWA 화면을 사용할 수 있다.
- 앱처럼 동작하는 모바일 UI, 하단 탭, 오프라인 캐시를 프론트에서 세밀하게 제어하기 좋다.
- 지도, 체크리스트, 실시간 갱신 같은 화면 상태를 React에서 다루기 쉽다.
- Go 백엔드는 화면 렌더링보다 데이터와 권한 관리에 집중할 수 있다.

### 서버 렌더링 MVC 방식

```text
Browser -> Go HTML Server -> PostgreSQL
```

역할:
- Go 서버가 데이터를 조회한 뒤 HTML 템플릿까지 렌더링한다.
- 브라우저는 서버가 만든 HTML을 받아서 표시한다.

이번 프로젝트에서 우선하지 않는 이유:
- 모바일 앱 같은 상호작용을 만들 때 React PWA보다 유연성이 떨어진다.
- 부모님용 앱과 관리자 페이지를 같은 컴포넌트 체계로 재사용하기 어렵다.
- 오프라인 캐시, 지도 상호작용, 하단 탭 UI는 클라이언트 앱 구조가 더 자연스럽다.

결론:
- Go는 REST API 서버로 사용한다.
- HTML 템플릿 렌더링은 우선 구현하지 않는다.
- 관리자 페이지도 별도 서버 템플릿이 아니라 React 내부 라우트로 만든다.

## 2. 앱 구성

### 부모님용 앱

- 홈
- 일정
- 지도
- 정보
- 체크
- 긴급

목표:
- 큰 글씨와 큰 버튼
- 조회 중심
- 지도, 전화, 복사 같은 행동은 명확한 버튼으로 제공
- 마지막으로 불러온 핵심 정보는 오프라인에서도 확인

### 관리자 페이지

- 일정 관리
- 장소/맛집 관리
- 추천 루트 관리
- 여행 정보 관리
- 긴급 정보 관리
- 공유 범위 설정

목표:
- 제작자가 여행 전후로 데이터를 직접 수정
- 수정 내용은 부모님 앱과 가족 공유 화면에 반영

### 가족 공유 페이지

- 최신 일정 확인
- 장소와 루트 확인
- 긴급 정보 일부 확인
- 민감정보는 숨김 처리 가능

## 3. 프론트엔드 구조 초안

```text
src/
  App.tsx
  main.tsx
  styles.css
  data/
    sampleTrip.ts
  types/
    travel.ts
```

1차 MVP에서는 여행 데이터를 프론트엔드에 두고 화면을 완성한다. Go API 연결 시 `data` 계층을 API 호출 계층으로 교체한다.

## 3-1. 백엔드 구조

```text
apps/api/
  cmd/api/main.go
  internal/
    auth/         # JWT 생성/검증, bcrypt 비밀번호 해시
    dto/          # 요청/응답 데이터 구조체
    handler/      # HTTP 핸들러 (auth, trip)
    httpjson/     # JSON 응답 헬퍼
    middleware/   # JWT 인증 미들웨어
    model/        # 도메인 모델 (Trip, Schedule, Place, Route, User)
    repository/   # 데이터 접근 계층 (현재 in-memory, PostgreSQL 예정)
    server/       # 라우트 등록, CORS, 서버 초기화
    service/      # 비즈니스 로직 (auth, trip)
  schema.sql      # PostgreSQL 스키마
  go.mod
```

## 4. 데이터 모델 초안

### trips

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid | 여행 ID |
| title | text | 여행명 |
| start_date | date | 시작일 |
| end_date | date | 종료일 |
| memo | text | 전체 메모 |

### schedules

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid | 일정 ID |
| trip_id | uuid | 여행 ID |
| place_id | uuid | 연결 장소 |
| date | date | 일정 날짜 |
| time | text | 일정 시간 |
| type | text | 이동, 식사, 관광, 숙소 등 |
| title | text | 일정 제목 |
| transport_memo | text | 이동 메모 |
| reservation_memo | text | 예약 메모 |
| parent_memo | text | 부모님께 보여줄 메모 |
| sort_order | int | 표시 순서 |

### places

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid | 장소 ID |
| trip_id | uuid | 여행 ID |
| name | text | 장소명 |
| category | text | 숙소, 맛집, 카페, 관광, 쇼핑, 교통 |
| address | text | 주소 |
| latitude | numeric | 위도 |
| longitude | numeric | 경도 |
| google_maps_url | text | Google Maps 링크 |
| recommended_reason | text | 추천 이유 |
| opening_memo | text | 영업 메모 |
| budget_memo | text | 예산 메모 |
| caution_memo | text | 주의사항 |

### routes

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid | 루트 ID |
| trip_id | uuid | 여행 ID |
| title | text | 루트명 |
| description | text | 설명 |
| transport_memo | text | 이동 메모 |
| estimated_duration | text | 예상 소요 시간 |

### route_places

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid | 연결 ID |
| route_id | uuid | 루트 ID |
| place_id | uuid | 장소 ID |
| sort_order | int | 루트 내 순서 |

## 5. API 설계

### 구현 완료

| Method | Path | 설명 | 권한 |
| --- | --- | --- | --- |
| GET | `/healthz` | 서버 상태 확인 | 공개 |
| POST | `/api/auth/register` | 회원가입 | 공개 |
| POST | `/api/auth/login` | 로그인 (JWT 발급) | 공개 |
| GET | `/api/trips` | 내 여행 목록 조회 | 로그인 |
| POST | `/api/trips` | 여행 생성 | 로그인 |
| GET | `/api/trips/{tripID}` | 여행 기본 정보 조회 | 로그인 |
| PATCH | `/api/trips/{tripID}` | 여행 수정 (소유자만) | 로그인 |
| DELETE | `/api/trips/{tripID}` | 여행 삭제 (소유자만) | 로그인 |
| GET | `/api/trips/{tripID}/schedules` | 일정 목록 조회 | 로그인 |
| GET | `/api/trips/{tripID}/places` | 장소와 맛집 목록 조회 | 로그인 |
| GET | `/api/trips/{tripID}/routes` | 추천 루트 조회 | 로그인 |

### 예정 (2차 확장)

| Method | Path | 설명 | 권한 |
| --- | --- | --- | --- |
| POST | `/api/trips/{tripID}/schedules` | 일정 생성 | 로그인 |
| PATCH | `/api/schedules/{scheduleID}` | 일정 수정 | 로그인 |
| DELETE | `/api/schedules/{scheduleID}` | 일정 삭제 | 로그인 |
| POST | `/api/trips/{tripID}/places` | 장소 생성 | 로그인 |
| PATCH | `/api/places/{placeID}` | 장소 수정 | 로그인 |
| DELETE | `/api/places/{placeID}` | 장소 삭제 | 로그인 |
| POST | `/api/trips/{tripID}/share` | 공유 링크 생성 | 로그인 |
| GET | `/api/share/{token}` | 공유 링크로 여행 조회 | 공개 |

## 6. 인증과 인가 설계

스프링 시큐리티의 핵심 개념을 Go API 서버 기준으로 옮기면 아래와 같다.

```text
인증 Authentication
  사용자가 누구인지 확인한다.
  예: 관리자 이메일과 비밀번호로 로그인한다.

인가 Authorization
  인증된 사용자가 어떤 권한을 가졌는지 확인한다.
  예: admin 권한이 있어야 일정과 장소를 수정할 수 있다.
```

### 인증 방식

1차 구현은 `JWT access token` 방식으로 진행한다.

흐름:
1. 관리자가 이메일과 비밀번호로 로그인한다.
2. Go API가 DB에서 사용자 정보를 조회한다.
3. 비밀번호는 bcrypt 해시로 비교한다.
4. 성공하면 JWT를 발급한다.
5. 프론트엔드는 이후 요청에 `Authorization: Bearer <token>` 헤더를 포함한다.
6. Go API middleware가 토큰을 검증하고 사용자 ID와 권한을 요청 컨텍스트에 넣는다.

세션 방식도 가능하지만, PWA와 API 서버가 분리되어 배포될 가능성이 높아 초기에는 JWT가 단순하다.

### 비밀번호 정책

- 비밀번호 원문은 저장하지 않는다.
- DB에는 bcrypt 해시만 저장한다.
- 관리자 계정은 초기에 1명만 만든다.
- 운영 전 기본 비밀번호는 반드시 변경한다.

### 역할

| 역할 | 설명 |
| --- | --- |
| `admin` | 일정, 장소, 루트, 여행 정보, 긴급 정보 생성/수정/삭제 |
| `family` | 가족 공유 페이지에서 허용된 정보 조회 |
| `parent` | 부모님용 앱에서 여행 정보 조회와 체크리스트 사용 |
| `public` | 로그인 없이 볼 수 있는 제한된 공유 정보 |

### 권한 규칙

| 경로 | 접근 |
| --- | --- |
| `/healthz` | 공개 |
| `/api/trips/:tripId` | 부모님, 가족, 관리자 |
| `/api/trips/:tripId/schedules` | 부모님, 가족, 관리자 |
| `/api/trips/:tripId/places` | 부모님, 가족, 관리자 |
| `/api/trips/:tripId/routes` | 부모님, 가족, 관리자 |
| `/api/admin/**` | 관리자 |
| `/api/share/:shareToken/**` | 공유 토큰을 가진 사용자 |

### 가족 공유

가족 공유는 일반 로그인보다 `공유 토큰` 방식이 현실적이다.

흐름:
1. 관리자가 공유 링크를 생성한다.
2. 링크에는 추측하기 어려운 공유 토큰이 포함된다.
3. 가족은 로그인 없이 공유 링크로 읽기 전용 정보를 본다.
4. 공유 토큰별로 민감정보 노출 여부를 설정한다.

공유 화면에서는 예약번호, 보험 정보, 가족 전화번호 같은 민감정보를 숨길 수 있어야 한다.

### Go 구현 위치

```text
apps/api/internal/auth
  JWT 생성/검증
  bcrypt 비밀번호 검증
  권한 middleware

apps/api/internal/handler
  로그인 요청 처리
  관리자 API 요청 처리

apps/api/internal/service
  로그인 비즈니스 로직
  사용자 권한 확인

apps/api/internal/repository
  사용자 조회
  공유 토큰 조회
```

## 7. 권한 정책

| 사용자 | 권한 |
| --- | --- |
| 관리자 | 모든 여행 데이터 생성, 수정, 삭제 |
| 부모님 | 지정된 여행 데이터 조회, 체크리스트 상태 저장 |
| 가족 | 공유 허용된 여행 데이터 조회 |

초기에는 관리자 1명 기준으로 단순하게 시작한다. 가족 공유는 읽기 전용 링크와 공개 범위 설정으로 관리한다.

## 8. 지도 전략

- 앱 내 지도는 장소 위치와 카테고리 구분에 집중한다.
- 자체 길찾기 알고리즘은 만들지 않는다.
- 길찾기와 상세 리뷰 확인은 Google Maps로 이동한다.
- Google Maps API 비용을 줄이기 위해 초기에는 외부 링크 중심으로 구현한다.
- 앱 내 지도 라이브러리는 구현 단계에서 비용과 사용성을 보고 선택한다.

후보:
- Leaflet + OpenStreetMap
- Google Maps JavaScript API
- MapLibre

## 9. 배포와 설정 분리

스프링 부트의 `profile` 개념은 이 프로젝트에서 환경변수와 배포 환경별 `.env`로 관리한다.

### 패키징 방식

프론트엔드:
- `npm run build`로 정적 파일을 만든다.
- 결과물은 `dist/`에 생성된다.
- Vercel Hobby 플랜에 배포한다.

백엔드:
- `go build`로 실행 바이너리를 만든다.
- Go 서버는 별도 WAS 없이 단독 실행한다.
- 1차 MVP에서는 배포하지 않는다.
- 2차 확장 시 Fly.io Tokyo region을 우선 검토한다.

Spring Boot의 executable jar와 비슷하게, Go는 하나의 실행 파일로 배포할 수 있다. WAR처럼 외부 WAS에 올리는 방식은 사용하지 않는다.

### 환경 구분

| 환경 | 용도 | 예시 |
| --- | --- | --- |
| `development` | 로컬 개발 | 로컬 PostgreSQL, Vite dev server |
| `test` | 자동 테스트 | 테스트 DB 또는 in-memory repository |
| `production` | 실제 배포 | 운영 PostgreSQL, 실제 도메인 |

### 프론트 환경변수

Vite에서 브라우저에 노출되는 환경변수는 `VITE_` 접두사가 필요하다.

```text
VITE_API_BASE_URL=http://localhost:8080
```

1차 MVP에서는 API 서버를 쓰지 않으므로 비워두거나 로컬 개발 값만 사용한다. 2차 확장 운영 배포에서는 API 서버 주소로 바꾼다.

```text
VITE_API_BASE_URL=https://api.example.com
```

프론트에는 민감정보를 넣지 않는다. JWT secret, DB URL, 관리자 비밀번호 같은 값은 절대 `VITE_` 환경변수로 만들지 않는다.

### 백엔드 환경변수

```text
APP_ENV=development
PORT=8080
DATABASE_URL=postgres://postgres:postgres@localhost:5432/kagoshima_travel?sslmode=disable
JWT_SECRET=replace-with-a-long-random-secret
ALLOWED_ORIGINS=http://localhost:5173
```

설명:
- `APP_ENV`: 현재 실행 환경
- `PORT`: Go API 서버 포트
- `DATABASE_URL`: PostgreSQL 연결 문자열
- `JWT_SECRET`: JWT 서명용 비밀키
- `ALLOWED_ORIGINS`: CORS 허용 origin 목록

### 설정 파일 관리 원칙

- `.env.example`은 커밋한다.
- 실제 `.env`와 `.env.production`은 커밋하지 않는다.
- 운영 비밀값은 배포 플랫폼의 환경변수 관리 기능에 저장한다.
- 로컬 개발용 샘플 값만 문서와 example 파일에 둔다.

### 배포 순서

1차 MVP:
1. 실제 여행 데이터를 프론트 데이터 파일에 입력
2. `npm run build`로 PWA 빌드 확인
3. Vercel에 정적 배포
4. `kagoshima.hjh-dev.site` 서브도메인을 Vercel에 연결
5. 부모님 갤럭시와 제작자 iPhone에서 접속 확인
6. 부모님 폰 홈 화면에 추가
7. 오프라인 상태에서 핵심 정보 확인

2차 확장:
1. PostgreSQL 운영 DB 생성
2. Go 백엔드 배포
3. 백엔드 환경변수 등록
4. `/healthz`로 서버 상태 확인
5. 프론트 `VITE_API_BASE_URL`을 운영 API 주소로 설정
6. 관리자 페이지와 가족 공유 기능 연결

## 10. 구현 순서

1. PWA 앱 골격 구현
2. 샘플 데이터 기반 부모님용 화면 구현
3. 지도 링크, 장소 후보, 추천 루트 UI 구현
4. 실제 여행 데이터 입력
5. 오프라인 캐시와 모바일 테스트
6. Vercel Hobby 무료 배포
7. 부모님 폰 홈 화면 추가
8. Go API 서버는 2차 확장 준비물로 유지
9. 비용 여유가 생기면 PostgreSQL, 관리자 로그인, CRUD, 가족 공유 페이지 구현
