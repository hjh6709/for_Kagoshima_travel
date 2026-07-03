# Oracle VM Infra Scripts

Oracle Cloud Always Free VM에서 여행 공유 앱 API를 운영하기 위한 인프라 스크립트입니다.

현재 기준 권장 서버 이미지는 Oracle Linux 9입니다. 스크립트는 Oracle Linux/RHEL 계열과 Ubuntu/Debian 계열을 모두 감지해서 처리합니다.

## 서버 초기 설정

Oracle Linux VM에 SSH 접속한 뒤 레포를 내려받고 아래 명령을 실행합니다.

```bash
ssh -i ~/.ssh/oracle_travel_api opc@<ORACLE_VM_PUBLIC_IP>
```

서버에서:

```bash
sudo bash infra/oracle/setup-server.sh
```

스크립트가 수행하는 작업:

- OS package update/upgrade
- 기본 패키지 설치
- PostgreSQL 설치
- Caddy 설치
- Oracle Linux에서는 `firewalld`로 `ssh`, `http`, `https` 허용
- Ubuntu에서는 UFW에서 `22`, `80`, `443` 허용
- API 실행용 시스템 유저 `travel-api` 생성
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
  TRAVEL_API_RUN_USER=travel-api \
  bash infra/oracle/setup-server.sh
```

기본값:

```text
TRAVEL_API_APP_DIR=/opt/travel-api
TRAVEL_API_ENV_DIR=/etc/travel-api
TRAVEL_API_RUN_USER=travel-api
```

## 검증

스크립트 문법 검증:

```bash
bash -n infra/oracle/setup-server.sh
bash -n infra/oracle/deploy-api.sh
```

서버에서 실행 후 확인:

```bash
sudo firewall-cmd --list-all
systemctl status postgresql
systemctl status caddy
id travel-api
ls -ld /opt/travel-api /etc/travel-api
```

Ubuntu VM을 사용하는 경우 방화벽 확인 명령은 `sudo ufw status numbered`를 사용합니다.

## systemd 서비스 설정

서비스 파일을 서버에 복사합니다.

```bash
sudo cp infra/oracle/systemd/travel-api.service /etc/systemd/system/travel-api.service
sudo systemctl daemon-reload
sudo systemctl enable travel-api
```

운영 환경변수 파일을 작성합니다.

```bash
sudo mkdir -p /etc/travel-api
sudo cp infra/oracle/env/travel-api.env.example /etc/travel-api/travel-api.env
sudo chmod 600 /etc/travel-api/travel-api.env
sudo nano /etc/travel-api/travel-api.env
```

`travel-api.env`에는 실제 DB 비밀번호와 JWT secret을 입력합니다. 실제 값은 레포에 커밋하지 않습니다.

## API 바이너리 배포

로컬 또는 GitHub Actions에서 VM 아키텍처에 맞는 Linux binary를 만든 뒤 서버에 업로드합니다.

```bash
scp -i ~/.ssh/oracle_travel_api /tmp/travel-api-linux-arm64 opc@<ORACLE_VM_PUBLIC_IP>:/tmp/travel-api
```

서버에서 배포 스크립트를 실행합니다.

```bash
sudo bash infra/oracle/deploy-api.sh /tmp/travel-api
```

## PostgreSQL 백업

백업 스크립트는 `DATABASE_URL` 환경변수를 읽어 `pg_dump`를 실행합니다.

```bash
DATABASE_URL='postgres://travel_app:<STRONG_DB_PASSWORD>@localhost:5432/travel_app?sslmode=disable' \
  bash infra/oracle/scripts/backup-postgres.sh
```

기본값:

```text
TRAVEL_API_BACKUP_DIR=$HOME/backups/travel-api
TRAVEL_API_BACKUP_RETENTION_DAYS=14
```

cron 예시는 `infra/oracle/cron/travel-api-backup.cron`에 있습니다. 실제 서버 경로를 수정한 뒤 root crontab으로 등록합니다. DB 접속 정보는 `/etc/travel-api/travel-api.env`에서 읽습니다.

```bash
sudo crontab infra/oracle/cron/travel-api-backup.cron
```

cron 예시는 기본 백업 경로를 `/var/backups/travel-api`로 둡니다.

실제 백업 파일은 같은 VM에만 보관하지 말고, 주기적으로 로컬 Mac 또는 Object Storage 같은 외부 위치로 복사해야 합니다.
