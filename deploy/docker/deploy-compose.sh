#!/bin/sh
# XYZW Web Helper - Docker Compose 部署脚本（含认证后端）
#
# 用法: sh deploy/docker/deploy-compose.sh
#
# 前提: 本地已执行 sh docker/install.sh build（前端镜像已构建）
#       本地已登录 ACR 公网: docker login crpi-ijyip3mvrstcfvh2.cn-heyuan.personal.cr.aliyuncs.com

set -e

# 加载公共配置
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$SCRIPT_DIR/../deploy.conf"

REMOTE_DIR="/root/xyzw"

FRONTEND_IMAGE="$ACR_REGISTRY/$ACR_NAMESPACE/xyzw_web_helper:latest"
BACKEND_IMAGE="$ACR_REGISTRY/$ACR_NAMESPACE/xyzw_auth_backend:latest"

echo "[1/4] Building and pushing frontend image..."
sh deploy/docker/deploy.sh push

echo "[2/4] Building and pushing backend image..."
docker build -t xyzw_auth_backend:latest ./backend
docker tag xyzw_auth_backend:latest "$BACKEND_IMAGE"
docker push "$BACKEND_IMAGE"

echo "[3/4] Uploading docker-compose.yml to server..."
ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "mkdir -p $REMOTE_DIR"
scp -P "$REMOTE_PORT" docker-compose.yml "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/"

echo "[4/4] Deploying on server with Docker Compose..."
ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
  ACR_REGISTRY_VPC="$ACR_REGISTRY_VPC" \
  ACR_USERNAME="$ACR_USERNAME" \
  REMOTE_DIR="$REMOTE_DIR" \
  'sh -s' <<'ENDSSH'
set -e

# 安装 docker-compose（如未安装）
# 登录 VPC ACR（服务器端）
if [ -n "$ACR_PASSWORD" ]; then
  echo "$ACR_PASSWORD" | docker login "$ACR_REGISTRY_VPC" -u "$ACR_USERNAME" --password-stdin
fi

cd "$REMOTE_DIR"

# 停止旧的单容器部署（如有）
docker rm -f my_xyzw_web_helper 2>/dev/null || true

# 拉取最新镜像并启动（使用内置的 docker compose 插件）
ACR_REGISTRY_VPC="$ACR_REGISTRY_VPC" docker compose pull
ACR_REGISTRY_VPC="$ACR_REGISTRY_VPC" docker compose up -d

sleep 2
if docker ps | grep -q xyzw-frontend; then
  echo "  Deployment successful!"
  echo "  Visit http://$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"
else
  echo "  ERROR: Container failed to start."
  docker compose logs --tail=20
  exit 1
fi
ENDSSH

echo ""
echo "Docker Compose deployment complete!"
