# Travel Share App

여행자가 직접 일정, 체크리스트, 항공편, 장소, 긴급 정보를 관리하고 여행 중 바로 확인하는 모바일 우선 여행 도우미 앱입니다.

## 방향

사용자가 직접 여행 정보를 입력·수정하고, 필요하면 가족이나 동행자에게 공유 링크로 여행 정보를 전달하는 서비스를 목표로 합니다.

- 여행 중 모바일에서 직접 쓰는 사용성을 우선 고려
- Android와 iPhone에서 모두 사용할 수 있도록 크로스 플랫폼 구성
- 초기 구현 방식은 PWA 웹앱 권장
- 일정 순서 조정, 날짜 조정, 체크리스트 추가·삭제, 지도, 항공, 긴급 연락 정보를 핵심 기능으로 구성

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
