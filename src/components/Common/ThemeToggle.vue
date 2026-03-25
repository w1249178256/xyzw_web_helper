<template>
  <n-button circle size="medium" class="theme-toggle" @click="toggleTheme">
    <template #icon>
      <n-icon v-if="isDark">
        <Sunny />
      </n-icon>
      <n-icon v-else>
        <Moon />
      </n-icon>
    </template>
  </n-button>
</template>

<script setup>
import { Moon, Sunny } from "@vicons/ionicons5";
import { useTheme } from "@/composables/useTheme";

const { isDark, toggleTheme } = useTheme();
</script>

<style scoped lang="scss">
.theme-toggle {
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.1);
  }
}
</style>
