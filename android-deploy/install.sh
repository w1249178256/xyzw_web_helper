#!/bin/bash

# XYZW Web Helper Android 安装脚本 (Linux/Mac/Termux)

echo "🚀 开始安装 XYZW Web Helper..."

# 检查是否在 Termux 中运行
if [ -n "$PREFIX" ]; then
    echo "📱 检测到 Termux 环境"
    pkg update && pkg upgrade -y
    pkg install nginx -y
else
    echo "💻 检测到 Linux/Mac 环境"
    # 检查是否已安装 Nginx
    if ! command -v nginx &> /dev/null; then
        echo "❌ Nginx 未安装，请先安装 Nginx"
        echo "Ubuntu/Debian: sudo apt install nginx"
        echo "CentOS/RHEL: sudo yum install nginx"
        echo "Mac: brew install nginx"
        exit 1
    fi
fi

# 创建部署目录
DEPLOY_DIR="$HOME/xyzw_web_helper"
mkdir -p "$DEPLOY_DIR"

# 复制文件
echo "📦 复制部署文件..."
cp -r dist "$DEPLOY_DIR/"
cp nginx.conf "$DEPLOY_DIR/"
cp dockerfile "$DEPLOY_DIR/"

# 配置 Nginx
echo "⚙️  配置 Nginx..."
NGINX_CONF_DIR="$HOME/.nginx"
mkdir -p "$NGINX_CONF_DIR"

# 修改 Nginx 配置中的路径
sed "s|root   /app/web;|root   $DEPLOY_DIR/dist;|g" nginx.conf > "$NGINX_CONF_DIR/nginx.conf"

# 启动 Nginx
echo "🌐 启动 Nginx 服务..."
if [ -n "$PREFIX" ]; then
    # Termux 环境
    nginx -c "$NGINX_CONF_DIR/nginx.conf"
else
    # Linux/Mac 环境
    sudo nginx -c "$NGINX_CONF_DIR/nginx.conf"
fi

echo ""
echo "✅ 安装完成！"
echo ""
echo "📱 访问地址："
echo "   - 本地访问：http://localhost:80"
echo "   - 局域网访问：http://[你的IP]:80"
echo ""
echo "🔧 管理命令："
echo "   - 停止服务：nginx -s stop"
echo "   - 重启服务：nginx -s reload"
echo "   - 查看状态：ps aux | grep nginx"
echo ""
echo "📂 安装目录：$DEPLOY_DIR"
echo ""
