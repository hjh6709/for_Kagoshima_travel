# 인증과 공유 전략

이 문서는 여행 도우미 앱을 개인용 PWA에서 포트폴리오와 상용 서비스 후보로 확장하기 위한 인증, 데이터 저장, 공유 링크 전략을 정리합니다.

## 1. 제품 방향 전환

초기 앱은 제작자가 정적 데이터 파일에 여행 정보를 직접 입력하는 방식으로 시작했다. 하지만 실제 사용자가 자신의 여행 정보를 입력하려면 사용자별 데이터 저장과 권한 분리가 필요하다.

따라서 제품 구조는 아래처럼 바꾼다.

```text
여행 관리 사용자
  -> 로그인
  -> 여행 생성
  -> 일정, 숙소, 골프장, 맛집, 긴급 정보 입력
  -> 공유 링크 발급

가족/동행자
  -> 공유 링크 접속
  -> 로그인 없이 여행 정보 읽기 전용 조회
  -> 체크리스트는 각 기기 localStorage에 저장
```

핵심 원칙:
- 정보를 입력하고 수정하는 사람만 로그인한다.
- 가족이나 동행자는 로그인 없이 읽기 전용 링크로 본다.
- 공유 링크는 링크를 아는 사람이 볼 수 있는 공개 초대장이므로 민감정보를 기본 응답에서 제외한다.
- 1차 포트폴리오 버전은 한 명의 owner 계정과 하나의 여행 관리 흐름으로 시작한다.
- 이후 로그인 사용자 공동 관리는 `trip_members`와 `owner/editor/viewer` 역할로 확장한다.

## 2. 단계별 전략

### Phase 1. Case Study MVP

목표:
- 현재 가고시마 여행 앱을 실제 사례로 완성한다.
- 포트폴리오에서 문제 정의, UX 판단, PWA 배포, 오프라인 전략을 설명할 수 있게 한다.

포함:
- 정적 PWA
- Vercel 배포
- 커스텀 도메인
- Google Maps 외부 링크
- 체크리스트 localStorage
- 여행자용 읽기 화면

제외:
- 회원가입
- 운영 DB
- 여행 관리 입력 화면

### Phase 2. 사용자 입력형 Beta

목표:
- 사용자가 직접 여행을 만들고 정보를 입력한다.
- 가족이나 동행자에게 공유 링크를 보낼 수 있다.

포함:
- 이메일/비밀번호 로그인
- 여행 생성/수정
- 일정 CRUD
- 장소/숙소/골프장 CRUD
- 긴급 정보 CRUD
- 공유 링크 생성
- 읽기 전용 공유 페이지

제외:
- 소셜 로그인
- 결제
- 복잡한 팀 권한
- 실시간 협업

### Phase 3. 상용 서비스 후보

목표:
- 여러 사용자가 안정적으로 쓸 수 있는 여행 준비 도구로 확장한다.

검토:
- Google/Kakao/Apple 소셜 로그인
- 템플릿 기반 여행 생성
- 로그인 사용자 초대와 여행별 역할
- 민감정보 암호화
- 변경 이력
- 알림
- 유료 플랜 또는 후원 모델

## 3. 인증 방식

초기 Beta에서는 이메일/비밀번호 방식을 우선한다.

이유:
- 구현 범위가 작다.
- OAuth 리다이렉트와 제공자 설정을 피할 수 있다.
- 포트폴리오에서 인증/인가, 비밀번호 해시, JWT 또는 세션 처리를 설명하기 좋다.

정책:
- 비밀번호 원문은 저장하지 않는다.
- bcrypt 해시만 DB에 저장한다.
- 로그인 성공 시 access token을 발급한다.
- 여행 관리 API는 인증된 사용자만 접근한다.

소셜 로그인은 Phase 3에서 검토한다.

## 4. 공유 링크 방식

가족과 동행자에게는 로그인 대신 공유 링크를 제공한다.

예시:

```text
https://kagoshima.hjh-dev.site/share/9aR7xQ2...
```

공유 토큰 정책:
- 충분히 긴 랜덤 토큰을 사용한다.
- 토큰은 추측하기 어려워야 한다.
- 공유 링크는 읽기 전용으로만 동작한다.
- 공유 링크로는 수정, 삭제, 멤버 초대, 공유 링크 재발급을 할 수 없다.
- 민감정보는 기본 응답에서 제외한다.
- 필요하면 토큰을 폐기할 수 있어야 한다.
- 운영 전 공유 화면에는 검색엔진 색인 방지 정책을 적용한다.

