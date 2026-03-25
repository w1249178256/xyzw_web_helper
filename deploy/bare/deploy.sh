#!/bin/sh
# XYZW Web Helper - 裸机部署脚本（无 Docker）
#
# 用法:
#   sh deploy/bare/deploy.sh              # 构建 + 打包 + 上传 + 部署
#   sh deploy/bare/deploy.sh build        # 仅构建（生成 dist/）
#   sh deploy/bare/deploy.sh pack         # 仅打包（生成 deploy/bare/xyzw_deploy.tar.gz）
#   sh deploy/bare/deploy.sh upload       # 仅上传（scp 到服务器）
#   sh deploy/bare/deploy.sh remote       # 仅在服务器上执行部署
#
# 依赖: pnpm, ssh, scp

set -e

# 加载公共配置
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$SCRIPT_DIR/../deploy.conf"

REMOTE_DIR="/var/www/xyzw"
NGINX_CONF_DEST="/etc/nginx/sites-available/xyzw"
PACK_NAME="xyzw_deploy.tar.gz"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR/../.."
PACK_PATH="$SCRIPT_DIR/$PACK_NAME"

# ---- 步骤函数 ----

do_build() {
  echo "[1/4] Building..."
  cd "$PROJECT_DIR"
  pnpm run build
  echo "      Build done -> dist/"
}

do_pack() {
  echo "[2/4] Packing..."
  cd "$PROJECT_DIR"
  tar czf "$PACK_PATH" dist/ deploy/bare/nginx.conf
  echo "      Packed -> deploy/bare/$PACK_NAME"
}

do_upload() {
  echo "[3/4] Uploading to $REMOTE_USER@$REMOTE_HOST..."
  scp -P "$REMOTE_PORT" "$PACK_PATH" "$REMOTE_USER@$REMOTE_HOST:/tmp/$PACK_NAME"
  echo "      Upload done."
}

do_remote() {
  echo "[4/4] Deploying on remote server..."
  ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "$(cat <<'ENDSSH'
set -e

PACK_NAME="xyzw_deploy.tar.gz"
REMOTE_DIR="/var/www/xyzw"
NGINX_CONF="/etc/nginx/sites-available/xyzw"

# 安装 nginx（如未安装）
if ! command -v nginx >/dev/null 2>&1; then
  echo "  Installing nginx..."
  if command -v apt-get >/dev/null 2>&1; then
    apt-get install -y nginx
  elif command -v yum >/dev/null 2>&1; then
    yum install -y nginx
  else
    echo "  ERROR: Cannot install nginx. Please install it manually."
    exit 1
  fi
fi

# 解压部署包
echo "  Extracting..."
mkdir -p /tmp/xyzw_deploy
tar xzf /tmp/$PACK_NAME -C /tmp/xyzw_deploy

# 部署静态文件
echo "  Deploying static files to $REMOTE_DIR..."
mkdir -p "$REMOTE_DIR"
cp -r /tmp/xyzw_deploy/dist/. "$REMOTE_DIR/"

# 部署 nginx 配置
echo "  Configuring nginx..."
mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
cp /tmp/xyzw_deploy/deploy/bare/nginx.conf "$NGINX_CONF"
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/xyzw

# 禁用 nginx 默认站点（避免冲突）
rm -f /etc/nginx/sites-enabled/default

# 确认主配置包含 sites-enabled
if ! grep -q "sites-enabled" /etc/nginx/nginx.conf 2>/dev/null; then
  echo "  WARNING: /etc/nginx/nginx.conf may not include sites-enabled."
  echo "           Please add: include /etc/nginx/sites-enabled/*;"
fi

# 重启 nginx
echo "  Restarting nginx..."
nginx -t && systemctl restart nginx

# 清理临时文件
rm -rf /tmp/xyzw_deploy /tmp/$PACK_NAME

echo "  Done! Visit http://$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"
ENDSSH
)"
}

# ---- 入口 ----

case "${1:-all}" in
  build)
    do_build
    ;;
  pack)
    do_pack
    ;;
  upload)
    do_upload
    ;;
  remote)
    do_remote
    ;;
  all)
    do_build
    do_pack
    do_upload
    do_remote
    echo ""
    echo "Deployment complete!"
    ;;
  *)
    echo "Usage: sh deploy/bare/deploy.sh [build|pack|upload|remote|all]"
    ;;
esac
