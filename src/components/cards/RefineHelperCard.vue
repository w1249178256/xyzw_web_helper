<template>
  <MyCard class="refine-helper" :statusClass="{ active: state.isRunning }">
    <template #icon>
      <img src="/icons/ta.png" alt="洗练图标" />
    </template>
    <template #title>
      <h3>洗练助手</h3>
      <p>装备洗练、锁定孔位、自动洗练</p>
    </template>
    <template #badge>
      <span>{{ state.isRunning ? "运行中" : "已停止" }}</span>
    </template>
    <template #default>
      <div class="refine-container">
        <!-- 工具栏 -->
        <div class="toolbar">
          <n-button type="primary" size="small" @click="refreshHeroes"
            >刷新阵容</n-button
          >
          <n-button size="small" @click="resetCount">清零</n-button>
          <div class="jade-info">
            <span>白玉: {{ jadeCount }}</span>
            <span>彩玉: {{ colorJadeCount }}</span>
          </div>
        </div>

        <!-- 武将列表 -->
        <div class="hero-list-section">
          <h4>选择武将</h4>
          <div class="hero-list">
            <div v-if="loading" class="loading">加载中...</div>
            <div v-else-if="heroes.length === 0" class="empty">
              暂无武将数据
            </div>
            <div
              v-for="hero in heroes"
              :key="hero.id"
              class="hero-item"
              :class="{ active: selectedHeroId === hero.id }"
              @click="selectHero(hero.id)"
            >
              <div class="hero-avatar">
                <img v-if="HERO_DICT[hero.id]?.avatar" :src="HERO_DICT[hero.id]?.avatar" :alt="hero.name" />
                <div v-else class="hero-placeholder">{{ hero.name?.substring(0, 2) || "?" }}</div>
              </div>
              <div class="hero-info">
                <div class="hero-name">{{ hero.name }}</div>
                <div class="hero-level">Lv.{{ hero.level }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 装备列表 -->
        <div v-if="selectedHeroId" class="equip-section">
          <h4>选择装备</h4>
          <div class="equip-tabs">
            <div
              v-for="part in equipParts"
              :key="part.id"
              class="equip-tab"
              :class="{ active: selectedPart === part.id }"
              @click="selectPart(part.id)"
            >
              <div class="tab-name">{{ part.name }}</div>
              <div class="tab-level">Lv.{{ part.level }}</div>
            </div>
          </div>
        </div>

        <!-- 洗练详情 -->
        <div v-if="selectedPart" class="refine-detail">
          <!-- 洗练统计 -->
          <div class="stats">
            <div class="stat-item">
              <span class="stat-label">淬炼次数</span>
              <span class="stat-value">{{ quenchTimes }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">{{ equipBonusName }}</span>
              <span class="stat-value">+{{ equipBonusValue }}</span>
            </div>
          </div>

          <!-- 洗练孔位 -->
          <div class="slots-section">
            <h4>孔位锁定</h4>
            <div class="slots">
              <div
                v-for="slot in slots"
                :key="slot.id"
                class="slot"
                :class="{
                  locked: slot.isLocked,
                  [`color-${slot.colorId}`]: slot.colorId > 0
                }"
              >
                <n-checkbox
                  v-model:checked="slot.isLocked"
                  @change="handleSlotLock(slot.id, slot.isLocked)"
                ></n-checkbox>
                <span class="slot-label">孔{{ slot.id }}</span>
                <div v-if="slot.attrId" class="slot-attr">
                  <span>{{ getAttrName(slot.attrId) }}</span>
                  <span>+{{ slot.attrNum }}%</span>
                </div>
                <div v-else class="slot-empty">未淬炼</div>
              </div>
            </div>
          </div>

          <!-- 密码验证区域 -->
          <div class="password-section">
            <div class="password-info" v-if="!isPasswordValidated">
              <span class="password-label">解锁二级密码：</span>
              <n-input
                v-model:value="password"
                type="password"
                placeholder="请输入二级密码"
                size="small"
                style="width: 150px"
                @input="passwordError = ''"
              ></n-input>
              <n-button
                type="primary"
                size="small"
                @click="verifyPassword"
                :loading="isVerifying"
              >
                验证
              </n-button>
              <span v-if="passwordError" class="password-error">{{ passwordError }}</span>
            </div>
            <div class="password-validated" v-else>
              <n-tag type="success" size="small">密码已验证</n-tag>
              <n-button
                type="warning"
                size="small"
                @click="resetPasswordValidation"
              >
                重新验证
              </n-button>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="actions">
            <n-button
              type="primary"
              size="small"
              :disabled="state.isRunning"
              @click="quenchOnce"
            >
              淬炼一次
            </n-button>
            <n-button
              type="success"
              size="small"
              :disabled="state.isRunning"
              @click="quenchContinuous"
            >
              连续淬炼
            </n-button>
            <n-button
              type="warning"
              size="small"
              :disabled="state.isRunning"
              @click="startAutoQuench"
            >
              自动淬炼
            </n-button>
            <n-button
              type="error"
              size="small"
              :disabled="!state.isRunning"
              @click="stopQuench"
            >
              停止
            </n-button>
            <div class="count-info">
              已淬炼: <strong>{{ quenchCount }}</strong>
            </div>
          </div>

          <!-- 自动淬炼设置 -->
          <div class="auto-section">
            <h4>自动淬炼设置</h4>
            <!-- 条件列表 -->
            <div class="conditions-list">
              <div 
                v-for="(condition, index) in targetConditions" 
                :key="index" 
                class="condition-item"
              >
                <div class="auto-form">
                  <div class="form-item">
                    <span class="form-label">属性</span>
                    <n-select
                      v-model:value="condition.attrId"
                      :options="attrOptions"
                      placeholder="选择属性"
                      size="small"
                      style="width: 120px"
                    ></n-select>
                  </div>
                  <div class="form-item">
                    <span class="form-label">≥</span>
                    <n-input-number
                      v-model:value="condition.attrValue"
                      :min="1"
                      :max="100"
                      size="small"
                      style="width: 80px"
                    ></n-input-number>
                  </div>
                  <div class="form-item">
                    <n-button 
                      type="error" 
                      size="small" 
                      @click="removeCondition(index)"
                      :disabled="targetConditions.length <= 1"
                    >
                      删除
                    </n-button>
                  </div>
                </div>
              </div>
            </div>
            <!-- 添加条件按钮 -->
            <div class="add-condition">
              <n-button 
                type="primary" 
                size="small" 
                @click="addCondition"
              >
                + 添加条件
              </n-button>
            </div>
            <!-- 延迟设置 -->
            <div class="auto-form delay-setting">
              <div class="form-item">
                <span class="form-label">延迟(ms)</span>
                <n-input-number
                  v-model:value="delay"
                  :min="0"
                  :step="100"
                  size="small"
                  style="width: 100px"
                ></n-input-number>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </MyCard>
</template>

<script setup>
import { ref, computed } from "vue";
import { useMessage } from "naive-ui";
import { useTokenStore } from "@/stores/tokenStore";
import MyCard from "../Common/MyCard.vue";
import { HERO_DICT } from "@/utils/HeroList.js";

const tokenStore = useTokenStore();
const message = useMessage();

// 响应式数据
const loading = ref(false);
const heroes = ref([]);
const selectedHeroId = ref(null);
const selectedPart = ref(null);
const quenchCount = ref(0);
const delay = ref(350);
// 将单个条件改为数组形式，支持多个条件
const targetConditions = ref([{
  attrId: null,
  attrValue: null
}]);
const jadeCount = ref(0);
const colorJadeCount = ref(0);
// 密码验证相关
const password = ref('');
const isPasswordValidated = ref(false);
const passwordError = ref('');
const isVerifying = ref(false);

// 状态
const state = ref({
  isRunning: false,
  continuousQuenching: false,
  autoQuenching: false,
  stopRequested: false,
});

// WebSocket相关
let continuousTimer = null;
let autoTimer = null;

// 属性映射
const attrMap = {
  1: "攻击",
  2: "血量",
  3: "防御",
  4: "速度",
  5: "破甲",
  6: "破甲抵抗",
  7: "精准",
  8: "格挡",
  9: "减伤",
  10: "暴击",
  11: "暴击抵抗",
  12: "爆伤",
  13: "爆伤抵抗",
  14: "技能伤害",
  15: "免控",
  16: "眩晕免疫",
  17: "冰冻免疫",
  18: "沉默免疫",
  19: "流血免疫",
  20: "中毒免疫",
  21: "灼烧免疫",
};

// 装备部位映射
const partMap = {
  1: "武器",
  2: "铠甲",
  3: "头冠",
  4: "坐骑",
};

// 英雄数据
const allHeroesData = ref({});
const heroEquipment = ref({});
const slots = ref([]);
const quenchTimes = ref(0);
const equipBonusName = ref("攻击");
const equipBonusValue = ref(0);

// 属性选项
const attrOptions = computed(() => {
  return Object.entries(attrMap).map(([id, name]) => ({
    label: name,
    value: Number(id),
  }));
});

// 装备部位列表
const equipParts = computed(() => {
  if (!heroEquipment.value) return [];
  return Object.entries(heroEquipment.value).map(([id, equip]) => ({
    id: Number(id),
    name: partMap[Number(id)] || `装备${id}`,
    level: equip?.level || 1,
  }));
});

// 刷新阵容
const refreshHeroes = async () => {
  const token = tokenStore.selectedToken;
  if (!token) {
    message.warning("请先选择Token");
    return;
  }

  const tokenId = token.id;
  const status = tokenStore.getWebSocketStatus(tokenId);
  if (status !== "connected") {
    message.error("WebSocket未连接，无法刷新阵容");
    return;
  }

  loading.value = true;
  try {
    // 获取预设队伍信息和角色信息
    const [presetTeamInfo, roleInfo] = await Promise.all([
      tokenStore.sendMessageWithPromise(tokenId, "presetteam_getinfo", {}),
      tokenStore.sendMessageWithPromise(tokenId, "role_getroleinfo", {}),
    ]);

    // 解析队伍数据
    const teamData = parseTeamData(presetTeamInfo);
    const role = roleInfo?.role || roleInfo;
    const heroData = role?.heroes || {};
    const items = role?.items || {};

    // 更新白玉和彩玉数量
    jadeCount.value = items["1022"]?.quantity || 0;
    colorJadeCount.value = items["1023"]?.quantity || 0;

    // 构建英雄列表
    const heroList = buildHeroList(teamData, heroData);
    heroes.value = heroList;
    allHeroesData.value = heroData;

    message.success("阵容刷新成功");
  } catch (error) {
    message.error(`刷新阵容失败: ${error.message}`);
  } finally {
    loading.value = false;
  }
};

// 解析队伍数据
const parseTeamData = (presetTeamInfo) => {
  if (!presetTeamInfo) {
    return {
      useTeamId: 1,
      teams: {},
    };
  }
  const root = presetTeamInfo.presetTeamInfo ?? presetTeamInfo;
  const findUseIdRec = (obj) => {
    if (!obj || typeof obj !== "object") return null;
    if (typeof obj.useTeamId === "number") return obj.useTeamId;
    for (const k of Object.keys(obj)) {
      const v = findUseIdRec(obj[k]);
      if (v) return v;
    }
    return null;
  };
  const useTeamId = root.useTeamId ?? root.presetTeamInfo?.useTeamId ?? findUseIdRec(root) ?? 1;

  const dict = root.presetTeamInfo ?? root;
  const teams = {};
  const ids = Object.keys(dict || {}).filter((k) => /^\d+$/.test(k));
  for (const idStr of ids) {
    const id = Number(idStr);
    const node = dict[idStr];
    if (!node) {
      teams[id] = { teamInfo: {} };
      continue;
    }
    if (node.teamInfo) {
      teams[id] = { teamInfo: node.teamInfo };
    } else if (node.heroes) {
      const ti = {};
      node.heroes.forEach((h, idx) => {
        ti[String(idx + 1)] = h;
      });
      teams[id] = { teamInfo: ti };
    } else if (typeof node === "object") {
      const hasHero = Object.values(node).some(
        (v) => v && typeof v === "object" && "heroId" in v,
      );
      teams[id] = { teamInfo: hasHero ? node : {} };
    } else {
      teams[id] = { teamInfo: {} };
    }
  }
  return { useTeamId: Number(useTeamId) || 1, teams };
};

// 构建英雄列表
const buildHeroList = (teamData, heroData) => {
  const { useTeamId, teams } = teamData;
  const currentTeam = teams[useTeamId] || { teamInfo: {} };
  const teamInfo = currentTeam.teamInfo;

  const heroList = [];

  // 从当前队伍中获取英雄
  for (const [position, hero] of Object.entries(teamInfo)) {
    const heroId = hero?.heroId || hero?.id;
    if (!heroId) continue;

    const heroDetail = heroData[String(heroId)] || {};
    heroList.push({
      id: heroId,
      name: HERO_DICT[heroId]?.name || `武将${heroId}`,
      position: Number(position),
      level: hero?.level || heroDetail?.level || 1,
      equipment: heroDetail?.equipment || {},
    });
  }

  // 如果队伍中没有英雄，从所有英雄中获取
  if (heroList.length === 0 && Object.keys(heroData).length > 0) {
    for (const [id, hero] of Object.entries(heroData)) {
      if (hero && hero.equipment) {
        heroList.push({
          id: Number(id),
          name: HERO_DICT[Number(id)]?.name || `武将${Number(id)}`,
          position: heroList.length + 1,
          level: hero?.level || 1,
          equipment: hero?.equipment || {},
        });
        if (heroList.length >= 5) break;
      }
    }
  }

  // 按位置排序
  return heroList.sort((a, b) => a.position - b.position);
};

// 选择英雄
const selectHero = (heroId) => {
  selectedHeroId.value = heroId;
  selectedPart.value = null;
  quenchCount.value = 0;

  // 获取英雄装备
  const heroDetail = allHeroesData.value[String(heroId)] || {};
  heroEquipment.value = heroDetail?.equipment || {};
};

// 选择装备部位
const selectPart = (partId) => {
  selectedPart.value = partId;
  quenchCount.value = 0;

  // 获取装备详情
  const equip = heroEquipment.value[partId];
  if (equip) {
    // 更新洗练次数和加成
    quenchTimes.value = equip.quenchTimes || 0;

    // 根据部位类型更新加成名称
    const bonusType =
      partId === 1
        ? "quenchAttackExt"
        : partId === 3
          ? "quenchDefenseExt"
          : "quenchHpExt";
    equipBonusName.value =
      partId === 1 ? "攻击" : partId === 3 ? "防御" : "血量";
    equipBonusValue.value = equip[bonusType] || 0;

    // 更新孔位信息
    updateSlots(equip.quenches || {});
  } else {
    quenchTimes.value = 0;
    equipBonusValue.value = 0;
    slots.value = [];
  }
};

// 更新孔位信息
const updateSlots = (quenches) => {
  const slotList = [];
  const slotKeys = Object.keys(quenches).sort((a, b) => Number(a) - Number(b));

  for (const key of slotKeys) {
    const slotId = Number(key);
    const slot = quenches[key];
    slotList.push({
      id: slotId,
      attrId: slot.attrId || null,
      attrNum: slot.attrNum || 0,
      isLocked: slot.isLocked || slot.locked || false,
      colorId: slot.colorId || 0,
    });
  }

  slots.value = slotList;
};

// 获取属性名称
const getAttrName = (attrId) => {
  return attrMap[attrId] || `属性${attrId}`;
};

// 密码验证
const verifyPassword = async () => {
  if (!password.value) {
    passwordError.value = "请输入密码";
    return;
  }

  const token = tokenStore.selectedToken;
  if (!token) {
    message.warning("请先选择Token");
    return;
  }

  const tokenId = token.id;
  const status = tokenStore.getWebSocketStatus(tokenId);
  if (status !== "connected") {
    message.error("WebSocket未连接，无法验证密码");
    return;
  }

  isVerifying.value = true;
  passwordError.value = '';

  try {
    await tokenStore.sendMessageWithPromise(
      tokenId,
      "role_commitpassword",
      {
        password: password.value,
        passwordType: 1
      }
    );

    isPasswordValidated.value = true;
    message.success("密码验证成功");
  } catch (error) {
    passwordError.value = `验证失败: ${error.message}`;
    message.error(`密码验证失败: ${error.message}`);
  } finally {
    isVerifying.value = false;
  }
};

// 重置密码验证
const resetPasswordValidation = () => {
  isPasswordValidated.value = false;
  password.value = '';
  passwordError.value = '';
};

// 处理孔位锁定
const handleSlotLock = async (slotId, isLocked) => {
  const token = tokenStore.selectedToken;
  if (!token || !selectedHeroId.value || !selectedPart.value) {
    message.warning("请先选择武将和装备");
    return;
  }

  // 解锁时需要验证密码
  if (!isLocked && !isPasswordValidated.value) {
    message.warning("请先验证二级密码以解锁孔位");
    // 恢复锁定状态
    const slot = slots.value.find((s) => s.id === slotId);
    if (slot) {
      slot.isLocked = true;
    }
    return;
  }

  const tokenId = token.id;
  try {
    await tokenStore.sendMessageWithPromise(
      tokenId,
      "equipment_updatequenchlock",
      {
        heroId: selectedHeroId.value,
        part: selectedPart.value,
        slot: slotId,
        isLocked,
      },
    );

    // 更新孔位状态
    const slot = slots.value.find((s) => s.id === slotId);
    if (slot) {
      slot.isLocked = isLocked;
    }

    message.success(isLocked ? "孔位已锁定" : "孔位已解锁");
  } catch (error) {
    message.error(`锁定孔位失败: ${error.message}`);
  }
};

// 淬炼一次
const quenchOnce = async () => {
  if (!selectedHeroId.value || !selectedPart.value) {
    message.warning("请先选择武将和装备部位");
    return;
  }

  await executeQuench();
};

// 连续淬炼
const quenchContinuous = () => {
  if (state.value.continuousQuenching) return;

  if (!selectedHeroId.value || !selectedPart.value) {
    message.warning("请先选择武将和装备部位");
    return;
  }

  state.value.continuousQuenching = true;
  state.value.isRunning = true;
  message.info("开始连续淬炼，出现橙色或红色属性时自动暂停");

  const continuousQuench = async () => {
    if (!state.value.continuousQuenching) return;

    try {
      const result = await executeQuench();
      if (result && checkHighQualityAttr(result)) {
        message.success("发现橙色或红色属性，已自动暂停");
        stopQuench();
        return;
      }

      // 随机延迟
      const randomDelay = Math.floor(Math.random() * 150) + delay.value;
      continuousTimer = setTimeout(continuousQuench, randomDelay);
    } catch (error) {
      message.error(`连续淬炼失败: ${error.message}`);
      stopQuench();
    }
  };

  continuousQuench();
};

// 添加条件
const addCondition = () => {
  targetConditions.value.push({
    attrId: null,
    attrValue: null
  });
};

// 删除条件
const removeCondition = (index) => {
  if (targetConditions.value.length <= 1) {
    message.warning("至少需要保留一个条件");
    return;
  }
  targetConditions.value.splice(index, 1);
};

// 自动淬炼
const startAutoQuench = () => {
  // 检查是否有有效的条件
  const hasValidCondition = targetConditions.value.some(condition => 
    condition.attrId !== null && condition.attrValue !== null
  );
  
  if (!hasValidCondition) {
    message.warning("请至少设置一个有效的目标属性和数值");
    return;
  }

  if (!selectedHeroId.value || !selectedPart.value) {
    message.warning("请先选择武将和装备部位");
    return;
  }

  state.value.autoQuenching = true;
  state.value.isRunning = true;
  
  // 生成条件描述
  const conditionDescriptions = targetConditions.value
    .filter(condition => condition.attrId && condition.attrValue)
    .map(condition => `${getAttrName(condition.attrId)} ≥ ${condition.attrValue}`);
  
  message.info(
    `开始自动淬炼，目标：${conditionDescriptions.join(" 或 ")}`,
  );

  const autoQuench = async () => {
    if (!state.value.autoQuenching) return;

    try {
      const result = await executeQuench();
      if (result && checkTargetAttr(result)) {
        message.success(
          `已达到目标条件，自动淬炼已停止`,
        );
        stopQuench();
        return;
      }

      // 随机延迟
      const randomDelay = Math.floor(Math.random() * 150) + delay.value;
      autoTimer = setTimeout(autoQuench, randomDelay);
    } catch (error) {
      message.error(`自动淬炼失败: ${error.message}`);
      stopQuench();
    }
  };

  autoQuench();
};

// 执行淬炼
const executeQuench = async () => {
  const token = tokenStore.selectedToken;
  if (!token) {
    message.warning("请先选择Token");
    return null;
  }

  const tokenId = token.id;
  const status = tokenStore.getWebSocketStatus(tokenId);
  if (status !== "connected") {
    message.error("WebSocket未连接，无法执行淬炼");
    return null;
  }

  // 检查武器等级（如果是武器）
  if (selectedPart.value === 1) {
    const equip = heroEquipment.value[selectedPart.value];
    if (equip?.level < 4000) {
      message.warning(
        `武器等级不足，需要4000级以上（当前${equip?.level || 0}级）`,
      );
      return null;
    }
  }

  try {
    // 获取当前孔位信息
    const currentEquip = heroEquipment.value[selectedPart.value];
    if (!currentEquip?.quenches) {
      message.error("未获取到装备孔位信息");
      return null;
    }

    // 检查是否有孔位的attrNum值超过50且未被锁定
    const highAttrSlots = Object.values(currentEquip.quenches).filter(slot => 
      slot.attrNum > 50 && !slot.isLocked
    );
    const hasHighAttrSlot = highAttrSlots.length > 0;

    // 如果有高属性孔位且未锁定，先发送equipment_confirm命令
    let seedFromConfirm = 0;
    if (hasHighAttrSlot) {
      // 构建确认请求参数
      const confirmParams = {
        heroId: selectedHeroId.value,
        part: selectedPart.value,
        quenchId: 0,
        quenches: currentEquip.quenches
      };

      // 发送确认请求并获取响应
      const confirmResult = await tokenStore.sendMessageWithPromise(
        tokenId,
        "equipment_confirm",
        confirmParams,
        15000,
      );

      // 从确认响应中提取seed值 - WebSocket客户端已返回body部分
      if (confirmResult?.role?.heroes) {
        // 处理响应格式1: role.heroes[heroId].equipment[part].seed
        const hero = confirmResult.role.heroes[String(selectedHeroId.value)];
        if (hero?.equipment?.[selectedPart.value]?.seed) {
          seedFromConfirm = hero.equipment[selectedPart.value].seed;
          console.log('✅ 从Equipment_ConfirmResp中提取seed:', seedFromConfirm);
        }
      } else if (confirmResult?.seed) {
        // 处理响应格式2: seed直接在body中
        seedFromConfirm = confirmResult.seed;
        console.log('✅ 从Equipment_ConfirmResp的body中提取seed:', seedFromConfirm);
      } else if (confirmResult?.equipment?.seed) {
        // 处理响应格式3: equipment.seed
        seedFromConfirm = confirmResult.equipment.seed;
        console.log('✅ 从Equipment_ConfirmResp的equipment中提取seed:', seedFromConfirm);
      } else {
        // 所有格式都未匹配，记录完整响应以便调试
        console.log('❌ 未能从Equipment_ConfirmResp中提取seed，响应内容:', JSON.stringify(confirmResult));
      }
    }

    // 构建淬炼制请求参数
    const quenchParams = {
      heroId: selectedHeroId.value,
      part: selectedPart.value,
      quenchId: 0,
      quenches: currentEquip.quenches,
      seed: seedFromConfirm,
      skipOrange: false,
    };

    // 发送淬炼请求（设置更长的超时时间，淬炼操作可能较慢）
    const result = await tokenStore.sendMessageWithPromise(
      tokenId,
      "equipment_quench",
      quenchParams,
      15000,
    );

    // 更新淬炼次数
    quenchCount.value++;

    // 更新装备信息 - 处理不同格式的响应
    let updatedEquip = null;
    
    // 处理1: Equipment_QuenchResp响应直接包含装备数据
    if (result?.equipment) {
      updatedEquip = result.equipment;
    }
    // 处理2: 响应包含角色英雄数据
    else if (result?.role?.heroes) {
      const updatedHero = result.role.heroes[String(selectedHeroId.value)];
      if (updatedHero?.equipment) {
        updatedEquip = updatedHero.equipment[selectedPart.value];
      }
    }
    // 处理3: 响应直接包含淬炼制结果
    else if (result?.quenches) {
      // 基于现有装备创建更新后的装备对象
      updatedEquip = {
        ...heroEquipment.value[selectedPart.value],
        quenches: result.quenches,
        quenchTimes: (heroEquipment.value[selectedPart.value].quenchTimes || 0) + 1
      };
    }
    
    // 如果获取到了更新的装备数据，更新界面
    if (updatedEquip) {
      // 更新装备对象
      heroEquipment.value[selectedPart.value] = updatedEquip;

      // 更新淬炼次数和加成
      quenchTimes.value = updatedEquip.quenchTimes || 0;
      const bonusType =
        selectedPart.value === 1
          ? "quenchAttackExt"
          : selectedPart.value === 3
            ? "quenchDefenseExt"
            : "quenchHpExt";
      equipBonusValue.value = updatedEquip[bonusType] || 0;

      // 更新孔位信息
      if (updatedEquip.quenches) {
        updateSlots(updatedEquip.quenches);
      }
    }

    // 更新白玉和彩玉数量
    if (result?.role?.items) {
      const items = result.role.items;
      jadeCount.value = items["1022"]?.quantity || jadeCount.value;
      colorJadeCount.value = items["1023"]?.quantity || colorJadeCount.value;
    }

    return result;
  } catch (error) {
    message.error(`淬炼失败: ${error.message}`);
    return null;
  }
};

// 从响应中获取最新的装备数据
const getEquipFromResult = (result) => {
  // 处理1: Equipment_QuenchResp响应直接包含装备数据
  if (result?.equipment) {
    return result.equipment;
  }
  // 处理2: 响应包含角色英雄数据
  else if (result?.role?.heroes) {
    const updatedHero = result.role.heroes[String(selectedHeroId.value)];
    if (updatedHero?.equipment) {
      return updatedHero.equipment[selectedPart.value];
    }
  }
  // 处理3: 响应直接包含淬炼制结果
  else if (result?.quenches) {
    // 基于现有装备创建更新后的装备对象
    return {
      ...heroEquipment.value[selectedPart.value],
      quenches: result.quenches,
      quenchTimes: (heroEquipment.value[selectedPart.value].quenchTimes || 0) + 1
    };
  }
  // 处理4: 使用当前界面的装备数据（兜底）
  return heroEquipment.value[selectedPart.value];
};

// 检查高品质属性（橙色或红色）
const checkHighQualityAttr = (result) => {
  const equip = getEquipFromResult(result);
  if (!equip?.quenches) return false;

  // 检查是否有高品质属性（colorId >= 5）
  for (const slot of Object.values(equip.quenches)) {
    if (slot.colorId && slot.colorId >= 5) {
      return true;
    }
  }

  return false;
};

// 检查目标属性
const checkTargetAttr = (result) => {
  // 获取有效的条件
  const validConditions = targetConditions.value.filter(condition => 
    condition.attrId && condition.attrValue
  );
  
  if (validConditions.length === 0) return false;

  const equip = getEquipFromResult(result);
  if (!equip?.quenches) return false;

  const slots = Object.values(equip.quenches);
  
  // 检查是否有任何一个条件满足（OR关系）
  return validConditions.some(condition => {
    return slots.some(slot => {
      return slot.attrId === condition.attrId && slot.attrNum >= condition.attrValue;
    });
  });
};

// 停止淬炼
const stopQuench = () => {
  state.value.continuousQuenching = false;
  state.value.autoQuenching = false;
  state.value.isRunning = false;

  if (continuousTimer) {
    clearTimeout(continuousTimer);
    continuousTimer = null;
  }

  if (autoTimer) {
    clearTimeout(autoTimer);
    autoTimer = null;
  }

  message.success("淬炼已停止");
};

// 重置淬炼次数
const resetCount = () => {
  quenchCount.value = 0;
  message.success("已清零");
};
</script>

<style scoped lang="scss">
.refine-container {
  padding: var(--spacing-sm);
}

.toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  flex-wrap: wrap;
}

