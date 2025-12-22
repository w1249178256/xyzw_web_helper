<template>
  <div>
    <div class="status-card club-warrank">
      <div class="card-header">
        <img src="/icons/Ob7pyorzmHiJcbab2c25af264d0758b527bc1b61cc3b.png" alt="队伍图标" class="status-icon">
        <div class="status-info">
          <h3>切磋</h3>
        </div>
      </div>
      <div class="inline-container">
        <n-input v-model:value="targetId" type="text" placeholder="切磋对手ID" class="inputOrSelectWidth" />
        <n-button size="small" :disabled="loading1" @click="getTargetInfo">
          <template #icon>
            <n-icon>
              <Refresh />
            </n-icon>
          </template>查询
        </n-button>
        <n-select v-model:value="fightNum" :options="options" class="inputOrSelectWidth" />
        <n-button size="small" :disabled="loading1 || !targetId" @click="fightPVPRefresh">
          <template #icon>
            <n-icon>
              <Refresh />
            </n-icon>
          </template>切磋
        </n-button>
        <n-button type="primary" size="small" :disabled="!topranklist || loading1" @click="handleExport1">
          <template #icon>
            <n-icon>
              <Copy />
            </n-icon>
          </template>导出</n-button>
      </div>

      <div v-if="memberData" class="member-card">
        <div class="member-header">
          <div class="member-stats-inline">
            <div class="member-info">
              <n-avatar round :size="60" :src="memberData.headImg" />
            </div>
            <div class="member-right">
              <div class="member-row">
                <span>游戏名: {{ memberData.name }}</span>
                <span>区服: {{ memberData.serverName }}</span>
              </div>
              <div class="member-row">
                <span>战力: {{ memberData.power }}</span>
                <span>红数/孔数: <span style="color: red;font-weight: bolder;">{{ memberData.red }}</span>/<span
                    style="color: green;font-weight: bolder;">{{ memberData.hole }}</span></span>
              </div>
              <div class="member-row">
                <span>俱乐部名: {{ memberData.legionName }}</span>
                <span>俱乐部历史最高战力: {{ memberData.MaxPower }}</span>
              </div>
              <div class="member-row">
                <span>俱乐部当前红数: {{ memberData.legionRed }}</span>
                <span>俱乐部历史最高红数: {{ memberData.legionMaxRed }}</span>
              </div>
            </div>
          </div>
          <div class="member-stats-inline">
            <div v-for="hero in memberData.heroList" :key="hero.heloId || hero.heroName" class="hero-item">
              <div class="hero-circle">
                <img v-if="hero.heroAvate" :src="hero.heroAvate" :alt="hero.heroName" class="hero-avatar" />
                <div v-else class="hero-placeholder">{{ hero.heroName?.substring(0, 2) || "?" }}</div>
              </div>
              <span class="hero-name">武将:{{ hero.heroName || "未知" }}</span>
              <span class="hero-name">战力:{{ hero.power || "未知" }}</span>
              <span class="hero-name">星级:{{ hero.star || "未知" }}/
                <n-tag :type="hero.HolyBeast ? 'success' : 'error'" size="small">
                  {{ hero.HolyBeast ? '已开四圣' : '未开四圣' }}
                </n-tag>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="battle-records-content">
        <!-- 加载状态 -->
        <div v-if="loading1" class="loading-state">
          <n-spin size="large">
            <template #description>
              正在加载俱乐部数据...
            </template>
          </n-spin>
        </div>
        <div v-else-if="fightResult" class="member-card">
          <div v-if="fightResult.resultCount && fightResult.resultCount.length > 0">
            <div class="result-Count">
              <div>
                胜率:{{ ((fightResult.winCount / fightNum) * 100).toFixed(2) }}%
              </div>
              <div>
                掉将率:{{ ((fightResult.dieHeroGameCount / fightNum) * 100).toFixed(2) }}%
              </div>
            </div>
            <div v-for="(battle, index) in fightResult.resultCount" :key="index" :class="getBattleClass(battle)"
              class="fight-content">
              <div class="fight-card">
                <div class="fight-left">
                  <div class="fight-avatar">
                    <n-avatar round :size="24" :src="battle.leftheadImg" />
                    <span>名称:{{ battle.leftName || '未知' }}</span>
                    <span>战力:{{ battle.leftpower || '0' }}</span>
                    <span>掉将数:{{ battle.leftDieHero || '0' }}</span>
                  </div>
                </div>
                <div class="battle-vs">
                  <n-tag :type="battle.isWin ? 'success' : 'error'" size="small">{{ battle.isWin ? '胜利' : '失败' }}</n-tag>
                </div>
                <div class="fight-left">
                  <div class="fight-avatar">
                    <n-avatar round :size="24" :src="battle.rightheadImg" />
                    <span>名称:{{ battle.rightName || '未知' }}</span>
                    <span>战力:{{ battle.rightpower || '0' }}</span>
                    <span>掉将数:{{ battle.rightDieHero || '0' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMessage, NDatePicker, NPagination } from 'naive-ui'
import { useTokenStore } from '@/stores/tokenStore'
import {
  Trophy,
  Refresh,
  Copy,
  ChevronDown,
  ChevronUp,
  DocumentText
} from '@vicons/ionicons5'
import {
  getLastSaturday,
  formatTimestamp,
  formatTimestamp1,
  parseBattleResult,
  parseAttackType,
  formatBattleRecordsForExport,
  copyToClipboard
} from '@/utils/clubBattleUtils'
import { gettoday, formatWarrankRecordsForExport, allianceincludes } from '@/utils/goldWarrankUtils'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  inline: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible'])

const message = useMessage()
const tokenStore = useTokenStore()

const showModal = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const loading1 = ref(false)
const topranklist = ref(null)
const expandedMembers = ref(new Set())
const roleIdinput = ref('')
const queryDate = ref('')
const targetId = ref('')
const teamArray = ref(null)
//切磋对手信息
const memberData = ref(null)
//批量数量
const fightNum = ref(1)
//战斗结果
const fightResult = ref(null)
const options = [
  {
    label: "1",
    value: 1
  },
  {
    label: "10",
    value: 10
  },
  {
    label: "25",
    value: 25
  },
  {
    label: "50",
    value: 50
  }
]
let player_date = { name: '', power: '' }

// 分页状态
const currentPage = ref(1)
const pageSize = ref(20) // 每页20条，共5页

// 计算总页数
const totalPages = computed(() => {
  if (!topranklist.value) return 0
  return Math.ceil(Object.keys(topranklist.value).length / pageSize.value)
})

//英雄字典
const HERO_DICT = {
  101: { name: "司马懿", type: "魏国", avatar: "/team/simayi.png" },
  102: { name: "郭嘉", type: "魏国", avatar: "/team/guojia.png" },
  103: { name: "关羽", type: "蜀国", avatar: "/team/guanyu.png" },
  104: { name: "诸葛亮", type: "蜀国", avatar: "/team/zhugeliang.png" },
  105: { name: "周瑜", type: "吴国", avatar: "/team/zhouyu.png" },
  106: { name: "太史慈", type: "吴国", avatar: "/team/taishici.png" },
  107: { name: "吕布", type: "群雄", avatar: "/team/lvbu.png" },
  108: { name: "华佗", type: "群雄", avatar: "/team/huatuo.png" },
  109: { name: "甄姬", type: "魏国", avatar: "/team/zhenji.png" },
  110: { name: "黄月英", type: "蜀国", avatar: "/team/huangyueying.png" },
  111: { name: "孙策", type: "吴国", avatar: "/team/sunce.png" },
  112: { name: "贾诩", type: "群雄", avatar: "/team/jiaxu.png" },
  113: { name: "曹仁", type: "魏国", avatar: "/team/caoren.png" },
  114: { name: "姜维", type: "蜀国", avatar: "/team/jiangwei.png" },
  115: { name: "孙坚", type: "吴国", avatar: "/team/sunjian.png" },
  116: { name: "公孙瓒", type: "群雄", avatar: "/team/gongsunzan.png" },
  117: { name: "典韦", type: "魏国", avatar: "/team/dianwei.png" },
  118: { name: "赵云", type: "蜀国", avatar: "/team/zhaoyun.png" },
  119: { name: "大乔", type: "吴国", avatar: "/team/daqiao.png" },
  120: { name: "张角", type: "群雄", avatar: "/team/zhangjiao.png" },
  201: { name: "徐晃", type: "魏国", avatar: "/team/xuhuang.png" },
  202: { name: "荀彧", type: "魏国", avatar: "/team/xunyu.png" },
  203: { name: "典韦", type: "魏国", avatar: "/team/xiaodianwei.png" },
  204: { name: "张飞", type: "蜀国", avatar: "/team/zhangfei.png" },
  205: { name: "赵云", type: "蜀国", avatar: "/team/xiaozhaoyun.png" },
  206: { name: "庞统", type: "蜀国", avatar: "/team/pangtong.png" },
  207: { name: "鲁肃", type: "吴国", avatar: "/team/lusu.png" },
  208: { name: "陆逊", type: "吴国", avatar: "/team/luxun.png" },
  209: { name: "甘宁", type: "吴国", avatar: "/team/ganning.png" },
  210: { name: "貂蝉", type: "群雄", avatar: "/team/diaochan.png" },
  211: { name: "董卓", type: "群雄", avatar: "/team/dongzhuo.png" },
  212: { name: "张角", type: "群雄", avatar: "/team/xiaozhangjiao.png" },
  213: { name: "张辽", type: "魏国", avatar: "/team/zhangliao.png" },
  214: { name: "夏侯惇", type: "魏国", avatar: "/team/xiahoudun.png" },
  215: { name: "许褚", type: "魏国", avatar: "/team/xuzhu.png" },
  216: { name: "夏侯渊", type: "魏国", avatar: "/team/xiahouyuan.png" },
  217: { name: "魏延", type: "蜀国", avatar: "/team/weiyan.png" },
  218: { name: "黄忠", type: "蜀国", avatar: "/team/huangzhong.png" },
  219: { name: "马超", type: "蜀国", avatar: "/team/machao.png" },
  220: { name: "马岱", type: "蜀国", avatar: "/team/madai.png" },
  221: { name: "吕蒙", type: "吴国", avatar: "/team/lvmeng.png" },
  222: { name: "黄盖", type: "吴国", avatar: "/team/huanggai.png" },
  223: { name: "蔡文姬", type: "魏国", avatar: "/team/caiwenji.png" },
  224: { name: "小乔", type: "吴国", avatar: "/team/xiaoqiao.png" },
  225: { name: "袁绍", type: "群雄", avatar: "/team/yuanshao.png" },
  226: { name: "华雄", type: "群雄", avatar: "/team/huaxiong.png" },
  227: { name: "颜良", type: "群雄", avatar: "/team/yanliang.png" },
  228: { name: "文丑", type: "群雄", avatar: "/team/wenchou.png" },
  301: { name: "周泰", type: "吴国", avatar: "/team/zhoutai.png" },
  302: { name: "许攸", type: "魏国", avatar: "/team/xuyou.png" },
  303: { name: "于禁", type: "魏国", avatar: "/team/yujin.png" },
  304: { name: "张星彩", type: "蜀国", avatar: "/team/zhangxingcai.png" },
  305: { name: "关银屏", type: "蜀国", avatar: "/team/guanyinping.png" },
  306: { name: "关平", type: "蜀国", avatar: "/team/guanping.png" },
  307: { name: "程普", type: "吴国", avatar: "/team/chengpu.png" },
  308: { name: "张昭", type: "吴国", avatar: "/team/zhangzhao.png" },
  309: { name: "陆绩", type: "吴国", avatar: "/team/luji.png" },
  310: { name: "吕玲绮", type: "群雄", avatar: "/team/lvlingqi.png" },
  311: { name: "潘凤", type: "群雄", avatar: "/team/panfeng.png" },
  312: { name: "邢道荣", type: "群雄", avatar: "/team/xingdaorong.png" },
  313: { name: "祝融夫人", type: "群雄", avatar: "/team/zhurongfuren.png" },
  314: { name: "孟获", type: "群雄", avatar: "/team/menghuo.png" },
};

// 获取当前页的数据
const currentPageData = computed(() => {
  if (!topranklist.value) return {}

  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  const entries = Object.entries(topranklist.value)

  return Object.fromEntries(entries.slice(startIndex, endIndex))
})
// 格式化战力
const formatPower = (power) => {
  if (!power) return '0'
  if (power >= 100000000) {
    return (power / 100000000).toFixed(2) + '亿'
  }
  if (power >= 10000) {
    return (power / 10000).toFixed(2) + '万'
  }
  return power.toString()
}

// 获取战斗样式类
const getBattleClass = (battle) => {
  const classes = []
  if (battle.isWin) {
    classes.push('battle-win')
  } else {
    classes.push('battle-loss')
  }
  return classes.join(' ')
}

const formatScore = (score) => {
  return score.toFixed(0).toString()
}

const formatServerId = (ServerId) => {
  return (ServerId - 27).toFixed(0).toString()
}


// 处理图片加载错误
const handleImageError = (event) => {
  event.target.style.display = 'none'
}

// 切磋
const fetchfightPVP = async () => {
  if (!tokenStore.selectedToken) {
    message.warning('请先选择游戏角色')
    return
  }

  const tokenId = tokenStore.selectedToken.id

  // 检查WebSocket连接
  const wsStatus = tokenStore.getWebSocketStatus(tokenId)
  if (wsStatus !== 'connected') {
    message.error('WebSocket未连接，无法查询战绩')
    return
  }

  loading1.value = true
  queryDate.value = gettoday()


  try {
    let winCount = 0;
    let dieHeroGameCount = 0;
    let resultCount = [];
    for (var i = 0; i < fightNum.value; i++) {
      const result = await tokenStore.sendMessageWithPromise(tokenId, 'fight_startpvp',
        {
          targetId: targetId.value,
        }, 5000)
      if (!result.battleData) {
        fightResult.value = null;
        message.warning('切磋错误');
        return;
      }
      //处理掉将情况
      let leftCount = 0;
      result.battleData.result.sponsor.teamInfo.forEach(item => {
        if (item.hp == 0) {
          leftCount++;
        }
      })
      if (leftCount != 0) {
        dieHeroGameCount++;
      }
      let rightCount = 0;
      result.battleData.result.accept.teamInfo.forEach(item => {
        if (item.hp == 0) {
          rightCount++;
        }
      })
      let tempObj = {
        leftName: result.battleData.leftTeam.name,
        leftheadImg: result.battleData.leftTeam.headImg,
        leftpower: formatPower(result.battleData.leftTeam.power),
        rightName: result.battleData.rightTeam.name,
        rightheadImg: result.battleData.rightTeam.headImg,
        rightpower: formatPower(result.battleData.rightTeam.power),
        //掉将情况
        leftDieHero: leftCount,
        rightDieHero: rightCount,
        isWin: result.battleData.result.isWin ? true : false //对战结果
      }
      if (result.battleData.result.isWin) {
        winCount++;
      }
      resultCount.push(tempObj);
    }
    const teamData = {
      winCount,
      dieHeroGameCount,
      resultCount
    };
    fightResult.value = teamData;
    message.success('俱乐部数据加载成功');
    return teamData;

  } catch (error) {
    message.error(`查询失败: ${error.message}`);
    topranklist.value = null;
  } finally {
    loading1.value = false;
  }



}


// 查询
const fetchTargetInfo = async () => {
  if (!tokenStore.selectedToken) {
    message.warning('请先选择游戏角色')
    return
  }

  const tokenId = tokenStore.selectedToken.id

  // 检查WebSocket连接
  const wsStatus = tokenStore.getWebSocketStatus(tokenId)
  if (wsStatus !== 'connected') {
    message.error('WebSocket未连接，无法查询战绩')
    return
  }

  loading1.value = true
  queryDate.value = gettoday()


  try {
    const result = await tokenStore.sendMessageWithPromise(tokenId, 'rank_getroleinfo',
      {
        bottleType: 0,
        includeBottleTeam: false,
        isSearch: false,
        roleId: targetId.value
      }, 5000)
    if (!result.roleInfo && !result.legionInfo) {
      memberData.value = null;
      message.warning('未查询到对手信息');
      return;
    }
    const teamData = {};
    const heroAndholdAndRed = getHeroInfo(result.roleInfo.heroes);
    // 俱乐部名称
    teamData.legionName = result.legionInfo.name;
    // 俱乐部当前红数
    teamData.legionRed = result.legionInfo.statistics['battle:red:quench'];
    // 俱乐部历史最高红数
    teamData.legionMaxRed = result.legionInfo.statistics['red:quench'];
    // 俱乐部历史最高战力
    teamData.MaxPower = formatPower(result.legionInfo.statistics['max:power']);
    // 切磋对手武将信息
    teamData.heroList = heroAndholdAndRed.heroList;
    // 切磋对手玩家头像
    teamData.headImg = result.roleInfo.headImg;
    // 切磋对手玩家名称
    teamData.name = result.roleInfo.name;
    teamData.power = formatPower(result.roleInfo.power);
    teamData.serverName = result.roleInfo.serverName;
    teamData.hole = heroAndholdAndRed.holeCount;
    teamData.red = heroAndholdAndRed.redCount;
    memberData.value = teamData;
    message.success('对手信息加载成功');
    return teamData;

  } catch (error) {
    message.error(`查询失败: ${error.message}`);
    topranklist.value = null;
  } finally {
    loading1.value = false;
  }
}

/**
 * 提取数组中的英雄信息
 * @param {Object} heroObj
 */
const getHeroInfo = (heroObj) => {
  //统计总红数
  let redCount = 0;
  let holeCount = 0;
  let heroList = [];
  Object.values(heroObj).forEach(hero => {
    let heroInfo = HERO_DICT[hero.heroId];
    let equipmentInfo = getEquipment(hero.equipment);
    let tempObj = {
      heroId: hero.heroId, //英雄ID
      power: formatPower(hero.power), //英雄战力
      star: hero.star, //英雄星级
      heroName: heroInfo.name, //英雄姓名
      heroAvate: heroInfo.avatar,
      level: hero.level, //英雄等级
      hole: equipmentInfo.holeCount, //英雄开孔数量
      red: equipmentInfo.redCount, //英雄红数
      HolyBeast: hero.hB?.active   //激活四圣
    }
    redCount += tempObj.red;
    holeCount += tempObj.hole;
    heroList.push(tempObj);
  });
  return { redCount, holeCount, heroList };
}

//获取装备信息
const getEquipment = (equipment) => {
  let redCount = 0;
  let holeCount = 0;
  let equipArr = [];
  //此处遍历4件装备
  Object.values(equipment).forEach(equ => {
    //遍历每件装备的属性
    Object.values(equ.quenches).forEach(item => {
      holeCount++;
      if (item.colorId == 6) {
        redCount++;
      }
    })
  });
  return { redCount, holeCount }
}

// 处理分页大小改变
const handlePageSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1 // 重置到第一页
}
// 刷新战绩
const fightPVPRefresh = () => {
  fetchfightPVP()
}

