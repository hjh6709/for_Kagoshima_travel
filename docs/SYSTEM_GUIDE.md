# 스마트 여정 플래너 시스템 가이드북 (SYSTEM_GUIDE)

이 문서는 스마트 여정 플래너 프로젝트의 **전체 앱 아키텍처 구조** 및 **백엔드 REST API 명세**를 설명하여, 개발자가 개발 편의성 및 데이터 사양을 신속히 파악하고 협업할 수 있도록 돕는 종합 가이드라인입니다.

---

## 1. 프로젝트 아키텍처 & 디렉토리 구조

본 프로젝트는 단일 레포지토리(Monorepo) 구조로 구성되어 있으며, 프론트엔드 React PWA 및 Go API 서버가 결합된 아키텍처를 가집니다.

```
for_Kagoshima_travel/
├── apps/
│   ├── api/                 # Go 백엔드 REST API 웹 서버
│   │   ├── cmd/api/         # main.go 엔트리포인트
│   │   ├── internal/        # 비즈니스 로직 도메인
│   │   │   ├── server/      # HTTP 라우팅 및 미들웨어 (server.go)
│   │   │   ├── handler/     # HTTP 핸들러 DTO 계층
│   │   │   ├── service/     # 트랜잭션 서비스 도메인
│   │   │   └── repository/  # PostgreSQL 데이터베이스 접근 계층
│   │   └── openapi.json     # OpenAPI 3.0 명세 규격서
│   │
│   └── web/                 # React + TypeScript PWA 프론트엔드 (Vite)
│       ├── src/
│       │   ├── api/         # Axios 클라이언트 인스턴스 및 호출 스택
│       │   ├── features/    # 비즈니스 모듈별 격리 폴더
│       │   │   ├── auth/    # 인증 상태 및 게이트웨이
│       │   │   ├── manage/  # 여행 플래너 상세 관리 도구 상자
│       │   │   ├── share/   # 읽기전용 동반자 실시간 공유 화면
│       │   │   ├── start/   # 비로그인 웰컴 대시보드 화면
│       │   │   └── trip/    # 대시보드 탭 레이아웃 및 퀵 헬퍼
│       │   ├── shared/      # 범용 일자 정렬, 날짜 파싱 유틸
│       │   └── styles.css   # 글로벌 디자인 테마 및 입체 모션 CSS
│
└── docs/                    # 옵시디언 연동 작업로그 및 가이드북 폴더
```

---

## 2. 백엔드 REST API 명세서 요약

전체 API 명세는 로컬 또는 실서버 VM 실행 상태에서 `GET /openapi.json` 혹은 Swagger UI `GET /docs` 화면을 통해 대화형으로 확인할 수 있습니다.

### 2.1 인증 및 계정 (Authentication)
모든 인증은 JWT 토큰 방식으로 동작하며, 보호된 API 요청 시 `Authorization: Bearer <JWT_TOKEN>` 헤더를 동봉해야 합니다.

| 메서드 | 엔드포인트 | 설명 | 인증 필요 |
| :--- | :--- | :--- | :---: |
| **POST** | `/api/auth/register` | 신규 사용자 이메일 회원가입 | X |
| **POST** | `/api/auth/login` | 로그인 및 JWT 토큰 발행 | X |
| **GET** | `/api/auth/me` | 현재 인증된 사용자 정보 프로필 반환 | **O** |

### 2.2 여행 관리 (Trip Management)
| 메서드 | 엔드포인트 | 설명 | 인증 필요 |
| :--- | :--- | :--- | :---: |
| **GET** | `/api/trips` | 로그인한 사용자의 전체 여정 리스트 목록 조회 | **O** |
| **POST** | `/api/trips` | 신규 여정 카드 생성 | **O** |
| **GET** | `/api/trips/{tripID}` | 특정 여정 카드의 상세 명세(국가 코드 포함) 조회 | **O** |
| **PATCH** | `/api/trips/{tripID}` | 여정 기본 정보(제목, 일자, 목적국가) 수정 | **O** |
| **DELETE** | `/api/trips/{tripID}` | 특정 여정 카드 영구 삭제 | **O** |
| **POST** | `/api/trips/{tripID}/share` | 해당 여정의 퍼블릭 읽기전용 공유 링크 해시 토큰 생성 | **O** |

