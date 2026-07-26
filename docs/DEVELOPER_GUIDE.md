# Kagoshima Travel (가고시마 여행) - 개발자 종합 가이드 (Developer Guide)

이 문서는 프로젝트에 새롭게 참여하는 개발자가 빠른 시간 안에 전체 아키텍처, 디렉터리 구조, 디자인 시스템, API 연동 패턴 및 코딩 규칙을 이해할 수 있도록 정리한 개발 참고 문서입니다.

---

## 1. 프로젝트 아키텍처 개요

가고시마 및 중화권 오프라인/온라인 맞춤형 여행 플랫폼으로, 모바일 PWA 환경 및 App Store 수준의 UI/UX 감성을 목표로 구축되었습니다.

- Frontend: React 18, TypeScript, Vite, Workbox (PWA), Vanilla CSS Tokens
- Backend: Go 1.22+, Chi Router, SQLite / GORM, JWT Auth (HttpOnly Cookie)
- Map Integration: Google Maps API (글로벌) + Amap 고덕지도 (중국 대륙 대응)

---

## 2. 모노레포 디렉터리 구조

```
for_Kagoshima_travel/
├── apps/
│   ├── api/                     # Go 백엔드 API 서버
│   │   ├── cmd/api/             # 진입점 (main.go)
│   │   └── internal/            # 캡슐화된 내부 패키지
│   │       ├── auth/            # JWT 및 비밀번호 해싱 (bcrypt)
│   │       ├── db/              # SQLite 데이터베이스 연결
│   │       ├── dto/             # 요청/응답 Data Transfer Object
│   │       ├── handler/         # HTTP 라우터 핸들러
│   │       ├── middleware/      # CORS 및 Auth 미들웨어
│   │       ├── model/           # DB GORM 도메인 엔티티
│   │       ├── repository/      # DB 쿼리 리포지토리
│   │       ├── server/          # HTTP 서버 수명주기
│   │       └── service/         # 비즈니스 로직 서비스
│   │
│   └── web/                     # React Vite PWA 프론트엔드
│       ├── src/
│       │   ├── api/             # HTTP 클라이언트 & API 바인딩
│       │   ├── data/            # 정적 가고시마/상하이 오프라인 추천 데이터
│       │   ├── features/        # 도메인 피처 모듈 (trip, manage, share, start)
│       │   │   └── trip/
│       │   │       ├── components/ # 계층화된 UI 컴포넌트
│       │   │       │   ├── tabs/    # 메인 탭 컴포넌트 (TodayTab, MapTab 등)
│       │   │       │   ├── sections/# 화면 섹션 컴포넌트 (ChecklistSection 등)
│       │   │       │   ├── cards/   # 단위 카드 컴포넌트 (ScheduleCard 등)
│       │   │       │   ├── helpers/ # 헬퍼 모달 및 유틸 (QuickTravelHelper 등)
│       │   │       │   └── index.ts # Barrel Re-export 진입점
│       │   │       ├── TripPage.tsx
│       │   │       └── tripViewState.ts
│       │   ├── shared/          # 공통 컴포넌트 & 유틸 (date, mapLinks 등)
│       │   ├── types/           # 도메인 타입 정의
│       │   └── styles.css       # 메인 CSS 디자인 시스템 토큰
│       └── vite.config.ts
└── docs/                        # 프로젝트 문서
```

---

## 3. 프론트엔드 모듈화 & 컴포넌트 패턴

### 컴포넌트 역할 분리 (Domain Subfolder Architecture)
`apps/web/src/features/trip/components/` 하위는 역할에 따라 4개 디렉토리로 분류되어 있습니다.

1. tabs/: 사용자가 하단 탭 바를 통해 스위칭하는 독립 페이지 단위 (TodayTab, ScheduleTab, FlightTab, MapTab, ConciergeTab, MyPageTab, BottomTabs)
2. sections/: 탭 내부를 구성하는 블록 섹션 (TodayHeaderSection, HomeChecklistSection, ChecklistSection, RecommendedRoutesSection, QuickActionGrid)
3. cards/: 단일 데이터 엔티티를 표현하는 컴포넌트 (NextScheduleCard, ScheduleCard, ProfileShortcutButton)
4. helpers/: 보조 유틸 팝업 및 에디터 (QuickTravelHelper, TripDateEditor)

### Barrel Export 사용 규칙
`features/trip/components/index.ts` 진입점이 제공되므로 상위 페이지에서는 다음과 같이 깔끔하게 임포트합니다.

```tsx
import { TodayTab, ScheduleTab, MapTab } from "./components";
```

---

## 4. 디자인 시스템 & UI/UX 가이드라인 (Impeccable Design Standard)

본 서비스는 App Store 최상위 퀄리티를 유지하기 위해 다음 디자인 원칙과 안티패턴 방지 규칙을 준수해야 합니다.

### WCAG AAA 가독성 & 가이드라인
- Primary Text: `#0f172a` (딥 슬레이트)
- Page Background: `#0f172a` (다크 메탈릭) / Phone Surface: `#f8fafc`
- Contrast Ratio: 모든 본문 텍스트는 4.5:1 이상, 강조 텍스트는 5.5:1 이상 유지
- Input Focus Ring: 3px solid rgba(146, 95, 14, 0.5) 시각적 피드백 제공

### 6대 UI 안티패턴 방지 금지 규칙
1. Cream Palette 금지: 무난한 베이지/크림 배경 대신 명확한 슬레이트 메탈릭 스킴 사용
2. GPT Thin Border + Wide Shadow 금지: 1px 보더와 90px 퍼지는 섀도우를 동시에 남발하지 않음
3. Low Contrast 금지: 글자색 대비비 미달 금지
4. Dark Glow 금지: 어두운 배경 위 원색 비현실적 반광(chromatic shadow) 금지, 뉴트럴 섀도우 사용
5. Cramped Padding 금지: 하단/상단 경계선에 텍스트가 바짝 붙지 않도록 `calc(24px + env(safe-area-inset-...))` 패딩 보장
6. Nested Cards 금지: 카드 내부에 보더와 배경이 있는 또 다른 카드를 중첩(Card inside card)하지 말고, 구분선(divider)과 여백으로 플랫하게 구성

### 60fps 애니메이션 퍼포먼스
- 진행률(Progress fill) 등 프로그레스 바를 변경할 때는 layout reflow를 유발하는 `width` 대신 `transform: scaleX(val)` 과 `transform-origin: left` 를 사용합니다.

---

## 5. 로컬 개발 환경 구축 & 실행

### 백엔드 실행 (Go API)
```bash
cd apps/api
go run cmd/api/main.go
# 8080 포트에서 백엔드 API 켜짐
```

### 프론트엔드 실행 (Vite Dev Server)
```bash
cd apps/web
npm install
npm run dev
# http://localhost:5173 에 프론트엔드 서버 구동
```

### 전체 빌드 검증
```bash
# 프론트엔드 빌드 검증
cd apps/web
npm run build

# 백엔드 테스트 검증
cd apps/api
go test ./...
```

---

## 6. Git 브랜치 & PR 규칙

1. 메인 브랜치 직접 작업 금지: 항상 `main` 브랜치를 최신화(`git pull origin main`)한 후 기능별 새 브랜치를 생성(`git checkout -b feature/xyz` 또는 `git checkout -b refactor/abc`)하여 작업합니다.
2. 단위 테스트 및 빌드 통과 필수: PR 제출 전 반드시 `npm run build` 및 `go test ./...` 를 통과해야 합니다.
3. PR 제출: `gh pr create` 명령을 사용하여 변경 사항 및 검증 결과를 요약한 PR을 등록합니다.
