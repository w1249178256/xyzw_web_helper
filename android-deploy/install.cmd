@echo off
REM XYZW Web Helper Windows 安装脚本

echo 🚀 开始安装 XYZW Web Helper...

REM 检查是否安装了 Nginx
where nginx >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Nginx 未安装
    echo.
    echo 请先安装 Nginx:
    echo 1. 访问 http://nginx.org/en/download.html
    echo 2. 下载并解压到 C:\nginx
    echo 3. 将 C:\nginx 添加到系统 PATH
    echo.
    pause
    exit /b 1
)

echo ✅ 检测到 Nginx 已安装

REM 创建部署目录
set DEPLOY_DIR=%USERPROFILE%\xyzw_web_helper
if not exist "%DEPLOY_DIR%" mkdir "%DEPLOY_DIR%"

REM 复制文件
echo 📦 复制部署文件...
xcopy /E /I /Y dist "%DEPLOY_DIR%\dist"
copy /Y nginx.conf "%DEPLOY_DIR%\"
copy /Y dockerfile "%DEPLOY_DIR%\"

REM 配置 Nginx
echo ⚙️  配置 Nginx...
set NGINX_CONF_DIR=%DEPLOY_DIR%\nginx
if not exist "%NGINX_CONF_DIR%" mkdir "%NGINX_CONF_DIR%"

REM 修改 Nginx 配置中的路径（使用 PowerShell 进行字符串替换）
powershell -Command "(Get-Content nginx.conf) -replace 'root   /app/web;', 'root   %DEPLOY_DIR%\\dist;' | Set-Content '%NGINX_CONF_DIR%\nginx.conf'"

echo 🌐 启动 Nginx 服务...
start "" "nginx" -c "%NGINX_CONF_DIR%\nginx.conf"

echo.
echo ✅ 安装完成！
echo.
echo 📱 访问地址：
echo    - 本地访问：http://localhost:80
echo    - 局域网访问：http://[你的IP]:80
echo.
echo 🔧 管理命令：
echo    - 停止服务：nginx -s stop
echo    - 重启服务：nginx -s reload
echo.
echo 📂 安装目录：%DEPLOY_DIR%
echo.

pause
