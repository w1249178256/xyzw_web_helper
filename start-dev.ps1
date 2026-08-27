$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
Set-Location "d:\Program Files\xyzw_web_helper"

# 检查 node 是否可用
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js 未找到，请确保 Node.js 已安装在 C:\Program Files\nodejs"
    exit 1
}

Write-Host "Node.js 版本: $(node --version)" -ForegroundColor Green
Write-Host "NPM 版本: $(npm --version)" -ForegroundColor Green
Write-Host ""

# 检查 node_modules 是否存在
if (-not (Test-Path "node_modules")) {
    Write-Host "node_modules 不存在，正在安装依赖..." -ForegroundColor Yellow
    npm install
    Write-Host "依赖安装完成" -ForegroundColor Green
    Write-Host ""
}

# 启动开发服务器
Write-Host "正在启动开发服务器..." -ForegroundColor Cyan
npm run dev