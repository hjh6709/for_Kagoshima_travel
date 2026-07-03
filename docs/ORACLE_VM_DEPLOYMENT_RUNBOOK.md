# Oracle VM API 배포 런북

이 문서는 여행 공유 앱의 Go API와 PostgreSQL을 Oracle Cloud Infrastructure Always Free VM에 배포하기 위한 운영 기준과 절차를 정리합니다.

프론트엔드는 기존처럼 Vercel에 두고, API와 DB만 Oracle VM에서 운영합니다.

## 목표 구조

```text
사용자 브라우저
  -> https://kagoshima.hjh-dev.site
  -> Vercel 정적 PWA
  -> https://api.hjh-dev.site
  -> Cloudflare DNS
  -> Oracle VM 443
  -> Caddy reverse proxy
  -> Go API localhost:8080
  -> PostgreSQL localhost:5432
```

## 운영 책임 구분

Oracle VM은 Render/Cloud Run 같은 PaaS보다 자유도가 높지만, 서버 운영 책임도 직접 가져갑니다.

| 항목 | Oracle이 제공 | 우리가 관리 |
| --- | --- | --- |
| 물리 서버/클라우드 인프라 | 예 | 아니오 |
| VM 생성/공인 IP | 예 | 설정 필요 |
| Ubuntu 패키지 보안 업데이트 | 아니오 | 예 |
| 방화벽 정책 | 기능 제공 | 정책 설정 필요 |
| Go API 프로세스 | 아니오 | systemd로 관리 |
| HTTPS | 아니오 | Caddy로 관리 |
| PostgreSQL 설치/백업 | 아니오 | 예 |
| 앱 인증/인가/CORS | 아니오 | 예 |
| 장애 로그 확인/복구 | 아니오 | 예 |

## 도메인과 포트

운영 도메인:

```text
Frontend: https://kagoshima.hjh-dev.site
API:      https://api.hjh-dev.site
```

외부에 열 포트:

```text
22   SSH
80   HTTP -> HTTPS 인증서 발급/리다이렉트
443  HTTPS API
```

외부에 열지 않을 포트:

```text
5432 PostgreSQL
8080 Go API
```

Go API와 PostgreSQL은 VM 내부에서만 접근합니다. 브라우저는 항상 Caddy가 제공하는 HTTPS API 도메인으로 접근합니다.

## Oracle Cloud 준비

Oracle Cloud Console에서 다음을 준비합니다.

1. Always Free 가능한 리전을 선택합니다.
2. Compute VM을 생성합니다.
   - OS: Ubuntu LTS
   - Shape: Always Free 범위의 Ampere A1 또는 AMD VM
   - 공인 IPv4: 필요
   - SSH key: 로컬에서 관리하는 공개키 등록
3. VCN/Subnet Security List 또는 Network Security Group에서 ingress rule을 설정합니다.
   - TCP 22
   - TCP 80
   - TCP 443
4. 서버에 SSH 접속합니다.

```bash
ssh ubuntu@<ORACLE_VM_PUBLIC_IP>
```

서버 IP, SSH key, Oracle 계정 정보는 레포에 커밋하지 않습니다.

## 서버 초기 설정

Ubuntu 기준으로 패키지를 갱신합니다.

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl git ufw postgresql postgresql-contrib ca-certificates debian-keyring debian-archive-keyring apt-transport-https
```

방화벽을 설정합니다.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status numbered
```

Caddy를 설치합니다.

