<template>
  <MyCard class="shop-goods" :status-class="{ active: status === 'loaded' }">
    <template #icon>
      <img src="/icons/174061875626614.png" alt="商店图标" />
    </template>
    <template #title>
      <h3>商店商品</h3>
      <p>{{ summaryText }}</p>
    </template>
    <template #badge>
      <span>{{ statusText }}</span>
    </template>

    <template #default>
      <NAlert v-if="hint" type="info" :bordered="false" class="shop-hint">
        {{ hint }}
      </NAlert>

      <div class="shop-meta">
        <div v-if="rows.length" class="shop-stats">
          <span>商品 <b>{{ rows.length }}</b></span>
          <span>有折扣 <b>{{ discountedCount }}</b></span>
          <span>已购 <b>{{ boughtCount }}</b></span>
          <span v-if="refreshCount > 0">
            已刷新 <b>{{ refreshCount }}</b> 次
          </span>
        </div>
        <div class="gold-brick" :class="{ empty: !goldBrick }">
          <img class="gold-icon" :src="goldIcon" alt="金砖" />
          <span>金砖</span>
          <b>{{ formatNum(goldBrick) }}</b>
        </div>
      </div>

      <div v-if="rows.length" class="goods-grid">
        <div v-for="row in rows" :key="row.goodsId" class="goods-item">
          <div class="goods-name" :title="getGoodsName(row.goodsId)">
            {{ getGoodsName(row.goodsId) || `商品 ${row.goodsId}` }}
          </div>

          <div class="goods-thumb">
            <div class="thumb-box">
              <img
                :src="goodsIcon(row.goodsId)"
                :alt="getGoodsName(row.goodsId)"
                loading="lazy"
              />
              <span v-if="isDiscounted(row)" class="discount-badge">
                {{ formatDiscountCN(row.discount) }}
              </span>
            </div>
          </div>

          <div class="goods-price">
            <span v-if="isDiscounted(row)" class="price-base">
              {{ getGoodsBasePrice(row.goodsId) }}
            </span>
            <span
              class="price-final"
              :class="{ unaffordable: isUnaffordable(row) }"
            >
              <img class="price-icon" :src="goldIcon" alt="金砖" />
              {{ getGoodsFinalPrice(row.goodsId, row.discount) }}
            </span>
          </div>

          <NButton
            size="small"
            block
            :type="isSoldOut(row) ? 'default' : 'primary'"
            :secondary="!isSoldOut(row)"
            :disabled="isSoldOut(row)"
            @click="openPurchase(row)"
          >
            {{ isSoldOut(row) ? "已购买" : "购买" }}
          </NButton>
        </div>
      </div>

      <p v-if="rows.length" class="shop-note">
        读取商品不会触发商店刷新；「刷新商店」会重置整批商品与折扣，点击后需二次确认。VIP0 每天 1 次免费刷新，用完后按钮自动置灰。
      </p>

      <NModal
        v-model:show="purchaseVisible"
        preset="card"
        title="购买商品"
        style="width: 420px; max-width: 92vw"
        :bordered="false"
      >
        <div class="purchase-body">
          <div class="purchase-meta">
            <div>
              <span>商品</span>
              <b>{{ getGoodsName(purchaseTarget?.goodsId) || "-" }}</b>
            </div>
            <div>
              <span>ID</span><b>{{ purchaseTarget?.goodsId }}</b>
            </div>
            <div>
              <span>当前折扣</span>
              <b>{{ formatDiscount(purchaseTarget?.discount) }}</b>
            </div>
            <div>
              <span>原价</span>
              <b>{{ getGoodsBasePrice(purchaseTarget?.goodsId) ?? "-" }}</b>
            </div>
            <div>
              <span>现价</span>
              <b class="with-icon">
                <img class="price-icon" :src="goldIcon" alt="金砖" />
                {{
                  getGoodsFinalPrice(
                    purchaseTarget?.goodsId,
                    purchaseTarget?.discount,
                  ) ?? "-"
                }}
              </b>
            </div>
            <div>
              <span>已购数量</span>
              <b :class="{ 'sold-out': purchaseTargetSoldOut }">
                {{ purchaseTargetQty }}
              </b>
            </div>
            <div>
              <span>金砖余额</span>
              <b class="with-icon">
                <img class="price-icon" :src="goldIcon" alt="金砖" />
                {{ formatNum(goldBrick) }}
              </b>
            </div>
          </div>

          <NAlert
            v-if="purchaseTargetSoldOut"
            type="info"
            :bordered="false"
            class="purchase-warn"
          >
            该商品已购买，每件限购 1 次，无法再次购买。
          </NAlert>
          <NAlert v-else type="warning" :bordered="false" class="purchase-warn">
            每件商品限购 1 次，购买会消耗金砖。
          </NAlert>

          <div v-if="purchaseLog.length" class="purchase-log">
            <p v-for="(line, i) in purchaseLog" :key="i" :class="line.type">
              {{ line.text }}
            </p>
          </div>
        </div>

        <template #footer>
          <NSpace justify="end">
            <NButton size="small" :disabled="purchaseRunning" @click="purchaseVisible = false">
              关闭
            </NButton>
            <NButton
              size="small"
              type="primary"
              :loading="purchaseRunning"
              :disabled="purchaseTargetSoldOut"
              @click="runPurchase"
            >
              {{ purchaseTargetSoldOut ? "已购买" : "确认购买" }}
            </NButton>
          </NSpace>
        </template>
      </NModal>

      <!-- 购买计划 -->
      <NModal
        v-model:show="planVisible"
        preset="card"
        title="购买计划"
        style="width: 780px; max-width: 94vw"
        :bordered="false"
        :mask-closable="!planRunning"
        :closable="!planRunning"
        @after-leave="backToSetup"
      >
        <!-- 设置视图 -->
        <div v-if="planView === 'setup'" class="plan-setup">
          <div class="plan-toolbar">
            <div class="plan-toolbar-item">
              <span>刷新次数上限</span>
              <NInputNumber
                v-model:value="planDraft.maxRefresh"
                :min="0"
                :max="MAX_REFRESH_LIMIT"
                size="small"
                style="width: 96px"
              />
              <span class="plan-toolbar-hint">
                0 = 只买当前批次；买齐或刷满 {{ MAX_REFRESH_LIMIT }} 次即停止
              </span>
            </div>
            <div class="plan-toolbar-item">
              <span>复制其他账户</span>
              <NSelect
                v-model:value="planCopySelected"
                :options="planCopyOptions"
                :placeholder="
                  planCopyOptions.length ? '选择账户即可复制' : '暂无其他账户存过计划'
                "
                :disabled="!planCopyOptions.length"
                size="small"
                style="width: 100%;min-width: 300px;"
                @update:value="copyPlanFrom"
              />
            </div>

            <div class="plan-toolbar-item">
              <span>按折扣换算</span>
              <NButton
                v-for="rate in DISCOUNT_PRESETS"
                :key="rate"
                size="tiny"
                secondary
                @click="applyDiscount(rate)"
              >
                {{ Math.round(rate * 10) }}折
              </NButton>
            </div>
          </div>

          <p class="plan-tip">
            勾选想买的商品并填写心理价：只有「现价 ≤ 心理价」才会购买，原价仅供参考。
          </p>

          <NAlert v-if="!rows.length" type="info" :bordered="false" class="plan-empty">
            还没有商品数据，请先回到卡片点「读取商品列表」。
          </NAlert>

          <div class="plan-list">
            <div
              v-for="row in rows"
              :key="row.goodsId"
              class="plan-row"
              :class="{
                checked: isPlanChecked(row.goodsId),
                bought: Number(row.buy_quantity ?? 0) >= 1,
              }"
            >
              <NCheckbox
                :checked="isPlanChecked(row.goodsId)"
                @update:checked="(v) => togglePlanItem(row.goodsId, v)"
              />
              <span class="plan-name">
                {{ getGoodsName(row.goodsId) }}
                <span
                  v-if="Number(row.buy_quantity ?? 0) >= 1"
                  class="plan-bought-tag"
                >
                  本批已购
                </span>
              </span>
              <span class="plan-origin">
                原价 {{ getGoodsBasePrice(row.goodsId) }}
              </span>
              <NInputNumber
                :value="planDraft.items[String(row.goodsId)] ?? null"
                :min="1"
                :show-button="false"
                size="small"
                placeholder="心理价"
                class="plan-price-input"
                @update:value="(v) => setPlanPrice(row.goodsId, v)"
              />
            </div>
          </div>

          <div class="plan-summary">
            <span>已勾选 <b>{{ planCheckedIds.length }}</b> 件</span>
            <span :class="{ over: planCostOverBudget }">
              预计花费 <b>{{ formatNum(planEstimatedCost) }}</b> 金砖
              <span class="plan-summary-formula">
                单次 {{ formatNum(planCostPerRound) }} × {{ planRounds }} 轮
              </span>
              <template v-if="planCostOverBudget">（超出余额）</template>
            </span>
            <span>金砖余额 <b>{{ formatNum(goldBrick) }}</b></span>
            <span v-if="refreshExhausted" class="plan-summary-warn">
              今日刷新次数已用完，只能购买当前批次
            </span>
          </div>
        </div>

        <!-- 执行日志视图 -->
        <div v-else class="plan-running">
          <div class="plan-logs">
            <p v-for="(line, i) in planLogs" :key="i" :class="line.type">
              {{ line.text }}
            </p>
          </div>
        </div>

        <template #footer>
          <NSpace justify="end">
            <template v-if="planView === 'setup'">
              <NButton size="small" @click="clearPlanItems">清空勾选</NButton>
              <NButton size="small" @click="closePlan">关闭</NButton>
              <NButton
                size="small"
                type="primary"
                :disabled="!planCheckedIds.length"
                @click="savePlan"
              >
                保存计划
              </NButton>
            </template>
            <template v-else-if="planRunning">
              <NButton size="small" type="error" @click="planStopRequested = true">
                停止
              </NButton>
            </template>
            <template v-else>
              <NButton size="small" @click="backToSetup">返回设置</NButton>
              <NButton size="small" @click="closePlan">关闭</NButton>
            </template>
          </NSpace>
        </template>
      </NModal>
    </template>

    <template #action>
      <div class="action-wrapper shop-actions">
        <NButton
          class="read-btn"
          type="primary"
          size="small"
          :loading="loading"
          :disabled="!tokenStore.selectedToken"
          @click="fetchGoods"
        >
          {{ loading ? "读取中..." : "读取商品列表" }}
        </NButton>

        <!-- 刷新会重置整批商品，必须二次确认 -->
        <NPopconfirm
          v-model:show="refreshConfirmVisible"
          :disabled="refreshConfirmDisabled"
          placement="top-end"
          positive-text="确认刷新"
          negative-text="取消"
          @positive-click="refreshStore"
        >
          <template #trigger>
            <NButton
              class="refresh-btn"
              size="small"
              type="warning"
              secondary
              :title="refreshTitle"
              :loading="refreshing"
              :disabled="refreshConfirmDisabled"
            >
              <template #icon>
                <NIcon><RefreshOutline /></NIcon>
              </template>
              {{ refreshButtonText }}
            </NButton>
          </template>
          <div class="refresh-confirm">
            <p class="refresh-confirm-title">确定刷新商店？</p>
            <p class="refresh-confirm-desc">
              刷新后当前这批商品、折扣和已购记录都会被重置，无法撤销。
            </p>
            <p v-if="refreshCount === 0" class="refresh-confirm-desc">
              今天还没刷过，本次是免费刷新。
            </p>
            <p v-else class="refresh-confirm-desc">
              今天已刷新 {{ refreshCount }} 次，继续可能失败或消耗金砖。
            </p>
          </div>
        </NPopconfirm>

        <NButton
          class="plan-btn"
          size="small"
          type="info"
          secondary
          title="编辑购买计划：勾选商品、设置心理价和刷新次数"
          :disabled="!tokenStore.selectedToken"
          @click="openPlan"
        >
          <template #icon>
            <NIcon><CreateOutline /></NIcon>
          </template>
          编辑计划
        </NButton>

        <NButton
          class="run-btn"
          size="small"
          type="success"
          secondary
          title="按照已保存的计划自动购买"
          :loading="planRunning"
          :disabled="!tokenStore.selectedToken || planRunning"
          @click="runSavedPlan"
        >
          <template #icon>
            <NIcon><PlayOutline /></NIcon>
          </template>
          执行计划
        </NButton>
      </div>
    </template>
  </MyCard>
