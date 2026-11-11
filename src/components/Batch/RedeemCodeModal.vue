<template>
  <n-modal
    v-model:show="show"
    preset="card"
    title="一键使用兑换码"
    style="width: 90%; max-width: 560px"
  >
    <div class="settings-content">
      <n-alert type="info" show-icon style="margin-bottom: 12px">
        每行填写一个兑换码，也支持用空格、逗号或分号分隔。执行时会先读取角色已兑换记录，已使用的兑换码会自动跳过。
      </n-alert>
      <div class="settings-grid">
        <div class="setting-item">
          <label class="setting-label">兑换码列表</label>
          <n-input
            v-model:value="cdkCodes"
            type="textarea"
            placeholder="例如：&#10;vip666&#10;VIP666&#10;happy666"
            :autosize="{ minRows: 7, maxRows: 14 }"
          />
          <div v-if="missingPresetCodes.length" class="preset-codes">
            <span class="preset-label">常用兑换码（点击填入）：</span>
            <n-tag
              v-for="code in missingPresetCodes"
              :key="code"
              size="small"
              type="info"
              class="preset-tag"
              @click="appendPresetCode(code)"
            >
              {{ code }}
            </n-tag>
          </div>
        </div>
        <div class="setting-item">
          <label class="setting-label">平台类型</label>
          <n-input v-model:value="cdkPlatformType" placeholder="默认 h5" />
        </div>
      </div>
      <div class="modal-actions" style="margin-top: 20px; text-align: right">
        <n-button @click="show = false" style="margin-right: 12px">
          取消
        </n-button>
        <n-button @click="$emit('save')" style="margin-right: 12px">
          保存配置
        </n-button>
        <n-button
          type="primary"
          @click="$emit('execute')"
          :disabled="!cdkCodes?.trim()"
        >
          开始兑换
        </n-button>
      </div>
    </div>
  </n-modal>
</template>
<script setup>
import { computed } from "vue";
import { presetCdkCodes } from "@/utils/batch/constants";

defineEmits(["save", "execute"]);

const show = defineModel("show", { type: Boolean, default: false });
const cdkCodes = defineModel("cdkCodes", { type: String, default: "" });
const cdkPlatformType = defineModel("cdkPlatformType", {
  type: String,
  default: "h5",
});

// 已填过的常用兑换码不再展示，避免重复填入（执行侧 normalizeRedeemCodes 也会兜底去重）
const missingPresetCodes = computed(() => {
  const existing = new Set(
    String(cdkCodes.value || "")
      .split(/[\s,，;；]+/)
      .map((code) => code.trim())
      .filter(Boolean),
  );
  return presetCdkCodes.filter((code) => !existing.has(code));
});

const appendPresetCode = (code) => {
  const lines = String(cdkCodes.value || "").trim();
  cdkCodes.value = lines ? `${lines}\n${code}` : code;
};
</script>

<style scoped>
.preset-codes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
}

.preset-label {
  font-size: 12px;
  color: var(--n-text-color, #666);
}

.preset-tag {
  cursor: pointer;
}
</style>
