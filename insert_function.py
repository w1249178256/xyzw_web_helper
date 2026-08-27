import re

# 读取文件
with open(r'd:\Program Files\xyzw_web_helper\src\diy\OneClickGoldFish\AccountMaintenanceCard.vue', 'r', encoding='utf-8') as f:
    content = f.read()

# 读取函数代码
with open(r'd:\Program Files\xyzw_web_helper\tmp_insert_function.txt', 'r', encoding='utf-8') as f:
    function_code = f.read()

# 找到插入位置
search_text = '// 批量升级 900 级\nconst handleBatchUpgrade900'
replace_text = function_code + '\n\n// 批量升级 900 级\nconst handleBatchUpgrade900'

# 替换
new_content = content.replace(search_text, replace_text)

# 写回文件
with open(r'd:\Program Files\xyzw_web_helper\src\diy\OneClickGoldFish\AccountMaintenanceCard.vue', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('函数插入成功')