```bash
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

Go 런타임은 서버에 설치하지 않는 방향을 기본으로 합니다. 로컬 또는 GitHub Actions에서 Linux 바이너리를 빌드해 VM에 업로드하면 서버에는 Go toolchain이 없어도 됩니다.

## PostgreSQL 설정

운영 DB와 사용자를 생성합니다.

```bash
sudo -u postgres psql
```

```sql
CREATE USER travel_app WITH PASSWORD '<STRONG_DB_PASSWORD>';
CREATE DATABASE travel_app OWNER travel_app;
\q
```

DB는 외부에 공개하지 않고 `localhost:5432`로만 사용합니다.

스키마 적용:

```bash
psql "postgres://travel_app:<STRONG_DB_PASSWORD>@localhost:5432/travel_app?sslmode=disable" < apps/api/schema.sql
```

실제 비밀번호는 쉘 히스토리에 남지 않도록 `.env` 파일이나 일회성 안전 입력 방식을 사용합니다.

## API 환경변수

서버에는 `/etc/travel-api/travel-api.env` 형태로 환경변수를 둡니다.

```env
APP_ENV=production
PORT=8080
DATABASE_URL=postgres://travel_app:<STRONG_DB_PASSWORD>@localhost:5432/travel_app?sslmode=disable
JWT_SECRET=<LONG_RANDOM_SECRET>
ALLOWED_ORIGINS=https://kagoshima.hjh-dev.site
```

파일 권한:

```bash
sudo mkdir -p /etc/travel-api
sudo chown root:root /etc/travel-api
sudo chmod 755 /etc/travel-api
sudo chmod 600 /etc/travel-api/travel-api.env
```

`JWT_SECRET`, DB 비밀번호, 서버 IP, SSH key는 GitHub Secrets 또는 서버 전용 파일로만 관리합니다.

## Go API 배포 위치

권장 경로:

```text
/opt/travel-api/
  app
```

초기 수동 배포 예시입니다.

로컬 Mac 또는 GitHub Actions에서 Linux 바이너리를 빌드합니다.

Oracle VM을 Arm-based Ampere A1로 만들었다면:

```bash
cd apps/api
GOOS=linux GOARCH=arm64 go build -o /tmp/travel-api ./cmd/api
```

Oracle VM을 AMD x86_64 shape로 만들었다면:

```bash
cd apps/api
GOOS=linux GOARCH=amd64 go build -o /tmp/travel-api ./cmd/api
```

바이너리를 서버에 업로드합니다.

```bash
scp /tmp/travel-api ubuntu@<ORACLE_VM_PUBLIC_IP>:/tmp/travel-api
```

서버에서 배포 경로로 이동합니다.

```bash
sudo mkdir -p /opt/travel-api
sudo chown ubuntu:ubuntu /opt/travel-api
sudo mv /tmp/travel-api /opt/travel-api/app
sudo chmod 755 /opt/travel-api/app
```

## systemd 서비스

Go API는 systemd로 관리합니다.

```ini
[Unit]
Description=Travel Share API
After=network.target postgresql.service

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/opt/travel-api
EnvironmentFile=/etc/travel-api/travel-api.env
ExecStart=/opt/travel-api/app
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

서비스 파일 위치:

```text
/etc/systemd/system/travel-api.service
```

적용:

```bash
sudo systemctl daemon-reload
sudo systemctl enable travel-api
sudo systemctl start travel-api
sudo systemctl status travel-api
```

로그 확인:

```bash
journalctl -u travel-api -f
```

## Caddy reverse proxy

Caddy는 `api.hjh-dev.site`를 `localhost:8080`으로 프록시하고 HTTPS 인증서를 자동 관리합니다.

설치 후 Caddyfile 예시:

```text
api.hjh-dev.site {
	reverse_proxy 127.0.0.1:8080
}
```

파일 위치:

```text
/etc/caddy/Caddyfile
```

