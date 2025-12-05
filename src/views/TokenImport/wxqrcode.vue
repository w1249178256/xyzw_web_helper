<template>
  <div class="wx-qrcode-import">
    <!-- 微信登录流程说明 -->
    <div class="login-flow-info">
      <h3>微信扫码登录流程</h3>
      <ol class="flow-steps">
        <li>点击下方按钮获取微信登录二维码</li>
        <li>使用微信扫码并确认登录</li>
        <li>系统将获取<strong color="red">最近一次登录</strong>的角色Token信息</li>
      </ol>
    </div>

    <!-- 二维码显示区域 -->
    <div class="qrcode-container">
      <div v-if="!qrcodeUrl" id="qr-placeholder" class="qr-placeholder" @click="generateQRCode">
        <n-icon size="48" color="var(--text-tertiary)">
          <Scan /> <!-- 使用扫码图标 -->
        </n-icon>
        <p>点击获取微信登录二维码</p>
      </div>
      <img v-else id="qr-image" :src="qrcodeUrl" alt="微信登录二维码" class="qr-image" />

      <!-- 状态信息 -->
      <div id="qr-status" class="qr-status" :class="statusType">{{ statusMessage }}</div>
    </div>

    <!-- 账号名称输入 -->
    <div class="account-name-input">
      <n-input v-model:value="accountName" placeholder="请输入账号名称（例如：微信账号1）" :disabled="isProcessing">
        <template #prefix>
          <n-icon>
            <PersonCircleOutline />
          </n-icon>
        </template>
      </n-input>
    </div>

    <!-- 操作按钮 -->
    <div class="form-actions">
      <n-button type="primary" block @click="generateQRCode" :loading="isProcessing">
        <template #icon>
          <n-icon>
            <Refresh />
          </n-icon>
        </template>
        {{ qrcodeUrl ? '刷新二维码' : '获取二维码' }}
      </n-button>

      <n-button block @click="$emit('cancel')" :disabled="isProcessing">
        <template #icon>
          <n-icon>
            <Close />
          </n-icon>
        </template>
        取消
      </n-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Scan, PersonCircleOutline, Refresh, Close } from '@vicons/ionicons5'
import { NIcon, useMessage } from 'naive-ui'
import { transformToken } from '@/utils/token';
import useIndexedDB from '@/hooks/useIndexedDB';
import { useTokenStore } from '@/stores/tokenStore';


const tokenStore = useTokenStore();

const {
  storeArrayBuffer
} = useIndexedDB();

const message = useMessage()

const importForm = reactive({
  name: '',
  server: '',
  wsUrl: ''
});

// 定义事件
const emit = defineEmits(['cancel', 'ok'])

// 响应式数据
const qrcodeUrl = ref(null)
const qrcodeUUID = ref(null)
const isProcessing = ref(false)
const statusMessage = ref('点击获取微信登录二维码')
const statusType = ref('info')
const accountName = ref(null)
const isScanning = ref(false)
const scanInterval = ref(null)
const timeout = 120000 // 120秒超时
const startTime = ref(null)

/**
 * 生成微信登录二维码
 */
const generateQRCode = async () => {
  try {
    isProcessing.value = true
    updateStatus('正在获取二维码...', 'info')

    // 重置状态
    resetQRCode()

    // 调用获取二维码接口
    const success = await tryGetWeixinQR()

    if (!success) {
      throw new Error('二维码获取失败')
    }
  } catch (error) {
    updateStatus('二维码获取失败：' + error.message, 'error')
    console.error('获取二维码失败:', error)
  } finally {
    isProcessing.value = false
  }
}

/**
 * 尝试获取微信二维码
 */
