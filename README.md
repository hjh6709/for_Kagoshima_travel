# Travel Share App

가족 여행 정보를 공유하고 관리하기 위한 모바일 우선 여행 도우미 앱입니다.

## 방향

부모님과 가족이 로그인 없이 공유 링크로 여행 정보를 쉽게 확인하고, 여행 생성자는 로그인 후 정보를 관리하는 서비스를 목표로 합니다.

- 부모님 갤럭시 사용을 우선 고려
- 제작자 iPhone 테스트도 가능하도록 크로스 플랫폼 구성
- 초기 구현 방식은 PWA 웹앱 권장
- 일정, 지도, 체크리스트, 긴급 연락 정보를 핵심 기능으로 구성

## 문서

기획·설계·배포 문서는 [`docs/README.md`](docs/README.md)에서 카테고리별로 모아 관리합니다.
로컬 실행과 테스트 절차는 [`docs/LOCAL_DEVELOPMENT_RUNBOOK.md`](docs/LOCAL_DEVELOPMENT_RUNBOOK.md)를 기준으로 확인합니다.
Oracle VM API 배포 절차는 [`docs/ORACLE_VM_DEPLOYMENT_RUNBOOK.md`](docs/ORACLE_VM_DEPLOYMENT_RUNBOOK.md)를 기준으로 확인합니다.

## 구조

```text
apps/
  api/  Go REST API
  web/  React + TypeScript + Vite PWA
docs/   기획·설계·운영 문서
```

## 실행

프론트엔드 개발 서버:

```bash
npm --prefix apps/web install
npm run web:dev
```

백엔드 API 서버:

```bash
npm run api:dev
```

## 빌드

프론트엔드:

```bash
npm run web:build
```

백엔드:

```bash
cd apps/api
go build -o bin/api ./cmd/api
```

전체 기본 검증:

```bash
npm run check
```

## 1차 배포

Vercel Hobby 무료 플랜에 정적 PWA로 배포합니다. 백엔드와 PostgreSQL은 2차 확장 범위로 둡니다.