</template>

<script setup>
import { CreateOutline, PlayOutline, RefreshOutline } from "@vicons/ionicons5";
import {
  NAlert,
  NButton,
  NCheckbox,
  NIcon,
  NInputNumber,
  NModal,
  NPopconfirm,
  NSelect,
  NSpace,
  useMessage,
} from "naive-ui";
import { computed, ref } from "vue";
import { useTokenStore } from "@/stores/tokenStore";
import { logInfo } from "@/utils/frontendLog";
import { getGoodsBasePrice, getGoodsFinalPrice, getGoodsName } from "@/utils/shopGoodsPrice";
import {
  clearShopPlan,
  listSavedPlanTokenIds,
  loadShopPlan,
  MAX_REFRESH_LIMIT,
  planGoodsIds,
  saveShopPlan,
} from "@/utils/shopPlan";

/**
 * 商店商品（黑市）查看 + 购买 + 手动刷新
 *
 * 协议：store_goodslist 读取、store_buy 购买、store_refresh 刷新、
 *      role_getroleinfo 读金砖余额，均已在 xyzwWebSocket.js 注册。
 * 店铺固定 storeId=1（黑市），其余店铺 ID 实测不可用，故不提供切换。
 *
 * 已确认的返回结构（storeId=1）：
 *   { goodsList: { "1": { buy_quantity: 0, discount: 0.5 }, … } }
 *   注意 goodsList 是「以 goodsId 为键的对象」，不是数组；discount 是 0~1 的浮点数，
 *   且带单精度误差（0.30000001192092896），展示时必须四舍五入。
 *
 * ⚠️ store_refresh 会直接重置整批商品与折扣，**必须**经过二次确认才能调用，
 *    绝不能挂到读取、定时任务或页面初始化里自动触发。用户只在买完想要的东西后手动刷新。
 */

