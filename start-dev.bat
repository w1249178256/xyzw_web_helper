@echo off
setlocal enabledelayedexpansion
chcp 936 >nul 2>nul
cd /d "%~dp0"
title XYZW 一键启动

echo ==========================================
echo   XYZW Web Helper 一键启动
echo ==========================================
echo 工作目录: %CD%
echo.

rem ---------- 1. 运行环境 ----------
where node >nul 2>nul
if errorlevel 1 (
  echo [错误] 找不到 node 命令，请先安装 Node.js 18+ 并加入 PATH
  goto :fail
)
set "NODE_VER=unknown"
for /f "delims=" %%v in ('node -v 2^>nul') do set "NODE_VER=%%v"
echo [1/4] Node 版本: !NODE_VER!

set "PM="
where pnpm >nul 2>nul
if not errorlevel 1 set "PM=pnpm"
if not defined PM (
  where npm >nul 2>nul
  if not errorlevel 1 set "PM=npm"
)
if not defined PM (
  echo [错误] 找不到 pnpm / npm，请安装其中之一
  goto :fail
)
echo       包管理器: !PM!

if not exist "node_modules" (
  echo       前端依赖缺失，开始安装...
  call !PM! install
  if errorlevel 1 (
    echo [错误] 前端依赖安装失败
    goto :fail
  )
) else (
  echo       前端依赖已就绪
)

if not exist "render-backend\node_modules" (
  echo       后端依赖缺失，开始安装...
  pushd render-backend
  call npm install
  set "BACKEND_INSTALL_ERR=!errorlevel!"
  popd
  if not "!BACKEND_INSTALL_ERR!"=="0" (
    echo [错误] 后端依赖安装失败
    goto :fail
  )
) else (
  echo       后端依赖已就绪
)

rem ---------- 2. 端口占用（只提示，不阻断） ----------
echo.
echo [2/4] 检查端口占用...
call :checkport 3000 前端
call :checkport 3001 后端

rem ---------- 3. 启动后端 ----------
echo.
echo [3/4] 启动后端 render-backend ^(http://127.0.0.1:3001^) ...
start "XYZW 后端 :3001" /D "%~dp0render-backend" cmd /k node server.js
call :wait 2

rem ---------- 4. 启动前端 ----------
echo [4/4] 启动前端 Vite ^(http://localhost:3000^) ...
start "XYZW 前端 :3000" /D "%~dp0." cmd /k !PM! dev

echo.
echo ==========================================
echo   启动完成
echo   前端: http://localhost:3000
echo   后端: http://127.0.0.1:3001/health
echo   日志: render-backend\logs\frontend-日期.log
echo ==========================================
echo.
echo 关闭这两个新窗口即可停止服务。
pause
exit /b 0

rem ---------- 子过程 ----------
:checkport
netstat -ano | findstr /C:":%~1 " | findstr /C:"LISTENING" >nul 2>nul
if not errorlevel 1 (
  echo       [警告] 端口 %~1 已被占用^（%~2^），可能启动失败或自动换端口
) else (
  echo       端口 %~1 空闲
)
exit /b 0

:wait
ping -n %~1 127.0.0.1 >nul 2>nul
exit /b 0

:fail
echo.
echo 启动失败，请把上面的错误信息截图发给开发。
pause
exit /b 1
