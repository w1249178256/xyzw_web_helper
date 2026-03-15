<template>
  <MyCard class="helper" status-class="active">
    <template #icon>
      <n-icon size="24">
        <Fish />
      </n-icon>
    </template>
    <template #title>
      <h3>灯神信息</h3>
    </template>
    <template #default>
      <!-- 第一行：阵容信息表格 -->
      <div class="team-table-container">
        <table class="team-table">
          <thead>
            <tr>
              <th>阵容</th>
              <th v-for="i in 5" :key="i">位置{{ i }}</th>
              <th>科技</th>
            </tr>
          </thead>
          <tbody>
            <tr :class="{ 'current-team': currentUseTeamId === 1 }">
              <td>阵容1</td>
              <td v-for="i in 5" :key="i">
                <div v-if="teamInfo[1] && teamInfo[1][i-1]">
                  <div class="hero-info">
                    <div class="hero-level">{{ teamInfo[1][i-1].level }}级</div>
                    <div class="hero-name">{{ getHeroName(teamInfo[1][i-1].heroId) }}</div>
                    <div class="hero-star">{{ getStarDisplay(teamInfo[1][i-1].star) }}</div>
                  </div>
                </div>
                <div v-else class="empty-slot">空位</div>
              </td>
              <td class="tech-cell">
                <div class="tech-info">
                  <div class="tech-item">{{ getTopTechInfo(1) }}</div>
                  <div class="tech-item">{{ getSecondTechInfo(1) }}</div>
                </div>
              </td>
            </tr>
            <tr :class="{ 'current-team': currentUseTeamId === 2 }">
              <td>阵容2</td>
              <td v-for="i in 5" :key="i">
                <div v-if="teamInfo[2] && teamInfo[2][i-1]">
                  <div class="hero-info">
                    <div class="hero-level">{{ teamInfo[2][i-1].level }}级</div>
                    <div class="hero-name">{{ getHeroName(teamInfo[2][i-1].heroId) }}</div>
                    <div class="hero-star">{{ getStarDisplay(teamInfo[2][i-1].star) }}</div>
                  </div>
                </div>
                <div v-else class="empty-slot">空位</div>
              </td>
              <td class="tech-cell">
                <div class="tech-info">
                  <div class="tech-item">{{ getTopTechInfo(2) }}</div>
                  <div class="tech-item">{{ getSecondTechInfo(2) }}</div>
                </div>
              </td>
            </tr>
            <tr class="lampgod-levels-row">
              <td>灯神层数</td>
              <td>{{ lampGodLevels['1'] }}<br><small>魏国</small></td>
              <td>{{ lampGodLevels['2'] }}<br><small>蜀国</small></td>
              <td>{{ lampGodLevels['3'] }}<br><small>吴国</small></td>
              <td>{{ lampGodLevels['4'] }}<br><small>群雄</small></td>
              <td>{{ lampGodLevels['5'] }}<br><small>深海</small></td>
              <td class="sweep-carpet-col">{{ sweepCarpetCount }}<br><small>扫荡魔毯</small></td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- 所有按钮放到一个容器中 -->
      <CustomizedCard mode="container">
        <CustomizedCard mode="name-switch" name="魏国" :switch-value="lampGodSelection.wei" @update:switch-value="(val) => handleLampGodSwitch('wei', val)" />
        <CustomizedCard mode="name-switch" name="蜀国" :switch-value="lampGodSelection.shu" @update:switch-value="(val) => handleLampGodSwitch('shu', val)" />
        <CustomizedCard mode="name-switch" name="吴国" :switch-value="lampGodSelection.wu" @update:switch-value="(val) => handleLampGodSwitch('wu', val)" />
        <CustomizedCard mode="name-switch" name="群雄" :switch-value="lampGodSelection.qunxiong" @update:switch-value="(val) => handleLampGodSwitch('qunxiong', val)" />
        <CustomizedCard mode="name-switch" name="爬塔" :switch-value="lampGodSelection.tower" @update:switch-value="(val) => handleLampGodSwitch('tower', val)" />
        <CustomizedCard mode="name-switch" name="深海" :switch-value="lampGodSelection.deepsea" @update:switch-value="(val) => handleLampGodSwitch('deepsea', val)" />
        <CustomizedCard mode="button" name="刷新阵容" :disabled="!selectedTokenId" @button-click="refreshTeamInfo" />
        <CustomizedCard mode="button" name="刷新灯神" :disabled="!selectedTokenId" @button-click="refreshLampGodInfo" />
        <CustomizedCard mode="button" name="切换阵1" :disabled="!selectedTokenId" @button-click="switchToTeam1" />
        <CustomizedCard mode="button" name="切换阵容" :disabled="!selectedTokenId" @button-click="switchTeam" />
        <CustomizedCard mode="button" name="更换科技" :disabled="!selectedTokenId" @button-click="changeTech" />
        <CustomizedCard mode="button" name="单个灯神战斗" :disabled="!selectedTokenId" @button-click="lampGodFight" />
        <CustomizedCard mode="button" name="灯神按钮" :disabled="!selectedTokenId" @button-click="lampGodAction" />
        <CustomizedCard mode="button" name="扫荡" :disabled="!selectedTokenId" @button-click="sweepAction" />
      </CustomizedCard>
      
      <!-- 新增容器：执行范围及批量操作 -->
      <CustomizedCard mode="container">
        <CustomizedCard mode="execution-range" name="执行范围" v-model:inputValue="lampGodTokens" placeholder="留空执行全部，或输入 1-20 或 1,2,3" @update:inputValue="handleLampGodTokensInput" />
        <CustomizedCard mode="button" name="导出灯神信息" :disabled="isExportingLampGodInfo" @button-click="exportLampGodInfo" />
        <CustomizedCard mode="button" name="批量灯神" :disabled="tokenStore.gameTokens.length === 0" @button-click="batchLampGodFight" />
        <CustomizedCard mode="button" name="批量扫荡" :disabled="tokenStore.gameTokens.length === 0" @button-click="batchSweepAction" />
        <CustomizedCard 
          mode="name-select" 
          name="选择玩具" 
          :select-value="selectedWeaponId" 
          :select-options="weaponOptions"
          @update:select-value="handleWeaponSelect" 
        />
        <CustomizedCard 
          mode="name-select" 
          name="执行次数" 
          :select-value="lampGodFightCount" 
          :select-options="lampGodFightCountOptions"
          @update:select-value="handleLampGodFightCountSelect" 
        />
      </CustomizedCard>
      
      <!-- 操作日志 -->
      <OperationLogCard 
        page="shidian" 
        card-type="灯神信息"
        :filter-operations="['刷新灯神信息', '灯神按钮', '切换灯神阵容', '更换科技', '灯神战斗', '批量灯神战斗', '导出灯神信息']"
      />
    </template>
  </MyCard>
</template>

<script setup>
// @unocss-include
// uno-css-ignore-file
import { defineProps, ref, computed, watch } from 'vue'
import { useTokenStore } from '@/stores/tokenStore'
import { useMessage } from 'naive-ui'
import { logOperation } from '@/utils/operationLogger'
import MyCard from '@/components/Common/MyCard.vue'
import CustomizedCard from '@/diy/CustomizedCard.vue'
import OperationLogCard from '@/diy/ShiDian/OperationLogCard.vue'
import { Fish } from '@vicons/ionicons5'
import { HERO_DICT } from '@/utils/HeroList.js'
import ConnectionPoolManager from '@/utils/connectionPoolManager'

const tokenStore = useTokenStore()
const message = useMessage()

// 初始化连接池管理器
const connectionPool = new ConnectionPoolManager(tokenStore, {
  maxConnections: 1,
  connectionTimeout: 30000,
  reconnectDelay: 1000,
  maxRetries: 3
});

const props = defineProps({
  selectedTokenId: {
    type: String,
    default: null
  }
})

// 阵容信息
const teamInfo = ref({})
const currentUseTeamId = ref(1)

// 灯神层数信息
const lampGodLevels = ref({
  1: '-', // 魏国
  2: '-', // 蜀国
  3: '-', // 吴国
  4: '-', // 群雄
  5: '-'  // 深海
})

// 扫荡魔毯数量
const sweepCarpetCount = ref('-')

// 科技类型映射
const techTypeMap = {
  1: '战士',
  6: '肉盾',
  5: '辅助',
  2: '法师',
  4: '刺客',
  3: '射手'
}

// 灯神类型名称映射（中文 -> 英文键）
const lampGodTypeNameMap = {
  '魏国': 'wei',
  '蜀国': 'shu',
  '吴国': 'wu',
  '群雄': 'qunxiong',
  '爬塔': 'tower',
  '深海': 'deepsea'
}

// 灯神阵容配置
const lampGodConfigs = {
  tower: {
    heroes: [116, 102, 107, 104, 112],
    techs: ['战士', '法师', '射手']
  },
  wei: {
    heroes: [202, 113, 101, 102, 109],
    techs: ['法师', '辅助', '肉盾']
  },
  shu: {
    heroes: [206, 220, 118, 104, 110],
    techs: ['刺客', '法师', '射手']
  },
  wu: {
    heroes: [209, 111, 106, 105, 119],
    techs: ['射手', '肉盾', '辅助']
  },
  qunxiong: {
    heroes: [116, 120, 107, 112, 312],
    techs: ['战士', '刺客', '法师']
  },
  deepsea: {
    heroes: [112, 116, 107, 104, 210],
    techs: ['战士', '法师', '刺客']
  }
}

const lampGodTokens = ref('')
const isExportingLampGodInfo = ref(false)
const lampGodSelection = ref({
  wei: false,
  shu: false,
  wu: false,
  qunxiong: false,
  tower: false,
  deepsea: false
})

const selectedWeaponId = ref(3)

const weaponOptions = [
  { label: '未激活', value: 0 },
  { label: '一支穿云箭', value: 1 },
  { label: '皮鞋手机', value: 2 },
  { label: '懦弱百合', value: 3 },
  { label: '正义喇叭', value: 4 },
  { label: '祖传大饼', value: 5 },
  { label: '冰镇啤酒', value: 6 },
  { label: '导演话筒', value: 7 },
  { label: '驱蚊花露水', value: 8 },
  { label: '止痒花露水', value: 9 }
]

const lampGodFightCount = ref(10)

const lampGodFightCountOptions = [
  { label: '5', value: 5 },
  { label: '10', value: 10 }
]

const handleWeaponSelect = (value) => {
  selectedWeaponId.value = value
}

const handleLampGodFightCountSelect = (value) => {
  lampGodFightCount.value = value
}