const message = useMessage();
const tokenStore = useTokenStore();

// 黑市固定在 storeId=1，其余店铺 ID 实测不可用，因此不做选择
const STORE_ID = 1;
const loading = ref(false);
const status = ref("idle");
const rows = ref([]);
// goodsMap = 已确认的 goodsList 对象结构；dynamic = 兜底解析
const mode = ref("goodsMap");
const hint = ref("");

// 购买弹窗
const purchaseVisible = ref(false);
const purchaseTarget = ref(null);
const purchaseRunning = ref(false);
const purchaseLog = ref([]);

// 刷新商店：会重置整批商品，必须走二次确认
const refreshing = ref(false);
const refreshConfirmVisible = ref(false);
/**
 * 今日已刷新次数，来自 store_goodslist 返回的顶层 refresh 字段。
 * 服务端只在刷过之后才下发该字段（没刷过时返回里根本没有 refresh）。
 */
const refreshCount = ref(0);
/** VIP 0 每天只有 1 次免费刷新，用完后再点服务端会直接拒绝（实测报「无刷新次数」） */
const isVipZero = computed(
  () => Number(tokenStore.gameData?.roleInfo?.role?.vip ?? 0) === 0,
);
/** 今天已经刷不动了：VIP0 且已刷满 1 次 */
const refreshExhausted = computed(
  () => isVipZero.value && refreshCount.value >= 1,
);
const refreshConfirmDisabled = computed(
  () =>
    !tokenStore.selectedToken ||
    refreshing.value ||
    status.value === "loading" ||
    refreshExhausted.value ||
    // 必须先读取过商品列表：没读过就不知道今天刷没刷过，也不该盲刷
    !rows.value.length,
);

/** 刷新按钮悬停提示：说明当前处于什么状态、为什么点不了 */
const refreshTitle = computed(() => {
  if (!tokenStore.selectedToken) return "请先选择一个角色";
  if (!rows.value.length) return "请先读取商品列表";
  if (refreshing.value) return "正在刷新";
  if (refreshExhausted.value) return "今日刷新次数已用完，明天恢复";
  return refreshCount.value === 0
    ? "今天还没刷过，本次免费"
    : `今天已刷新 ${refreshCount.value} 次，继续可能消耗金砖`;
});

/** 按钮文案：把「今天还能不能刷」直接写在按钮上 */
const refreshButtonText = computed(() => {
  if (refreshing.value) return "刷新中";
  if (refreshExhausted.value) return "今日已刷";
  if (refreshCount.value > 0) return "再刷一次";
  return "刷新商店";
});

// ==================== 购买计划 ====================
const planVisible = ref(false);
/** 弹窗视图：setup = 设置清单，log = 执行日志（含已结束状态） */
const planView = ref("setup");
/** 编辑中的计划：{ items: { goodsId: 心理价 }, maxRefresh } */
const planDraft = ref({ items: {}, maxRefresh: 0 });
const planRunning = ref(false);
const planStopRequested = ref(false);
/** 执行日志：[{ text, type }]，type = info|ok|warn|err|muted */
/** 折扣快捷换算：1 折 ~ 10 折 */
const DISCOUNT_PRESETS = Array.from({ length: 10 }, (_, i) => (i + 1) / 10);
const planLogs = ref([]);

/** 可复制的其他账户计划（打开弹窗时刷新） */
const planCopyOptions = ref([]);
const planCopySelected = ref(null);

/** 扫描本地已保存计划的账户，排除当前账户，拼成下拉选项 */
function buildCopyOptions() {
  const currentId = String(tokenStore.selectedToken?.id ?? "");
  const tokens = tokenStore.gameTokens || [];
  planCopyOptions.value = listSavedPlanTokenIds()
    .filter((id) => id && id !== currentId)
    .map((id) => {
      const plan = loadShopPlan(id);
      const count = planGoodsIds(plan).length;
      if (!count) return null;
      const token = tokens.find((t) => String(t.id) === id);
      return {
        label: `${token?.name || id}（${count} 件 / 刷 ${plan.maxRefresh} 次）`,
        value: id,
      };
    })
    .filter(Boolean);
  planCopySelected.value = null;
}

