# Oracle VM Infra Scripts

Oracle Cloud Always Free VM에서 여행 공유 앱 API를 운영하기 위한 인프라 스크립트입니다.

## 서버 초기 설정

Ubuntu VM에 SSH 접속한 뒤 레포를 내려받고 아래 명령을 실행합니다.

```bash
sudo bash infra/oracle/setup-server.sh
```

스크립트가 수행하는 작업:

- Ubuntu package update/upgrade
- 기본 패키지 설치
- PostgreSQL 설치
- Caddy 설치
- UFW에서 `22`, `80`, `443` 허용
- `/opt/travel-api` 생성
- `/etc/travel-api` 생성

스크립트가 수행하지 않는 작업:

- Oracle Cloud VM 생성
- Cloudflare DNS 설정
- DB 비밀번호 생성
- PostgreSQL user/database 생성
- `/etc/travel-api/travel-api.env` 작성
- API binary 배포
- systemd service 등록

## 옵션

필요하면 환경변수로 경로와 실행 유저를 바꿀 수 있습니다.

```bash
sudo TRAVEL_API_APP_DIR=/opt/travel-api \
  TRAVEL_API_ENV_DIR=/etc/travel-api \
  TRAVEL_API_RUN_USER=ubuntu \
  bash infra/oracle/setup-server.sh
```

기본값:

```text
TRAVEL_API_APP_DIR=/opt/travel-api
TRAVEL_API_ENV_DIR=/etc/travel-api
TRAVEL_API_RUN_USER=${SUDO_USER:-ubuntu}
```

## 검증

스크립트 문법 검증:

```bash
bash -n infra/oracle/setup-server.sh
```

서버에서 실행 후 확인:

```bash
ufw status numbered
systemctl status postgresql
systemctl status caddy
ls -ld /opt/travel-api /etc/travel-api
```
