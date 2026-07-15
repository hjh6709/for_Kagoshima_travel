# 배포 아키텍처 및 운영 가이드

이 문서는 가고시마 여행 공유 서비스의 실제 운영 서버 배포 구조와 관리 방법을 명세합니다.

---

## 1. 현재 운영 배포 아키텍처

서비스는 비용 효율성과 안정성을 극대화하기 위해 백엔드 계산 엔진(오라클 VM)과 데이터 저장소(Supabase)를 분리하는 이원화 아키텍처를 채택하고 있습니다.

```text
[ 유저 브라우저 (PWA) ] 
       │
       ├──(HTTPS: api.hjh-dev.site)──> [ Oracle Cloud VM (Go API + Caddy Proxy) ]
       │                                                     │
       │                                                (PostgreSQL)
       │                                                     ▼
       └─(HTTPS: kagoshima.hjh-dev.site)──> [ Supabase Cloud Database (Seoul) ]
```

* **Frontend**: React + Vite + PWA ➡️ **Vercel Hobby** 배포 (`https://kagoshima.hjh-dev.site`)
* **Backend API**: Go REST API ➡️ **Oracle Cloud VM (ARM A1)** 호스트 (`https://api.hjh-dev.site`)
* **Database**: PostgreSQL 17 ➡️ **Supabase Cloud DB** (Northeast Asia - Seoul 리전)

---

## 2. 프론트엔드 배포 (Vercel)

Vercel에서 GitHub 리포지토리의 `main` 브랜치를 기준으로 자동 빌드 및 배포(CD)됩니다.

### Vercel 빌드 설정
* **Framework Preset**: Vite
* **Build Command**: `cd apps/web && npm run build`
* **Output Directory**: `apps/web/dist`
* **Install Command**: `cd apps/web && npm ci`

### 필수 환경 변수
* **`VITE_API_BASE_URL`**: `https://api.hjh-dev.site` (운영계 Go API 서버 도메인)

---

## 3. 백엔드 배포 (Oracle Cloud VM)

오라클 클라우드 ARM 인스턴스 환경에서 24시간 안정적으로 무중단 가동됩니다.

### 인프라 구성 실체
* **Caddy 웹서버**: 외부 80/443 포트로 들어오는 HTTPS 트래픽을 인수하여 내부 `127.0.0.1:8080` Go API 포트로 프록싱하며 SSL 인증서를 자동 갱신합니다.
* **systemd 서비스**: Go 바이너리를 `travel-api.service` 데몬 시스템 서비스로 등록하여, 서버가 재부팅되어도 자동으로 백그라운드 구동되도록 제어합니다.
  - 서비스 파일 위치: `/etc/systemd/system/travel-api.service`
  - 환경변수 주입 파일: `/etc/travel-api/travel-api.env`

### 필수 주입 환경 변수 (`travel-api.env`)
* `APP_ENV`: `production`
* `PORT`: `8080`
* `DATABASE_URL`: `postgresql://postgres.[Project-ID]:[PW]@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres` (Supabase 트랜잭션 풀러 URI)
* `JWT_SECRET`: 로그인 세션 서명용 시크릿 키
* `ALLOWED_ORIGINS`: `https://kagoshima.hjh-dev.site`

---

## 4. 데이터베이스 마이그레이션 및 롤백 (Supabase)

데이터베이스의 모든 영속성 스키마는 **Supabase PostgreSQL**에서 관리합니다.

* **테이블 구조 갱신**: 신규 테이블(예: checklists) 생성 또는 변경 시, 로컬의 Go DDL 마이그레이션 유틸리티(`scratch/migrate_db.go`)를 원격 DB 커넥션으로 구동하거나 Supabase SQL Editor를 통해 최종 쿼리를 반영합니다.
* **데이터 보존 안정성**: 백엔드 서버(오라클 VM)에 문제가 생겨 VM 인스턴스를 재생성하더라도 모든 여행 데이터는 Supabase 클라우드에 고스란히 영구 보존됩니다.
