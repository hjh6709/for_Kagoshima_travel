#!/usr/bin/env bash
set -euo pipefail

# 로컬 .env 파일 환경변수 로드
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

VM_IP=${OCI_VM_IP:-""}
VM_USER="opc"
SSH_KEY=${OCI_SSH_KEY:-"/Users/hanjeonghyun/.ssh/oracle_travel_api"}
TARGET_DIR="/home/opc/travel-api"

if [ -z "$VM_IP" ]; then
    echo "🚨 에러: 로컬 .env 파일에 OCI_VM_IP 환경변수가 지정되지 않았습니다!"
    exit 1
fi

echo "=== 1. Go API 빌드 시작 (target: Linux ARM64) ==="
cd apps/api
GOOS=linux GOARCH=arm64 go build -o travel-api cmd/api/main.go
cd ../..

echo "=== 2. VM 디렉토리 준비 및 파일 전송 ==="
ssh -i "$SSH_KEY" "$VM_USER@$VM_IP" "mkdir -p $TARGET_DIR && [ ! -f $TARGET_DIR/travel-api ] || mv $TARGET_DIR/travel-api $TARGET_DIR/travel-api.old"
scp -i "$SSH_KEY" apps/api/travel-api "$VM_USER@$VM_IP:$TARGET_DIR/travel-api"
scp -i "$SSH_KEY" scripts/travel-api.service "$VM_USER@$VM_IP:$TARGET_DIR/travel-api.service"

ssh -i "$SSH_KEY" "$VM_USER@$VM_IP" "[ -f $TARGET_DIR/.env ] || echo -e 'PORT=8080\nJWT_SECRET=super-secret-key-change-me' > $TARGET_DIR/.env"

echo "=== 3. Systemd 서비스 등록 및 재시작 ==="
ssh -i "$SSH_KEY" "$VM_USER@$VM_IP" "
    sudo cp $TARGET_DIR/travel-api.service /etc/systemd/system/travel-api.service &&
    sudo systemctl daemon-reload &&
    sudo systemctl enable travel-api &&
    sudo systemctl restart travel-api &&
    rm -f $TARGET_DIR/travel-api.old
"

echo "=== 배포 완료! (travel-api 가 가동되었습니다) ==="