//获取对手信息
const getTargetInfo = () => {
  fetchTargetInfo();
}

// 导出战绩
const handleExport1 = async () => {
  if (!topranklist.value) {
    message.warning('没有可导出的数据')
    return
  }


  try {
    const exportText = formatWarrankRecordsForExport(
      teamArray.value,
      queryDate.value
    )
    message.success('导出成功')
  } catch (error) {
    message.error('导出失败，请重试')
  }
}

// 关闭弹窗
const handleClose = () => {
  expandedMembers.value.clear()
}

// 暴露方法给父组件
defineExpose({
  fetchfightPVP
})

// Inline 模式：挂载后自动拉取
onMounted(() => {
  // if (props.inline) {
  //     topranklistRefresh()
  // }
})
</script>

<style scoped lang="scss">
.club-warrank {

  .inputOrSelectWidth {
    width: 20%;
  }

  .member-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-light);
    border-radius: var(--border-radius-medium);
    padding: var(--spacing-sm);
    transition: all var(--transition-fast);
    margin-bottom: var(--spacing-sm);
    max-height: 400px;
    overflow: auto;

    &:hover {
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    }

    &+& {
      margin-top: var(--spacing-sm);
    }
  }

  .inline-container {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .member-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    background-color: rgb(241, 241, 241, 0.5);
    border-radius: 15px;
    min-height: 120px;
    /* max-height: 120px; Removed fixed height */
    padding: var(--spacing-sm);
  }

  .member-info {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: var(--spacing-sm);
    min-width: 120px;
    max-width: 120px;
    min-height: 120px;
    /* max-height: 120px; */
    flex-shrink: 0;
  }

  .member-right {
    display: flex;
    flex-direction: column;
    width: 100%;
    /* max-height: 120px; */
  }

  .member-row {
    display: flex;
    gap: var(--spacing-sm);
    font-size: 14px;
    color: #333;
    align-items: center;
    justify-content: space-between;
    padding: 4px;
    flex-wrap: wrap;
    /* Allow wrapping */
  }

  .member-stats-inline {
    display: flex;
    gap: var(--spacing-xs);
    align-items: center;
    flex: 1;
    flex-wrap: wrap;
    /* Allow wrapping */
    justify-content: center;
  }


  .member-row .left {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .member-row .right {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--text-secondary);
  }

  .member-row .name {
    font-weight: var(--font-weight-medium);
  }

  .member-row .power {
    font-feature-settings: 'tnum' 1;
    font-variant-numeric: tabular-nums;
  }

  .hero-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
    min-width: 128px;
  }

  @media (max-width: 768px) {
    .member-header {
      flex-direction: column;
      height: auto;
    }

    .member-stats-inline {
      width: 100%;
    }

    .hero-item {
      min-width: 80px;
      width: 45%;
    }

    .member-info {
      min-height: auto;
      padding-bottom: var(--spacing-sm);
    }
  }

  .hero-circle {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--bg-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  .hero-avatar {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .hero-placeholder {
    font-size: 12px;
    color: var(--text-secondary);
  }

  .hero-name {
    font-size: 12px;
    color: var(--text-secondary);
    text-align: center;
    min-width: 90px;
    max-width: 140px;
    white-space: nowrap;
  }

}

.fight-content {
  display: inline-flex;
  border-radius: 5px;
  padding: var(--spacing-xs);
  margin: var(--spacing-xs);

  .fight-card {
    display: flex;
    border-radius: 5px;
    padding: var(--spacing-xs);

    .fight-left {
      display: flex;
      flex-direction: row;

      .fight-avatar {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-sm);
      }
    }
  }

  .battle-vs {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-sm);
  }
}

.result-Count {
  display: flex;
  align-items: center;
  justify-content: space-around;
  font-weight: var(--font-weight-bold);
  background-color: rgba(206, 205, 205, 0.5);
  border: 2px solid #e8b5b5;
  border-radius: 5px;
}

.battle-win {
  border-left-color: #10b981;
  background-color: #9dbbb1;
}

.battle-loss {
  border-left-color: #ef4444;
  background-color: #f38383;
}

/* 卡片基础样式，保持与 GameStatus 一致 */
.status-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-lg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all var(--transition-normal);

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}


.status-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 8px;
  margin-right: var(--spacing-md);
}

.status-info {
  flex: 1;

  h3 {
    margin: 0;
    font-size: var(--font-size-lg);
  }

  p {
    margin: 0;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }
}
</style>