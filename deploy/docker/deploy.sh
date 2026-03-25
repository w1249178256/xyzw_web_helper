#!/bin/sh
# XYZW Web Helper - Docker 部署脚本（通过阿里云 ACR 中转）
#
# 用法:
#   sh deploy/docker/deploy.sh              # push + 服务器 pull + 启动
#   sh deploy/docker/deploy.sh push         # 仅推送镜像到 ACR
#   sh deploy/docker/deploy.sh remote       # 仅在服务器上拉取并启动
#
# 前提: 本地已执行过 sh docker/install.sh build（镜像已构建）
#       本地已登录 ACR: docker login crpi-ijyip3mvrstcfvh2.cn-heyuan.personal.cr.aliyuncs.com

set -e

# 加载公共配置
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$SCRIPT_DIR/../deploy.conf"

HOST_PORT="80"
CONTAINER_NAME="my_xyzw_web_helper"
APP_IMAGE="xyzw_web_helper:latest"

# ACR 镜像路径
ACR_IMAGE="$ACR_REGISTRY/$ACR_NAMESPACE/xyzw_web_helper:latest"
ACR_IMAGE_VPC="$ACR_REGISTRY_VPC/$ACR_NAMESPACE/xyzw_web_helper:latest"

# ---- 步骤函数 ----

do_push() {
  echo "[1/2] Pushing image to ACR ..."
  if ! docker image inspect "$APP_IMAGE" >/dev/null 2>&1; then
    echo "  ERROR: Image '$APP_IMAGE' not found."
    echo "         Run 'sh docker/install.sh build' first."
    exit 1
  fi
  docker tag "$APP_IMAGE" "$ACR_IMAGE"
  docker push "$ACR_IMAGE"
  echo "      Pushed -> $ACR_IMAGE"
}

do_remote() {
  echo "[2/2] Deploying on remote server ..."
  ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
    ACR_REGISTRY="$ACR_REGISTRY_VPC" \
    ACR_IMAGE="$ACR_IMAGE_VPC" \
    ACR_USERNAME="$ACR_USERNAME" \
    CONTAINER_NAME="$CONTAINER_NAME" \
    HOST_PORT="$HOST_PORT" \
    'sh -s' <<'ENDSSH'
set -e

# 安装 Docker（如未安装）
if ! command -v docker >/dev/null 2>&1; then
  echo "  Installing Docker..."
  apt-get update -qq
  apt-get install -y ca-certificates curl
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
    https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y docker-ce docker-ce-cli containerd.io
  systemctl enable --now docker
fi

# 登录 ACR（服务器端需提前配置密码，或使用环境变量 ACR_PASSWORD）
if [ -n "$ACR_PASSWORD" ]; then
  echo "$ACR_PASSWORD" | docker login "$ACR_REGISTRY" -u "$ACR_USERNAME" --password-stdin
fi

# 拉取镜像
echo "  Pulling image: $ACR_IMAGE ..."
docker pull "$ACR_IMAGE"

# 停止旧容器（包括其他占用同一端口的容器）
echo "  Stopping old container (if any)..."
docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
CONFLICT=$(docker ps -q --filter "publish=$HOST_PORT")
if [ -n "$CONFLICT" ]; then
  echo "  Stopping container occupying port $HOST_PORT: $CONFLICT"
  docker rm -f $CONFLICT
fi

# 启动容器
echo "  Starting container on port $HOST_PORT..."
docker run -d \
  -p "$HOST_PORT:80" \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  "$ACR_IMAGE"

# 验证
sleep 1
if docker ps | grep -q "$CONTAINER_NAME"; then
  echo "  Container is running."
  echo "  Visit http://$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}'):$HOST_PORT"
else
  echo "  ERROR: Container failed to start."
  docker logs "$CONTAINER_NAME"
  exit 1
fi
ENDSSH
}

# ---- 入口 ----

case "${1:-all}" in
  push)
    do_push
    ;;
  remote)
    do_remote
    ;;
  all)
    do_push
    do_remote
    echo ""
    echo "Docker deployment complete!"
    ;;
  *)
    echo "Usage: sh deploy/docker/deploy.sh [push|remote|all]"
    ;;
esac