const handleLampGodTokensInput = (value) => {
  lampGodTokens.value = value
}

// 处理灯神开关切换
const handleLampGodSwitch = (type, value) => {
  lampGodSelection.value[type] = value
}

// 获取英雄名称
const getHeroName = (heroId) => {
  // 使用完整的武将字典
  const heroInfo = HERO_DICT[heroId]
  return heroInfo ? heroInfo.name : `武将${heroId}`
}

// 获取星级显示
const getStarDisplay = (star) => {
  return `${star}星`
}

// 获取科技信息
const getTechInfo = () => {
  // 使用当前选中的token
  const token = tokenStore.selectedToken
  if (!token || !token.id) {
    return null
  }
  
  // 优先从全局 gameData.roleInfo 获取（如果当前选中的是这个token）
  if (tokenStore.selectedTokenId === token.id && tokenStore.gameData?.roleInfo) {
    const roleInfo = tokenStore.gameData.roleInfo
    if (!roleInfo.role || !roleInfo.role.legionResearch) {
      return null
    }
    return roleInfo.role.legionResearch || {}
  }
  
  // 兼容：从 token.gameData.roleInfo 获取
  if (token && token.gameData && token.gameData.roleInfo) {
    const roleInfo = token.gameData.roleInfo
    if (!roleInfo.role || !roleInfo.role.legionResearch) {
      return null
    }
    return roleInfo.role.legionResearch || {}
  }
  
  return null
}

// 获取阵容的科技信息
const getTeamTechInfo = (teamId) => {
  const techInfo = getTechInfo()
  if (!techInfo) {
    return []
  }
  
  // 计算每种科技类型的总点数
  // 战士：101-108 -> 类型1
  // 肉盾：601-608 -> 类型6
  // 辅助：501-508 -> 类型5
  // 法师：201-208 -> 类型2
  // 刺客：401-408 -> 类型4
  // 射手：301-308 -> 类型3
  const teamTechs = []
  
  for (let techType = 1; techType <= 6; techType++) {
    let totalPoints = 0
    
    // 计算当前科技类型的所有子项目点数
    for (let subIndex = 1; subIndex <= 8; subIndex++) {
      const techKey = `${techType}${subIndex.toString().padStart(2, '0')}` // 如 "101", "102", ..., "108"
      const points = techInfo[techKey] || 0
      totalPoints += points
    }
    
    if (totalPoints > 0) {
      teamTechs.push({
        type: techType,
        name: techTypeMap[techType],
        points: totalPoints
      })
    }
  }
  
  return teamTechs
}

// 获取科技点数最高的2个科技
const getTopTechs = (teamId) => {
  const techs = getTeamTechInfo(teamId)
  if (techs.length === 0) {
    return []
  }
  
  return techs.sort((a, b) => b.points - a.points).slice(0, 2)
}

// 获取科技点数最高的科技信息
const getTopTechInfo = (teamId) => {
  const topTechs = getTopTechs(teamId)
  if (topTechs.length === 0) {
    return '无'
  }
  
  return `${topTechs[0].name}(${topTechs[0].points})`
}

// 获取科技点数第二高的科技信息
const getSecondTechInfo = (teamId) => {
  const topTechs = getTopTechs(teamId)
  if (topTechs.length < 2) {
    return '无'
  }
  
  return `${topTechs[1].name}(${topTechs[1].points})`
}

// 刷新阵容信息
const refreshTeamInfo = async () => {
  // 使用当前选中的token，而不是props.selectedTokenId
  const token = tokenStore.selectedToken
  if (!token || !token.id) {
    message.warning('请先选择Token')
    return
  }
  
  if (!token) {
    message.error('Token不存在')
    return
  }
  
  const status = tokenStore.getWebSocketStatus(token.id)
  if (status !== 'connected') {
    message.error('WebSocket未连接，请先连接Token')
    return
  }
  
  try {
    message.info('正在刷新阵容信息...')
    
    // 1. 使用fight_startlevel获取当前阵容
    // 执行命令前等待400ms
    await new Promise(resolve => setTimeout(resolve, 400))
    const fightResult = await tokenStore.sendFightStartLevel(token.id, {})
    console.log('fight_startlevel 原始响应:', fightResult)
    
    // 提取并显示阵容英雄名称
    let heroNames = []
    if (fightResult && fightResult.battleData && fightResult.battleData.leftTeam && fightResult.battleData.leftTeam.team) {
      const team = fightResult.battleData.leftTeam.team
      for (let i = 0; i < 5; i++) {
        const hero = team[String(i)] || team[i]
        if (hero && hero.id) {
          heroNames.push(getHeroName(hero.id))
        }
      }
    }    
    const tokenIndex = getTokenIndex(token)
    logOperation('shidian', '刷新阵容', {
      cardType: '灯神信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'info',
      message: `${tokenIndex}、${token.name || token.id}、执行命令: fight_startlevel, 获取阵容: ${heroNames.join(', ') || '无'}`
    })
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 2. 使用presetteam_getinfo获取useTeamId
    // 执行命令前等待400ms
    await new Promise(resolve => setTimeout(resolve, 400))
    const teamInfoRes = await tokenStore.sendPresetteamGetInfo(token.id, {})
    console.log('presetteam_getinfo 原始响应:', teamInfoRes)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 3. 使用role_getroleinfo获取角色科技信息
    // 执行命令前等待400ms
    await new Promise(resolve => setTimeout(resolve, 400))
    const roleInfoRes = await tokenStore.sendGetRoleInfo(token.id, {})
    console.log('role_getroleinfo 原始响应:', roleInfoRes)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const extractedTeamInfo = {}
    
    // 从fight_startlevel结果中提取当前阵容
    // fight_startlevel 响应结构: { battleData: { leftTeam: { team: { "0": {...}, "1": {...} } } } }
    let battleTeam = null
    if (fightResult && fightResult.battleData && fightResult.battleData.leftTeam && fightResult.battleData.leftTeam.team) {
      battleTeam = fightResult.battleData.leftTeam.team
      console.log('从 fightResult.battleData.leftTeam.team 获取阵容:', battleTeam)
    } else if (fightResult && fightResult.leftTeam && fightResult.leftTeam.team) {
      // 备选结构
      battleTeam = fightResult.leftTeam.team
      console.log('从 fightResult.leftTeam.team 获取阵容:', battleTeam)
    }
    
    if (battleTeam) {
      const currentBattleTeam = []
      for (let i = 0; i < 5; i++) {
        const hero = battleTeam[String(i)] || battleTeam[i]
        if (hero && hero.id) {
          // 转换格式以兼容现有代码
          currentBattleTeam.push({
            heroId: hero.id,
            level: hero.level,
            star: hero.star,
            order: hero.order,
            color: hero.color,
            power: hero.power || 0
          })
        } else {
          currentBattleTeam.push(null)
        }
      }
      // 将当前实际阵容存储在索引0中（表示当前阵容）
      extractedTeamInfo[0] = currentBattleTeam
      console.log('提取的当前阵容:', currentBattleTeam)
    } else {
      console.warn('无法从 fight_startlevel 响应中提取阵容，响应结构:', fightResult)
    }
    
    // 处理预设阵容信息和useTeamId
    if (teamInfoRes && teamInfoRes.presetTeamInfo) {
      const presetTeamInfo = teamInfoRes.presetTeamInfo.presetTeamInfo || teamInfoRes.presetTeamInfo
      console.log('presetTeamInfo 结构:', presetTeamInfo)
      
      // 获取当前使用的阵容ID
      if (presetTeamInfo.useTeamId !== undefined) {
        currentUseTeamId.value = presetTeamInfo.useTeamId
        message.info(`当前使用阵容ID: ${presetTeamInfo.useTeamId}`)
        
        // 根据useTeamId高亮显示对应的阵容
        if (presetTeamInfo.useTeamId === 1) {
          message.success('当前使用阵容1，已高亮显示')
        } else if (presetTeamInfo.useTeamId === 2) {
          message.success('当前使用阵容2，已高亮显示')
        }
      } else {
        message.warning('未获取到useTeamId，可能当前没有预设阵容')
      }
      
      // 处理阵容1
      console.log('检查阵容1:', presetTeamInfo[1])
      if (presetTeamInfo[1] && presetTeamInfo[1].teamInfo) {
        const team1Info = presetTeamInfo[1].teamInfo
        console.log('阵容1 teamInfo:', team1Info)
        extractedTeamInfo[1] = []
        for (let i = 0; i < 5; i++) {
          const hero = team1Info[String(i)] || team1Info[i]
          if (hero && hero.heroId) {
            extractedTeamInfo[1].push(hero)
          } else {
            extractedTeamInfo[1].push(null)
          }
        }
        console.log('提取的阵容1:', extractedTeamInfo[1])
      } else {
        console.warn('阵容1数据不存在')
      }
      
      // 处理阵容2
      console.log('检查阵容2:', presetTeamInfo[2])
      if (presetTeamInfo[2] && presetTeamInfo[2].teamInfo) {
        const team2Info = presetTeamInfo[2].teamInfo
        console.log('阵容2 teamInfo:', team2Info)
        extractedTeamInfo[2] = []
        for (let i = 0; i < 5; i++) {
          const hero = team2Info[String(i)] || team2Info[i]
          if (hero && hero.heroId) {
            extractedTeamInfo[2].push(hero)
          } else {
            extractedTeamInfo[2].push(null)
          }
        }
        console.log('提取的阵容2:', extractedTeamInfo[2])
      } else {
        console.warn('阵容2数据不存在')
      }
    } else {
      console.warn('presetTeamInfo 不存在')
    }
    
    // 角色信息已经在 sendGetRoleInfo 中更新到全局状态
    console.log('角色信息已通过 sendGetRoleInfo 更新，包含科技信息')
    
    // 根据当前使用的阵容ID，用实际阵容替换对应的预设阵容
    if (currentUseTeamId.value === 1 && extractedTeamInfo[0]) {
      // 用实际阵容替换阵容1
      extractedTeamInfo[1] = [...extractedTeamInfo[0]]
      console.log('使用实际阵容替换阵容1')
    } else if (currentUseTeamId.value === 2 && extractedTeamInfo[0]) {
      // 用实际阵容替换阵容2
      extractedTeamInfo[2] = [...extractedTeamInfo[0]]
      console.log('使用实际阵容替换阵容2')
    }
    
    // 更新阵容信息
    teamInfo.value = { ...extractedTeamInfo }
    console.log('更新后的 teamInfo:', teamInfo.value)
    
    message.success('阵容信息刷新成功')
  } catch (error) {
    console.error('刷新阵容信息失败:', error)
    message.error(`刷新阵容信息失败: ${error.message || '未知错误'}`)
  }
}