/** 把某个账户的计划复制到当前草稿（不自动保存，由用户点「保存计划」） */
function copyPlanFrom(tokenId) {
  if (!tokenId) return;
  const plan = loadShopPlan(tokenId);
  const ids = planGoodsIds(plan);
  if (!ids.length) {
    message.warning("该账户没有已保存的计划");
    return;
  }
  planDraft.value = { items: { ...plan.items }, maxRefresh: plan.maxRefresh };
  planCopySelected.value = null;
  message.success(`已复制 ${ids.length} 件商品的计划，确认后点「保存计划」`);
}

const planCheckedIds = computed(() =>
  Object.keys(planDraft.value.items || {})
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id)),
);

/** 单次（这一批商品全部命中心理价时的花费） */
const planCostPerRound = computed(() => {
  let total = 0;
  for (const goodsId of planCheckedIds.value) {
    const row = rows.value.find((r) => Number(r.goodsId) === goodsId);
    const price = getGoodsFinalPrice(goodsId, row?.discount);
    if (price != null) total += price;
  }
  return total;
});

/** 购买轮次：首轮 + 每次刷新后各一轮 */
const planRounds = computed(
  () => Math.max(1, Number(planDraft.value.maxRefresh || 0) + 1),
);

/** 预计总花费 = 单次 × 轮次 */
const planEstimatedCost = computed(
  () => planCostPerRound.value * planRounds.value,
);

/** 预计花费是否超出当前金砖 */
const planCostOverBudget = computed(
  () => planEstimatedCost.value > Number(goldBrick.value || 0),
);

/** 当前草稿与已保存计划是否不同 */
function isPlanDirty() {
  const token = tokenStore.selectedToken;
  if (!token) return false;
  const saved = loadShopPlan(token.id);
  const draft = planDraft.value;
  const draftItems = Object.keys(draft.items || {}).sort();
  const savedItems = Object.keys(saved.items || {}).sort();
  if (draftItems.join(",") !== savedItems.join(",")) return true;
  if (draftItems.some((k) => Number(draft.items[k]) !== Number(saved.items[k]))) return true;
  return Number(draft.maxRefresh || 0) !== Number(saved.maxRefresh || 0);
}

/** 关闭配置弹窗：有改动就提醒一下，避免「改了没保存就直接执行」 */
function closePlan() {
  if (isPlanDirty()) {
    message.warning("计划有未保存的修改，点「保存计划」后执行才会生效", 5000);
  }
  planVisible.value = false;
}

async function openPlan() {
  const token = tokenStore.selectedToken;
  if (!token) {
    message.warning("请先在页面上方选择一个角色");
    return;
  }
  // 计划要基于当前商品列表；还没读过就先读一次，避免打开一张空清单
  if (!rows.value.length && !loading.value) {
    await fetchGoods();
  }
  planDraft.value = loadShopPlan(token.id);
  planLogs.value = [];
  planStopRequested.value = false;
  planView.value = "setup";
  planVisible.value = true;
  buildCopyOptions();
}

function backToSetup() {
  planView.value = "setup";
  planLogs.value = [];
}


function isPlanChecked(goodsId) {
  return String(goodsId) in (planDraft.value.items || {});
}

function togglePlanItem(goodsId, checked) {
  const key = String(goodsId);
  const items = { ...(planDraft.value.items || {}) };
  if (checked) {
    if (!(key in items)) {
      // 默认心理价 = 当前现价，用户可再调整
      const row = rows.value.find((r) => Number(r.goodsId) === Number(goodsId));
      const price = getGoodsFinalPrice(goodsId, row?.discount);
      items[key] = price ?? getGoodsBasePrice(goodsId) ?? 1;
    }
  } else {
    delete items[key];
  }
  planDraft.value = { ...planDraft.value, items };
}

function setPlanPrice(goodsId, value) {
  const key = String(goodsId);
  const items = { ...(planDraft.value.items || {}) };
  if (value == null) {
    delete items[key];
  } else {
    items[key] = value;
  }
  planDraft.value = { ...planDraft.value, items };
}

/** 按折扣把「所有已勾选商品」的心理价换算成 原价 × 折扣 */
function applyDiscount(rate) {
  const items = { ...(planDraft.value.items || {}) };
  if (!Object.keys(items).length) {
    message.warning("请先勾选要购买的商品");
    return;
  }
  for (const key of Object.keys(items)) {
    const base = getGoodsBasePrice(Number(key));
    if (base != null) items[key] = Math.max(1, Math.round(base * rate));
  }
  planDraft.value = { ...planDraft.value, items };
  message.success(`已按 ${Math.round(rate * 10)} 折换算心理价`);
}

function clearPlanItems() {
  planDraft.value = { ...planDraft.value, items: {} };
  clearShopPlan(tokenStore.selectedToken?.id);
}

function planLog(text, type = "info") {
  planLogs.value.push({ text, type });
}

/**
 * 一键按计划购买。
 *
 * 循环：逐件判断「现价 ≤ 心理价」→ 买 → 全部买到 或 刷满次数 → 停。
 * 任何一步出错（金砖不足 / 已购 / 刷新被拒）立刻整单停止，不做兜底重试。
 */
/** 保存当前配置（只保存，不执行） */
function savePlan() {
  const token = tokenStore.selectedToken;
  if (!token) return;
  const plan = saveShopPlan(token.id, planDraft.value);
  planDraft.value = plan;
  message.success(
    `计划已保存：${planGoodsIds(plan).length} 件商品，最多刷新 ${plan.maxRefresh} 次`,
  );
  planVisible.value = false;
}

