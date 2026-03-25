import { ref, onMounted, onUnmounted } from "vue";

// 全局响应式主题状态
const isDark = ref(false);

// 检查当前主题状态
const checkCurrentTheme = () => {
  return (
    document.documentElement.classList.contains("dark") ||
    document.documentElement.getAttribute("data-theme") === "dark"
  );
};

// 更新响应式状态
const updateReactiveState = () => {
  isDark.value = checkCurrentTheme();
};

// 主题管理逻辑
export function useTheme() {
  let mutationObserver = null;

  // 初始化主题
  const initTheme = () => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setDarkTheme();
    } else {
      setLightTheme();
    }

    // 立即更新响应式状态
    updateReactiveState();
  };

  // 设置深色主题
  const setDarkTheme = () => {
    document.documentElement.classList.add("dark");
    document.documentElement.setAttribute("data-theme", "dark");
    document.body.classList.add("dark");
    document.body.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");

    // 立即更新响应式状态
    isDark.value = true;

    // 触发主题更新事件
    window.dispatchEvent(
      new CustomEvent("theme-change", { detail: { isDark: true } }),
    );
  };

  // 设置浅色主题
  const setLightTheme = () => {
    document.documentElement.classList.remove("dark");
    document.documentElement.removeAttribute("data-theme");
    document.body.classList.remove("dark");
    document.body.removeAttribute("data-theme");
    localStorage.setItem("theme", "light");

    // 立即更新响应式状态
    isDark.value = false;

    // 触发主题更新事件
    window.dispatchEvent(
      new CustomEvent("theme-change", { detail: { isDark: false } }),
    );
  };

  // 切换主题
  const toggleTheme = () => {
    if (isDark.value) {
      setLightTheme();
    } else {
      setDarkTheme();
    }
  };

  // 监听系统主题变化
  const setupSystemThemeListener = () => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addListener(() => {
      const savedTheme = localStorage.getItem("theme");
      // 只有在用户没有手动设置主题时才跟随系统
      if (!savedTheme) {
        initTheme();
      }
    });
  };

  // 设置DOM变化监听器（确保响应式状态同步）
  const setupDOMObserver = () => {
    if (typeof window !== "undefined") {
      mutationObserver = new MutationObserver(() => {
        updateReactiveState();
      });

      // 监听documentElement和body的变化
      mutationObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "data-theme"],
      });

      mutationObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ["class", "data-theme"],
      });
    }
  };

  // 清理监听器
  const cleanup = () => {
    if (mutationObserver) {
      mutationObserver.disconnect();
      mutationObserver = null;
    }
  };

  // 获取当前主题
  const getCurrentTheme = () => {
    return isDark.value ? "dark" : "light";
  };

  // 组件挂载时初始化
  onMounted(() => {
    setupDOMObserver();
    updateReactiveState();
  });

  // 组件卸载时清理
  onUnmounted(() => {
    cleanup();
  });

  return {
    isDark,
    initTheme,
    toggleTheme,
    setDarkTheme,
    setLightTheme,
    setupSystemThemeListener,
    getCurrentTheme,
    updateReactiveState,
  };
}