// 切换到阵容1
const switchToTeam1 = async () => {
  // 使用当前选中的token，而不是props.selectedTokenId
  const token = tokenStore.selectedToken
  if (!token || !token.id) {
    message.warning('请先选择Token')
    return
  }
  
  if (!token) {
    message.error('Token不存在')
    return
  }
  
  const status = tokenStore.getWebSocketStatus(token.id)
  if (status !== 'connected') {
    message.error('WebSocket未连接，请先连接Token')
    return
  }
  
  // 不再检查当前阵容，直接执行切换阵容1
  try {
    const tokenIndex = getTokenIndex(token)
    message.info('正在切换到阵容1...')
    
    const saveTeamParams = { teamId: 1 }
    // 执行命令前等待400ms
    await new Promise(resolve => setTimeout(resolve, 400))
    await tokenStore.sendPresetteamSaveTeam(token.id, saveTeamParams)
    logOperation('shidian', '切换阵1', {
      cardType: '灯神信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'info',
      message: `${tokenIndex}、${token.name || token.id}、执行命令: presetteam_saveTeam, 保存/切换预设阵容1`
    })
    currentUseTeamId.value = 1
    
    // 刷新阵容信息
    await refreshTeamInfo()
    
    message.success('已切换到阵容1')
    logOperation('shidian', '切换阵1', {
      cardType: '灯神信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: `${tokenIndex}、${token.name || token.id}、已切换到阵容1`
    })
  } catch (error) {
    console.error('切换阵容1失败:', error)
    message.warning(`切换阵容1失败: ${error.message || '未知错误'}，继续执行后续操作`)
    const tokenIndex = getTokenIndex(token)
    logOperation('shidian', '切换阵1', {
      cardType: '灯神信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `${tokenIndex}、${token.name || token.id}、切换阵容1失败: ${error.message || '未知错误'}`
    })
    // 失败后不返回，继续执行后续操作
  }
}

// 切换阵容
const switchTeam = async () => {
  // 使用当前选中的token，而不是props.selectedTokenId
  const token = tokenStore.selectedToken
  if (!token || !token.id) {
    message.warning('请先选择Token')
    return
  }
  
  if (!token) {
    message.error('Token不存在')
    return
  }
  
  const status = tokenStore.getWebSocketStatus(token.id)
  if (status !== 'connected') {
    message.error('WebSocket未连接，请先连接Token')
    return
  }
  
  // 获取选中的灯神类型
  const selectedTypes = []
  if (lampGodSelection.value.wei) selectedTypes.push('wei')
  if (lampGodSelection.value.shu) selectedTypes.push('shu')
  if (lampGodSelection.value.wu) selectedTypes.push('wu')
  if (lampGodSelection.value.qunxiong) selectedTypes.push('qunxiong')
  if (lampGodSelection.value.tower) selectedTypes.push('tower')
  if (lampGodSelection.value.deepsea) selectedTypes.push('deepsea')
  
  if (selectedTypes.length === 0) {
    message.warning('请至少选择一个灯神类型')
    return
  }
  
  const selectedType = selectedTypes[0]
  const config = lampGodConfigs[selectedType]
  
  if (!config) {
    message.warning('未找到对应的阵容配置')
    return
  }
  
  try {
    message.info(`正在切换到${selectedType}阵容...`)
    
    // 使用fight_startlevel获取最新阵容
    message.info('正在获取最新阵容...')
    // 执行命令前等待400ms
    await new Promise(resolve => setTimeout(resolve, 400))
    const fightResult = await tokenStore.sendFightStartLevel(token.id, {})
    
    let currentHeroes = teamInfo.value[1]
    
    // 如果获取到最新阵容，使用它
    if (fightResult && fightResult.body && fightResult.body.battleData && fightResult.body.battleData.leftTeam && fightResult.body.battleData.leftTeam.team) {
      const battleTeam = fightResult.body.battleData.leftTeam.team
      const latestHeroes = []
      for (let i = 0; i < 5; i++) {
        const hero = battleTeam[String(i)] || battleTeam[i]
        if (hero && hero.id) {
          latestHeroes.push({
            heroId: hero.id,
            level: hero.level,
            star: hero.star,
            order: hero.order,
            color: hero.color,
            power: hero.power || 0
          })
        } else {
          latestHeroes.push(null)
        }
      }
      currentHeroes = latestHeroes
      message.success('获取最新阵容成功')
    } else if (!currentHeroes) {
      message.warning('获取最新阵容失败，请先刷新阵容信息')
      return
    }
    
    // 从预设灯神配置获取目标英雄信息
    const targetHeroIds = config.heroes
    
    // 使用hero_exchange更换英雄，将当前阵容切换为预设灯神配置中的英雄
    for (let i = 0; i < Math.min(targetHeroIds.length, currentHeroes.length); i++) {
      const targetHeroId = targetHeroIds[i]
      const currentHero = currentHeroes[i]
      
      if (currentHero && currentHero.heroId !== targetHeroId) {
        try {
          message.info(`正在更换位置${i+1}的英雄: ${getHeroName(currentHero.heroId)} → ${getHeroName(targetHeroId)}`)
          const exchangeParams = {
            heroId: currentHero.heroId,
            targetHeroId: targetHeroId
          }
          // 执行命令前等待400ms
          await new Promise(resolve => setTimeout(resolve, 400))
          await tokenStore.sendHeroExchange(token.id, exchangeParams)
          logOperation('shidian', '切换阵容', {
            cardType: '灯神信息',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `执行命令: hero_exchange, 位置${i+1}: ${getHeroName(currentHero.heroId)} → ${getHeroName(targetHeroId)}`
          })
          message.success(`位置${i+1}英雄更换成功: ${getHeroName(currentHero.heroId)} → ${getHeroName(targetHeroId)}`)
          
          // 每次更换后重新获取最新阵容
          await new Promise(resolve => setTimeout(resolve, 300))
          // 执行命令前等待400ms
          await new Promise(resolve => setTimeout(resolve, 400))
          const refreshResult = await tokenStore.sendFightStartLevel(token.id, {})
          if (refreshResult && refreshResult.battleData && refreshResult.battleData.leftTeam && refreshResult.battleData.leftTeam.team) {
            const battleTeam = refreshResult.battleData.leftTeam.team
            for (let j = 0; j < 5; j++) {
              const hero = battleTeam[String(j)] || battleTeam[j]
              if (hero && hero.id) {
                currentHeroes[j] = {
                  heroId: hero.id,
                  level: hero.level,
                  star: hero.star,
                  order: hero.order,
                  color: hero.color,
                  power: hero.power || 0
                }
              } else {
                currentHeroes[j] = null
              }
            }
          } else if (refreshResult && refreshResult.body && refreshResult.body.battleData && refreshResult.body.battleData.leftTeam && refreshResult.body.battleData.leftTeam.team) {
            const battleTeam = refreshResult.body.battleData.leftTeam.team
            for (let j = 0; j < 5; j++) {
              const hero = battleTeam[String(j)] || battleTeam[j]
              if (hero && hero.id) {
                currentHeroes[j] = {
                  heroId: hero.id,
                  level: hero.level,
                  star: hero.star,
                  order: hero.order,
                  color: hero.color,
                  power: hero.power || 0
                }
              } else {
                currentHeroes[j] = null
              }
            }
          }
          await new Promise(resolve => setTimeout(resolve, 200))
        } catch (error) {
          message.error(`位置${i+1}英雄更换失败: ${getHeroName(currentHero.heroId)} → ${getHeroName(targetHeroId)}`)
          console.error(`更换英雄失败: ${getHeroName(currentHero.heroId)} → ${getHeroName(targetHeroId)}`, error)
        }
      } else if (currentHero) {
        message.info(`位置${i+1}: ${getHeroName(currentHero.heroId)} 已是目标英雄，无需更换`)
      } else {
        message.info(`位置${i+1}: 当前为空位，将添加英雄 ${getHeroName(targetHeroId)}`)
        try {
          // 对于空位，我们只需将目标英雄放入该位置
          const exchangeParams = {
            heroId: targetHeroId,
            targetHeroId: targetHeroId
          }
          // 执行命令前等待400ms
          await new Promise(resolve => setTimeout(resolve, 400))
          await tokenStore.sendHeroExchange(token.id, exchangeParams)
          logOperation('shidian', '切换阵容', {
            cardType: '灯神信息',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `执行命令: hero_exchange, 位置${i+1}: 空位 → ${getHeroName(targetHeroId)}`
          })
          message.success(`位置${i+1}英雄添加成功: ${getHeroName(targetHeroId)}`)
          
          // 每次更换后重新获取最新阵容
          await new Promise(resolve => setTimeout(resolve, 300))
          // 执行命令前等待400ms
          await new Promise(resolve => setTimeout(resolve, 400))
          const refreshResult = await tokenStore.sendFightStartLevel(token.id, {})
          if (refreshResult && refreshResult.battleData && refreshResult.battleData.leftTeam && refreshResult.battleData.leftTeam.team) {
            const battleTeam = refreshResult.battleData.leftTeam.team
            for (let j = 0; j < 5; j++) {
              const hero = battleTeam[String(j)] || battleTeam[j]
              if (hero && hero.id) {
                currentHeroes[j] = {
                  heroId: hero.id,
                  level: hero.level,
                  star: hero.star,
                  order: hero.order,
                  color: hero.color,
                  power: hero.power || 0
                }
              } else {
                currentHeroes[j] = null
              }
            }
          } else if (refreshResult && refreshResult.body && refreshResult.body.battleData && refreshResult.body.battleData.leftTeam && refreshResult.body.battleData.leftTeam.team) {
            const battleTeam = refreshResult.body.battleData.leftTeam.team
            for (let j = 0; j < 5; j++) {
              const hero = battleTeam[String(j)] || battleTeam[j]
              if (hero && hero.id) {
                currentHeroes[j] = {
                  heroId: hero.id,
                  level: hero.level,
                  star: hero.star,
                  order: hero.order,
                  color: hero.color,
                  power: hero.power || 0
                }
              } else {
                currentHeroes[j] = null
              }
            }
          }
          await new Promise(resolve => setTimeout(resolve, 200))
        } catch (error) {
          message.error(`位置${i+1}英雄添加失败: ${getHeroName(targetHeroId)}`)
          console.error(`添加英雄失败: ${getHeroName(targetHeroId)}`, error)
        }
      }
    }
    
    // 切换阵容完成，不执行刷新阵容信息（避免调用presetteam_getinfo）
    // 阵容信息已经在切换过程中使用，无需重新获取
    
    // 更新当前使用的预设阵容显示
    updateCurrentPresetTeam()
    
    message.success(`已切换到${selectedType}阵容`)
    logOperation('shidian', '切换阵容', {
      cardType: '灯神信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: `已切换到${selectedType}阵容`
    })
  } catch (error) {
    console.error('切换阵容失败:', error)
    message.error(`切换阵容失败: ${error.message || '未知错误'}`)
    logOperation('shidian', '切换阵容', {
      cardType: '灯神信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `切换阵容失败: ${error.message || '未知错误'}`
    })
  }
}

