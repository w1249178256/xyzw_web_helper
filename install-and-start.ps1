$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
Set-Location "d:\Program Files\xyzw_web_helper"

# 检查 node 是否可用
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js 未找到，请确保 Node.js 已安装在 C:\Program Files\nodejs"
    exit 1
}

Write-Host "Node.js 版本: $(node --version)"
Write-Host "NPM 版本: $(npm --version)"

# 安装依赖
Write-Host "正在安装依赖..."
npm install

# 启动开发服务器
Write-Host "正在启动开发服务器..."
npm run dev