const tryGetWeixinQR = async () => {
  try {
    const qrPageUrl =
      '/api/weixin/connect/app/qrconnect' +
      '?appid=wxfb0d5667e5cb1c44' +
      '&bundleid=com.hortor.games.xyzw' +
      '&scope=snsapi_base,snsapi_userinfo,snsapi_friend,snsapi_message' +
      '&state=weixin'

    const response = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('GET', qrPageUrl, true)
      xhr.timeout = 15000
      xhr.setRequestHeader('Accept', 'text/html')
      xhr.onload = () => resolve(xhr)
      xhr.onerror = () => reject(new Error('网络错误'))
      xhr.ontimeout = () => reject(new Error('请求超时'))
      xhr.send()
    })

    if (response.status !== 200) {
      throw new Error('HTTP 状态码：' + response.status)
    }

    const html = response.responseText
    const doc = new DOMParser().parseFromString(html, 'text/html')

    let qrUrl = doc.querySelector('img.auth_qrcode')?.src

    if (!qrUrl) {
      const m = html.match(/https:\/\/[^"']*qrcode[^"']*/i)
      if (m) qrUrl = m[0]
    }

    if (!qrUrl) {
      throw new Error('未找到二维码图片地址')
    }

    // 解析 uuid
    qrcodeUUID.value = qrUrl.split('/').pop().split('?')[0]
    qrcodeUrl.value = qrUrl

    // 更新状态
    updateStatus('请使用微信扫码登录', 'success')

    // 开始轮询扫码状态
    startScanMonitoring()
    return true

  } catch (err) {
    console.error('二维码解析失败:', err)
    updateStatus('二维码获取失败：' + err.message, 'error')
    return false
  }
}

/**
 * 开始轮询扫码状态
 */
const startScanMonitoring = () => {
  if (isScanning.value) return

  isScanning.value = true
  startTime.value = Date.now()

  scanInterval.value = setInterval(() => {
    checkScanStatus()
  }, 1000)
}

/**
 * 检查扫码状态
 */
const checkScanStatus = async () => {
  try {
    if (!qrcodeUUID.value) return

    const elapsed = Date.now() - startTime.value
    if (elapsed > timeout) {
      updateStatus('二维码已超时，请重新获取', 'error')
      stopScanMonitoring()
      resetQRCode()
      return
    }

    // 使用微信官方推荐的扫码状态轮询路径
    const url =
      '/api/weixin/connect/l/qrconnect?uuid=' +
      qrcodeUUID.value +
      '&f=url&_=' + Date.now()

    const res = await new Promise(resolve => {
      const xhr = new XMLHttpRequest()
      xhr.open('GET', url, true)
      xhr.timeout = 5000
      xhr.setRequestHeader('Accept', '*/*')
      xhr.onload = () => resolve(xhr)
      xhr.onerror = () => resolve({ status: 0 })
      xhr.ontimeout = () => resolve({ status: 0 })
      xhr.send()
    })

    if (res.status === 200) {
      const text = res.responseText

      // 405 → 扫码确认
      if (text.includes('window.wx_errcode=405')) {
        // 提取code
        const codeMatch = text.match(/wx_redirecturl='[^']*code=([a-zA-Z0-9]+)/)
        // 提取nickname
        const nicknameMatch = text.match(/window\.wx_nickname\s*=\s*['"]([^'"]+)['"]/)

        if (codeMatch) {
          const code = codeMatch[1]
          const nickname = nicknameMatch ? nicknameMatch[1] : ''

          stopScanMonitoring()
          updateStatus(`扫码成功，正在登录... 用户：${nickname || '未知用户'}`, 'success')
          await handleScanSuccess(code, nickname)
          return
        }
      }

      // 408 → 已过期
      if (text.includes('window.wx_errcode=408')) {
        updateStatus('二维码已过期，请重新生成', 'error')
        stopScanMonitoring()
        resetQRCode()
        return
      }
    }

    // 每30秒提醒一次
    const remain = Math.ceil((timeout - elapsed) / 1000)
    if (remain % 30 === 0) {
      updateStatus(`请扫码，剩余 ${remain} 秒`, 'info')
    }

  } catch (err) {
    console.error('扫码状态检查失败:', err)
  }
}