/** 卡片上的「执行」入口：按已保存的计划跑，没配过就先引导去配置 */
async function runSavedPlan() {
  const token = tokenStore.selectedToken;
  if (!token) {
    message.warning("请先在页面上方选择一个角色");
    return;
  }
  const plan = loadShopPlan(token.id);
  if (!planGoodsIds(plan).length) {
    message.warning("计划里还没有勾选商品，请先配置并保存");
    await openPlan();
    return;
  }
  // 刷新次数 0 就只买当前批次，先说明白，避免以为「没自动刷新」
  if (Number(plan.maxRefresh) <= 0) {
    message.info(
      `已保存的计划是「只买当前批次」（刷新 0 次）。需要边刷边买，请在「编辑计划」里设置刷新次数。`,
      6000,
    );
  }
  planDraft.value = plan;
  await runPlan();
}

async function runPlan() {
  const token = tokenStore.selectedToken;
  if (!token || planRunning.value) return;

  const plan = saveShopPlan(token.id, planDraft.value);
  planDraft.value = plan;
  const ids = planGoodsIds(plan);
  if (!ids.length) {
    message.warning("请先勾选要购买的商品");
    return;
  }

  planRunning.value = true;
  planView.value = "log";
  planVisible.value = true;
  planStopRequested.value = false;
  planLogs.value = [];

  const nameOf = (goodsId) => getGoodsName(goodsId) || `${goodsId} 号`;

  try {
    const connected = await ensureConnected(token.id);
    if (!connected) throw new Error("WebSocket 未连接");

    planLog(
      `开始执行：勾选 ${ids.length} 件，最多刷新 ${plan.maxRefresh} 次，金砖 ${formatNum(goldBrick.value)}`,
    );
    await readGoodsRows(token.id);

    let round = 0;
    while (true) {
      if (planStopRequested.value) {
        planLog("已手动停止", "warn");
        break;
      }

      // ---- 逐件购买 ----
      for (const goodsId of ids) {
        if (planStopRequested.value) break;
        const row = rows.value.find((r) => Number(r.goodsId) === goodsId);
        const name = nameOf(goodsId);
        if (!row) {
          planLog(`${name}：本批没刷到，跳过`, "muted");
          continue;
        }
        if (Number(row.buy_quantity ?? 0) >= 1) {
          // 计划不看已购状态：本批次买过的直接视为已满足（每件限购 1 次，再买也会被服务端拒）
          planLog(`${name}：本批次已购买，视为满足`, "muted");
          continue;
        }
        const price = getGoodsFinalPrice(goodsId, row.discount);
        const limit = Number(plan.items[String(goodsId)]);
        if (price == null) continue;
        if (price > limit) {
          planLog(`${name}：现价 ${price} 高于心理价 ${limit}，不买`, "muted");
          continue;
        }
        planLog(`${name}：现价 ${price} ≤ ${limit}，购买中…`);
        const result = await buyGoodsOnce(token.id, goodsId);
        planLog(
          `${name}：已买到，花费 ${formatNum(result.spent)} 金砖（余额 ${formatNum(goldBrick.value)}）`,
          "ok",
        );
      }

      // ---- 是否买齐 ----
      const allDone = ids.every((goodsId) => {
        const row = rows.value.find((r) => Number(r.goodsId) === goodsId);
        return row ? Number(row.buy_quantity ?? 0) >= 1 : true;
      });
      if (allDone) {
        planLog("清单已全部买到，计划完成", "ok");
        break;
      }

      // ---- 刷新 ----
      if (round >= plan.maxRefresh) {
        planLog(`已刷新 ${round} 次，达到计划上限，结束`, "warn");
        break;
      }
      planLog(`第 ${round + 1}/${plan.maxRefresh} 次刷新…`, "info");
      const refreshed = await doRefreshStore(token.id);
      round += 1;
      planLog(
        refreshed.spent > 0
          ? `刷新完成，消耗 ${formatNum(refreshed.spent)} 金砖`
          : "刷新完成（免费）",
        "ok",
      );
      await sleep(500);
    }
  } catch (error) {
    const reason = String(error?.message || error);
    if (/次数/.test(reason)) {
      refreshCount.value = Math.max(refreshCount.value, 1);
      planLog(`刷新被拒：${reason}（今日次数已用完），计划终止`, "err");
    } else {
      planLog(`计划终止：${reason}`, "err");
    }
    message.error(`计划终止：${reason}`);
    logInfo("购买计划终止", { reason, logs: planLogs.value.slice(-5) });
  } finally {
    planRunning.value = false;
    status.value = rows.value.length ? "loaded" : "failed";
  }
}


const statusText = computed(
  () =>
    ({
      idle: "未读取",
      loading: "读取中",
      loaded: "已读取",
      failed: "读取失败",
    })[status.value] || "未读取",
);

const summaryText = computed(() => {
  if (status.value === "failed") return "读取失败，可看下方提示";
  if (!rows.value.length) return "点下方按钮读取商店商品";
  return `共 ${rows.value.length} 件商品`;
});

const discountedCount = computed(
  () => rows.value.filter((row) => Number(row.discount) < 0.999).length,
);
const boughtCount = computed(() =>
  rows.value.reduce((sum, row) => sum + (Number(row.buy_quantity) || 0), 0),
);

/** 金砖余额：role_getroleinfo 里的 role.diamond（IdentityCard 也用它） */
const goldBrick = computed(() => {
  const role = tokenStore.gameData?.roleInfo?.role;
  const value = Number(role?.diamond ?? 0);
  return Number.isFinite(value) ? value : 0;
});

/**
 * 弹窗里展示的「已购数量」取实时值。
 *
 * purchaseTarget 是表格某一行当时的对象引用，购买成功后 rows 会整批替换，
 * 直接读 purchaseTarget.buy_quantity 会一直停在买前的 0。这里按 goodsId 回查最新行。
 */
const purchaseTargetQty = computed(() => {
  const goodsId = purchaseTarget.value?.goodsId;
  if (goodsId === undefined || goodsId === null) return 0;
  return boughtQty(rows.value, goodsId);
});

/** 黑市每件限购 1 次：已购 >= 1 就视为买过，不能再买 */
const purchaseTargetSoldOut = computed(() => purchaseTargetQty.value >= 1);

function formatNum(value) {
  return Number(value || 0).toLocaleString();
}