// 更新当前使用的预设阵容显示
const updateCurrentPresetTeam = () => {
  // 从 fight_startlevel 获取当前实际阵容
  // 注意：这里需要调用 fight_startlevel 来获取当前实际阵容
  // 但由于切换阵容后立即获取可能还未生效，所以暂时使用 teamInfo[0]（如果存在）
  if (teamInfo.value[0] && currentUseTeamId.value) {
    if (currentUseTeamId.value === 1 && teamInfo.value[1]) {
      // 用实际阵容更新阵容1
      teamInfo.value[1] = [...teamInfo.value[0]]
      console.log('切换阵容后更新阵容1显示')
    } else if (currentUseTeamId.value === 2 && teamInfo.value[2]) {
      // 用实际阵容更新阵容2
      teamInfo.value[2] = [...teamInfo.value[0]]
      console.log('切换阵容后更新阵容2显示')
    }
  }
}

// 更换科技
const changeTech = async () => {
  // 使用当前选中的token，而不是props.selectedTokenId
  const token = tokenStore.selectedToken
  if (!token || !token.id) {
    message.warning('请先选择Token')
    return
  }
  
  if (!token) {
    message.error('Token不存在')
    return
  }
  
  const status = tokenStore.getWebSocketStatus(token.id)
  if (status !== 'connected') {
    message.error('WebSocket未连接，请先连接Token')
    return
  }
  
  // 获取选中的灯神类型
  const selectedTypes = []
  if (lampGodSelection.value.wei) selectedTypes.push('wei')
  if (lampGodSelection.value.shu) selectedTypes.push('shu')
  if (lampGodSelection.value.wu) selectedTypes.push('wu')
  if (lampGodSelection.value.qunxiong) selectedTypes.push('qunxiong')
  if (lampGodSelection.value.tower) selectedTypes.push('tower')
  if (lampGodSelection.value.deepsea) selectedTypes.push('deepsea')
  
  if (selectedTypes.length === 0) {
    message.warning('请至少选择一个灯神类型')
    return
  }
  
  const selectedType = selectedTypes[0]
  const config = lampGodConfigs[selectedType]
  
  if (!config) {
    message.warning('未找到对应的科技配置')
    return
  }
  
  try {
      message.info(`正在更换为${selectedType}科技...`)
      
      // 1. 根据选中的灯神类型获取目标科技配置
      const targetTechNames = config.techs // 例如 ["战士", "刺客", "法师"]
      const targetTechTypes = targetTechNames.map(techName => {
        const type = Object.keys(techTypeMap).find(key => techTypeMap[key] === techName)
        return parseInt(type)
      })
      
      message.info(`目标科技配置: ${targetTechNames.join(', ')}`)
      
      // 执行一次 legion_resetresearch 命令，参数advanced:false, type:params.type
      // type 参数从 1 到 6（advanced: false）
      message.info('开始执行军团重置研究...')
      for (let type = 1; type <= 6; type++) {
        try {
          const resetParams = {
            type: type,
            advanced: false
          }
          message.info(`执行军团重置研究: type=${type}, advanced=false`)
          const result = await tokenStore.sendLegionResetResearch(token.id, resetParams)
          
          // 检查是否收到资源不足的提示
          if (result && (result.msg || '').includes('资源不足') || 
              (result._raw && result._raw.body && result._raw.body.msg && result._raw.body.msg.includes('资源不足'))) {
            message.warning(`军团重置研究收到资源不足提示，停止执行`)
            logOperation('shidian', '更换科技', {
              cardType: '灯神信息',
              tokenId: token.id,
              tokenName: token.name,
              status: 'warning',
              message: `执行命令: legion_resetresearch, 参数: ${JSON.stringify(resetParams)} - 资源不足，停止执行`
            })
            return
          }
          
          message.success(`军团重置研究成功: type=${type}, advanced=false`)
          
          // 记录操作日志
          logOperation('shidian', '更换科技', {
            cardType: '灯神信息',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `执行命令: legion_resetresearch, 参数: ${JSON.stringify(resetParams)}`
          })
          
          // 每次执行间隔：500ms
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (error) {
          console.error(`军团重置研究失败: type=${type}, advanced=false`, error)
          message.warning(`军团重置研究失败: type=${type}, advanced=false`)
          
          // 检查错误信息是否包含资源不足
          if (error.message && error.message.includes('资源不足')) {
            message.warning(`军团重置研究收到资源不足提示，停止执行`)
            logOperation('shidian', '更换科技', {
              cardType: '灯神信息',
              tokenId: token.id,
              tokenName: token.name,
              status: 'warning',
              message: `军团重置研究收到资源不足提示，停止执行: ${error.message || '未知错误'}`
            })
            return
          }
          
          logOperation('shidian', '更换科技', {
            cardType: '灯神信息',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `军团重置研究失败: type=${type}, advanced=false, 错误: ${error.message || '未知错误'}`
          })
        }
      }
      
      // 一次性获取当前科技信息
      message.info('正在获取当前科技信息...')
      const roleInfo = await tokenStore.sendGetRoleInfo(token.id, {})
      
      if (!roleInfo || !roleInfo.role || !roleInfo.role.legionResearch) {
        message.warning('获取科技信息失败')
        return
      }
      
      // 使用与getTeamTechInfo相同的逻辑来获取科技信息
      const techInfo = roleInfo.role.legionResearch
      let allTechs = []
      
      for (let techType = 1; techType <= 6; techType++) {
        let totalPoints = 0
        
        // 计算当前科技类型的所有子项目点数
        for (let subIndex = 1; subIndex <= 8; subIndex++) {
          const techKey = `${techType}${subIndex.toString().padStart(2, '0')}` // 如 "101", "102", ..., "108"
          const points = techInfo[techKey] || 0
          totalPoints += points
        }
        
        if (totalPoints > 0) {
          allTechs.push({
            type: techType,
            name: techTypeMap[techType],
            points: totalPoints
          })
        }
      }
      
      // 计算初始总点数
      const initialTotalPoints = allTechs.reduce((sum, tech) => sum + tech.points, 0)
      
      // 记录初始科技状态
      const initialTechState = [...allTechs]
      message.info(`初始科技状态: ${initialTechState.map(t => `${t.name}:${t.points}`).join(', ')}`)
      message.info(`初始总点数: ${initialTotalPoints}`)
      
      // 记录获取科技信息的操作日志
      logOperation('shidian', '更换科技', {
        cardType: '灯神信息',
        tokenId: token.id,
        tokenName: token.name,
        status: 'info',
        message: `获取当前科技信息，初始状态: ${initialTechState.map(t => `${t.name}:${t.points}`).join(', ')}, 总点数: ${initialTotalPoints}`
      })
      
      // 执行 legion_research 命令：legion_research参数researchId:params.researchId, isMax:true
      // 根据灯神类型确定的目标科技类型进行升级
      const targetTechTypesSet = new Set(targetTechTypes);
      
      let researchFailed = false
      
      // 爬塔阵容特殊处理：战士科技109升15次，110升20次，111升10次
      if (selectedType === 'tower') {
        message.info('爬塔阵容：对战士科技执行特殊升级（109升15次，110升20次，111升10次）')
        
        const towerTechUpgrades = [
          { researchId: 109, count: 15, name: '战士科技109' },
          { researchId: 110, count: 20, name: '战士科技110' },
          { researchId: 111, count: 10, name: '战士科技111' }
        ]
        
        for (const tech of towerTechUpgrades) {
          if (researchFailed) break
          
          message.info(`开始升级${tech.name}，共${tech.count}次`)
          
          for (let i = 0; i < tech.count; i++) {
            if (researchFailed) break
            
            try {
              const researchParams = {
                researchId: tech.researchId,
                isMax: false
              }
              message.info(`执行研究: researchId=${tech.researchId}, isMax=false (${i+1}/${tech.count})`)
              const result = await tokenStore.sendLegionResearch(token.id, researchParams)
              
              // 检查是否收到资源不足的提示
              if (result && (result.msg || '').includes('资源不足') || 
                  (result._raw && result._raw.body && result._raw.body.msg && result._raw.body.msg.includes('资源不足'))) {
                message.warning(`研究收到资源不足提示，停止执行`)
                logOperation('shidian', '更换科技', {
                  cardType: '灯神信息',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'warning',
                  message: `执行命令: legion_research, 参数: ${JSON.stringify(researchParams)} - 资源不足，停止执行`
                })
                researchFailed = true
                break
              }
              
              message.success(`${tech.name}升级成功 (${i+1}/${tech.count})`)
              
              // 每次执行间隔：500ms
              await new Promise(resolve => setTimeout(resolve, 500))
            } catch (error) {
              console.error(`${tech.name}升级失败: researchId=${tech.researchId}, isMax=false`, error)
              message.warning(`${tech.name}升级失败`)
              
              // 检查错误信息是否包含资源不足
              if (error.message && error.message.includes('资源不足')) {
                message.warning(`研究收到资源不足提示，停止执行`)
                logOperation('shidian', '更换科技', {
                  cardType: '灯神信息',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'warning',
                  message: `研究收到资源不足提示，停止执行: ${error.message || '未知错误'}`
                })
                researchFailed = true
                break
              } else {
                logOperation('shidian', '更换科技', {
                  cardType: '灯神信息',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'error',
                  message: `${tech.name}升级失败: researchId=${tech.researchId}, isMax=false, 错误: ${error.message || '未知错误'}`
                })
              }
            }
          }
          
          if (!researchFailed) {
            message.success(`${tech.name}升级完成，共${tech.count}次`)
            logOperation('shidian', '更换科技', {
              cardType: '灯神信息',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `${tech.name}升级完成，共${tech.count}次`
            })
          }
        }
      } else {
        // 其他阵容：正常升级所有目标科技
        for (const targetTechType of targetTechTypes) {
          if (researchFailed) break
          
          message.info(`对目标科技 ${techTypeMap[targetTechType]} 执行研究...`)
          
          // 计算该科技类型的researchId前缀
          const prefix = targetTechType * 100; // 例如：type=1 -> prefix=100, type=2 -> prefix=200
          
          for (let subIndex = 1; subIndex <= 8; subIndex++) {
            if (researchFailed) break
            
            const researchId = prefix + subIndex; // 如 101, 102, ..., 108 或 201, 202, ..., 208 等
            
            try {
              const researchParams = {
                researchId: researchId,
                isMax: true
              }
              message.info(`执行研究: researchId=${researchId}, isMax=true`)
              const result = await tokenStore.sendLegionResearch(token.id, researchParams)
              
              // 检查是否收到资源不足的提示
              if (result && (result.msg || '').includes('资源不足') || 
                  (result._raw && result._raw.body && result._raw.body.msg && result._raw.body.msg.includes('资源不足'))) {
                message.warning(`研究收到资源不足提示，停止执行`)
                logOperation('shidian', '更换科技', {
                  cardType: '灯神信息',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'warning',
                  message: `执行命令: legion_research, 参数: ${JSON.stringify(researchParams)} - 资源不足，停止执行`
                })
                researchFailed = true
                break
              }
              
              message.success(`研究成功: researchId=${researchId}, isMax=true`)
              
              // 记录操作日志
              logOperation('shidian', '更换科技', {
                cardType: '灯神信息',
                tokenId: token.id,
                tokenName: token.name,
                status: 'success',
                message: `执行命令: legion_research, 参数: ${JSON.stringify(researchParams)}`
              })
              
              // 每次执行间隔：500ms
              await new Promise(resolve => setTimeout(resolve, 500))
            } catch (error) {
              console.error(`研究失败: researchId=${researchId}, isMax=true`, error)
              message.warning(`研究失败: researchId=${researchId}, isMax=true`)
              
              // 检查错误信息是否包含资源不足
              if (error.message && error.message.includes('资源不足')) {
                message.warning(`研究收到资源不足提示，停止执行`)
                logOperation('shidian', '更换科技', {
                  cardType: '灯神信息',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'warning',
                  message: `研究收到资源不足提示，停止执行: ${error.message || '未知错误'}`
                })
              } else {
                logOperation('shidian', '更换科技', {
                  cardType: '灯神信息',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'error',
                  message: `研究失败: researchId=${researchId}, isMax=true, 错误: ${error.message || '未知错误'}`
                })
              }
              
              researchFailed = true
              break
            }
          }
        }
      }
      
      if (researchFailed) {
        message.info('科技升级失败，跳过剩余操作')
        return
      }
    
      
      message.success('科技研究完成！')
      
      logOperation('shidian', '更换科技', {
        cardType: '灯神信息',
        tokenId: token.id,
        tokenName: token.name,
        status: 'success',
        message: `科技研究完成，执行了6轮军团研究及目标科技重置研究`
      })
  } catch (error) {
    console.error('更换科技失败:', error)
    message.error('更换科技失败')
    
    logOperation('shidian', '更换科技', {
      cardType: '灯神信息',
      tokenId: token.id,
      tokenName: token?.name,
      status: 'error',
      message: `更换科技失败: ${error.message || '未知错误'}`
    })
  }
}

// 灯神按钮 - 完整的灯神战斗流程
const lampGodAction = async () => {
  // 使用当前选中的token，而不是props.selectedTokenId
  const token = tokenStore.selectedToken
  if (!token || !token.id) {
    message.warning('请先选择Token')
    return
  }
  
  try {
    const status = tokenStore.getWebSocketStatus(token.id)
    if (status !== 'connected') {
      message.warning('WebSocket未连接，请先连接Token')
      return
    }
    
    // 检查是否有选中的灯神类型
    const selectedTypes = []
    if (lampGodSelection.value.wei) selectedTypes.push({ name: '魏国', genieId: 1 })
    if (lampGodSelection.value.shu) selectedTypes.push({ name: '蜀国', genieId: 2 })
    if (lampGodSelection.value.wu) selectedTypes.push({ name: '吴国', genieId: 3 })
    if (lampGodSelection.value.qunxiong) selectedTypes.push({ name: '群雄', genieId: 4 })
    if (lampGodSelection.value.tower) selectedTypes.push({ name: '爬塔', genieId: 6 }) // 假设爬塔的genieId为6
    if (lampGodSelection.value.deepsea) selectedTypes.push({ name: '深海', genieId: 5 })
    
    if (selectedTypes.length === 0) {
      message.warning('请至少选择一个灯神类型')
      return
    }
    
    // 获取武器名称
    const weaponName = weaponOptions.find(w => w.value === selectedWeaponId.value)?.label || '未激活'
    
    // 记录开始执行灯神按钮
    logOperation('shidian', '灯神按钮', {
      cardType: '灯神信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'info',
      message: `开始执行灯神按钮，灯神类型: ${selectedTypes.map(t => t.name).join(', ')}, 玩具: ${weaponName}(ID:${selectedWeaponId.value})`
    })
    
    // 执行完整的灯神战斗流程
    for (const type of selectedTypes) {
      // 模拟点击刷新阵容
      message.info(`${type.name} 正在刷新阵容...`)
      await refreshTeamInfo()
      
      // 总是执行切换到阵容1，不管当前阵容是多少
      try {
        message.info(`${type.name} 正在切换到阵容1...`)
        await switchToTeam1()
      } catch (error) {
        console.error(`${type.name} 切换阵容1失败:`, error)
        // 错误时不终止执行，继续下一步
      }
      
      // 执行fight_startlevel获取当前阵容
      message.info(`${type.name} 正在获取当前阵容...`)
      const fightResult = await tokenStore.sendFightStartLevel(token.id, {})
      
      // 获取当前阵容的英雄ID
      let currentTeamHeroes = []
      let currentTeamHeroNames = []
      // fight_startlevel响应结构: { battleData: { leftTeam: { team: { "0": {...}, "1": {...} } } } }
      let battleTeam = null
      if (fightResult && fightResult.battleData && fightResult.battleData.leftTeam && fightResult.battleData.leftTeam.team) {
        battleTeam = fightResult.battleData.leftTeam.team
      } else if (fightResult && fightResult.body && fightResult.body.battleData && fightResult.body.battleData.leftTeam && fightResult.body.battleData.leftTeam.team) {
        battleTeam = fightResult.body.battleData.leftTeam.team
      }
      
      if (battleTeam) {
        for (let pos = 0; pos < 5; pos++) {
          const hero = battleTeam[String(pos)] || battleTeam[pos]
          const heroId = hero && hero.id ? hero.id : 0
          currentTeamHeroes.push(heroId)
          if (heroId > 0) {
            currentTeamHeroNames.push(getHeroName(heroId))
          }
        }
      }
      
      logOperation('shidian', '灯神按钮', {
        cardType: '灯神信息',
        tokenId: token.id,
        tokenName: token.name,
        status: 'info',
        message: `执行命令: fight_startlevel, 获取当前阵容: [${currentTeamHeroNames.join(', ')}]`
      })
      
      // 获取灯神阵容配置
      const config = lampGodConfigs[type.name === '爬塔' ? 'tower' : type.name === '魏国' ? 'wei' : type.name === '蜀国' ? 'shu' : type.name === '吴国' ? 'wu' : type.name === '群雄' ? 'qunxiong' : 'deepsea']
      
      // 比较当前阵容与灯神阵容
      let needSwitchTeam = true
      let comparisonResult = ''
      if (config && config.heroes) {
        const presetHeroNames = config.heroes.map(id => id > 0 ? getHeroName(id) : '空位')
        needSwitchTeam = !currentTeamHeroes.every((heroId, index) => heroId === config.heroes[index])
        comparisonResult = needSwitchTeam 
          ? `当前阵容[${currentTeamHeroNames.join(', ')}] 与 预设阵容[${presetHeroNames.join(', ')}] 不同，需要切换`
          : `当前阵容[${currentTeamHeroNames.join(', ')}] 与 预设阵容[${presetHeroNames.join(', ')}] 相同，跳过切换`
      } else {
        comparisonResult = '未找到预设阵容配置，需要切换'
      }
      
      logOperation('shidian', '灯神按钮', {
        cardType: '灯神信息',
        tokenId: token.id,
        tokenName: token.name,
        status: 'info',
        message: `阵容比较: ${comparisonResult}`
      })
      
      // 如果阵容不同，执行切换阵容和科技
      if (needSwitchTeam) {
        // 模拟点击切换阵容，将当前阵容使用hero_exchange切换为灯神阵容
        message.info(`${type.name} 正在切换为灯神阵容...`)
        await switchTeam()
        
        // 模拟点击切换科技，将当前科技切换为灯神科技
        message.info(`${type.name} 正在切换为灯神科技...`)
        await changeTech()
      } else {
        message.info(`${type.name} 当前阵容与灯神阵容相同，跳过切换阵容和科技`)
      }
      
      // 爬塔类型只执行前四步，不执行灯神战斗
      if (type.genieId === 6) { // 爬塔
        message.info(`${type.name} 前四步执行完成，跳过灯神战斗`)
        continue
      }
      
      // 获取角色信息以获得灯神战斗阵容
      let roleInfo = await tokenStore.sendGetRoleInfo(token.id, {})
      let battleTeamData = null
      
      // 如果获取灯神战斗阵容失败，使用当前阵容
      if (!roleInfo || !roleInfo.role || !roleInfo.role.genieBattleTeam || !roleInfo.role.genieBattleTeam[type.genieId]) {
        message.warning(`${type.name} 获取灯神战斗阵容信息失败，使用当前阵容`)
        // 使用之前获取的当前阵容
        battleTeamData = currentTeamHeroes
      } else {
        battleTeamData = roleInfo.role.genieBattleTeam[type.genieId]
      }
      
      if (!battleTeamData) {
        message.warning(`${type.name} 灯神战斗阵容信息不存在`)
        continue
      }
      
      // 模拟点击灯神战斗
      message.info(`${type.name} 灯神战斗开始（${lampGodFightCount.value}次）...`)
      
      // 第一次战斗前获取阵容并执行hero_calcpowerbyteam
      let currentBattleTeam = {}
      try {
        message.info(`${type.name} 第 1 次战斗前获取当前阵容...`)
        const currentFightResult = await tokenStore.sendFightStartLevel(token.id, {})
        
        // 提取当前阵容
        if (currentFightResult && currentFightResult.battleData && currentFightResult.battleData.leftTeam && currentFightResult.battleData.leftTeam.team) {
          const team = currentFightResult.battleData.leftTeam.team
          for (let pos = 0; pos < 5; pos++) {
            const hero = team[String(pos)] || team[pos]
            currentBattleTeam[pos] = hero && hero.id ? hero.id : 0
          }
        } else if (currentFightResult && currentFightResult.body && currentFightResult.body.battleData && currentFightResult.body.battleData.leftTeam && currentFightResult.body.battleData.leftTeam.team) {
          const team = currentFightResult.body.battleData.leftTeam.team
          for (let pos = 0; pos < 5; pos++) {
            const hero = team[String(pos)] || team[pos]
            currentBattleTeam[pos] = hero && hero.id ? hero.id : 0
          }
        } else {
          // 如果获取失败，使用之前的阵容
          for (let pos = 0; pos < 5; pos++) {
            currentBattleTeam[pos] = battleTeamData[pos] || 0
          }
        }
        
        // 获取当前阵容英雄名称用于日志
        const currentHeroNames = []
        for (let pos = 0; pos < 5; pos++) {
          const heroId = currentBattleTeam[pos]
          if (heroId > 0) {
            currentHeroNames.push(getHeroName(heroId))
          }
        }
        
        logOperation('shidian', '灯神战斗', {
          cardType: '灯神信息',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: `执行命令: fight_startlevel, 第 1 次战斗前获取当前阵容: [${currentHeroNames.join(', ')}]`
        })
        
        // 第一次执行计算英雄战力
        const calcPowerParams = {
          battleTeam: currentBattleTeam,
          lordWeaponId: selectedWeaponId.value
        }
        await tokenStore.sendHeroCalcpowerbyteam(token.id, calcPowerParams)
        logOperation('shidian', '灯神战斗', {
          cardType: '灯神信息',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: `执行命令: hero_calcpowerbyteam, 参数: ${JSON.stringify(calcPowerParams)}`
        })
      } catch (error) {
        console.error(`${type.name} 第 1 次战斗前获取阵容失败:`, error)
        message.warning(`${type.name} 第 1 次战斗前获取阵容失败，使用默认阵容`)
        // 使用默认阵容
        for (let pos = 0; pos < 5; pos++) {
          currentBattleTeam[pos] = battleTeamData[pos] || 0
        }
      }
      
      let challengeExhausted = false
      for (let i = 0; i < lampGodFightCount.value; i++) {
        if (challengeExhausted) break
        
        try {
          // 执行灯神战斗
          const fightParams = {
            battleTeam: currentBattleTeam,
            genieId: type.genieId,
            lordWeaponId: selectedWeaponId.value
          }
          await tokenStore.sendFightStartGenie(token.id, fightParams)
          logOperation('shidian', '灯神战斗', {
            cardType: '灯神信息',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `执行命令: fight_startgenie, 第 ${i + 1} 次, 参数: ${JSON.stringify(fightParams)}`
          })
          message.success(`${type.name} 灯神战斗第 ${i + 1} 次执行成功`)
          // 每次战斗间隔：500ms
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (error) {
          console.error(`${type.name} 灯神战斗第 ${i + 1} 次失败:`, error)
          const errorMessage = error.message || ''
          
          // 检查是否是挑战次数已用完的错误
          if (errorMessage.includes('挑战次数已用完') || errorMessage.includes('3300030')) {
            message.warning(`${type.name} 挑战次数已用完，停止剩余挑战`)
            logOperation('shidian', '灯神战斗', {
              cardType: '灯神信息',
              tokenId: token.id,
              tokenName: token.name,
              status: 'warning',
              message: `${type.name} 挑战次数已用完，停止剩余挑战`
            })
            challengeExhausted = true
          } else {
            message.warning(`${type.name} 灯神战斗第 ${i + 1} 次失败: ${errorMessage || error}`)
          }
        }
      }
      if (challengeExhausted) {
        message.success(`${type.name} 灯神战斗因次数用完而结束`)
      } else {
        message.success(`${type.name} 灯神战斗${lampGodFightCount.value}次执行完成`)
      }
    }
    
    message.success('灯神按钮执行完成')
    logOperation('shidian', '灯神按钮', {
      cardType: '灯神信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: '灯神按钮执行完成'
    })
  } catch (error) {
    console.error('灯神按钮执行失败:', error)
    message.error('灯神按钮执行失败')
    logOperation('shidian', '灯神按钮', {
      cardType: '灯神信息',
      tokenId: token.id,
      tokenName: token?.name,
      status: 'error',
      message: `灯神按钮执行失败: ${error.message || '未知错误'}`
    })
  }
}

// 扫荡功能
const sweepAction = async () => {
  // 使用当前选中的token，而不是props.selectedTokenId
  const token = tokenStore.selectedToken
  if (!token || !token.id) {
    message.warning('请先选择Token')
    return
  }
  
  try {
    const status = tokenStore.getWebSocketStatus(token.id)
    if (status !== 'connected') {
      message.warning('WebSocket未连接，请先连接Token')
      return
    }
    
    message.info('正在执行扫荡...')
    
    // 1. 执行刷新灯神命令，获取扫荡魔毯数量
    await refreshLampGodInfo()
    
    // 2. 获取当前扫荡魔毯数量
    let remainingCarpetCount = parseInt(sweepCarpetCount.value) || 0
    
    if (remainingCarpetCount <= 0) {
      message.warning('扫荡魔毯数量不足，无法执行扫荡')
      return
    }
    
    message.info(`开始扫荡，当前扫荡魔毯数量: ${remainingCarpetCount}`)
    
    // 3. 循环执行genie_sweep命令，直到扫荡魔毯用完
    while (remainingCarpetCount > 0) {
      // 计算本次扫荡数量，最大为20或剩余数量（取较小值）
      const sweepCnt = Math.min(20, remainingCarpetCount)
      
      try {
        // 执行genie_sweep命令
        const sweepParams = {
          genieId: 4, // 固定使用群雄的genieId
          sweepCnt: sweepCnt
        }
        const result = await tokenStore.sendGenieSweep(token.id, sweepParams)
        
        message.success(`扫荡执行成功: genieId=4, sweepCnt=${sweepCnt}`)
        
        // 更新剩余魔毯数量 - 从响应结果中获取最新的扫荡魔毯数量
        // 从返回结果中获取更新后的扫荡魔毯数量
        if (result && result._raw && result._raw.body && result._raw.body.role && result._raw.body.role.items) {
          const items = result._raw.body.role.items
          const sweepCarpetItem = items['1021']
          if (sweepCarpetItem && typeof sweepCarpetItem === 'object') {
            sweepCarpetCount.value = sweepCarpetItem.quantity || 0
          } else {
            sweepCarpetCount.value = sweepCarpetItem || 0
          }
          remainingCarpetCount = parseInt(sweepCarpetCount.value) || 0
        } else {
          // 如果无法从响应中获取更新后的数量，则减去已扫荡的数量
          remainingCarpetCount -= sweepCnt
          sweepCarpetCount.value = remainingCarpetCount
        }
        
        // 记录操作日志
        logOperation('shidian', '扫荡', {
          cardType: '灯神信息',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `执行命令: genie_sweep, 参数: ${JSON.stringify(sweepParams)}, 剩余魔毯: ${remainingCarpetCount}`
        })
        
        // 每次扫荡间隔：500ms
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error('扫荡执行失败:', error)
        message.error(`扫荡执行失败: ${error.message || '未知错误'}`)
        
        logOperation('shidian', '扫荡', {
          cardType: '灯神信息',
          tokenId: token.id,
          tokenName: token.name,
          status: 'error',
          message: `扫荡执行失败: ${error.message || '未知错误'}`
        })
        
        break // 遇到错误时停止扫荡
      }
    }
    
    if (remainingCarpetCount === 0) {
      message.success('扫荡魔毯已用完，扫荡完成')
    } else {
      message.info(`扫荡完成，剩余扫荡魔毯: ${remainingCarpetCount}`)
    }
  } catch (error) {
    console.error('扫荡过程中发生错误:', error)
    message.error(`扫荡失败: ${error.message || '未知错误'}`)
    
    logOperation('shidian', '扫荡', {
      cardType: '灯神信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `扫荡失败: ${error.message || '未知错误'}`
    })
  }
}

// 灯神战斗 - 只包含fight_startgenie命令
const lampGodFight = async () => {
  // 使用当前选中的token，而不是props.selectedTokenId
  const token = tokenStore.selectedToken
  if (!token || !token.id) {
    message.warning('请先选择Token')
    return
  }
  
  try {
    const status = tokenStore.getWebSocketStatus(token.id)
    if (status !== 'connected') {
      message.warning('WebSocket未连接，请先连接Token')
      return
    }
    
    // 获取角色信息以获得灯神战斗阵容
    let roleInfo = await tokenStore.sendGetRoleInfo(token.id, {})
    let genieBattleTeam = null
    
    // 如果获取灯神战斗阵容失败，使用当前阵容
    if (!roleInfo || !roleInfo.role || !roleInfo.role.genieBattleTeam) {
      message.warning('获取灯神战斗阵容信息失败，使用当前阵容')
      // 执行fight_startlevel获取当前阵容
      const fightResult = await tokenStore.sendFightStartLevel(token.id, {})
      if (fightResult && fightResult.body && fightResult.body.battleData && fightResult.body.battleData.leftTeam && fightResult.body.battleData.leftTeam.team) {
        const currentTeam = fightResult.body.battleData.leftTeam.team
        // 构建临时的灯神战斗阵容
        genieBattleTeam = {}
        for (let genieId = 1; genieId <= 5; genieId++) {
          genieBattleTeam[genieId] = []
          for (let pos = 0; pos < 5; pos++) {
            if (Array.isArray(currentTeam)) {
              genieBattleTeam[genieId][pos] = currentTeam[pos]?.id || 0
            } else {
              genieBattleTeam[genieId][pos] = currentTeam[pos]?.id || currentTeam?.[String(pos)]?.id || 0
            }
          }
        }
      } else {
        message.error('获取当前阵容信息失败')
        return
      }
    } else {
      genieBattleTeam = roleInfo.role.genieBattleTeam
    }
    
    // 检查是否有选中的灯神类型
    const selectedTypes = []
    if (lampGodSelection.value.wei) selectedTypes.push({ name: '魏国', genieId: 1 })
    if (lampGodSelection.value.shu) selectedTypes.push({ name: '蜀国', genieId: 2 })
    if (lampGodSelection.value.wu) selectedTypes.push({ name: '吴国', genieId: 3 })
    if (lampGodSelection.value.qunxiong) selectedTypes.push({ name: '群雄', genieId: 4 })
    if (lampGodSelection.value.deepsea) selectedTypes.push({ name: '深海', genieId: 5 })
    
    if (selectedTypes.length === 0) {
      message.warning('请至少选择一个灯神类型')
      return
    }
    
    message.info(`正在执行灯神战斗（${selectedTypes.map(t => t.name).join('、')}）...`)
    
    for (const type of selectedTypes) {
      // 执行灯神战斗
      message.info(`${type.name} 灯神战斗开始（${lampGodFightCount.value}次）...`)
      
      // 获取对应灯神的战斗阵容
      let battleTeamData = genieBattleTeam[type.genieId]
      if (!battleTeamData) {
        // 如果特定灯神的阵容不存在，使用默认阵容
        message.warning(`${type.name} 灯神战斗阵容信息不存在，使用默认阵容`)
        // 执行fight_startlevel获取当前阵容
        const fightResult = await tokenStore.sendFightStartLevel(token.id, {})
        if (fightResult && fightResult.body && fightResult.body.battleData && fightResult.body.battleData.leftTeam && fightResult.body.battleData.leftTeam.team) {
          const currentTeam = fightResult.body.battleData.leftTeam.team
          battleTeamData = []
          for (let pos = 0; pos < 5; pos++) {
            if (Array.isArray(currentTeam)) {
              battleTeamData[pos] = currentTeam[pos]?.id || 0
            } else {
              battleTeamData[pos] = currentTeam[pos]?.id || currentTeam?.[String(pos)]?.id || 0
            }
          }
        } else {
          message.error('获取当前阵容信息失败')
          continue
        }
      }
      
      for (let i = 0; i < lampGodFightCount.value; i++) {
        try {
          // 构建battleTeam参数，使用灯神战斗阵容的heroId作为0-4参数
          const battleTeam = {}
          for (let pos = 0; pos < 5; pos++) {
            battleTeam[pos] = battleTeamData[pos] || 0
          }
          
          // 先执行计算英雄战力
          await tokenStore.sendHeroCalcpowerbyteam(token.id, {
            battleTeam: battleTeam,
            lordWeaponId: selectedWeaponId.value
          })
          
          // 再执行灯神战斗
          await tokenStore.sendFightStartGenie(token.id, {
            battleTeam: battleTeam,
            genieId: type.genieId,
            lordWeaponId: selectedWeaponId.value
          })
          message.success(`${type.name} 灯神战斗第 ${i + 1} 次执行成功`)
          // 每次战斗间隔：500ms
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (error) {
          console.error(`${type.name} 灯神战斗第 ${i + 1} 次失败:`, error)
          message.warning(`${type.name} 灯神战斗第 ${i + 1} 次失败: ${error.message || error}`)
        }
      }
      message.success(`${type.name} 灯神战斗${lampGodFightCount.value}次执行完成`)
    }
    
    message.success('灯神战斗完成')
    logOperation('shidian', '灯神战斗', {
      cardType: '灯神信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: '灯神战斗完成'
    })
  } catch (error) {
    console.error('灯神战斗失败:', error)
    message.error('灯神战斗失败')
    logOperation('shidian', '灯神战斗', {
      cardType: '灯神信息',
      tokenId: token.id,
      tokenName: token?.name,
      status: 'error',
      message: `灯神战斗失败: ${error.message || '未知错误'}`
    })
  }
}

// 解析Token范围（如果为空则返回null，表示执行全部）
const parseTokenRange = (rangeStr) => {
  if (!rangeStr || !rangeStr.trim()) {
    return null
  }
  
  const tokens = []
  const parts = rangeStr.split(',')
  
  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(Number)
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = start; i <= end; i++) {
          tokens.push(i)
        }
      }
    } else {
      const num = Number(trimmed)
      if (!isNaN(num)) {
        tokens.push(num)
      }
    }
  }
  
  return tokens.length > 0 ? tokens : null
}

