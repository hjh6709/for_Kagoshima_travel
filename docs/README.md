# 여행 도우미 앱 제품 기획 & 개발자 문서 단일 진입점

사용자가 직접 여행 일정, 준비물, 환율, 현지 회화를 관리하고 오프라인 환경에서도 빠르게 확인하는 모바일 여행 도우미 플랫폼의 종합 문서 단일 진입점(Entry Point)입니다.

---

## 📚 문서 맵 (Documentation Sitemap)

### 1. 개발자 종합 가이드 (Developer & Architecture)
1. [개발자 종합 가이드 (DEVELOPER_GUIDE.md)](./DEVELOPER_GUIDE.md) - **(필독)** 계층화된 폴더 구조, 안티패턴 금지 규칙, 60fps 애니메이션 및 번들 구성
2. [기술 설계서 (Tech Design)](./TECH_DESIGN.md) - 시스템 구성도, 데이터베이스 ERD, API 설계
3. [시스템 운용 가이드 (System Guide)](./SYSTEM_GUIDE.md) - 보안, 캡차, 인증 및 오프라인 캐싱 흐름

### 2. 기획 & 요구사항 (PRD & Specifications)
4. [프로덕트 요구사항 문서 (PRD)](./PRD.md)
5. [기능명세서 (Features)](./FEATURES.md)
6. [유저 플로우 (User Flow)](./USER_FLOW.md)
7. [와이어프레임 (Wireframe)](./WIREFRAME.md)

### 3. 배포 & 런북 (Deployment & Runbooks)
8. [로컬 개발 런북](./LOCAL_DEVELOPMENT_RUNBOOK.md)
9. [Oracle VM API 배포 런북](./ORACLE_VM_DEPLOYMENT_RUNBOOK.md)
10. [배포 가이드](./DEPLOYMENT.md)
11. [디자인 가이드라인](./DESIGN_GUIDELINES.md)
12. [프로젝트 트러블슈팅 가이드](./TROUBLESHOOTING.md)

---

## 💡 개발 및 코드 작성 시 핵심 참고 규칙

- **단일 책임 서브 모듈화 (Single Responsibility)**: 300줄 이상의 거대 비대 파일(God Object)은 단일 책임 컴포넌트 및 유틸로 분리합니다.
- **계층화된 컴포넌트 폴더 구조**: UI 컴포넌트는 `tabs/`, `sections/`, `cards/`, `forms/`, `lists/`, `helpers/` 서브 폴더에 작성하고 `index.ts` Barrel Export로 노출합니다.
- **오프라인 회복력 (Offline Resilience)**: 네트워크 오프라인 상태에서도 최근 방문 데이터 및 오프라인 캐시가 부드럽게 복원되도록 유지합니다.
- **60fps Transform 애니메이션**: Layout Reflow를 일으키는 width/left 대신 GPU 가속 transform과 opacity 속성만을 사용합니다.