/** 刷新角色信息以更新金砖余额；失败不影响主流程 */
async function refreshGoldBrick(tokenId) {
  // 未连接时不要触发：sendGetRoleInfo 内部会重试 3 次，空跑只会刷错误日志
  if (tokenStore.getWebSocketStatus(tokenId) !== "connected") return;
  try {
    await tokenStore.sendGetRoleInfo(tokenId);
  } catch {
    /* 余额刷新失败忽略 */
  }
}

/** 折扣转百分比，顺带吃掉单精度浮点误差 */
function formatDiscount(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return `${Math.round(num * 100)}%`;
}

/** 折扣转「几折」：0.5 → 5折，0.85 → 8.5折 */
function formatDiscountCN(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "";
  const tenths = Math.round(num * 100) / 10;
  return `${Number(tenths.toFixed(1))}折`;
}

/** 商品图标，来自 public/images/shop/goods-<goodsId>.png（现只有 1~16） */
function goodsIcon(goodsId) {
  // 带版本号，换图后不会被浏览器缓存住旧图
  return `/images/shop/goods-${goodsId}.png?v=7`;
}

/** 金砖图标：金砖余额与商品价格前面都用它 */
const goldIcon = "/images/shop/jinzhuan.png?v=1";

/** 是否在打折（discount 有单精度误差，用 0.999 容差） */
function isDiscounted(row) {
  return Number(row?.discount ?? 1) < 0.999;
}

/** 现价是否超过当前金砖 */
function isUnaffordable(row) {
  const price = getGoodsFinalPrice(row?.goodsId, row?.discount);
  return price !== null && price > goldBrick.value;
}

/** 每件限购 1 次：已购 >= 1 即买过 */
function isSoldOut(row) {
  return Number(row?.buy_quantity ?? 0) >= 1;
}

/** 兜底：其它店铺若返回数组，找出像商品列表的那一个 */
function findGoodsArray(node) {
  const seen = new Set();
  const queue = [node];
  while (queue.length) {
    const cur = queue.shift();
    if (!cur || typeof cur !== "object" || seen.has(cur)) continue;
    seen.add(cur);

    if (Array.isArray(cur)) {
      const objects = cur.filter((item) => item && typeof item === "object");
      const looksLikeGoods = objects.some(
        (item) =>
          "goodsId" in item ||
          "itemId" in item ||
          "price" in item ||
          "cost" in item,
      );
      if (looksLikeGoods) return cur;
      for (const child of cur) queue.push(child);
      continue;
    }

    for (const child of Object.values(cur)) queue.push(child);
  }
  return null;
}

/** 把返回体转成表格行 */
function parseGoods(res) {
  const goods = res?.goodsList;
  if (goods && typeof goods === "object" && !Array.isArray(goods)) {
    return {
      mode: "goodsMap",
      rows: Object.entries(goods)
        .map(([id, value]) => ({
          goodsId: Number(id) || id,
          ...(value || {}),
        }))
        .sort((a, b) => Number(a.goodsId) - Number(b.goodsId)),
    };
  }

  const list = findGoodsArray(res);
  return {
    mode: "dynamic",
    rows: Array.isArray(list) ? list : [],
  };
}


async function ensureConnected(tokenId) {
  if (tokenStore.getWebSocketStatus(tokenId) === "connected") return true;
  const token = tokenStore.selectedToken;
  if (!token) return false;
  tokenStore.createWebSocketConnection(tokenId, token.token, token.wsUrl);
  for (let i = 0; i < 16; i++) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (tokenStore.getWebSocketStatus(tokenId) === "connected") return true;
  }
  return false;
}

async function fetchGoods() {
  const token = tokenStore.selectedToken;
  if (!token) {
    message.warning("请先在页面上方选择一个角色");
    return;
  }

  loading.value = true;
  status.value = "loading";
  hint.value = "";

  try {
    const connected = await ensureConnected(token.id);
    if (!connected) throw new Error("WebSocket 未连接");

    const res = await tokenStore.sendMessageWithPromise(
      token.id,
      "store_goodslist",
      { storeId: STORE_ID },
      15000,
    );

    // 实测（2026-11-06）：store_goodslist 返回 { goodsList, refresh }，
    // refresh 是「今日已刷新次数」，没刷过时服务端根本不下发这个字段。

    const parsed = parseGoods(res);
    mode.value = parsed.mode;
    rows.value = parsed.rows;
    refreshCount.value = Number(res?.refresh ?? 0) || 0;

    if (rows.value.length) {
      hint.value = "";
    } else {
      hint.value = "返回里没有识别出商品列表，可点下方按钮重试。";
    }

    status.value = rows.value.length ? "loaded" : "failed";
    // 顺带刷新一次余额，不阻塞列表展示
    refreshGoldBrick(token.id);
  } catch (error) {
    rows.value = [];
    status.value = "failed";
    hint.value = `读取失败：${error?.message || error}`;
    message.error(`读取商店商品失败：${error?.message || error}`);
  } finally {
    loading.value = false;
  }
}

/** 只读取并解析，不动卡片提示状态（购买流程内部用） */
async function readGoodsRows(tokenId) {
  const res = await tokenStore.sendMessageWithPromise(
    tokenId,
    "store_goodslist",
    { storeId: STORE_ID },
    15000,
  );
  const parsed = parseGoods(res);
  mode.value = parsed.mode;
  rows.value = parsed.rows;
  refreshCount.value = Number(res?.refresh ?? 0) || 0;
  return parsed.rows;
}

/**
 * 刷新商店并重读列表（不含任何 UI 提示），失败直接抛错。
 * refreshStore 与「购买计划」共用这一份。
 */
async function doRefreshStore(tokenId) {
  const beforeGold = goldBrick.value;
  await tokenStore.sendMessageWithPromise(
    tokenId,
    "store_refresh",
    { storeId: STORE_ID },
    15000,
  );
  // 给服务端一点时间落新数据，再重新拉列表
  await sleep(600);
  const after = await readGoodsRows(tokenId);
  await refreshGoldBrick(tokenId);
  return { rows: after, spent: beforeGold - goldBrick.value };
}

/**
 * 买一件商品并校验是否真的到账，失败抛错（供购买计划使用）。
 * 到账判断：已购数量必须变化，否则视为没买到。
 */
