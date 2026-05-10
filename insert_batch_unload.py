# 读取文件
with open(r'd:\Program Files\xyzw_web_helper\src\diy\OneClickGoldFish\AccountMaintenanceCard.vue', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 找到插入位置
insert_line = None
for i, line in enumerate(lines):
    if '// 批量升级 900 级' in line:
        insert_line = i
        break

if insert_line:
    # 读取函数代码
    with open(r'd:\Program Files\xyzw_web_helper\tmp_batch_unload.ts', 'r', encoding='utf-8') as f:
        function_code = f.read()
    
    # 插入函数代码（在 // 批量升级 900 级 之前）
    lines.insert(insert_line, function_code + '\n\n')
    
    # 写回文件
    with open(r'd:\Program Files\xyzw_web_helper\src\diy\OneClickGoldFish\AccountMaintenanceCard.vue', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    
    print(f'函数插入成功，插入位置：第 {insert_line + 1} 行')
else:
    print('未找到插入位置')