/**
 * 停止扫码监控
 */
const stopScanMonitoring = () => {
  isScanning.value = false
  if (scanInterval.value) {
    clearInterval(scanInterval.value)
    scanInterval.value = null
  }
}

/**
 * 处理扫码成功
 */
const handleScanSuccess = async (code, nickname = '') => {
  try {
    isProcessing.value = true

    // 获取加密数据
    const encrypted = await getEncryptedData(code)
    if (encrypted) {
      await saveAccount(encrypted, nickname)
    }
  } catch (err) {
    updateStatus('处理失败：' + err.message, 'error')
    console.error('扫码处理失败:', err)
  } finally {
    isProcessing.value = false
  }
}

/**
 * 请求Hortor登录接口，并用encodePayload加密
 */
const getEncryptedData = async (code) => {
  const payload = {
    gameId: "xyzwapp",
    code,
    gameTp: "app",
    sysInfo: '{"system":"Android","hortorSDKVersion":"4.0.6-cn","model":"22081212C","brand":"Redmi"}',
    channel: "android",
    appFrom: "com.tencent.mm",
    noLogin: "2",
    distinctId: "DID-a38175b7-14ce-4b36-aa89-3e092ea03ea6",
    state: "hortor",
    packageName: "com.hortor.games.xyzw",
    tp: "app-we",
    signPrint: "E6:F7:FE:A9:EC:8E:24:D0:4F:2A:32:50:28:78:E1:C5:5E:70:81:13",
  }

  const rawJson = JSON.stringify(payload)
  console.log('原始登录 JSON:', rawJson)

  // 调用encodePayload加密
  const encoded = encodePayload(rawJson)

  try {
    console.log('加密后的登录 JSON:', encoded)
    console.log('解密:', decodePayload(encoded))
  } catch (err) {
  }

  const loginUrl =
    "/api/hortor/comb-login-server/api/v1/login" +
    "?gameId=xyzwapp" +
    "&timestamp=" + Date.now() +
    "&version=android-4.2.1-cn-release" +
    "&cryptVersion=1.1.0" +
    "&gameTp=app&system=android" +
    "&deviceUniqueId=DID-0e782e88-2f3b-4f5b-9020-47f5e5a5a026" +
    "&packageName=com.hortorgames.xyzw"

  const res = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", loginUrl, true)
    xhr.timeout = 15000
    xhr.setRequestHeader("Accept", "*/*")
    xhr.setRequestHeader("Content-Type", "text/plain; charset=utf-8")
    xhr.onload = () => resolve(xhr)
    xhr.onerror = () => reject(new Error("登录失败"))
    xhr.ontimeout = () => reject(new Error("登录超时"))
    xhr.send(encoded)
  })

  if (res.status !== 200) {
    throw new Error("HTTP 状态码：" + res.status)
  }

  const json = JSON.parse(res.responseText)
  if (json.meta?.errCode !== 0) {
    throw new Error("登录失败：" + json.meta?.errMsg)
  }

  const combUser = json.data?.combUser
  if (!combUser) {
    throw new Error("登录响应结构异常")
  }
  console.log('combUser:', combUser)

  // 这里简化处理，实际应该调用游戏加密模块生成bin
  // 由于是前端环境，我们模拟生成一个token
  const dm = window.__require?.("13");
  if (!dm?.encMsg || !dm?.lz4XorEncode)
    throw new Error("游戏加密模块未加载，不能生成 bin");

  const encryptedBuffer = dm.encMsg(
    {
      platform: "hortor",
      platformExt: "mix",
      info: combUser,
      serverId: null,
      scene: 0,
      referrerInfo: ""
    },
    { decrypt: dm.lz4XorDecode, encrypt: dm.lz4XorEncode }
  );

  return new Uint8Array(encryptedBuffer);

}

/**
 * 将登录JSON文本编码成最终payload
 */