// 生成激活报告
const generateActivationReport = (results) => {
  let content = `花盆玩具激活报告\n`
  content += `生成时间: ${new Date().toLocaleString('zh-CN')}\n`
  content += `总执行数量: ${results.length}\n`
  content += `成功数量: ${results.filter(r => r.success).length}\n`
  content += `失败数量: ${results.filter(r => !r.success).length}\n\n`
  content += `详细信息:\n`
  content += `Token名称,状态,备注\n`
  
  results.forEach(result => {
    if (result.success) {
      content += `${result.tokenName || result.tokenId},${result.status},${result.status === '已激活' ? '原本已激活' : '新激活'}\n`
    } else {
      content += `${result.tokenName || result.tokenId},失败,${result.error || '未知错误'}\n`
    }
  })
  
  return content
}

// 下载txt文件
const downloadTxtFile = (content, fileName) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

// 批量灯神战斗
// 批量灯神按钮 - 使用连接池处理多个token的连接
const batchLampGodFight = async () => {
  // 按token昵称排序的token列表（与页面显示顺序一致）
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  if (sortedTokensList.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  // 解析执行范围（如果为空则执行全部）
  const tokenIndices = connectionPool.parseTokenRange(lampGodTokens.value)
  const targetTokens = connectionPool.getTargetTokens(sortedTokensList, tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  // 获取每个token在sortedTokens中的序号（用于显示）
  const getTokenIndex = (token) => {
    const index = sortedTokensList.findIndex(t => t.id === token.id)
    return index + 1
  }
  
  // 获取选中的灯神类型和武器信息
  const selectedTypes = []
  if (lampGodSelection.value.wei) selectedTypes.push('魏国')
  if (lampGodSelection.value.shu) selectedTypes.push('蜀国')
  if (lampGodSelection.value.wu) selectedTypes.push('吴国')
  if (lampGodSelection.value.qunxiong) selectedTypes.push('群雄')
  if (lampGodSelection.value.tower) selectedTypes.push('爬塔')
  if (lampGodSelection.value.deepsea) selectedTypes.push('深海')
  const weaponName = weaponOptions.find(w => w.value === selectedWeaponId.value)?.label || '未激活'
  
  const rangeText = lampGodTokens.value ? `范围${lampGodTokens.value}` : "全部"
  message.info(`开始批量执行灯神按钮（${rangeText}），共${targetTokens.length}个Token，按序号顺序执行...`)
  logOperation('shidian', '批量灯神按钮', {
    cardType: '灯神信息',
    status: 'info',
    message: `开始批量执行灯神按钮，${rangeText}，共${targetTokens.length}个Token，灯神类型: ${selectedTypes.join(', ')}, 玩具: ${weaponName}(ID:${selectedWeaponId.value})`
  })
  
  try {
    // 使用连接池执行批量操作
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在执行灯神按钮...`)
          
          // 保存原始选中的token
          const originalSelectedTokenId = tokenStore.selectedTokenId
          
          // 临时选中当前token
          tokenStore.selectedTokenId = token.id
          
          // 执行灯神按钮操作
          await lampGodAction()
          
          // 恢复原始选中的token
          tokenStore.selectedTokenId = originalSelectedTokenId
          
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 灯神按钮执行完成`)
          logOperation('shidian', '批量灯神按钮', {
            cardType: '灯神信息',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: '灯神按钮执行完成'
          })
          return { success: true, token: token }
        } catch (error) {
          const tokenIndex = getTokenIndex(token)
          console.error(`[序号${tokenIndex}] ${token.name || token.id} 灯神按钮执行失败:`, error)
          message.error(`[序号${tokenIndex}] ${token.name || token.id} 灯神按钮执行失败: ${error.message || '未知错误'}`)
          logOperation('shidian', '批量灯神按钮', {
            cardType: '灯神信息',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `灯神按钮执行失败: ${error.message || '未知错误'}`
          })
          return { success: false, token: token, error: error.message || '未知错误' }
        }
      },
      {
        batchSize: 20,
        delayBetween: 300,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个Token）...`)
          } else if (progress.type === 'token-start') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1
            message.info(`[序号${tokenIndex}] ${progress.tokenName} 正在获取连接...`)
          } else if (progress.type === 'token-success') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1
            message.success(`[序号${tokenIndex}] ${progress.tokenName} 连接成功`)
          } else if (progress.type === 'token-error') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1
            if (progress.status === 'warning') {
              message.warning(`[序号${tokenIndex}] ${progress.tokenName} ${progress.message}`)
            } else {
              message.error(`[序号${tokenIndex}] ${progress.tokenName} ${progress.message}`)
            }
          }
        }
      }
    )
    
    // 统计结果
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    
    message.success(`批量灯神按钮完成：成功${successCount}个，失败${failCount}个`)
    logOperation('shidian', '批量灯神按钮', {
      cardType: '灯神信息',
      status: 'success',
      message: `批量灯神按钮完成：成功${successCount}个，失败${failCount}个`
    })
  } catch (error) {
    console.error('批量灯神按钮失败:', error)
    message.error('批量灯神按钮失败')
    logOperation('shidian', '批量灯神按钮', {
      cardType: '灯神信息',
      status: 'error',
      message: `批量灯神按钮失败: ${error.message || '未知错误'}`
    })
  }
}

// 批量扫荡功能
const batchSweepAction = async () => {
  // 按token昵称排序的token列表（与页面显示顺序一致）
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  if (sortedTokensList.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  // 解析执行范围（如果为空则执行全部）
  const tokenIndices = connectionPool.parseTokenRange(lampGodTokens.value)
  const targetTokens = connectionPool.getTargetTokens(sortedTokensList, tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  // 获取每个token在sortedTokens中的序号（用于显示）
  const getTokenIndex = (token) => {
    const index = sortedTokensList.findIndex(t => t.id === token.id)
    return index + 1
  }
  
  const rangeText = lampGodTokens.value ? `范围${lampGodTokens.value}` : "全部"
  message.info(`开始批量执行扫荡（${rangeText}），共${targetTokens.length}个Token，按序号顺序执行...`)
  logOperation('shidian', '批量扫荡', {
    cardType: '灯神信息',
    status: 'info',
    message: `开始批量执行扫荡，${rangeText}，共${targetTokens.length}个Token`
  })
  
  try {
    // 使用连接池执行批量操作
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在执行扫荡...`)
          
          // 保存原始选中的token
          const originalSelectedTokenId = tokenStore.selectedTokenId
          
          // 临时选中当前token
          tokenStore.selectedTokenId = token.id
          
          // 执行扫荡操作
          await sweepAction()
          
          // 恢复原始选中的token
          tokenStore.selectedTokenId = originalSelectedTokenId
          
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 扫荡执行完成`)
          logOperation('shidian', '批量扫荡', {
            cardType: '灯神信息',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: '扫荡执行完成'
          })
          return { success: true, token: token }
        } catch (error) {
          const tokenIndex = getTokenIndex(token)
          console.error(`[序号${tokenIndex}] ${token.name || token.id} 扫荡执行失败:`, error)
          message.error(`[序号${tokenIndex}] ${token.name || token.id} 扫荡执行失败: ${error.message || '未知错误'}`)
          logOperation('shidian', '批量扫荡', {
            cardType: '灯神信息',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `扫荡执行失败: ${error.message || '未知错误'}`
          })
          return { success: false, token: token, error: error.message || '未知错误' }
        }
      },
      {
        batchSize: 20,
        delayBetween: 300,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个Token）...`)
          } else if (progress.type === 'token-start') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1
            message.info(`[序号${tokenIndex}] ${progress.tokenName} 正在获取连接...`)
          } else if (progress.type === 'token-success') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1
            message.success(`[序号${tokenIndex}] ${progress.tokenName} 连接成功`)
          } else if (progress.type === 'token-error') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1
            if (progress.status === 'warning') {
              message.warning(`[序号${tokenIndex}] ${progress.tokenName} ${progress.message}`)
            } else {
              message.error(`[序号${tokenIndex}] ${progress.tokenName} ${progress.message}`)
            }
          }
        }
      }
    )
    
    // 统计结果
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    
    message.success(`批量扫荡完成：成功${successCount}个，失败${failCount}个`)
    logOperation('shidian', '批量扫荡', {
      cardType: '灯神信息',
      status: 'success',
      message: `批量扫荡完成：成功${successCount}个，失败${failCount}个`
    })
  } catch (error) {
    console.error('批量扫荡失败:', error)
    message.error('批量扫荡失败')
    logOperation('shidian', '批量扫荡', {
      cardType: '灯神信息',
      status: 'error',
      message: `批量扫荡失败: ${error.message || '未知错误'}`
    })
  }
}