공유 화면에서 기본 노출:
- 여행 기간
- 일정
- 장소
- 지도 링크
- 추천 루트
- 긴급 안내 일부

기본 제외:
- 숙소 예약번호
- 보험 정보
- 가족 전화번호
- 결제 정보
- 여권번호 등 개인식별정보
- 예약자명

## 5. 데이터 모델 초안

### users

| 컬럼 | 설명 |
| --- | --- |
| id | 사용자 ID |
| email | 로그인 이메일 |
| password_hash | bcrypt 해시 |
| name | 표시 이름 |
| created_at | 생성일 |

### trips

| 컬럼 | 설명 |
| --- | --- |
| id | 여행 ID |
| owner_id | 소유 사용자 ID |
| title | 여행명 |
| start_date | 시작일 |
| end_date | 종료일 |
| memo | 전체 메모 |

### trip_members

| 컬럼 | 설명 |
| --- | --- |
| trip_id | 여행 ID |
| user_id | 초대된 사용자 ID |
| role | `owner`, `editor`, `viewer` |
| created_at | 생성일 |

### share_links

| 컬럼 | 설명 |
| --- | --- |
| id | 공유 링크 ID |
| trip_id | 여행 ID |
| token_hash | 공유 토큰 해시 |
| label | 가족용, 동행자용 등 구분 이름 |
| revoked_at | 폐기 시각 |
| created_at | 생성일 |

### schedules / places / routes

기존 `TECH_DESIGN.md`의 모델을 유지하되 모든 데이터는 `trip_id`에 연결한다.

## 6. API 우선순위

### 인증

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/api/auth/register` | 사용자 가입 |
| POST | `/api/auth/login` | 로그인 |
| GET | `/api/me` | 현재 사용자 확인 |

### 여행 관리 데이터

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/api/trips` | 여행 생성 |
| GET | `/api/trips` | 내 여행 목록 |
| GET | `/api/trips/:tripId` | 내 여행 상세 |
| PATCH | `/api/trips/:tripId` | 여행 기본 정보 수정 |
| POST | `/api/trips/:tripId/schedules` | 일정 생성 |
| PATCH | `/api/schedules/:scheduleId` | 일정 수정 |
| DELETE | `/api/schedules/:scheduleId` | 일정 삭제 |
| POST | `/api/trips/:tripId/places` | 장소 생성 |
| PATCH | `/api/places/:placeId` | 장소 수정 |
| DELETE | `/api/places/:placeId` | 장소 삭제 |
| POST | `/api/trips/:tripId/share-links` | 공유 링크 생성 |

### 공유 조회

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/share/:token/trip` | 공유 여행 기본 정보 |
| GET | `/api/share/:token/schedules` | 공유 일정 목록 |
| GET | `/api/share/:token/places` | 공유 장소 목록 |
| GET | `/api/share/:token/routes` | 공유 루트 목록 |
| GET | `/api/share/:token/emergencies` | 공유 긴급 정보 |

## 7. 다음 구현 순서

1. 현재 정적 앱을 유지한 채 데이터 모델과 API 계약을 확정한다.
2. Go 백엔드에 `users`, `trips`, `share_links` 모델을 추가한다.
3. PostgreSQL 마이그레이션 방식을 정한다.
4. 이메일/비밀번호 가입과 로그인 API를 만든다.
5. 여행 생성/수정 API를 만든다.
6. 일정과 장소 CRUD API를 만든다.
7. 공유 링크 생성과 공유 조회 API를 만든다.
8. React 앱에 여행 관리 입력 화면을 별도 라우트로 붙인다.
9. 공유 화면은 공유 링크 데이터를 읽도록 전환한다.

## 8. 포트폴리오에서 강조할 포인트

- 실제 가족 문제에서 출발한 제품 문제 정의
- 가족/동행자 사용성을 고려한 로그인 없는 공유 흐름
- PWA, 오프라인, 홈 화면 추가, 커스텀 도메인 배포
- Go REST API와 React PWA 분리
- JWT/bcrypt 기반 인증
- 공유 토큰 기반 읽기 전용 접근
- 민감정보 공개 범위 제어
- 상용 서비스로 확장 가능한 데이터 모델