const encodePayload = (text) => {
  // 注意：这个超长字符串必须和原脚本里的一模一样！
  const cipherTable = "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"

  const xorShift = 1
  const shuffleTimes = 6
  const step = 3

  console.log('原始文本长度:', text.length)
  const mid = codeBase64(text, cipherTable, shuffleTimes, step, xorShift)
  console.log('codeBase64:', mid?.substring(0, 100) + '...')
  const final = encodeBase64(mid)
  console.log('编码结果长度:', final?.length)
  return final
}

const decodePayload = (cipherText) => {
  const xorShift = 1;
  const shuffleTimes = 6;
  const step = 3;

  const cipherTable = encodePayload.toString().match(/const cipherTable = "([^"]+)"/)[1]

  const mid = atob(cipherText);
  const shuffled = transCode(cipherTable, shuffleTimes);
  const key = getCodeKey(shuffled, step);
  const base64Text = dealWithString(mid, key, xorShift);
  return decodeURIComponent(escape(atob(base64Text)));
};

const codeBase64 = (text, cipherTable, shuffleTimes, step, xorShift) => {
  const base64Text = encodeBase64(text)
  if (cipherTable) {
    const shuffled = transCode(cipherTable, shuffleTimes)
    const key = getCodeKey(shuffled, step)
    return dealWithString(base64Text, key, xorShift)
  }
  return null
}

const encodeBase64 = (text) => {
  if (!text) return null
  return btoa(unescape(encodeURIComponent(text)))
}

const transCode = (str, times) => {
  if (times <= 0) return str
  if (str.length % 2 !== 0) return null

  const right = rightSide(str)
  const left = leftSide(str)
  return transCode(right, times - 1) + transCode(left, times - 1)
}

const rightSide = (str) => {
  if (str.length % 2 !== 0) return null
  return str.substring(Math.floor(str.length / 2))
}

const leftSide = (str) => {
  if (str.length % 2 !== 0) return null
  return str.substring(0, Math.floor(str.length / 2))
}

const getCodeKey = (str, step) => {
  const chars = str.split("")
  const result = []
  const count = Math.floor(str.length / step)
  for (let i = 0; i < count; i++) {
    result.push(chars[i * step])
  }
  return result.join("")
}

const dealWithString = (src, key, shift) => {
  if (!src || !key) return null

  const v = src.split("")
  const w = key.split("")
  const out = new Array(v.length)

  let idx = w.length >> shift
  for (let i = 0; i < v.length; i++) {
    if (idx >= w.length) idx = 0
    out[i] = String.fromCharCode(
      v[i].charCodeAt(0) ^ w[idx].charCodeAt(0)
    )
    idx++
  }
  return out.join("")
}

/**
 * 保存账号
 */
const saveAccount = async (arrBuf, nickname = '') => {
  let name = accountName.value?.trim()
 
  console.log('name:', name)

  const bin = new Uint8Array(arrBuf)
  console.log('bin:', bin)
  const roleToken = await transformToken(bin.buffer);
  const roleTokenJson = JSON.parse(roleToken)
  console.log('roleTokenJson.roleId:', roleTokenJson.roleId)
   // 如果没有输入账号名称，使用nickname作为默认值
   if (!name) {
    name = nickname || '微信账号_' + new Date().getTime()
    name += "-" + roleTokenJson.roleId;
  }
  const roleName = name
  const role = {
    name: roleName,
    token: roleToken,
    server: '',
    wsUrl: importForm.wsUrl || ''
  }
  // 刷新indexDB数据库token数据
  storeArrayBuffer(roleName, bin);

  const gameToken = tokenStore.gameTokens.find(t => t.name === roleName);
  if (gameToken) {
    console.log('移除同名token:', gameToken);
    tokenStore.updateToken(gameToken.id, {
      ...role
    });
  } else {
    tokenStore.addToken({
      ...role
    });
  }
  downloadBinFile(name + '.bin', bin)

  // 保存成功后关闭弹窗
  emit('ok')

}

