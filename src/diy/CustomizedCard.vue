<template>
  <!-- 模式0：容器模式，用于容纳多个项目 -->
  <div v-if="mode === 'container'" class="customized-card-container">
    <div class="card-container">
      <slot></slot>
    </div>
  </div>
  
  <!-- 其他模式：所有名称和按钮放在一个容器中 -->
  <div v-else class="customized-card-item">
    <!-- 模式1：名称和数量 -->
    <div v-if="mode === 'name-count'" class="card-item">
      <div class="item-name">{{ name }}</div>
      <div class="item-value">{{ count }}</div>
    </div>
    
    <!-- 模式2：名称和开关 -->
    <div v-if="mode === 'name-switch'" class="card-item">
      <div class="item-name">{{ name }}</div>
      <n-switch 
        :value="switchValue" 
        @update:value="(value) => emit('update:switchValue', value)"
        size="small" 
        class="n-switch"
      />
    </div>
    
    <!-- 模式3：按钮和占位符 -->
    <div v-if="mode === 'button-placeholder'" class="card-item">
      <n-button 
        :type="disabled ? 'default' : 'primary'" 
        size="small" 
        @click="onButtonClick"
        :disabled="disabled"
        class="n-button"
      >
        {{ buttonText }}
      </n-button>
      <div class="placeholder"></div>
    </div>
    
    <!-- 模式5：按钮模式 -->
    <div v-if="mode === 'button'" class="card-item">
      <n-button 
        :type="disabled ? 'default' : 'primary'" 
        size="small" 
        @click="onButtonClick"
        :loading="loading"
        :disabled="disabled"
        class="n-button"
      >
        {{ name }}
      </n-button>
    </div>
    
    <!-- 模式13：按钮+计数 -->
    <div v-if="mode === 'button-count'" class="card-item">
      <n-button 
        :type="disabled ? 'default' : 'primary'" 
        size="small" 
        @click="onButtonClick"
        :disabled="disabled"
        class="n-button"
      >
        {{ name }}
      </n-button>
      <div class="item-value">{{ count }}</div>
    </div>
    
    <!-- 模式4：名称+输入框 -->
  <div v-if="mode === 'name-input'" class="card-item mode-name-input">
    <div class="card-name">{{ name }}</div>
    <n-input
      :value="inputValue"
      @update:value="(value) => emit('update:inputValue', value)"
      size="small"
      :placeholder="placeholder"
      class="n-input"
    />
  </div>
  
  <!-- 模式6：按钮带输入框 -->
  <div v-if="mode === 'button-with-input'" class="card-item mode-button-with-input">
    <n-input
      :value="inputValue"
      @update:value="(value) => emit('update:inputValue', value)"
      size="small"
      :placeholder="placeholder"
      class="button-input-field"
    />
    <n-button 
      :type="disabled ? 'default' : 'primary'" 
      size="small" 
      @click="onButtonClick"
      :loading="loading"
      :disabled="disabled"
      class="n-button"
    >
      {{ name }}
    </n-button>
  </div>

  <!-- 模式7：名称加范围输入框（支持1-20和3,4,5格式） -->
  <div v-if="mode === 'name-range-input'" class="card-item mode-name-range-input">
    <div class="card-name">{{ name }}</div>
    <n-input
      :value="inputValue"
      @update:value="(value) => emit('update:inputValue', value)"
      size="small"
      :placeholder="placeholder"
      class="n-input"
      :maxlength="20"
    />
  </div>

  <!-- 模式10：执行范围（使用组件配色） -->
  <div v-if="mode === 'execution-range'" class="card-item mode-execution-range">
    <div class="execution-range-name">{{ name }}</div>
    <n-input
      :value="inputValue"
      @update:value="(value) => emit('update:inputValue', value)"
      size="small"
      :placeholder="placeholder"
      class="execution-range-input"
      :maxlength="20"
    />
  </div>

  <!-- 模式8：按钮加数字输入框（纯数字最多10位） -->
  <div v-if="mode === 'button-number-input'" class="card-item mode-button-number-input">
    <n-button 
      :type="disabled ? 'default' : 'primary'" 
      size="small" 
      @click="onButtonClick"
      :loading="loading"
      :disabled="disabled"
      class="n-button"
    >
      {{ name }}
    </n-button>
    <n-input
      :value="inputValue"
      @update:value="handleNumberInput"
      size="small"
      :placeholder="placeholder"
      class="n-input"
      :maxlength="10"
    />
  </div>

  <!-- 模式9：按钮+开关 -->
  <div v-if="mode === 'button-switch'" class="card-item mode-button-switch">
    <n-button
      :type="disabled ? 'default' : 'primary'"
      size="small"
      @click="onButtonClick"
      :loading="loading"
      :disabled="disabled"
      class="n-button"
    >
      {{ name }}
    </n-button>
    <n-switch
      :value="switchValue"
      @update:value="(value) => emit('update:switchValue', value)"
      size="small"
      class="n-switch"
    />
  </div>

  <!-- 模式11：名称+下拉框 -->
  <div v-if="mode === 'name-select'" class="card-item mode-name-select">
    <div class="card-name">{{ name }}</div>
    <n-select
      :value="selectValue"
      @update:value="(value) => emit('update:selectValue', value)"
      :options="selectOptions"
      size="small"
      :placeholder="placeholder"
      class="n-select"
      clearable
    />
  </div>

  <!-- 模式12：仅下拉框 -->
  <div v-if="mode === 'select-only'" class="card-item mode-select-only">
    <n-select
      :value="selectValue"
      @update:value="(value) => emit('update:selectValue', value)"
      :options="selectOptions"
      size="small"
      :placeholder="placeholder"
      class="n-select-full"
      clearable
    />
  </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  // 通用属性
  mode: {
    type: String,
    required: true,
    validator: (value) => ['container', 'name-count', 'name-switch', 'button-placeholder', 'name-input', 'button', 'button-with-input', 'name-range-input', 'button-number-input', 'button-switch', 'execution-range', 'name-select', 'select-only', 'button-count'].includes(value)
  },
  
  // 模式1：名称和数量
  name: {
    type: String,
    default: ''
  },
  count: {
    type: [String, Number],
    default: 0
  },
  
  // 模式2：名称和开关
  switchValue: {
    type: Boolean,
    default: false
  },
  
  // 模式3：按钮和占位符
  buttonText: {
    type: String,
    default: '按钮'
  },
  
  // 模式5：按钮模式
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  
  // 模式4：名称和输入框
  inputValue: {
    type: [String, Number],
    default: 1
  },
  min: {
    type: Number,
    default: 1
  },
  max: {
    type: Number,
    default: 999
  },
  
  // 模式6：按钮带输入框
  placeholder: {
    type: String,
    default: '请输入'
  },

  // 模式11：名称+下拉框
  selectValue: {
    type: [String, Number],
    default: null
  },
  selectOptions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:switchValue', 'update:inputValue', 'update:selectValue', 'button-click'])

