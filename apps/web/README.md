# Map Planner Web

React `19.2.8`, React DOM `19.2.8`, TypeScript와 Vite로 만든 모바일 우선 PWA입니다.

## 실행

```bash
npm install
cp .env.example .env
npm run dev
```

전체 로컬 API·PostgreSQL 구성은 [`../../docs/LOCAL_DEVELOPMENT_RUNBOOK.md`](../../docs/LOCAL_DEVELOPMENT_RUNBOOK.md)를 확인합니다.

## 환경변수

| 이름 | 역할 |
| --- | --- |
| `VITE_API_BASE_URL` | Go API 기준 URL 또는 동일 Origin 프록시 사용 시 빈 값 |
| `VITE_GOOGLE_MAPS_BROWSER_KEY` | Maps JavaScript API 브라우저 키 |
| `VITE_GOOGLE_MAPS_MAP_ID` | 선택적인 운영 Map ID |

브라우저 키는 Google Cloud에서 운영 웹사이트, Maps JavaScript API와 사용량으로 제한합니다. Places 검색용 서버 키는 웹 환경변수에 넣지 않습니다.

## 검증

```bash
npm test
npm run typecheck
npm run build
```

React와 React DOM은 정확히 같은 버전을 유지합니다. UI 변경은 실제 모바일 기본 배율에서 먼저 확인하고 작은 화면·확대·오프라인 상태를 회귀 검사합니다.

## 주요 경로

- `/`: 시작 화면
- `/demo`: 상하이 샘플
- `/manage`: 로그인과 여행 목록
- `/manage/trips/:id`: 소유자 여행 보기
- `/manage/trips/:id/edit/:section`: 항목별 편집
- `/share/:token`: 읽기 전용 공유 여행

제품 원칙은 [`../../PRODUCT.md`](../../PRODUCT.md), 디자인 토큰과 UI 규칙은 [`../../DESIGN.md`](../../DESIGN.md)를 기준으로 합니다.