const convertBin = (hex) => {
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2)
    bytes.push(parseInt(hex.substr(i, 2), 16));

  return new Uint8Array(bytes);
}

const downloadBinFile = (fileName, bin) => {
  const blob = new Blob([new Uint8Array(bin)], { type: "application/octet-stream" });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
}

/**
 * 将字符串转换为 Uint8Array（UTF-8 编码）
 * @param {string} str - 输入字符串
 * @returns {Uint8Array} 字节数组
 */
const stringToUint8Array = (str) => {
  // 使用 TextEncoder 按 UTF-8 编码转换字符串为字节数组
  const encoder = new TextEncoder();
  return encoder.encode(str);
};


/**
 * 将 Uint8Array 字节数组转换为十六进制字符串
 * @param {Uint8Array} uint8Array - 输入的字节数组
 * @param {boolean} [uppercase=true] - 是否返回大写的十六进制字符串，默认 true
 * @returns {string} 十六进制字符串
 */
const convertUint8ArrayToHex = (uint8Array, uppercase = true) => {
  if (!(uint8Array instanceof Uint8Array)) {
    throw new Error("输入必须是 Uint8Array 类型的字节数组");
  }
  const hexStrings = Array.from(uint8Array).map(byte => {
    let hex = byte.toString(16).padStart(2, '0');
    return uppercase ? hex.toUpperCase() : hex.toLowerCase();
  });
  return hexStrings.join('');
};

/**
 * 更新状态信息
 */
const updateStatus = (message, type = 'info') => {
  statusMessage.value = message
  statusType.value = type
}

/**
 * 重置二维码状态
 */
const resetQRCode = () => {
  stopScanMonitoring()
  qrcodeUUID.value = null
  qrcodeUrl.value = null
  updateStatus('点击获取微信登录二维码', 'info')
}

// 生命周期
onMounted(() => {
  // 组件挂载时的初始化逻辑
})

onUnmounted(() => {
  // 组件卸载时清理资源
  stopScanMonitoring()
})
</script>

<style scoped lang="scss">
.wx-qrcode-import {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg) 0;
}

.login-flow-info {
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-medium);
  padding: var(--spacing-md);

  h3 {
    margin: 0 0 var(--spacing-sm) 0;
    color: var(--text-primary);
    font-size: var(--font-size-md);
  }

  .flow-steps {
    margin: 0;
    padding-left: var(--spacing-lg);
    color: var(--text-secondary);

    li {
      margin-bottom: var(--spacing-xs);
      font-size: var(--font-size-sm);
    }
  }
}

.qrcode-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xl) 0;
}

.qr-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 200px;
  height: 200px;
  border: 2px dashed var(--border-light);
  border-radius: var(--border-radius-medium);
  cursor: pointer;
  transition: all var(--transition-normal);
  background: var(--bg-tertiary);

  &:hover {
    border-color: var(--primary-color);
    background: rgba(102, 126, 234, 0.05);
  }

  p {
    margin: var(--spacing-sm) 0 0 0;
    color: var(--text-tertiary);
    font-size: var(--font-size-sm);
  }
}

.qr-image {
  width: 200px;
  height: 200px;
  border: 2px solid var(--border-light);
  border-radius: var(--border-radius-medium);
  cursor: pointer;
  transition: all var(--transition-normal);

  &:hover {
    border-color: var(--primary-color);
    box-shadow: var(--shadow-small);
  }
}

.qr-status {
  margin-top: var(--spacing-xs);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-align: center;
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--border-radius-small);

  &.info {
    color: var(--text-secondary);
    background: var(--bg-tertiary);
  }

  &.success {
    color: var(--success-color);
    background: rgba(16, 185, 129, 0.1);
  }

  &.error {
    color: var(--error-color);
    background: rgba(239, 68, 68, 0.1);
  }
}

.account-name-input {
  margin-top: var(--spacing-md);
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
}
</style>