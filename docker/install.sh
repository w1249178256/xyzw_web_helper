#!/bin/sh
# XYZW Web Helper - Docker Deploy Script
#
# 推荐工作流:
#   sh docker/install.sh deps      # 首次或前端依赖变更时构建前端依赖镜像（只需一次）
#   sh docker/install.sh build     # 每次发布时构建前端和后端镜像
#   sh docker/install.sh up        # 启动服务
#
# 离线分发:
#   sh docker/install.sh save      # 导出所有镜像
#   sh docker/install.sh load      # 目标服务器导入并启动

set -e

DEPS_IMAGE="xyzw-deps:latest"
FRONTEND_IMAGE="xyzw_web_helper:latest"
BACKEND_IMAGE="xyzw-backend:latest"
DEPS_TAR="xyzw_deps.docker"
FRONTEND_TAR="xyzw_web_helper.docker"
BACKEND_TAR="xyzw_backend.docker"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR/.."
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"

# 代理地址（与参照 Dockerfile 保持一致）
PROXY="http://10.129.59.114:10889"

_proxy_arg() {
  if [ "$1" = "--proxy" ]; then
    echo "--build-arg HTTP_PROXY=${PROXY} --build-arg HTTPS_PROXY=${PROXY}"
  fi
}

case "$1" in
  deps)
    # 构建前端依赖预装基础镜像（含全部前端 node_modules）
    PROXY_ARG="$(_proxy_arg "$2")"
    [ -n "$PROXY_ARG" ] && echo "  使用代理: ${PROXY}"
    echo "[deps] Building frontend dependency image: $DEPS_IMAGE ..."
    # shellcheck disable=SC2086
    docker build $PROXY_ARG \
      -f "$SCRIPT_DIR/dockerfile.deps" \
      -t "$DEPS_IMAGE" \
      "$PROJECT_DIR"
    echo "[deps] Done. Run 'sh docker/install.sh build' to build app images."
    ;;

  build)
    # 检查前端依赖镜像是否存在
    if ! docker image inspect "$DEPS_IMAGE" >/dev/null 2>&1; then
      echo "[warn] Dependency image '$DEPS_IMAGE' not found."
      echo "       Run 'sh docker/install.sh deps' first."
      exit 1
    fi

    PROXY_ARG="$(_proxy_arg "$2")"
    [ -n "$PROXY_ARG" ] && echo "  使用代理: ${PROXY}"

    echo "[1/2] Building frontend image: $FRONTEND_IMAGE ..."
    # shellcheck disable=SC2086
    docker build $PROXY_ARG \
      -f "$SCRIPT_DIR/dockerfile" \
      -t "$FRONTEND_IMAGE" \
      "$PROJECT_DIR"

    echo "[2/2] Building backend image: $BACKEND_IMAGE ..."
    # shellcheck disable=SC2086
    docker build $PROXY_ARG \
      -f "$SCRIPT_DIR/dockerfile.backend" \
      -t "$BACKEND_IMAGE" \
      "$PROJECT_DIR"

    echo "Done. Run 'sh docker/install.sh up' to start services."
    ;;

  up)
    echo "Starting services with docker compose..."
    docker compose -f "$COMPOSE_FILE" up -d
    echo "Done! Visit http://localhost:8080"
    ;;

  down)
    echo "Stopping services..."
    docker compose -f "$COMPOSE_FILE" down
    echo "Done."
    ;;

  logs)
    docker compose -f "$COMPOSE_FILE" logs -f ${2:-}
    ;;

  save-deps)
    echo "Exporting dependency image to $SCRIPT_DIR/$DEPS_TAR ..."
    docker save -o "$SCRIPT_DIR/$DEPS_TAR" "$DEPS_IMAGE"
    echo "Saved."
    ;;

  save)
    echo "Exporting app images..."
    docker save -o "$SCRIPT_DIR/$FRONTEND_TAR" "$FRONTEND_IMAGE"
    echo "  Saved frontend: $FRONTEND_TAR"
    docker save -o "$SCRIPT_DIR/$BACKEND_TAR" "$BACKEND_IMAGE"
    echo "  Saved backend: $BACKEND_TAR"
    echo "Transfer both tar files to target server, then run: sh docker/install.sh load"
    ;;

  load-deps)
    echo "Loading dependency image from $SCRIPT_DIR/$DEPS_TAR ..."
    docker load -i "$SCRIPT_DIR/$DEPS_TAR"
    echo "Done."
    ;;

  load)
    echo "[1/3] Loading frontend image from $SCRIPT_DIR/$FRONTEND_TAR ..."
    docker load -i "$SCRIPT_DIR/$FRONTEND_TAR"
    echo "[2/3] Loading backend image from $SCRIPT_DIR/$BACKEND_TAR ..."
    docker load -i "$SCRIPT_DIR/$BACKEND_TAR"
    echo "[3/3] Starting services..."
    docker compose -f "$COMPOSE_FILE" up -d
    echo "Done! Visit http://localhost:8080"
    ;;

  stop)
    docker compose -f "$COMPOSE_FILE" down
    echo "Services stopped."
    ;;

  *)
    echo "Usage: sh docker/install.sh [command]"
    echo ""
    echo "  deps [--proxy]   - 构建前端依赖预装镜像（首次/前端依赖变更时执行）"
    echo "  build [--proxy]  - 构建前端和后端镜像"
    echo "  up               - 启动所有服务（docker compose up）"
    echo "  down             - 停止所有服务"
    echo "  logs [service]   - 查看日志（可指定 frontend 或 backend）"
    echo "  save-deps        - 导出前端依赖镜像"
    echo "  save             - 导出前端和后端应用镜像"
    echo "  load-deps        - 从 tar 包导入前端依赖镜像"
    echo "  load             - 从 tar 包导入并启动所有服务"
    echo "  stop             - 停止并删除容器"
    ;;
esac
