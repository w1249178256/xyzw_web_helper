<template>
  <div class="legion-war-container">
    <div class="legion-war-map">
      <div class="map-title">
        <div class="map-title-item">
          战场图示
        </div>
        <div >
          <span>是否进入战场:</span>
          <n-button text @click="getBattlefieldInfo">
            <span :class="connectionClass"> {{ isEntireBattlefield ? "已进入战场" : "重新进入战场" }}</span>
          </n-button>
          当前时间-{{ currentDateTime }}
        </div>
      </div>
      <div class="map-container">
        <canvas ref="legionWarMapDom" class="mapCanvas"></canvas>
      </div>
    </div>
    <div class="legion-war-operation">
      <div class="legion-war-operation-title">
        <div class="operation-title-item">
          操作面板
        </div>
      </div>
      <div class="legion-war-operation-container">
        <div class="legion-war-operation-item">
          <div>
            占领布局
          </div>
          <div>
            <n-switch v-model:value="isOccupyOrDistribution" @update:value="handleChange"/>
          </div>
          <div>
            分布布局
          </div>
        </div>
        <div class="legion-war-operation-item">
          <div>
            战队战况
          </div>
          <div>
            <n-switch v-model:value="isLegionOrIndividual" @update:value="handleChange"/>
          </div>
          <div>
            个人战况
          </div>
        </div>
        <div class="legion-war-operation-item">
          <n-button type="primary" @click="getBattlefieldInfo" :disabled="!isEntireBattlefield" style="padding:12px">
            拉取数据(需进入战场后)
          </n-button>
        </div>
        <div class="legion-war-operation-item">
          <n-button type="primary" @click="sendMessageToLegion" style="padding:12px">
            发送各战队免费复活到战队频道
          </n-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted,toRaw } from 'vue'
import { roadPointList,extractValidData,typeName,typeBg,formatPower,HexGraph } from "@/utils/legionWar"
import { getCurrentTimeByFormat } from "@/utils/DateTimeUtils"

import { XyzwLegionWarWebSocketClient } from '@/utils/xyzwLegionWarWebSocket'
import { useTokenStore } from '@/stores/tokenStore'
import { useMessage } from 'naive-ui'

const tokenStore = useTokenStore()
const message = useMessage()

let legionWarWebSocket = null;
const hint = ref(null);


//是否进入战场
const isEntireBattlefield = ref(false);
const currentDateTime = ref(getCurrentTimeByFormat("yyyy-MM-dd HH:mm:ss"));

const connectionStatusText = computed(() => {
  return legionWarWebSocket?.status === "connected" ? "已连接" : "未连接";
});
const connectionStatus = computed(() => {
  return legionWarWebSocket?.status === "connected" ? "connected" : "disconnected";
});

const connectionClass = computed(() => {
  return isEntireBattlefield.value ? "status-connected" : "status-disconnected";
});
const isConnected = computed(() => {
  return connectionStatus?.value === "connected";
});

const toggleConnection = () => {
  if (connectionStatus?.value === "connected") {
    disconnectWebSocket();
  } else {
    connectWebSocket();
  }
};

/**
 * 是占领情况还是分布情况
 */
const isOccupyOrDistribution = ref(false);
/**
 * 俱乐部战况还是个人战况
 */
const isLegionOrIndividual = ref(false); 

//处理change事件
const handleChange = function(value) {
  drawCanvasContent();
}

/**
 * 发送各俱乐部免费复活到俱乐部频道
 */
const sendMessageToLegion =async function(){
  let arr = Object.values(validData.value.legionInfo)
  const messageList = [];
  for(let i =0;i<2;i++){
    let message = ``;
    for (let j = 0; j < 10; j++) {
      const element = arr[j+(i*10)];
      if(j!=0){
        message+="\n";
      }
      message +=element.name+":剩"+(150-element.reviveCount);
    }
    messageList.push(message);
  }

  const tokenId = tokenStore.selectedToken.id;
  const sendInterval = 1500;
  for (let i = 0; i < messageList.length; i++) {
      // 等待间隔时间
      await new Promise(resolve => setTimeout(resolve, sendInterval));
      // 发送当前消息
      try {
          await tokenStore.sendMessageToLegion(tokenId, messageList[i]);
      } catch (error) {
          // 可选：失败后重试1次
          if (error.message.includes("频繁")) {
              await new Promise(resolve => setTimeout(resolve, sendInterval * 2));
              await tokenStore.sendMessageToLegion(tokenId, messageList[i]);
          }
      }
  }
} 

