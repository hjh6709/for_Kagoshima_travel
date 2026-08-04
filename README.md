# Map Planner

여행 전에는 장소·일정·항공편·준비물을 계획하고, 여행 중에는 오늘 일정과 지도에서 다음 이동을 빠르게 확인하는 모바일 우선 여행 플래너입니다. 상하이는 첫 실사용 사례이며 한국을 포함한 전 세계 여행을 지원하는 구조를 지향합니다.

## 주요 기능

- 이메일 인증 기반 회원가입, 로그인, 비밀번호 복구와 계정 관리
- 여행 생성·수정과 날짜·국가·동행자 관리
- Google Places 기반 장소 검색 및 카페·식당·관광지·숙소 저장
- 날짜별 일정, 장소 연결, 일정 순서와 완료 상태 관리
- 여행 전체 또는 날짜별 준비 체크리스트
- 저장 장소와 현재 위치를 표시하는 앱 내부 지도
- Google 지도 또는 중국 고덕지도로 이어지는 외부 길찾기
- 로그인 없이 확인하는 읽기 전용 공유 링크
- PWA 설치, 오프라인 캐시와 안전한 업데이트 안내

## 구조

```text
apps/web   React 19.2.8 + TypeScript + Vite PWA
apps/api   Go REST API + pgx/PostgreSQL
infra      OCI VM 수동 구성·복구 도구
scripts    현재 OCI 자동 배포와 검증 스크립트
docs       제품·기술·운영 문서
```

운영 환경은 Vercel의 정적 PWA, Oracle Cloud VM의 Go API와 Caddy, Supabase PostgreSQL로 구성됩니다. 웹 브라우저는 데이터베이스에 직접 연결하지 않고 Go API를 통해서만 데이터를 읽고 변경합니다.

## 빠른 시작

```bash
npm --prefix apps/web install
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
npm run web:dev
```

API를 별도로 실행하려면 다음 명령을 사용합니다.

```bash
npm run api:dev
```

자세한 로컬 환경과 PostgreSQL 실행 방법은 [`docs/LOCAL_DEVELOPMENT_RUNBOOK.md`](docs/LOCAL_DEVELOPMENT_RUNBOOK.md)를 확인합니다.

## 검증

```bash
npm run check
```

프런트엔드만 검증하려면 `npm --prefix apps/web test`, `typecheck`, `build`를 실행하고, API만 검증하려면 `cd apps/api && go test ./... -count=1`을 실행합니다.

## 문서

- 문서 단일 진입점: [`docs/README.md`](docs/README.md)
- 제품 원칙: [`PRODUCT.md`](PRODUCT.md)
- 디자인 시스템: [`DESIGN.md`](DESIGN.md)
- 현재 기술 구조: [`docs/TECH_DESIGN.md`](docs/TECH_DESIGN.md)
- 배포 구조: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)
- OCI 자동 배포·복구: [`docs/ORACLE_VM_DEPLOYMENT_RUNBOOK.md`](docs/ORACLE_VM_DEPLOYMENT_RUNBOOK.md)

실제 비밀 값이 들어 있는 `.env`, API 키, JWT 비밀키, 데이터베이스 URL과 SSH 키는 저장소에 커밋하지 않습니다.
