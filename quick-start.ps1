$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
Set-Location "d:\Program Files\xyzw_web_helper"

Write-Host "正在启动开发服务器..." -ForegroundColor Cyan
npm run dev