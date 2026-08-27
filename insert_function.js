const fs = require('fs');

const filePath = 'd:\\Program Files\\xyzw_web_helper\\src\\diy\\OneClickGoldFish\\AccountMaintenanceCard.vue';
const functionFile = 'd:\\Program Files\\xyzw_web_helper\\tmp_batch_unload.ts';

// 读取文件
let content = fs.readFileSync(filePath, 'utf8');
const functionCode = fs.readFileSync(functionFile, 'utf8');

// 找到插入位置
const searchText = 'const handleBatchUpgrade900 = async () => {';
const insertIndex = content.indexOf(searchText);

if (insertIndex >= 0) {
    // 插入函数代码
    const newContent = content.slice(0, insertIndex) + functionCode + '\n\n' + content.slice(insertIndex);
    
    // 写回文件
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('函数插入成功，位置:', insertIndex);
} else {
    console.log('未找到插入位置');
}
