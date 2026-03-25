#!/bin/sh
# 服务器数据库备份 & 还原脚本
#
# 用法:
#   sh deploy/db-backup.sh                        # 立即执行一次备份
#   sh deploy/db-backup.sh install                # 安装每天晚上 22:00 自动备份的 cron 任务
#   sh deploy/db-backup.sh uninstall              # 卸载 cron 任务
#   sh deploy/db-backup.sh list                   # 列出所有本地备份
#   sh deploy/db-backup.sh restore                # 还原最新备份到当前服务器
#   sh deploy/db-backup.sh restore <文件名.db>    # 还原指定备份到当前服务器
#
# 换服务器流程:
#   1. 修改 deploy.conf 中的 REMOTE_HOST 为新服务器 IP
#   2. 部署应用到新服务器: sh deploy/docker/deploy-compose.sh
#   3. 还原数据库: sh deploy/db-backup.sh restore

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$SCRIPT_DIR/deploy.conf"

# ---- 执行一次备份 ----

do_backup() {
  TIMESTAMP="$(date '+%Y%m%d_%H%M%S')"
  LOCAL_FILE="${BACKUP_LOCAL_DIR}/xyzw_${TIMESTAMP}.db"

  echo "[db-backup] $(date '+%Y-%m-%d %H:%M:%S') 开始备份..."

  mkdir -p "$BACKUP_LOCAL_DIR"
  scp -P "$REMOTE_PORT" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DB_PATH}" "$LOCAL_FILE"

  # 删除本地超期备份
  find "$BACKUP_LOCAL_DIR" -name "xyzw_*.db" -mtime "+${BACKUP_KEEP_DAYS}" -delete 2>/dev/null || true

  echo "[db-backup] 备份完成 -> $LOCAL_FILE"
  do_list
}

# ---- 列出本地备份 ----

do_list() {
  echo "[db-backup] 本地备份列表 (${BACKUP_LOCAL_DIR}):"
  if ls "${BACKUP_LOCAL_DIR}"/xyzw_*.db 2>/dev/null | head -1 | grep -q .; then
    ls -lht "${BACKUP_LOCAL_DIR}"/xyzw_*.db | awk '{printf "  %s  %s  %s\n", $6, $7, $9}'
  else
    echo "  (无备份文件)"
  fi
}

# ---- 还原数据库到服务器 ----

do_restore() {
  # 确定要还原的文件
  if [ -n "$1" ]; then
    if [ -f "$1" ]; then
      LOCAL_FILE="$1"
    elif [ -f "${BACKUP_LOCAL_DIR}/$1" ]; then
      LOCAL_FILE="${BACKUP_LOCAL_DIR}/$1"
    else
      echo "[db-restore] 错误: 找不到备份文件 '$1'"
      exit 1
    fi
  else
    LOCAL_FILE="$(ls -t "${BACKUP_LOCAL_DIR}"/xyzw_*.db 2>/dev/null | head -1)"
    if [ -z "$LOCAL_FILE" ]; then
      echo "[db-restore] 错误: ${BACKUP_LOCAL_DIR} 下没有备份文件，请先运行备份。"
      exit 1
    fi
    echo "[db-restore] 未指定文件，使用最新备份: $(basename "$LOCAL_FILE")"
  fi

  echo "[db-restore] 目标服务器: ${REMOTE_USER}@${REMOTE_HOST}"
  echo "[db-restore] 还原文件:   $LOCAL_FILE"
  echo "[db-restore] 目标路径:   ${REMOTE_DB_PATH}"
  echo ""

  printf "[db-restore] 确认将覆盖服务器上的数据库？(y/N) "
  read -r CONFIRM
  if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "[db-restore] 已取消。"
    exit 0
  fi

  # 确保目标目录存在
  ssh -p "$REMOTE_PORT" "${REMOTE_USER}@${REMOTE_HOST}" \
    "mkdir -p $(dirname "$REMOTE_DB_PATH")"

  echo "[db-restore] 上传数据库文件..."
  scp -P "$REMOTE_PORT" "$LOCAL_FILE" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DB_PATH}"

  # 重启后端容器使其重新加载数据库
  echo "[db-restore] 重启后端容器..."
  ssh -p "$REMOTE_PORT" "${REMOTE_USER}@${REMOTE_HOST}" \
    "cd /root/xyzw && docker compose restart backend"

  echo ""
  echo "[db-restore] 还原完成！"
  echo "  服务器: ${REMOTE_HOST}"
  echo "  来源:   $(basename "$LOCAL_FILE")"
}

# ---- 安装 cron ----

CRON_TAG="xyzw-db-backup"
CRON_JOB="0 22 * * * sh ${SCRIPT_DIR}/db-backup.sh >> ${BACKUP_LOCAL_DIR}/backup.log 2>&1 # ${CRON_TAG}"

do_install() {
  mkdir -p "$BACKUP_LOCAL_DIR"

  if crontab -l 2>/dev/null | grep -q "$CRON_TAG"; then
    echo "[db-backup] cron 任务已存在，跳过安装。"
    echo "  $(crontab -l | grep "$CRON_TAG")"
    return
  fi

  (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
  echo "[db-backup] cron 任务已安装（每天 22:00 自动备份）:"
  echo "  $CRON_JOB"
  echo ""
  echo "  备份文件保存至: $BACKUP_LOCAL_DIR"
  echo "  日志文件: ${BACKUP_LOCAL_DIR}/backup.log"
}

# ---- 卸载 cron ----

do_uninstall() {
  if ! crontab -l 2>/dev/null | grep -q "$CRON_TAG"; then
    echo "[db-backup] 未找到 cron 任务，无需卸载。"
    return
  fi

  crontab -l 2>/dev/null | grep -v "$CRON_TAG" | crontab -
  echo "[db-backup] cron 任务已卸载。"
}

# ---- 入口 ----

case "${1:-backup}" in
  backup)
    do_backup
    ;;
  list)
    do_list
    ;;
  restore)
    do_restore "$2"
    ;;
  install)
    do_install
    ;;
  uninstall)
    do_uninstall
    ;;
  *)
    echo "Usage: sh deploy/db-backup.sh [backup|list|restore [文件名]|install|uninstall]"
    exit 1
    ;;
esac
