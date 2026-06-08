# for_Kagoshima_travel

가고시마 여행을 위해 제작

## 방향

6월 말 부모님 가고시마 여행을 위한 모바일 우선 여행 도우미 앱입니다.

- 부모님 갤럭시 사용을 우선 고려
- 제작자 iPhone 테스트도 가능하도록 크로스 플랫폼 구성
- 초기 구현 방식은 PWA 웹앱 권장
- 일정, 지도, 체크리스트, 긴급 연락 정보를 핵심 기능으로 구성

## 문서

기획·설계·배포 문서는 [`docs/README.md`](docs/README.md)에서 카테고리별로 모아 관리합니다.

## 실행

```bash
npm install
npm run dev
```

## 빌드

```bash
npm run build
```

## 1차 배포

Vercel Hobby 무료 플랜에 정적 PWA로 배포합니다. 백엔드와 PostgreSQL은 2차 확장 범위로 둡니다.
