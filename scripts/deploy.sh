#!/usr/bin/env bash
set -euo pipefail

local_env_value() {
    [ -f .env ] || return 0
    sed -n "s/^$1=//p" .env | tail -n 1
}

# .env 전체를 shell로 실행하지 않고 배포 연결에 필요한 키만 읽는다.
VM_IP=${OCI_VM_IP:-$(local_env_value OCI_VM_IP)}
VM_USER=${OCI_VM_USER:-$(local_env_value OCI_VM_USER)}
VM_USER=${VM_USER:-opc}
SSH_KEY=${OCI_SSH_KEY:-$(local_env_value OCI_SSH_KEY)}
SSH_KEY=${SSH_KEY:-/Users/hanjeonghyun/.ssh/oracle_travel_api}
TARGET_DIR="/home/opc/travel-api"
BUILD_ARTIFACT="${TMPDIR:-/tmp}/travel-api.next"

if [ -z "$VM_IP" ]; then
    echo "🚨 에러: OCI_VM_IP 환경변수가 지정되지 않았습니다!"
    exit 1
fi

echo "=== 1. Go API 빌드 시작 (target: Linux ARM64) ==="
cd apps/api
CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -trimpath -o "$BUILD_ARTIFACT" cmd/api/main.go
cd ../..

echo "=== 2. VM 디렉토리 준비 및 파일 전송 ==="
ssh -i "$SSH_KEY" "$VM_USER@$VM_IP" "mkdir -p $TARGET_DIR"
scp -i "$SSH_KEY" "$BUILD_ARTIFACT" "$VM_USER@$VM_IP:$TARGET_DIR/travel-api.next"
scp -i "$SSH_KEY" scripts/travel-api.service "$VM_USER@$VM_IP:$TARGET_DIR/travel-api.service"
scp -i "$SSH_KEY" scripts/deploy-api-on-vm.sh "$VM_USER@$VM_IP:$TARGET_DIR/deploy-api-on-vm.sh"

echo "=== 3. 운영 설정 검증, 재시작, health check 및 rollback ==="
ssh -i "$SSH_KEY" "$VM_USER@$VM_IP" "chmod 750 $TARGET_DIR/deploy-api-on-vm.sh && $TARGET_DIR/deploy-api-on-vm.sh $TARGET_DIR"

echo "=== 배포 완료! (travel-api 가 가동되었습니다) ==="