const legionWarMapDom = ref(null)
let ctx = null;
const dpr = window.devicePixelRatio || 1;
let resizeHandler = null;
const hexSize = 13.25;
const gap = 2.75;
const hexWidth = 2 * hexSize;
const hexHeight = Math.sqrt(3) * hexSize;
const arr = Array.from({ length: 41 }, () =>
  Array.from({ length: 41 }, () => 0)
);
//记录左侧绘制后最大点
let leftMaxPoint=[0,0];
let validData =ref(null);

const result = ref(null)

const drawHexagon = (x, y, color) => {
  ctx.beginPath();
  // 绘制6个顶点
  for (let i = 0; i < 6; i++) {
    const angle = 2 * Math.PI / 6 * i;
    const px = x + hexSize * Math.cos(angle);
    const py = y + hexSize * Math.sin(angle);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    if(px>=leftMaxPoint[0]){
      leftMaxPoint[0]=px
    }if(py>=leftMaxPoint[1]){
      leftMaxPoint[1]=py
    }
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.stroke();
}

/**
 * 绘制canvas内容
 */
const drawCanvasContent = (mouseX=0,mouseY=0,type='')=>{

  //如果有坐标就传入坐标,没有就不传入坐标
  if(mouseX!==0&&mouseY!==0){
    //绘制左侧内容
    drawCanvasLeft(mouseX,mouseY,type)
  }else{
    //绘制左侧内容
    drawCanvasLeft()
  }
  drawdivideLine();
  //绘制右侧信息内容
  drawCanvasRight(validData.value);

}

//绘制地图左侧内容
const drawCanvasLeft = (mouseX=0,mouseY=0,type='') => {

  //清空画布
  ctx.clearRect(0, 0, ctx.canvas.width / dpr, ctx.canvas.height / dpr)
  //获取图结构的实例
  let graph = HexGraph.getInstance();
  //删除所有结点
  graph.removeAllNode();
  //提取result.value中的数据
  validData.value = extractValidData(result.value,isOccupyOrDistribution.value)
  if(validData.value){
    graph.addNodeList(Object.values(validData.value.buildingData).map(
      item=> {
        return {
          "id":item.id,
          "type":item.type,
          "belongsLegionId":item.belongsLegionId,
          "hP":item.hP,
          "maxHP":item.maxHP,
          "point":item.point,
          "belongsLegionInfo":validData.value.legionInfo[item.belongsLegionId]
        }
      })
    )
  }
  if(!validData.value){
    return;
  }
  //如果是占领布局
  if(!isOccupyOrDistribution.value){
    //处理地图连通
    let asc = true //是否升序
    Object.values(validData.value.legionInfo).forEach(element => {
      let tempArr = Object.keys(element.buildings).sort((a, b) => {
        // 拆分key为两个数字（如"19_28" → [19, 28]）
        const [a1, a2] = a.split('_').map(Number);
        const [b1, b2] = b.split('_').map(Number);
        
        // 核心排序逻辑：先比第一个数字，再比第二个数字
        const compareFirst = a1 - b1;
        if (compareFirst !== 0) {
            return asc ? compareFirst : -compareFirst;
        }
        const compareSecond = a2 - b2;
        return asc ? compareSecond : -compareSecond;
      });
    
      //此处填充两点之间路径颜色,可以采用单循环,但是会有些点不被填充颜色
      for(let buildingIndex =0;buildingIndex<tempArr.length;buildingIndex++){
        for(let buildingIndexTemp =buildingIndex;buildingIndexTemp<tempArr.length;buildingIndexTemp++){
          let graphresult = graph.findShortestPath(tempArr[buildingIndex],tempArr[buildingIndexTemp],element.id);
          if(graphresult){
            graphresult.forEach(item=>{
              item.belongsLegionId=element.id;
              item.colorBg=element.color;
            })
          }
        }
      }
    });
  }else{
    //如果是分布布局,将各个大本营的颜色设为对应俱乐部的背景色
    let legionList = Object.values(validData.value.legionInfo);
    for(let i =0;i<legionList.length;i++){
      let node = graph.getNodeByCoords(legionList[i].strongholdId);
      node.belongsLegionId=legionList[i].id
      node.colorBg=legionList[i].color;
    }
  }

  //获取所有结点
  let mergedArr = graph.getAllNodes()
  //所有节点放入二维数组中
  mergedArr.forEach(item => {
    let row=item.position.x;
    let col=item.position.y;
    //如果是布局情况
    if(isOccupyOrDistribution.value&&item.type !=4){
      item.belongsLegionId=-1;
      item.colorBg=typeBg(9)
    }
    if (parseInt(row) >= 0 && parseInt(row) < 41 && parseInt(col) >= 0 && parseInt(col) < 32) {
      arr[parseInt(col)][parseInt(row)] = item; // 赋值
    } else {
      console.warn(`坐标[${row},${col}]越界，跳过赋值`);
    }
  });
  
  if(!isOccupyOrDistribution.value){
    //特殊处理核心周围的颜色
    arr[16][19].belongsLegionId=arr[17][20].belongsLegionId;
    arr[17][19].belongsLegionId=arr[17][20].belongsLegionId;
    arr[16][21].belongsLegionId=arr[17][20].belongsLegionId;
    arr[17][21].belongsLegionId=arr[17][20].belongsLegionId;
    arr[16][20].belongsLegionId=arr[17][20].belongsLegionId;
    arr[18][20].belongsLegionId=arr[17][20].belongsLegionId;
    arr[16][21].colorBg=arr[17][20].colorBg;
    arr[17][21].colorBg=arr[17][20].colorBg;
    arr[16][19].colorBg=arr[17][20].colorBg;
    arr[17][19].colorBg=arr[17][20].colorBg;
    arr[16][20].colorBg=arr[17][20].colorBg;
    arr[18][20].colorBg=arr[17][20].colorBg;
  }
  
  
  //点击事件存储的临时对象
  let tempValue={};
  //用于记录最后绘制级内容的数组
  let drawPointArr = [];
  //根据二位数组绘制内容
  for (let row = 0; row <= 31; row++) {
    for (let col = 0; col <= 40; col++) {
      if (row>2&&arr[row][col] != 0) {
        // 计算中心坐标（处理错位）
        const x = col * (hexWidth * 0.75) + hexSize + gap * col;
        const y = row * hexHeight + (col % 2 === 1 ? hexHeight / 2 : 0) + gap * row;
        let colorTemp = arr[row][col].colorBg

        if(mouseX!==0&&mouseY!==0){
          // 简化碰撞检测：判断鼠标与中心的距离
          const distance = Math.sqrt((mouseX - x) **2 + (mouseY - y)** 2);
          if(type==='mousemove'){
            colorTemp = distance < hexSize ? '#42b983':colorTemp;
          }else if(type==='click'&&distance < hexSize){
            tempValue = arr[row][col];
          }
        }
        // 绘制六边形
        drawHexagon(x, y, colorTemp);
        
        if(arr[row][col].type!=9){
          let name =arr[row][col].typeName.replace("据点","");
          if(name=="大本营"){
            ctx.fillStyle = "#055138";
            name=validData.value.legionInfo[arr[row][col].belongsLegionId].name
          }
          drawPointArr.push({
            "x":x-13,
            "y":y+4,
            "name":name
          })
        }
      }
    }
  }

  for(let i=0;i<drawPointArr.length;i++){
          ctx.fillStyle = "black";
          ctx.font = "bold 12px Microsoft Yahei";
          ctx.fillText(
            drawPointArr[i].name,
            drawPointArr[i].x,
            drawPointArr[i].y
          );
  }

  if(tempValue.type!=9&&Object.keys(tempValue).length>0&&type==='click'){
    drawClickContent(mouseX,mouseY,tempValue)
  }


}

/**
 * 绘制分割线
 */
const drawdivideLine = ()=>{
  ctx.beginPath();
  ctx.moveTo(leftMaxPoint[0]+10,leftMaxPoint[1]);
  ctx.lineTo(leftMaxPoint[0]+10,10);
  ctx.closePath();
  ctx.strokeStyle = '#000';
  ctx.stroke();
};
/**
 * 绘制Canvas右侧的内容
 * @param {*} tableData 
 */
const drawCanvasRight = (tableData) =>{
  if(tableData){
    let tableConfig={}
    if(!isLegionOrIndividual.value){
      tableData = Object.values(tableData.legionInfo).sort((a,b)=>b.score-a.score).map(item=>{
        return [item.name,item.killCnt,item.reviveCount+"/150",item.score,item.redCount,formatPower(item.power),item.participantsCount+"/"+item.memberCount,item.danCount,item.blessingCount+"个共"+item.blessingScore+"分",item.color]
      })
      tableConfig={
        x: leftMaxPoint[0]+20,
        y: 20,
        columns: 9, // 3列
        rows: 20, // 4行内容（不含表头）
        headerData: ['俱乐部名称','击杀数', '免费复活', '积分', '红数', '战力', '人数', '花费总丹', '四圣'], // 表头
        tableData: tableData?tableData:[],
        columnWidth: 78, // 单元格宽度（可根据内容调整）
        rowHeight: 37, // 单元格高度
        scale: 1 
      }
    }else{
      let tableDataTemp=[] 
      Object.values(tableData.memberInfo).forEach(item=>{
        if(item.legionId==tokenStore.gameData?.roleInfo?.role.legionId){
          tableDataTemp.push([item.name,item.kill,item.die,item.revive+"/5",item.score,item.digGround,item.dan,parseFloat(item.kill/item.die).toFixed(2)]);
        }
      })
      tableDataTemp=tableDataTemp.sort((a,b)=> {return b[1]-a[1]})
      tableConfig={
        x: leftMaxPoint[0]+20,
        y: 20,
        columns: 8, // 3列
        rows: tableDataTemp?tableDataTemp.length:30, // 4行内容（不含表头）
        headerData: ['名称','击杀数', '死亡次数', '已复活次数', '积分', '刨地','复活丹', 'K/D'], // 表头
        tableData: tableDataTemp?tableDataTemp:[],
        columnWidth: 88, // 单元格宽度（可根据内容调整）
        rowHeight: 25, // 单元格高度
        scale: 1 
      }
    }
    drawTable(ctx,tableConfig)
  }
}

/**
 * 绘制表格
 * @param {*} ctx 
 * @param {*} options 
 * @param {*} options.x 表格的左上角x坐标
 * @param {*} options.y 表格的左上角y坐标 
 * @param {*} options.columns 表格的列
 * @param {*} options.rows 表格的行
 * @param {*} options.headerData 表格的表头
 * @param {*} options.tableData 表格的内容
 * @param {*} options.columnWidth 单元格宽度
 * @param {*} options.rowHeight 单元格高度
 */
 const drawTable = (ctx, options) => {
  // 默认配置（可自定义）
  const defaults = {
    columnWidth: 80,
    rowHeight: 25,
    headerBgColor: '#42b983',
    cellBgColor: '#ffffff',
    borderColor: '#333333',
    headerTextColor: '#ffffff',
    cellTextColor: '#373737',
    fontSize: 14,
    font: 'Arial',
    scale: 1
  };

  // 合并配置（用户传参覆盖默认）
  const config = { ...defaults, ...options };
  const {
    x, y, columns, rows, headerData, tableData,
    columnWidth, rowHeight, headerBgColor, cellBgColor,
    borderColor, headerTextColor, cellTextColor, fontSize, font, scale
  } = config;
  // 计算缩放后的实际尺寸（适配画布缩放）
  let scaledColW = columnWidth * scale;
  const scaledRowH = rowHeight * scale;
  const scaledFontSize = fontSize * scale;
  const scaledLineWidth = 1 * scale; // 边框线宽

  ctx.save();
  // 1. 绘制表格外边框
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = scaledLineWidth;
  ctx.strokeRect(
    x, // 表格起始x（已适配分割线位置）
    y, // 表格起始y
    columns * scaledColW, // 表格总宽度
    (rows + 1) * scaledRowH // 表格总高度（表头1行 + 内容rows行）
  );

  let currentX=x;
  let addColumnWidth=20;
  let reduceColumnWidth=20;
  // 2. 绘制表头（第1行）
  for (let col = 0; col < columns; col++) {
    ctx.fillStyle = headerBgColor;
    
    let currentColW = col === 0 ? scaledColW + addColumnWidth : scaledColW;
    currentColW = col === 1 ? scaledColW - reduceColumnWidth : currentColW;

    // 绘制表头单元格背景
    ctx.fillRect(
      currentX,
      y,
      currentColW,
      scaledRowH
    );
    //绘制表头单元格边框
    ctx.strokeRect(
      currentX,
      y,
      currentColW,
      scaledRowH
    );
    // 绘制表头文字（居中）
    ctx.fillStyle = headerTextColor;
    ctx.font = `${scaledFontSize}px ${font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      headerData[col] || '',
      currentX  + currentColW / 2,
      y + scaledRowH / 2
    );
    
    currentX+=currentColW;
  }

  // 3. 绘制内容行（第2行及以后）
  for (let row = 0; row < rows; row++) {
    currentX=x;
    for (let col = 0; col < columns; col++) {
      
      let currentColW = col === 0 ? scaledColW + addColumnWidth : scaledColW;
      currentColW = col === 1 ? scaledColW - reduceColumnWidth : currentColW;

      ctx.fillStyle = tableData[row]?.[9]||cellBgColor;
      // 计算当前单元格的坐标
      const cellX = currentX;
      const cellY = y + (row + 1) * scaledRowH;

      // 绘制内容单元格背景
      ctx.fillRect(cellX, cellY, currentColW, scaledRowH);
      // 绘制内容单元格边框
      ctx.strokeRect(cellX, cellY, currentColW, scaledRowH);
      // 绘制内容文字（居中）
      ctx.fillStyle = cellTextColor;
      ctx.font = `${scaledFontSize}px ${font}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        tableData[row]?.[col] || '0',
        cellX + currentColW / 2,
        cellY + scaledRowH / 2
      );
      currentX+=currentColW;
    }
  }

  ctx.restore();
};