### 2.3 일정 & 장소 & 항공 (Trip Elements)
| 메서드 | 엔드포인트 | 설명 | 인증 필요 |
| :--- | :--- | :--- | :---: |
| **GET** | `/api/trips/{tripID}/schedules` | 여정의 상세 타임라인 일정 목록 조회 | **O** |
| **POST** | `/api/trips/{tripID}/schedules` | 일정 타임 스탬프 데이터 카드 신설 | **O** |
| **PATCH** | `/api/trips/{tripID}/schedules/{scheduleID}` | 특정 시간대의 일정 카드 수정 | **O** |
| **DELETE** | `/api/trips/{tripID}/schedules/{scheduleID}` | 특정 일정 노드 삭제 | **O** |
| **GET** | `/api/trips/{tripID}/places` | 여정 내 저장된 명소/장소 목록 조회 | **O** |
| **POST** | `/api/trips/{tripID}/places` | 신규 명소 카드 추가 (고덕지도 경위도 연동 가능) | **O** |
| **PATCH** | `/api/trips/{tripID}/places/{placeID}` | 특정 장소 정보 및 가이드 메모 수정 | **O** |
| **DELETE** | `/api/trips/{tripID}/places/{placeID}` | 특정 장소 삭제 | **O** |
| **GET** | `/api/trips/{tripID}/flights` | 여정에 동봉된 항공 리스트 조회 | **O** |
| **POST** | `/api/trips/{tripID}/flights` | 출발/도착 보딩패스 항공편 정보 신설 | **O** |
| **PATCH** | `/api/trips/{tripID}/flights/{flightID}` | 항공편 데이터 및 마스킹 메모 수정 | **O** |
| **DELETE** | `/api/trips/{tripID}/flights/{flightID}` | 항공편 삭제 | **O** |

### 2.4 공개 공유 뷰 (Public Share View)
| 메서드 | 엔드포인트 | 설명 | 인증 필요 |
| :--- | :--- | :--- | :---: |
| **GET** | `/api/share/{token}` | 로그인 없이 동반자가 일정을 읽을 수 있는 토큰 뷰 서빙 | X |

---

## 3. 현지 소통 및 특화 기능 구조 정보

본 플래너에는 특히 해외 여행(일본 `JP`, 중국 `CN`) 시 사용성 보강을 위해 다음과 같은 장치가 설계되어 연동 중입니다.

1. **중국 구글 차단 우회용 고덕지도(Amap) 연동**:
   - `destinationCountry`가 `CN` 일 경우, 장소 카드에 `Amap 🗺️ 고덕지도` 링크가 자동 파싱 노출됩니다.
   - 장소 이름과 주소를 클립보드에 담는 `📋 정보 복사` 단추가 제공됩니다.
2. **풀스크린 대형 글자 확대(Zoom) 돋보기 모달**:
   - 현지 택시 기사나 주민에게 길을 물어볼 때 스마트폰 글씨를 꽉 채워 보여줄 수 있도록 하는 풀스크린 텍스트 줌 모달(`.modal-overlay`)이 장소 카드(`Maximize2`) 및 퀵 헬퍼에 통합되어 가동 중입니다.
3. **항공권 보딩패스 동적 바인딩**:
   - 로컬 DB 스펙 한계를 우회하기 위해 `flights`의 출/입국 편 뱃지와 `destinationCountry`를 대조하여 출발/도착 공항 코드(`ICN`, `KOJ`, `PVG`) 및 한글 공항 명칭을 모바일 화면에 동적으로 렌더링하고 있습니다.