// 监听开关值变化（仅在需要时使用，避免循环更新）
// watch(() => props.switchValue, (newValue) => {
//   emit('update:switchValue', newValue)
// })

// 监听输入值变化（移除，避免循环更新，直接使用 @update:value 事件即可）
// watch(() => props.inputValue, (newValue) => {
//   emit('update:inputValue', newValue)
// })

// 按钮点击事件
const onButtonClick = () => {
  emit('button-click')
}

// 数字输入验证
const handleNumberInput = (value) => {
  // 过滤非数字字符
  const filteredValue = value.replace(/[^0-9]/g, '')
  // 限制最大长度为10位
  const limitedValue = filteredValue.slice(0, 10)
  emit('update:inputValue', limitedValue)
}
</script>

<style scoped>
/* 容器模式样式 */
.customized-card-container {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius-medium);
  border: 1px solid var(--bg-secondary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.card-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.1rem;
}

/* 单个卡片项样式 - 去除外边框 */
.customized-card-item {
  padding: 0.75rem;
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius-medium);
  border: none;
  box-shadow: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-height: 40px;
}

.card-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
}

.item-name {
  font-weight: 500;
  font-size: var(--font-size-sm);
  background-color: #16a34a;
  color: #ffffff;
  padding: 6px 12px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 66%;
  min-height: 28px;
  border: none;
}

.item-value {
  font-weight: 500;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 33%;
}

.placeholder {
  visibility: hidden;
  width: 33%;
  height: 20px;
}

.n-switch {
  width: 33%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.n-button {
  width: 66%;
  min-height: 32px;
  background-color: #f59e0b;
  border-color: #f59e0b;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.n-button:hover {
  background-color: #fbbf24;
  border-color: #fbbf24;
}

.n-button:active {
  background-color: #d97706;
  border-color: #d97706;
}

.n-input-number {
  width: 33%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.button-input-field {
  width: 66%;
  display: flex;
  align-items: center;
}

.n-select {
  width: 33%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.n-select-full {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 执行范围模式样式 */
.mode-execution-range {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
}

.execution-range-name {
  font-weight: 500;
  font-size: var(--font-size-sm);
  background-color: #16a34a;
  color: #ffffff;
  padding: 6px 12px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 66%;
  min-height: 28px;
  border: none;
}

.execution-range-input {
  width: 33%;
  display: flex;
  align-items: center;
}

/* name-input 和 name-range-input 模式的名称样式 */
.card-name {
  font-weight: 500;
  font-size: var(--font-size-sm);
  background-color: #16a34a;
  color: #ffffff;
  padding: 6px 12px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 66%;
  min-height: 28px;
  border: none;
}

.n-input {
  width: 33%;
  display: flex;
  align-items: center;
}</style>