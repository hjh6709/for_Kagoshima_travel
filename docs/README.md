# Map Planner 문서

현재 제품과 운영 상태를 설명하는 문서의 단일 진입점입니다. 구현이 바뀌면 같은 PR에서 관련 문서를 함께 갱신합니다.

## 제품과 사용자 경험

1. [`../PRODUCT.md`](../PRODUCT.md) — 사용자, 제품 목적, 범위와 변하지 않는 원칙
2. [`PRD.md`](./PRD.md) — 해결하려는 문제, 대상 사용자와 출시 기준
3. [`FEATURES.md`](./FEATURES.md) — 현재 제공 기능과 다음 개선 범위
4. [`USER_FLOW.md`](./USER_FLOW.md) — 비로그인·소유자·공유 사용자의 실제 이동 흐름
5. [`../DESIGN.md`](../DESIGN.md) — Pocket Atlas 디자인 토큰과 UI 규칙

## 기술

1. [`TECH_DESIGN.md`](./TECH_DESIGN.md) — 웹·API·DB 경계, 데이터 모델, 보안 원칙
2. [`../apps/api/README.md`](../apps/api/README.md) — Go API 실행, 환경변수와 검증
3. [`../apps/web/README.md`](../apps/web/README.md) — React PWA 실행과 브라우저 환경변수

OpenAPI의 실행 기준은 `apps/api/internal/handler/openapi.json`이며, API 실행 중 `/docs`와 `/openapi.json`에서도 확인할 수 있습니다.

## 개발과 운영

1. [`LOCAL_DEVELOPMENT_RUNBOOK.md`](./LOCAL_DEVELOPMENT_RUNBOOK.md) — 로컬 웹·API·PostgreSQL 실행
2. [`DEPLOYMENT.md`](./DEPLOYMENT.md) — Vercel·OCI·Supabase 운영 구성
3. [`ORACLE_VM_DEPLOYMENT_RUNBOOK.md`](./ORACLE_VM_DEPLOYMENT_RUNBOOK.md) — GitHub Actions 기반 API 배포와 롤백
4. [`../infra/oracle/README.md`](../infra/oracle/README.md) — 수동 서버 초기화·복구용 인프라 스크립트
5. [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md) — 실제 장애 사례와 재발 방지 조치

## 문서 유지 원칙

- 현재 동작은 소스·테스트·OpenAPI를 우선 근거로 삼습니다.
- 완료된 일회성 구현 계획과 화면별 임시 설계서는 PR 설명 HTML에 남기고 저장소에는 중복 보관하지 않습니다.
- 디자인 규칙은 `DESIGN.md`, 제품 범위는 `PRODUCT.md`, 운영 절차는 런북 한 곳에만 기록합니다.
- 예시에는 실제 API 키, 비밀번호, JWT, DB URL, 이메일이나 공유 토큰을 넣지 않습니다.