.jade-info {
  margin-left: auto;
  display: flex;
  gap: var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.hero-list-section,
.equip-section {
  margin-bottom: var(--spacing-md);
}

h4 {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.hero-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  max-height: 220px;
  overflow-y: auto;
  padding: var(--spacing-sm);
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-medium);
}

.hero-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--bg-primary);
  border: 2px solid transparent;
  border-radius: var(--border-radius-medium);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all 0.2s;
  color: var(--text-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  min-width: 140px;
  flex: 0 0 calc(25% - 8px);
  box-sizing: border-box;
}

.hero-item:hover {
  border-color: var(--primary-color);
  background: var(--primary-color-light);
}

.hero-item.active {
  border-color: var(--primary-color);
  background: var(--primary-color-light);
  color: var(--primary-color);
}

.hero-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.hero-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-placeholder {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--text-secondary);
}

.hero-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.hero-name {
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hero-level {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.loading,
.empty {
  padding: var(--spacing-md);
  color: var(--text-secondary);
  text-align: center;
  font-size: var(--font-size-sm);
}

.equip-tabs {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.equip-tab {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-tertiary);
  border: 2px solid transparent;
  border-radius: var(--border-radius-medium);
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
}

.equip-tab:hover {
  border-color: var(--border-light);
}

.equip-tab.active {
  border-color: var(--primary-color);
  background: var(--primary-color-light);
}

.tab-name {
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.tab-level {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-top: var(--spacing-xs);
}

.stats {
  display: flex;
  gap: var(--spacing-lg);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-medium);
  margin-bottom: var(--spacing-md);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.stat-label {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.stat-value {
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-md);
  color: var(--primary-color);
}

.slots-section {
  margin-bottom: var(--spacing-md);
}

.slots {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.slot {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-medium);
  border-left: 4px solid var(--border-light);
  transition: all 0.2s;
}

.slot:hover {
  background: var(--bg-secondary);
}

.slot.locked {
  border-left-color: var(--primary-color);
  background: var(--primary-color-light);
}

/* 孔位颜色样式 */
.slot.color-1 {
  background: rgba(255, 255, 255, 0.1);
  border-left-color: #ffffff;
}

.slot.color-2 {
  background: rgba(76, 175, 80, 0.1);
  border-left-color: #4caf50;
}

.slot.color-3 {
  background: rgba(33, 150, 243, 0.1);
  border-left-color: #2196f3;
}

.slot.color-4 {
  background: rgba(156, 39, 176, 0.1);
  border-left-color: #9c27b0;
}

.slot.color-5 {
  background: rgba(255, 152, 0, 0.1);
  border-left-color: #ff9800;
}

.slot.color-6 {
  background: rgba(244, 67, 54, 0.1);
  border-left-color: #f44336;
}

/* 锁定状态下的颜色样式 */
.slot.locked.color-1 {
  background: rgba(255, 255, 255, 0.2);
}

.slot.locked.color-2 {
  background: rgba(76, 175, 80, 0.2);
}

.slot.locked.color-3 {
  background: rgba(33, 150, 243, 0.2);
}

.slot.locked.color-4 {
  background: rgba(156, 39, 176, 0.2);
}

.slot.locked.color-5 {
  background: rgba(255, 152, 0, 0.2);
}

.slot.locked.color-6 {
  background: rgba(244, 67, 54, 0.2);
}

.slot-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  min-width: 40px;
  font-weight: var(--font-weight-medium);
}

.slot-attr {
  flex: 1;
  display: flex;
  justify-content: space-between;
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
}

.slot-empty {
  flex: 1;
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
}

.actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  flex-wrap: wrap;
}

.count-info {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.count-info strong {
  color: var(--primary-color);
  font-size: var(--font-size-md);
}

.auto-section {
  padding: var(--spacing-sm);
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-medium);
}

.auto-form {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

/* 条件列表样式 */
.conditions-list {
  margin-bottom: var(--spacing-sm);
}

.condition-item {
  padding: var(--spacing-sm);
  background: rgba(0, 0, 0, 0.05);
  border-radius: var(--border-radius-medium);
  margin-bottom: var(--spacing-sm);
  border: 1px solid var(--border-light);
}

/* 添加条件按钮样式 */
.add-condition {
  margin-bottom: var(--spacing-sm);
  display: flex;
  justify-content: flex-start;
}

/* 延迟设置样式 */
.delay-setting {
  padding-top: var(--spacing-sm);
  border-top: 1px dashed var(--border-light);
}

/* 密码验证区域样式 */
.password-section {
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: rgba(0, 0, 0, 0.05);
  border-radius: var(--border-radius-medium);
  border: 1px solid var(--border-light);
}

.password-info,
.password-validated {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.password-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

.password-error {
  color: var(--color-error);
  font-size: var(--font-size-xs);
  margin-left: var(--spacing-sm);
}

.password-validated {
  justify-content: space-between;
  align-items: center;
}

.form-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.form-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}
</style>