/**
 * 绘制点击事件内容
 * @param {number} mousex 鼠标原始x坐标（未缩放的坐标）
 * @param {number} mousey 鼠标原始y坐标（未缩放的坐标）
 * @param {string|object} value 展示内容（字符串/对象，对象自动转键值对）
 * @param {number} scale 画布缩放比例
 * @param {number} offsetX 画布x偏移
 * @param {number} offsetY 画布y偏移
 * @param {object} options 可选配置（可自定义样式）
 */
const drawClickContent = (mousex, mousey, value, scale=1, offsetX=0, offsetY=0, options = {}) => {
  // 默认配置（可自定义）
  const config = {
    boxWidth: 200, // 信息框基础宽度（未缩放）
    boxPadding: 10, // 内边距（未缩放）
    bgColor: 'rgba(0, 0, 0, 0.8)', // 背景色（半透明黑）
    borderColor: '#ffffff', // 边框色
    borderWidth: 1, // 边框宽度（未缩放）
    fontColor: '#ffffff', // 文字颜色
    fontSize: 14, // 字体大小（未缩放）
    font: 'Arial', // 字体
    gap: 10, // 信息框与鼠标的间距（未缩放）
    ...options
  };

  // 1. 处理value，转成可展示的文本（对象→键值对，字符串→原内容）
  let text = '';
  if (typeof value === 'object' && value !== null ) {
    text = Object.entries(value).map(([key, val]) => `${key}: ${val}`).join('\n');
    let item =value;
    text =`坐标:${item.id}\n血量:${item.hP}/${item.maxHP}\n类型:${item.typeName}\n分数:${item.point}\n所属俱乐部:${validData.value.legionInfo[item.belongsLegionId]?.name||'无所属'}`
  } else {
    text = String(value || '无数据');
  }
  const textLines = text.split('\n'); // 按换行分割成数组

  // 2. 计算缩放后的实际尺寸（适配canvas缩放）
  const scaledBoxWidth = config.boxWidth * scale;
  const scaledPadding = config.boxPadding * scale;
  const scaledFontSize = config.fontSize * scale;
  const scaledBorderWidth = config.borderWidth * scale;
  const scaledGap = config.gap * scale;
  const lineHeight = scaledFontSize * 1.4; // 行高（1.4倍字体）
  const textTotalHeight = textLines.length * lineHeight; // 文本总高度
  const scaledBoxHeight = textTotalHeight + 2 * scaledPadding; // 信息框总高度

  // 3. 计算信息框的最终位置（适配缩放+偏移，防溢出）
  // 鼠标坐标转canvas实际坐标（应用缩放+偏移）
  const canvasX = mousex * scale + offsetX;
  const canvasY = mousey * scale + offsetY;

  // 信息框默认显示在鼠标右下方，避免溢出canvas边界
  let boxX = canvasX + scaledGap;
  let boxY = canvasY + scaledGap;
  const canvasWidth = ctx.canvas.width / dpr; // canvas可视宽度（去除dpr）
  const canvasHeight = ctx.canvas.height / dpr; // canvas可视高度（去除dpr）

  // 右边界溢出：信息框移到鼠标左侧
  if (boxX + scaledBoxWidth > leftMaxPoint[0]+10) {
    boxX = canvasX - scaledBoxWidth - scaledGap;
  }
  // 下边界溢出：信息框移到鼠标上方
  if (boxY + scaledBoxHeight > leftMaxPoint[1]+20) {
    boxY = canvasY - scaledBoxHeight - scaledGap;
  }
  // 左/上边界溢出：贴边显示
  boxX = Math.max(scaledBorderWidth, boxX);
  boxY = Math.max(scaledBorderWidth, boxY);

  // 4. 绘制信息框背景
  ctx.save(); // 保存上下文状态，避免影响其他绘制
  ctx.fillStyle = config.bgColor;
  ctx.fillRect(
    boxX - scaledBorderWidth,
    boxY - scaledBorderWidth,
    scaledBoxWidth + 2 * scaledBorderWidth,
    scaledBoxHeight + 2 * scaledBorderWidth
  );

  // 5. 绘制信息框边框
  ctx.strokeStyle = config.borderColor;
  ctx.lineWidth = scaledBorderWidth;
  ctx.strokeRect(boxX, boxY, scaledBoxWidth, scaledBoxHeight);

  // 6. 绘制文本内容
  ctx.fillStyle = config.fontColor;
  ctx.font = `${scaledFontSize}px ${config.font}`;
  ctx.textBaseline = 'top'; // 文本基线：顶部对齐
  textLines.forEach((line, index) => {
    ctx.fillText(
      line,
      boxX + scaledPadding, // 文本x坐标（加内边距）
      boxY + scaledPadding + index * lineHeight // 文本y坐标（按行高偏移）
    );
  });

  ctx.restore(); // 恢复上下文状态
}