async function buyGoodsOnce(tokenId, goodsId) {
  const beforeQty = boughtQty(rows.value, goodsId);
  const beforeGold = goldBrick.value;
  await tokenStore.sendMessageWithPromise(
    tokenId,
    "store_buy",
    { goodsId },
    8000,
  );
  await sleep(800);
  const after = await readGoodsRows(tokenId);
  await refreshGoldBrick(tokenId);
  const afterQty = boughtQty(after, goodsId);
  if (afterQty <= beforeQty) {
    throw new Error(`${goodsId} 号提交后已购数量没变化，可能没买到`);
  }
  return { spent: beforeGold - goldBrick.value, qty: afterQty };
}

/**
 * 刷新商店（危险操作）。
 *
 * store_refresh 会让服务端重发一批商品，当前商品/折扣/已购记录全部重置。
 * 调用前必须经过 NPopconfirm 二次确认，不允许被其它流程自动触发。
 */
async function refreshStore() {
  const token = tokenStore.selectedToken;
  if (!token || refreshing.value) return;

  refreshing.value = true;
  const beforeGold = goldBrick.value;
  try {
    const connected = await ensureConnected(token.id);
    if (!connected) throw new Error("WebSocket 未连接");

    const result = await doRefreshStore(token.id);
    const after = result.rows;

    status.value = after.length ? "loaded" : "failed";
    hint.value = "商店已刷新，商品与折扣已更新";

    const spent = beforeGold - goldBrick.value;
    message.success(
      spent > 0 ? `商店已刷新，消耗 ${formatNum(spent)} 金砖` : "商店已刷新",
    );
    logInfo("刷新商店", {
      storeId: STORE_ID,
      goodsCount: after.length,
      goldBefore: beforeGold,
      goldAfter: goldBrick.value,
      spent,
    });
  } catch (error) {
    const reason = String(error?.message || error);
    // 「无刷新次数」是服务端硬限制（VIP0 每天 1 次，实测游戏内点也报同样错误），
    // 本地直接标记成已刷满，避免用户反复点。
    const noMoreTimes = /次数/.test(reason);
    if (noMoreTimes) {
      refreshCount.value = Math.max(refreshCount.value, 1);
      message.warning("今天的刷新次数已用完，明天恢复");
      hint.value = "今日刷新次数已用完（VIP0 每天 1 次），明天恢复。";
    } else {
      message.error(`刷新失败：${reason}`);
      hint.value = `刷新失败：${reason}`;
    }
    logInfo("刷新商店失败", { reason, refreshCount: refreshCount.value });
    // 刷新可能已经在服务端生效，再读一次以真实状态为准
    try {
      await readGoodsRows(token.id);
      status.value = rows.value.length ? "loaded" : "failed";
    } catch {
      /* 读取也失败就保持原样 */
    }
  } finally {
    refreshing.value = false;
  }
}

/** 取某个商品当前的已购数量 */
function boughtQty(list, goodsId) {
  const hit = list.find((row) => String(row.goodsId) === String(goodsId));
  return Number(hit?.buy_quantity ?? 0);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function openPurchase(row) {
  // 双保险：按钮已置灰，这里再拦一次，避免其他入口绕过
  if (Number(row?.buy_quantity ?? 0) >= 1) {
    message.info(`${getGoodsName(row?.goodsId) || row?.goodsId} 已购买过，每件限购 1 次`);
    return;
  }
  purchaseTarget.value = row;
  purchaseLog.value = [];
  purchaseVisible.value = true;
}

/**
 * 购买。
 *
 * 黑市每件商品限购 1 次，所以不存在数量概念：一次点击只发一条 store_buy。
 * store_buy 在本工程里只有 { goodsId } 这一种已知参数（见 xyzwWebSocket.js:194）。
 * 走「买前读 → 买 → 买后读」，用 buy_quantity 与金砖变化校验真实结果。
 */
async function runPurchase() {
  const token = tokenStore.selectedToken;
  const target = purchaseTarget.value;
  if (!token || !target) return;

  purchaseRunning.value = true;
  purchaseLog.value = [];
  const log = (text, type = "info") => purchaseLog.value.push({ text, type });

  try {
    const goodsId = target.goodsId;
    // 买前再校验一次：数据可能已过期（例如在游戏里买过），已购就不再发命令
    const beforeQty = boughtQty(rows.value, goodsId);
    if (beforeQty >= 1) {
      log(`${goodsId} 号已购买（已购 ${beforeQty}），每件限购 1 次，已跳过`, "warn");
      message.info("该商品已购买，无法再次购买");
      return;
    }

    const connected = await ensureConnected(token.id);
    if (!connected) throw new Error("WebSocket 未连接");

    const beforeGold = goldBrick.value;
    log(`买前：${goodsId} 号已购 ${beforeQty}，金砖 ${formatNum(beforeGold)}`);

    let sent = false;
    try {
      await tokenStore.sendMessageWithPromise(
        token.id,
        "store_buy",
        { goodsId },
        8000,
      );
      sent = true;
      log(`${goodsId} 号已提交购买`);
    } catch (error) {
      log(`购买失败：${error?.message || error}`, "err");
    }

    await sleep(800);
    const after = await readGoodsRows(token.id);
    await refreshGoldBrick(token.id);

    const afterQty = boughtQty(after, goodsId);
    const spent = beforeGold - goldBrick.value;

    log(
      `买后：${goodsId} 号已购 ${afterQty}，金砖 ${formatNum(beforeGold)} → ${formatNum(goldBrick.value)}（消费 ${formatNum(spent)}）`,
      afterQty > beforeQty ? "ok" : "warn",
    );

    if (afterQty > beforeQty) {
      status.value = "loaded";
      message.success(`购买成功：${goodsId} 号`);
    } else if (sent) {
      log("服务器数量没变，可能已达限购或参数不对", "warn");
    }
  } catch (error) {
    log(`购买异常：${error?.message || error}`, "err");
    message.error(`购买失败：${error?.message || error}`);
  } finally {
    purchaseRunning.value = false;
  }
}

</script>

<style scoped lang="scss">
/* MyCard 的 .card-action 会对「直接子 button」套用统一内边距，
   会把 naive 按钮的高度压扁，这里用一层包裹避开该规则 */
.action-wrapper {
  flex: 1;
  display: flex;
}

/* 底部一行：四个按钮按内容宽度居中排列，不拉长 */
.shop-actions {
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);

  .read-btn {
    flex: 0 0 auto;
    min-width: 132px;
  }

  .refresh-btn,
  .plan-btn,
  .run-btn {
    flex: 0 0 auto;
    min-width: 104px;
  }
}

