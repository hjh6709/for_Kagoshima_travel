# 장애 사례와 재발 방지

추측이 아니라 코드·테스트·배포 설정으로 확인된 사례만 기록합니다. 운영 로그나 화면에 비밀 값과 개인정보를 복사하지 않습니다.

## 1. Vercel에서 API POST가 405를 반환함

### 증상

회원가입이나 비밀번호 복구의 POST 요청이 `HTTP 405 Method Not Allowed`를 반환하고 정적 `index.html` 관련 헤더가 보였습니다.

### 원인과 조치

SPA fallback이 `/api` 요청까지 받아 정적 파일에 POST했습니다. `vercel.json`에서 `/api/:path*`를 `https://api.hjh-dev.site/api/:path*`로 먼저 전달하고, 그다음 나머지 경로를 `/index.html`로 보냅니다.

### 재발 확인

- `vercel.json`에서 API rewrite가 SPA rewrite보다 앞에 있는지 확인
- 배포 뒤 `/healthz`와 인증코드 POST를 각각 확인

## 2. 공유 응답에 소유자 내부 정보가 섞일 위험

### 증상

소유자 여행 객체를 공개 공유 화면에서 그대로 사용하면 여행 내부 메모와 같은 비공개 필드가 네트워크 응답에 포함될 수 있습니다.

### 원인과 조치

화면에서 숨기는 것만으로는 데이터 노출을 막을 수 없습니다. 공개 기본 정보는 `PublicTripResponse`, 소유자 정보는 `TripResponse`로 분리하고 공유 응답은 허용된 필드만 조립합니다. 일정 이동·안내 메모와 항공 메모는 공유 응답에서 제외합니다.

### 재발 확인

- `apps/api/internal/server/share_security_test.go`
- `apps/api/internal/service/trip_service_test.go`의 공유 메모 제외 테스트
- 소유자 DTO에 새 필드를 추가해도 공개 DTO에는 자동으로 추가하지 않음

## 3. React와 React DOM 버전 불일치로 흰 화면이 발생함

### 증상

배포된 PWA가 앱 셸 배경만 표시하고 React 화면을 렌더링하지 못했습니다.

### 원인과 조치

React와 React DOM 런타임 버전이 일치하지 않았습니다. 두 패키지를 정확히 `19.2.8`로 맞추고 `apps/web/scripts/react-version-parity.test.mjs`가 `package.json`, lockfile과 설치 버전을 검사하도록 했습니다.

### 재발 확인

```bash
npm --prefix apps/web run test:dependencies
```

## 4. 실행 중인 API 바이너리 교체에서 `Text file busy`가 발생함

### 증상

OCI VM 배포 중 활성 `travel-api` 바이너리를 덮어쓰거나 불완전하게 이름을 바꾸는 단계에서 배포가 중단됐습니다.

### 원인과 조치

새 바이너리를 `travel-api.next`로 별도 전송하고 기존 활성 바이너리를 timestamp 롤백 파일로 이동한 뒤 next를 활성화합니다. systemd 재시작과 `/healthz`가 실패하면 이전 바이너리를 복원합니다. 구현은 `scripts/deploy-api-on-vm.sh`, 회귀 검사는 `scripts/deploy-api-on-vm.test.sh`가 담당합니다.

## 5. production 환경이 개발 모드로 실행될 위험

### 증상

`APP_ENV`가 없으면 production 전용 JWT·Origin·DB 검증이 활성화되지 않습니다.

### 조치

VM `.env`에 중복 없이 `APP_ENV=production`을 설정합니다. 배포 스크립트가 이 값, DB URL, 허용 Origin, JWT 길이와 테스트 우회 설정 부재를 새 바이너리 교체 전에 확인합니다.

```bash
sed -i '/^APP_ENV=/d' /home/opc/travel-api/.env
printf 'APP_ENV=production\n' >> /home/opc/travel-api/.env
chmod 600 /home/opc/travel-api/.env
```

## 공통 진단 순서

1. 사용자 화면의 재현 경로와 시각을 기록합니다.
2. 브라우저 Network와 Console에서 실패 요청과 상태 코드를 확인합니다.
3. API `healthz`, systemd 상태와 비밀 값이 제거된 로그를 확인합니다.
4. 짐작으로 수정하지 않고 실패 테스트를 추가합니다.
5. 수정 뒤 같은 모바일 흐름과 실패 대체 화면을 확인합니다.
