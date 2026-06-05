# 배포 가이드

1차 MVP는 비용을 줄이기 위해 백엔드 없이 Vercel Hobby 무료 플랜에 정적 PWA로 배포한다.

## 1. 현재 배포 방식

```text
React + Vite + PWA
  -> npm run build
  -> dist/
  -> Vercel Hobby
```

Go 백엔드와 PostgreSQL은 2차 확장 준비물로 유지하되, 지금은 운영 배포하지 않는다.

## 2. 배포 전 확인

```bash
npm install
npm run build
```

빌드가 성공하면 `dist/`가 생성된다. `dist/`는 빌드 결과물이므로 git에는 커밋하지 않는다.

## 3. Vercel 설정

Vercel에서 GitHub 저장소를 import한 뒤 아래 설정을 사용한다.

| 항목 | 값 |
| --- | --- |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

현재 1차 MVP에서는 API 서버를 사용하지 않으므로 Vercel 환경변수는 필수는 아니다.

2차 확장으로 Go API를 붙이면 아래 환경변수를 Vercel에 추가한다.

```text
VITE_API_BASE_URL=https://api.example.com
```

`VITE_`로 시작하는 값은 브라우저에 노출될 수 있으므로 비밀값을 넣지 않는다.

## 4. 민감정보 주의

Vercel Hobby로 배포된 앱은 URL을 아는 사람이 접근할 수 있는 공개 웹앱으로 본다.

앱 데이터에 넣기 전 다시 확인할 정보:
- 예약번호
- 여권 정보
- 여행자보험 상세 정보
- 가족 전화번호
- 숙소 예약자명

1차 MVP에서는 민감정보를 최소화하고, 필요한 경우 부모님께 별도로 전달한다.

## 5. 부모님 폰 설치

안드로이드 Chrome:
1. 배포 URL 접속
2. 브라우저 메뉴 열기
3. 홈 화면에 추가 선택
4. 앱 아이콘으로 실행 확인

iPhone Safari:
1. 배포 URL 접속
2. 공유 버튼 선택
3. 홈 화면에 추가 선택
4. 앱 아이콘으로 실행 확인

## 6. 커스텀 도메인 연결

보유 도메인 `hjh-dev.site`를 사용할 수 있다. 1차 여행 앱은 메인 도메인보다 서브도메인으로 분리한다.

추천 주소:

```text
kagoshima.hjh-dev.site
```

Vercel 공식 문서 기준으로 서브도메인은 보통 CNAME 레코드로 연결한다.

Vercel에서:
1. Project Settings로 이동
2. Domains 메뉴 선택
3. `kagoshima.hjh-dev.site` 추가
4. Vercel이 안내하는 DNS 레코드 값을 확인

Gabia DNS 관리툴에서:

```text
Type: CNAME
Name: kagoshima
Value: Vercel이 안내하는 CNAME 값
TTL: 기본값 또는 300초
```

Vercel 문서의 일반 예시는 `cname.vercel-dns-0.com` 또는 프로젝트별 CNAME 값을 사용한다. 실제 연결 시에는 Vercel 화면에 표시되는 값을 우선한다.

참고:
- Vercel 공식 문서: [Setting up a custom domain](https://vercel.com/docs/domains/set-up-custom-domain)
- Vercel 공식 문서: [Add a custom domain](https://vercel.com/docs/concepts/projects/domains/add-a-domain)

주의:
- DNS 전파는 수분에서 길게는 24-48시간 걸릴 수 있다.
- 설정 직후 안 된다고 여러 번 바꾸기보다 Vercel의 domain verification 상태를 확인한다.
- HTTPS 인증서는 Vercel이 자동 발급한다.
- 앱 URL이 예뻐져도 공개 웹앱이라는 점은 변하지 않으므로 민감정보는 계속 최소화한다.

## 7. 2차 확장 배포

Go 백엔드를 붙이는 시점에는 아래 구조로 확장한다.

```text
Vercel PWA
  -> Go API
  -> PostgreSQL
```

후보:
- Go API: Fly.io Tokyo region
- DB: Fly Postgres 또는 저비용 PostgreSQL