function resizeAndRedraw(canvas) {
  const container = canvas.parentElement;
  const w = container.clientWidth;
  const h = container.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  drawCanvasContent();
}

const connectWebSocket = () => {
  if (!tokenStore.selectedToken) {
    message.warning("请先选择一个Token");
    router.push("/tokens");
    return;
  }

  try {
    const tokenId = tokenStore.selectedToken.id;
    const token = tokenStore.selectedToken.token;

    // 使用 tokenStore 的 WebSocket 连接管理
    tokenStore.createWebSocketConnection(tokenId, token);
    message.info("正在建立 WebSocket 连接...");

    // 等待连接建立
    setTimeout(async () => {
      const status = tokenStore.getWebSocketStatus(tokenId);
      if (status === "connected") {
        message.success("WebSocket 连接成功");
        
        const getbattlefield = await tokenStore.sendMessageWithPromise(tokenId, 'legion_getbattlefield', {}, 10000)
        fetchBattleRecords1(getbattlefield);
      }
    }, 2000);
  } catch (error) {
    console.error("WebSocket连接失败:", error);
    message.error("WebSocket连接失败");
  }
};

/**
 * 建立盐场连接请求与处理
 */
const fetchBattleRecords1 = async (getbattlefield) => {
  if (tokenStore.selectedToken) {
    const tokenId = tokenStore.selectedToken.id
    const status = tokenStore.getWebSocketStatus(tokenStore.selectedToken.id);
    if (status !== "connected") {
      connectWebSocket();
      return;
    }
    const baseWsUrl = getbattlefield?.info.domainName+`?p=${encodeURIComponent(tokenStore.selectedToken.token)}&e=x&sid2=${getbattlefield?.info.sid}&lang=chinese&sid2=${getbattlefield?.info.sid}`
    hint.value = getbattlefield?.info.battlefieldId;
    legionWarWebSocket =  new XyzwLegionWarWebSocketClient({
      url: baseWsUrl,
          utils: null,
          hint: hint.value,
          heartbeatMs: 5000
    })

    
    legionWarWebSocket.onConnect = async () => {
      try {
        setTimeout( () => {
          isEntireBattlefield.value=true;
          const entire = legionWarWebSocket.send("war_enterbattlefield",{battlefieldId:hint.value,useGzip:true})
        }, 5000);
      } catch (error) {
        console.error(`初始请求盐场信息失败 [${tokenId}]`, error)
      }
    }
    // 10. 设置消息监听
    legionWarWebSocket.setMessageListener((message) => {
      const cmd = message?.cmd || 'unknown'
      if(cmd.includes("war_getbattlefieldinfo")){
        console.log(message.rawData)
        result.value = message?.rawData;
        resizeAndRedraw(legionWarMapDom.value)
      }
    })
    legionWarWebSocket.onDisconnect = (event) => {
      const reason = event.code === 1006 ? '异常断开' : event.reason || ''
      console.log(event)
    }

    legionWarWebSocket.onError = (error) => {
    console.log(error)
    }

    // 11. 初始化连接
    legionWarWebSocket.init()
  }
}