적용:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
sudo systemctl status caddy
```

Caddy가 자동 HTTPS를 발급하려면 다음 조건이 필요합니다.

- `api.hjh-dev.site`의 DNS A 레코드가 Oracle VM 공인 IP를 가리킴
- Oracle Cloud ingress rule에서 80/443 열림
- 서버 내부 방화벽에서 80/443 열림
- Caddy가 80/443에 bind 가능

## Cloudflare DNS

Cloudflare에서 DNS 레코드를 추가합니다.

```text
Type: A
Name: api
Content: <ORACLE_VM_PUBLIC_IP>
Proxy status: DNS only 또는 Proxied
TTL: Auto
```

초기 인증서 발급 문제를 줄이려면 먼저 `DNS only`로 연결한 뒤, HTTPS 동작 확인 후 Cloudflare proxy 사용 여부를 결정합니다.

## Vercel 프론트 환경변수

Vercel Web 프로젝트에 다음 환경변수를 설정합니다.

```env
VITE_API_BASE_URL=https://api.hjh-dev.site
```

변경 후 프론트 재배포가 필요합니다.

## 배포 후 점검

API 서버 내부 점검:

```bash
curl http://localhost:8080/healthz
```

외부 HTTPS 점검:

```bash
curl https://api.hjh-dev.site/healthz
```

브라우저 CORS 점검:

1. `https://kagoshima.hjh-dev.site/owner` 접속
2. 회원가입 또는 로그인 시도
3. Network 탭에서 API 요청이 `https://api.hjh-dev.site`로 나가는지 확인
4. CORS 에러가 있으면 `ALLOWED_ORIGINS`와 API 재시작 여부 확인

## 배포 바이너리 빌드 검증

`.github/workflows/api-release-build.yml`은 Oracle VM 배포 전에 Go API가 Linux 바이너리로 빌드 가능한지 확인합니다.

검증 대상:

```text
linux/amd64
linux/arm64
```

Oracle VM을 AMD x86_64 shape로 만들면 `linux/amd64` 산출물을 사용하고, Ampere A1 Arm shape로 만들면 `linux/arm64` 산출물을 사용합니다.

이 workflow는 빌드 산출물을 artifact로 업로드하지만, 서버에 SSH 접속하거나 서비스를 재시작하지 않습니다. 실제 서버 배포는 GitHub Secrets와 Oracle VM 준비가 끝난 뒤 별도 workflow로 추가합니다.

## 백업 기준

초기 백업은 `pg_dump` 기반으로 시작합니다.

```bash
mkdir -p ~/backups/travel-api
pg_dump "postgres://travel_app:<STRONG_DB_PASSWORD>@localhost:5432/travel_app?sslmode=disable" \
  > ~/backups/travel-api/travel_app_$(date +%Y%m%d_%H%M%S).sql
```

최소 운영 기준:

- 하루 1회 백업
- 7~14일 보관
- 같은 VM에만 두지 않고 외부 위치에도 복사
- 복구 테스트 절차를 별도 문서화

백업 자동화는 다음 PR에서 스크립트와 cron으로 분리합니다.

## 장애 대응 기본 명령

API 상태:

```bash
systemctl status travel-api
journalctl -u travel-api -n 100 --no-pager
```

API 재시작:

```bash
sudo systemctl restart travel-api
```

Caddy 상태:

```bash
systemctl status caddy
journalctl -u caddy -n 100 --no-pager
```

DB 상태:

```bash
systemctl status postgresql
sudo -u postgres psql -c '\l'
```

디스크/메모리:

```bash
df -h
free -m
```

## 이후 자동화 PR 계획

1. `chore(infra): Oracle VM 서버 설정 스크립트 추가`
   - 패키지 설치, 방화벽, 디렉터리 생성, Caddy 설치 절차 스크립트화

2. `chore(infra): API systemd 배포 설정 추가`
   - systemd unit, env 예시, 수동 배포 스크립트 추가

3. `chore(infra): PostgreSQL 백업 스크립트 추가`
   - `pg_dump`, 보관 기간 정리, cron 등록 절차 추가

4. `ci(deploy): API SSH 배포 워크플로우 추가`
   - main merge 후 GitHub Actions에서 Linux binary build
   - SSH/SCP로 VM에 업로드
   - systemd restart

5. `docs(deploy): 운영 점검 체크리스트 추가`
   - 배포 전/후 체크리스트, 장애 시 확인 순서, 복구 절차 정리

## 참고 문서

- [Oracle Cloud Infrastructure Free Tier](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier.htm)
- [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/)
- [Caddy Automatic HTTPS](https://caddyserver.com/docs/automatic-https)
- [Caddy reverse_proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy)