// 刷新灯神信息
const refreshLampGodInfo = async () => {
  // 使用当前选中的token，而不是props.selectedTokenId
  const token = tokenStore.selectedToken
  if (!token || !token.id) {
    message.warning('请先选择Token')
    return
  }
  try {
    message.info('正在刷新灯神信息...')
    if (!token || !token.id) {
      message.error('Token信息不完整')
      return
    }
    
    const status = tokenStore.getWebSocketStatus(token.id)
    if (status !== 'connected') {
      message.warning('WebSocket未连接，请先连接Token')
      return
    }
    
    // 调用role_getroleinfo获取角色信息（包含genie字段、items字段和legionResearch字段）
    const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
    if (roleInfo && roleInfo.role) {
      if (roleInfo.role.genie) {
        // 提取灯神层数信息
        const genieData = roleInfo.role.genie
        lampGodLevels.value = {
          1: genieData['1'] || '-', // 魏国
          2: genieData['2'] || '-', // 蜀国
          3: genieData['3'] || '-', // 吴国
          4: genieData['4'] || '-', // 群雄
          5: genieData['5'] || '-'  // 深海
        }
        
        // 提取扫荡魔毯数量（itemid 1021）
        const items = roleInfo.role.items || {}
        const sweepCarpetItem = items['1021']
        // 如果返回的是对象格式 { "itemId": 1021, "quantity": 12, "ext": null }，则提取 quantity
        // 如果返回的是数字格式，则直接使用
        if (sweepCarpetItem && typeof sweepCarpetItem === 'object') {
          sweepCarpetCount.value = sweepCarpetItem.quantity || 0
        } else {
          sweepCarpetCount.value = sweepCarpetItem || 0
        }
        
        message.success('灯神信息刷新成功')
        logOperation('shidian', '刷新灯神信息', {
          cardType: '灯神信息',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: '灯神信息刷新成功'
        })
      } else {
        message.warning('未获取到灯神信息（genie字段）')
        // 重置灯神层数信息
        lampGodLevels.value = {
          1: '-', // 魏国
          2: '-', // 蜀国
          3: '-', // 吴国
          4: '-', // 群雄
          5: '-'  // 深海
        }
        // 重置扫荡魔毯数量
        sweepCarpetCount.value = '-'
        logOperation('shidian', '刷新灯神信息', {
          cardType: '灯神信息',
          tokenId: token.id,
          tokenName: token.name,
          status: 'warning',
          message: '未获取到灯神信息（genie字段）'
        })
      }
    } else {
      message.warning('未获取到角色信息')
      // 重置灯神层数信息
      lampGodLevels.value = {
        1: '-', // 魏国
        2: '-', // 蜀国
        3: '-', // 吴国
        4: '-', // 群雄
        5: '-'  // 深海
      }
      // 重置扫荡魔毯数量
      sweepCarpetCount.value = '-'
    }
  } catch (error) {
    console.error('刷新灯神信息失败:', error)
    message.error(`刷新灯神信息失败: ${error.message || error}`)
    const token = tokenStore.selectedToken
    logOperation('shidian', '刷新灯神信息', {
      cardType: '灯神信息',
      tokenId: token?.id,
      tokenName: token?.name,
      status: 'error',
      message: `刷新灯神信息失败: ${error.message || error}`
    })
  }
}