/**
 * 获取战场信息
 */
const getBattlefieldInfo = async ()=> {
  if(isEntireBattlefield.value){
    legionWarWebSocket.send("war_getbattlefieldinfo",{battlefieldId:hint.value});
    currentDateTime.value = getCurrentTimeByFormat("");
  }else{
    message.error("暂未进入战场,请稍后");
  }
}

onMounted(() => {
  fetchBattleRecords1()
  const canvas = legionWarMapDom.value;
  ctx = canvas.getContext('2d');

  resizeHandler = () => resizeAndRedraw(canvas);
  resizeHandler(); // 初始化
  //增加鼠标移动事件
  // canvas.addEventListener('mousemove', (e) => {
  //   const rect = canvas.getBoundingClientRect();
  //   const mouseX = e.clientX - rect.left;
  //   const mouseY = e.clientY - rect.top;
  //   ctx.font="12px Arial";
  //   ctx.fillStyle = "rgb(0,0,0)";
  //   drawCanvasContent(mouseX,mouseY,'mousemove')
  // });
  //增加点击事件
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    ctx.font="12px Arial";
    ctx.fillStyle = "rgb(0,0,0)";
    drawCanvasContent(mouseX,mouseY,'click')
  });
  window.addEventListener('resize', resizeHandler);
  
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeHandler);
});

