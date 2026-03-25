<template>
  <div class="changelog-card">
    <div class="changelog-header">
      <div class="version-badge" :class="`badge-${entry.type}`">
        {{ entry.version }}
      </div>
      <div class="changelog-meta">
        <span class="release-date">{{ formatDate(entry.date) }}</span>
        <span class="type-tag" :class="`tag-${entry.type}`">
          {{ getTypeLabel(entry.type) }}
        </span>
      </div>
    </div>

    <div class="changelog-content">
      <div v-if="entry.title" class="changelog-title">{{ entry.title }}</div>

      <div
        v-if="entry.features && entry.features.length"
        class="change-section"
      >
        <h4 class="section-title">
          <i class="icon-sparkles">✨</i>
          新功能
        </h4>
        <ul class="change-list">
          <li v-for="(item, idx) in entry.features" :key="`feature-${idx}`">
            {{ item }}
          </li>
        </ul>
      </div>

      <div
        v-if="entry.improvements && entry.improvements.length"
        class="change-section"
      >
        <h4 class="section-title">
          <i class="icon-arrow-up">⬆️</i>
          改进优化
        </h4>
        <ul class="change-list">
          <li
            v-for="(item, idx) in entry.improvements"
            :key="`improvement-${idx}`"
          >
            {{ item }}
          </li>
        </ul>
      </div>

      <div v-if="entry.fixes && entry.fixes.length" class="change-section">
        <h4 class="section-title">
          <i class="icon-bug">🐛</i>
          修复问题
        </h4>
        <ul class="change-list">
          <li v-for="(item, idx) in entry.fixes" :key="`fix-${idx}`">
            {{ item }}
          </li>
        </ul>
      </div>

      <div
        v-if="entry.breaking && entry.breaking.length"
        class="change-section breaking"
      >
        <h4 class="section-title">
          <i class="icon-warning">⚠️</i>
          重大变更
        </h4>
        <ul class="change-list">
          <li v-for="(item, idx) in entry.breaking" :key="`breaking-${idx}`">
            {{ item }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  entry: {
    type: Object,
    required: true,
    validator: (value) => {
      return value.version && value.date && value.type;
    },
  },
});

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now - date;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "今天";
  if (diffDays === 1) return "昨天";
  if (diffDays < 7) return `${diffDays}天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;

  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getTypeLabel = (type) => {
  const labels = {
    major: "主要版本",
    minor: "次要版本",
    patch: "补丁版本",
    hotfix: "热修复",
  };
  return labels[type] || type;
};
</script>

<style scoped>
.changelog-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.changelog-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.changelog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--border-color);
}

.version-badge {
  font-size: 20px;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.version-badge.badge-major {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.version-badge.badge-minor {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.version-badge.badge-patch {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.version-badge.badge-hotfix {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.changelog-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.release-date {
  color: var(--text-secondary);
  font-size: 14px;
}

.type-tag {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.type-tag.tag-major {
  background: rgba(245, 87, 108, 0.1);
  color: #f5576c;
}

.type-tag.tag-minor {
  background: rgba(79, 172, 254, 0.1);
  color: #4facfe;
}

.type-tag.tag-patch {
  background: rgba(67, 233, 123, 0.1);
  color: #43e97b;
}

.type-tag.tag-hotfix {
  background: rgba(250, 112, 154, 0.1);
  color: #fa709a;
}

.changelog-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.changelog-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.change-section {
  padding: 12px;
  border-radius: 8px;
  background: var(--bg-color);
}

.change-section.breaking {
  background: rgba(245, 87, 108, 0.05);
  border-left: 4px solid #f5576c;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.change-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.change-list li {
  padding-left: 24px;
  position: relative;
  color: var(--text-secondary);
  line-height: 1.6;
}

.change-list li::before {
  content: "•";
  position: absolute;
  left: 8px;
  color: var(--primary-color);
  font-weight: bold;
}

/* 深色模式适配 */
:root {
  --card-bg: #ffffff;
  --border-color: #e5e7eb;
  --bg-color: #f9fafb;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --primary-color: #667eea;
}

@media (prefers-color-scheme: dark) {
  :root {
    --card-bg: #1f2937;
    --border-color: #374151;
    --bg-color: #111827;
    --text-primary: #f9fafb;
    --text-secondary: #d1d5db;
    --primary-color: #818cf8;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .changelog-card {
    padding: 16px;
  }

  .changelog-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .version-badge {
    font-size: 16px;
    padding: 6px 12px;
  }

  .changelog-title {
    font-size: 16px;
  }
}
</style>