// 导出灯神信息
const exportLampGodInfo = async () => {
  try {
    isExportingLampGodInfo.value = true
    message.info('开始导出灯神信息...')

    // 按token昵称排序的token列表（与页面显示顺序一致）
    const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
      const nameA = (a.name || '未命名').toLowerCase()
      const nameB = (b.name || '未命名').toLowerCase()
      return nameA.localeCompare(nameB)
    })

    // 解析执行范围（如果为空则执行全部）
    const tokenIndices = connectionPool.parseTokenRange(lampGodTokens.value)
    const targetTokens = connectionPool.getTargetTokens(sortedTokensList, tokenIndices)
    
    if (targetTokens.length === 0) {
      message.warning('执行范围内没有有效的Token')
      return
    }

    const rangeText = lampGodTokens.value ? `范围${lampGodTokens.value}` : "全部"
    message.info(`找到 ${targetTokens.length} 个Token（${rangeText}），开始处理...`)
    logOperation('shidian', '导出灯神信息', {
      cardType: '灯神信息',
      status: 'info',
      message: `开始导出灯神信息，${rangeText}，共${targetTokens.length}个Token`
    })

    const lampGodInfoList = []

    // 使用连接池执行批量操作
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = globalIndex + 1
          message.info(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 正在获取灯神信息...`)
          
          // 模拟点击获取灯神信息（调用role_getroleinfo）
          const result = await tokenStore.sendGetRoleInfo(token.id, {})
          
          const nickname = token.name || token.id
          const genie = result?.role?.genie || {}
          
          const info = {
            nickname,
            wei: String(genie['1'] || genie[1] || 0),
            shu: String(genie['2'] || genie[2] || 0),
            wu: String(genie['3'] || genie[3] || 0),
            qunxiong: String(genie['4'] || genie[4] || 0),
            deepsea: String(genie['5'] || genie[5] || 0)
          }
          
          lampGodInfoList.push(info)
          message.success(`[${tokenIndex}] ${nickname} 获取灯神信息成功`)
          return { success: true, token: token, info: info }
        } catch (error) {
          console.error(`[${globalIndex + 1}] ${token.name || token.id} 获取灯神信息失败:`, error)
          
          const info = {
            nickname: token.name || token.id,
            wei: '获取失败',
            shu: '获取失败',
            wu: '获取失败',
            qunxiong: '获取失败',
            deepsea: '获取失败'
          }
          
          lampGodInfoList.push(info)
          return { success: false, token: token, error: error.message || '未知错误', info: info }
        }
      },
      {
        batchSize: 20,
        delayBetween: 300,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个Token）...`)
          } else if (progress.type === 'token-start') {
            message.info(`[${progress.globalIndex + 1}/${targetTokens.length}] ${progress.tokenName} 正在获取连接...`)
          } else if (progress.type === 'token-success') {
            message.success(`[${progress.globalIndex + 1}] ${progress.tokenName} 连接成功`)
          } else if (progress.type === 'token-error') {
            if (progress.status === 'warning') {
              message.warning(`[${progress.globalIndex + 1}] ${progress.tokenName} ${progress.message}`)
            } else {
              message.error(`[${progress.globalIndex + 1}] ${progress.tokenName} ${progress.message}`)
            }
          }
        }
      }
    )

    // 生成导出内容
    const lines = []
    // 标题行
    lines.push('昵称,魏国,蜀国,吴国,群雄,深海')
    
    // 数据行
    lampGodInfoList.forEach(info => {
      lines.push(`${info.nickname},${info.wei},${info.shu},${info.wu},${info.qunxiong},${info.deepsea}`)
    })

    // 导出文件
    const content = lines.join('\n')
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `灯神信息_${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    message.success(`灯神信息已导出成功，共 ${lampGodInfoList.length} 条记录`)
    
    // 记录日志
    logOperation('shidian', '导出灯神信息', {
      cardType: '灯神信息',
      status: 'success',
      message: `导出灯神信息成功，共 ${lampGodInfoList.length} 条记录（${rangeText}）`
    })
  } catch (error) {
    console.error('导出灯神信息失败:', error)
    message.error(`导出灯神信息失败: ${error.message || error}`)
    
    // 记录错误日志
    logOperation('shidian', '导出灯神信息', {
      cardType: '灯神信息',
      status: 'error',
      message: `导出灯神信息失败: ${error.message || error}`
    })
  } finally {
    isExportingLampGodInfo.value = false
  }
}


</script>

<style scoped>
.team-table-container {
  margin-bottom: 16px;
  width: 100%;
}

.team-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.team-table th,
.team-table td {
  border: 1px solid #e0e0e0;
  padding: 8px;
  text-align: center;
}

.team-table th {
  background-color: #f5f5f5;
  font-weight: bold;
}

.team-table td {
  background-color: white;
}

.current-team {
  background-color: #f0f9ff;
}



.hero-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.hero-level {
  font-size: 12px;
  color: #666;
}

.hero-name {
  font-size: 14px;
  font-weight: 500;
}

.hero-star {
  font-size: 12px;
  color: #f59e0b;
}

.empty-slot {
  color: #999;
}

.tech-cell {
  vertical-align: top;
}

.tech-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lampgod-levels-row td {
  background-color: #f9f9f9;
  font-weight: bold;
  padding: 4px;
}

.lampgod-levels-row small {
  display: block;
  font-size: 10px;
  color: #666;
  margin-top: 2px;
}

/* 为扫荡魔毯列添加特殊样式 */
.sweep-carpet-col {
  min-width: 60px;
}

.tech-item {
  font-size: 12px;
  color: #666;
}
</style>
