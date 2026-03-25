import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useLocalTokenStore } from "./localTokenManager";

export const useAuthStore = defineStore("auth", () => {
  // 状态
  const user = ref(null);
  const token = ref(localStorage.getItem("token") || null);
  const isLoading = ref(false);

  const localTokenStore = useLocalTokenStore();

  // 计算属性
  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const userInfo = computed(() => user.value);

  // 登录 - 移除API调用，使用本地认证
  const login = async (credentials) => {
    try {
      isLoading.value = true;

      // 模拟本地认证逻辑
      const mockUser = {
        id: "local_user_" + Date.now(),
        username: credentials.username,
        email: credentials.email || `${credentials.username}@local.game`,
        avatar: "/icons/xiaoyugan.png",
        createdAt: new Date().toISOString(),
      };

      const mockToken =
        "local_token_" +
        Date.now() +
        "_" +
        Math.random().toString(36).substr(2, 9);

      token.value = mockToken;
      user.value = mockUser;

      // 保存到本地存储
      localStorage.setItem("token", token.value);
      localStorage.setItem("user", JSON.stringify(user.value));

      // 同时保存到token管理器
      localTokenStore.setUserToken(mockToken);

      return { success: true };
    } catch (error) {
      console.error("登录错误:", error);
      return { success: false, message: "本地认证失败" };
    } finally {
      isLoading.value = false;
    }
  };

  // 注册 - 移除API调用，使用本地注册
  const register = async (userInfo) => {
    try {
      isLoading.value = true;

      // 检查用户名是否已存在（简单的本地检查）
      const existingUsers = JSON.parse(
        localStorage.getItem("registeredUsers") || "[]",
      );
      const userExists = existingUsers.some(
        (u) => u.username === userInfo.username,
      );

      if (userExists) {
        return { success: false, message: "用户名已存在" };
      }

      // 保存新用户信息到本地
      const newUser = {
        ...userInfo,
        id: "user_" + Date.now(),
        createdAt: new Date().toISOString(),
      };

      existingUsers.push(newUser);
      localStorage.setItem("registeredUsers", JSON.stringify(existingUsers));

      return { success: true, message: "注册成功，请登录" };
    } catch (error) {
      console.error("注册错误:", error);
      return { success: false, message: "本地注册失败" };
    } finally {
      isLoading.value = false;
    }
  };

  // 登出
  const logout = () => {
    user.value = null;
    token.value = null;

    // 清除本地存储
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("gameRoles");

    // 清除token管理器中的数据
    localTokenStore.clearUserToken();
    localTokenStore.clearAllGameTokens();
  };

  // 获取用户信息 - 移除API调用，使用本地数据
  const fetchUserInfo = async () => {
    try {
      if (!token.value) return false;

      // 从本地存储获取用户信息
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        try {
          user.value = JSON.parse(savedUser);
          return true;
        } catch (error) {
          console.error("解析用户信息失败:", error);
          logout();
          return false;
        }
      } else {
        logout();
        return false;
      }
    } catch (error) {
      console.error("获取用户信息失败:", error);
      logout();
      return false;
    }
  };

  // 初始化认证状态 - 移除API验证，使用本地验证
  const initAuth = async () => {
    const savedUser = localStorage.getItem("user");
    if (token.value && savedUser) {
      try {
        user.value = JSON.parse(savedUser);
        // 初始化token管理器
        localTokenStore.initTokenManager();
      } catch (error) {
        console.error("初始化认证失败:", error);
        logout();
      }
    }
  };

  return {
    // 状态
    user,
    token,
    isLoading,

    // 计算属性
    isAuthenticated,
    userInfo,

    // 方法
    login,
    register,
    logout,
    fetchUserInfo,
    initAuth,
  };
});