/* 刷新确认气泡里的说明文字 */
.refresh-confirm {
  max-width: 260px;

  p {
    margin: 0;
    line-height: 1.6;
  }

  .refresh-confirm-title {
    font-weight: var(--font-weight-semibold);
    margin-bottom: 4px;
  }

  .refresh-confirm-desc {
    color: var(--text-secondary);
    font-size: var(--font-size-xs);
  }
}

/* ===== 购买计划 ===== */
.plan-setup {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.plan-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--border-radius-medium);
}

.plan-toolbar-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.plan-toolbar-hint {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary, var(--text-secondary));
}

.plan-tip {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.plan-list {
  max-height: 46vh;
  overflow-y: auto;
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-medium);
}

.plan-row {
  display: grid;
  grid-template-columns: 26px minmax(110px, 1fr) 96px 124px;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 6px var(--spacing-sm);
  font-size: var(--font-size-sm);
  border-bottom: 1px solid var(--border-light);

  &:last-child {
    border-bottom: none;
  }

  &.checked {
    background: rgba(24, 160, 88, 0.07);
  }
}

.plan-name {
  overflow: hidden;
  color: var(--text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plan-origin {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary, var(--text-secondary));
  text-decoration: line-through;
}

.plan-bought-tag {
  margin-left: 4px;
  padding: 0 4px;
  border-radius: 2px;
  background: rgba(24, 160, 88, 0.12);
  color: var(--success-color, #18a058);
  font-size: 10px;
}

.plan-price-input {
  width: 100%;
}

.plan-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-lg);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);

  b {
    color: var(--text-primary);
  }

  /* 预计花费超过余额时整段标红 */
  .over,
  .over b {
    color: var(--error-color, #d03050);
  }
}

.plan-summary-formula {
  margin-left: 4px;
  font-size: var(--font-size-xs);
  color: var(--text-tertiary, var(--text-secondary));
}

.plan-summary-warn {
  color: var(--warning-color, #d5910a);
}

.plan-logs {
  max-height: 50vh;
  overflow-y: auto;
  font-family: var(--font-mono, monospace);
  font-size: var(--font-size-xs);
  line-height: 1.85;

  p {
    margin: 0;
    padding: 1px 0;
  }

  .ok {
    color: var(--success-color, #18a058);
  }

  .warn {
    color: var(--warning-color, #d5910a);
  }

  .err {
    color: var(--error-color, #d03050);
    font-weight: var(--font-weight-semibold);
  }

  .muted {
    color: var(--text-tertiary, var(--text-secondary));
  }
}

.gold-brick {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(240, 160, 32, 0.12);
  color: var(--warning-color, #b26a00);
  font-size: var(--font-size-xs);
  white-space: nowrap;

  b {
    font-weight: var(--font-weight-medium);
    font-variant-numeric: tabular-nums;
  }

  &.empty {
    background: var(--bg-secondary, #f5f5f5);
    color: var(--text-tertiary, var(--text-secondary));
  }
}

.gold-icon {
  width: 14px;
  height: 14px;
  object-fit: contain;
  flex-shrink: 0;
}

/* 价格 / 弹窗里用的小号金砖图标 */
.price-icon {
  width: 12px;
  height: 12px;
  object-fit: contain;
  flex-shrink: 0;
}

.with-icon {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.shop-hint {
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-sm);
}

/* 统计行与金砖同一行：左统计、右余额 */
.shop-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  margin-bottom: var(--spacing-sm);
  min-height: 22px;
}

.shop-stats {
  display: flex;
  gap: var(--spacing-lg);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);

  b {
    color: var(--text-primary);
    font-weight: var(--font-weight-medium);
  }
}

/* ===== 商品网格：一排 3 个，卡片式展示（对齐游戏内商店） ===== */
/* 自动流式排列：容器有多宽就排多少个，不固定每行 3 个 */
.goods-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  justify-items: center;
}

.goods-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  width: 100%;
  max-width: 168px;
  padding: var(--spacing-xs) var(--spacing-sm) var(--spacing-sm);
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-medium);

  &:hover {
    border-color: var(--border-medium);
  }
}

.goods-name {
  text-align: center;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.goods-thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xs) 0;
}

/* 图片与折扣角标的定位容器。
   素材是统一 160×160 的透明抠图，这里用 1:1 容器 + contain，
   保证 16 个商品占位完全一致、不拉伸。 */
.thumb-box {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 100px;
  aspect-ratio: 1 / 1;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

/* 图片右上角的折扣角标 */
.discount-badge {
  position: absolute;
  top: 0;
  right: 0;
  padding: 0 6px;
  border-radius: 0 var(--border-radius-small) 0 var(--border-radius-small);
  background: var(--error-color, #d03050);
  color: #fff;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  line-height: 1.6;
}

.goods-price {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  min-height: 24px;

  .price-base {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    text-decoration: line-through;
  }

  .price-final {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
  }

  .unaffordable {
    color: var(--error-color, #d03050);
  }
}

.shop-note {
  margin: 0 0 var(--spacing-sm);
  color: var(--text-tertiary, var(--text-secondary));
  font-size: var(--font-size-xs);
}

.purchase-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.purchase-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);

  > div {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  b {
    color: var(--text-primary);
    font-weight: var(--font-weight-medium);
  }

  b.sold-out {
    color: var(--success-color, #18a058);
  }
}

.purchase-warn {
  font-size: var(--font-size-xs);
}

.purchase-log {
  max-height: 160px;
  overflow: auto;
  font-size: var(--font-size-xs);

  p {
    margin: 2px 0;
    color: var(--text-secondary);
  }

  .ok {
    color: var(--success-color);
  }

  .warn {
    color: var(--warning-color);
  }

  .err {
    color: var(--error-color);
  }
}
</style>
