# 프로젝트 트러블슈팅 및 장애 해결 가이드 (Troubleshooting)

이 문서는 가고시마 여행 플래너 앱을 배포 및 운영하는 과정에서 일어난 주요 문제 사례들과 진단 팩트, 그리고 근본적인 해결책을 기록하는 공식 트러블슈팅 가이드입니다.

---

## 1. Vercel - Oracle VM API 프록시 누락으로 인한 `HTTP 405 Method Not Allowed` 에러

### 🚨 문제 현상
- 사용자가 프론트엔드(`https://kagoshima.hjh-dev.site/manage`)에서 회원가입 및 비밀번호 찾기 시 이메일 인증코드 발송 버튼을 누르면 `인증코드 전송에 실패했습니다. (HTTP 405)` 팝업 에러가 발생함.

### 🔍 원인 분석 (Fact Check)
- curl로 `POST https://kagoshima.hjh-dev.site/api/auth/send-verification-code` 스캔 시 Vercel 서버에서 `HTTP/2 405` 및 `content-disposition: inline; filename="index.html"` 응답이 반환됨.
- `vercel.json` 에 `/api/` 요청을 외부 백엔드 API 서버(`https://api.hjh-dev.site`)로 프록싱해 주는 `rewrites` 규칙이 누락되어 있어, 브라우저의 모든 POST 요청이 Vercel의 정적 `index.html` 파일로 수신됨.
- Vercel 정적 파일 호스팅 엔진이 정적 HTML 파일에 대한 POST 요청을 거부(HTTP 405)하면서 생긴 현상임.

### 💡 해결 조치
- `vercel.json` 에 `/api/:path*` 프록시 규칙을 최상단에 작성함.

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.hjh-dev.site/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 2. 공유 링크 API 민감 개인정보(`reservation_memo`, `memo`) 노출 방지 하드닝

### 🚨 문제 현상
- 여정을 타인이나 가족에게 읽기 전용 공유 링크(`GET /api/share/{token}`)로 전달할 때, 항공권 및 숙소 예약번호/핀코드 등 민감한 메모 텍스트가 네트워크 응답 데이터에 그대로 노출될 위험이 존재함.

### 💡 해결 조치
- 백엔드 `trip_service.go` 내 `GetSharedTrip` 서비스 메서드에서 `maskSensitiveText` 헬퍼 함수를 신설하여 민감한 메모 필드를 `CON••••` 형태로 자동 마스킹 필터링하여 응답함.
- `trip_service_test.go` 단위 테스트(`TestGetSharedTripSensitiveDataMasking`)를 통해 응답 마스킹 무결성을 검증함.

---

## 3. DB 접속 정보 부재 시 백엔드 테스트 및 인메모리 Fallback 보장

### 🚨 문제 현상
- CI 파이프라인이나 개발자 로컬 환경에서 PostgreSQL DB 환경변수(`DATABASE_URL`)가 세팅되어 있지 않을 경우 백엔드 서버 시작 및 통합 테스트가 멈추거나 패닉이 발생하는 현상.

### 💡 해결 조치
- `MemoryTripRepository`, `MemoryChecklistRepository` 인메모리 테스트 더블(Test Double)을 신설하고, DB 연결 실패 시 자동으로 In-Memory 저장소로 Fallback 스위칭되도록 구현하여 테스트 무결성 100% 보장.