</script>

<style scoped lang="scss">
.legion-war-container {
  display: flex;
  justify-content: space-between;
  margin: var(--spacing-sm);

  .legion-war-map {
    background-color: var(--bg-secondary);
    display: flex;
    flex-direction: column;
    padding: var(--spacing-sm);
    width: 87%;

    .map-title {
      display:flex;
      padding: var(--spacing-sm);
      border-bottom: 1px solid #bbbbbb80;
      align-items:center;
      justify-content: space-between;
    }
    
    .map-container {
      width: 100%;
      height: 100%;
      min-height: 60vh; /* Ensure map has height on mobile */
      .mapCanvas {
        width: 100%;
        height: 100%;
        display: block;
      }
    }
  }
  .legion-war-operation{
    background-color: var(--bg-secondary);
    width: 12.5%; 
    display: flex;
    flex-direction: column;
    padding: var(--spacing-sm);

    .legion-war-operation-title{
      display:flex;
      padding: var(--spacing-sm);
      border-bottom: 1px solid #bbbbbb80;
      align-items:center;
      justify-content: space-between;
    }
    .legion-war-operation-container{
      width: 100%;
      height: 100%;
      display: flex;
      padding: var(--spacing-xs);
      flex-direction: column;
      gap: var(--spacing-sm);
      .legion-war-operation-item{
        width: 100%;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items:center;
      }
    }
  }
  .status-connected {
    color: var(--success-color);
  }

  .status-disconnected {
    color: var(--error-color);
  }
}

@media (max-width: 768px) {
  .legion-war-container {
    flex-direction: column;
    margin: 0;
    
    .legion-war-map {
      width: 100%;
      padding: var(--spacing-xs);
      margin-bottom: var(--spacing-md);
      
      .map-title {
        font-size: var(--font-size-sm);
        padding: var(--spacing-xs);
        flex-wrap: wrap;
        gap: 8px;
      }

      .map-container {
        min-height: 50vh;
      }
    }

    .legion-war-operation {
      width: 100%;
      padding: var(--spacing-xs);

      .legion-war-operation-container {
        flex-direction: row; /* Horizontal layout for operations on mobile if space allows, or keep column */
        flex-wrap: wrap;
        gap: var(--spacing-md);

        .legion-war-operation-item {
          width: 100%; /* Keep items full width for better touch targets */
          padding: var(--spacing-xs) 0;
          border-bottom: 1px solid var(--border-light);
          
          &:last-child {
            border-bottom: none;
          }
        }
      }
    }
  }
}
</style>