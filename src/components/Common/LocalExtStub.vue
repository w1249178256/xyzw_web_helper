<template>
  <div class="local-ext-stub"></div>
</template>

<script setup>
/**
 * 本地扩展占位组件。
 *
 * 公共构建（无私有源）时 `@local-ext` / `@local-overlay` 别名指向本组件，
 * 渲染为空节点，保证公共仓库与 CI 在缺少私有目录时依然可正常构建。
 * 私有构建通过环境变量把别名重定向到本地私有实现，见 vite.config.js。
 */
</script>

<style scoped>
.local-ext-stub {
  display: none;
}
</style>