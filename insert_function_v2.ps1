$filePath = "d:\Program Files\xyzw_web_helper\src\diy\OneClickGoldFish\AccountMaintenanceCard.vue"
$lines = Get-Content $filePath -Encoding UTF8

# 找到插入位置
$insertIndex = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '// 批量升级 900 级') {
        $insertIndex = $i
        break
    }
}

if ($insertIndex -ge 0) {
    # 读取函数代码
    $functionCode = Get-Content "d:\Program Files\xyzw_web_helper\tmp_batch_unload.ts" -Encoding UTF8 -Raw
    
    # 创建新内容
    $newLines = @()
    for ($i = 0; $i -lt $insertIndex; $i++) {
        $newLines += $lines[$i]
    }
    $newLines += $functionCode
    $newLines += ""
    $newLines += ""
    for ($i = $insertIndex; $i -lt $lines.Count; $i++) {
        $newLines += $lines[$i]
    }
    
    # 写回文件
    $newLines | Set-Content $filePath -Encoding UTF8
    Write-Host "函数插入成功，位置：$insertIndex"
} else {
    Write-Host "未找到插入位置"
}
