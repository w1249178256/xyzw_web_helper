import { defineStore } from "pinia";
import { ref } from "vue";
import { useLocalTokenStore } from "./localTokenManager";

export const useGameRolesStore = defineStore("gameRoles", () => {
  // 状态
  const gameRoles = ref([]);
  const isLoading = ref(false);
  const selectedRole = ref(null);

  const localTokenStore = useLocalTokenStore();

  // 获取游戏角色列表 - 移除API调用，使用本地数据
  const fetchGameRoles = async () => {
    try {
      isLoading.value = true;

      // 从本地存储获取角色数据
      const savedRoles = localStorage.getItem("gameRoles");
      if (savedRoles) {
        try {
          gameRoles.value = JSON.parse(savedRoles);
        } catch (error) {
          console.error("解析游戏角色数据失败:", error);
          gameRoles.value = [];
        }
      } else {
        gameRoles.value = [];
      }

      return { success: true };
    } catch (error) {
      console.error("获取游戏角色失败:", error);
      return { success: false, message: "本地数据读取失败" };
    } finally {
      isLoading.value = false;
    }
  };

  // 添加游戏角色 - 移除API调用，本地生成角色和token
  const addGameRole = async (roleData) => {
    try {
      isLoading.value = true;

      // 生成角色ID和游戏token
      const roleId =
        "role_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      const gameToken =
        "game_token_" +
        Date.now() +
        "_" +
        Math.random().toString(36).substr(2, 16);

      const newRole = {
        ...roleData,
        id: roleId,
        createdAt: new Date().toISOString(),
        isActive: false,
        exp: 0,
        gold: 1000, // 默认金币
        vip: false,
        avatar: roleData.avatar || "/icons/xiaoyugan.png",
      };

      // 添加到角色列表
      gameRoles.value.push(newRole);
      localStorage.setItem("gameRoles", JSON.stringify(gameRoles.value));

      // 生成并保存游戏token
      const tokenData = {
        token: gameToken,
        roleId: roleId,
        roleName: newRole.name,
        server: newRole.server,
        wsUrl: null, // 使用默认的游戏WebSocket地址
        createdAt: new Date().toISOString(),
        isActive: true,
      };

      localTokenStore.addGameToken(roleId, tokenData);

      return { success: true, message: "添加角色成功，已生成游戏token" };
    } catch (error) {
      console.error("添加游戏角色失败:", error);
      return { success: false, message: "添加角色失败" };
    } finally {
      isLoading.value = false;
    }
  };

  // 更新游戏角色 - 移除API调用，使用本地更新
  const updateGameRole = async (roleId, roleData) => {
    try {
      isLoading.value = true;

      const index = gameRoles.value.findIndex((role) => role.id === roleId);
      if (index !== -1) {
        gameRoles.value[index] = {
          ...gameRoles.value[index],
          ...roleData,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem("gameRoles", JSON.stringify(gameRoles.value));

        // 更新对应的token信息
        const existingToken = localTokenStore.getGameToken(roleId);
        if (existingToken) {
          localTokenStore.updateGameToken(roleId, {
            roleName: roleData.name || existingToken.roleName,
            server: roleData.server || existingToken.server,
          });
        }

        return { success: true, message: "更新角色成功" };
      } else {
        return { success: false, message: "角色不存在" };
      }
    } catch (error) {
      console.error("更新游戏角色失败:", error);
      return { success: false, message: "更新角色失败" };
    } finally {
      isLoading.value = false;
    }
  };

  // 删除游戏角色 - 移除API调用，同时删除对应token
  const deleteGameRole = async (roleId) => {
    try {
      isLoading.value = true;

      gameRoles.value = gameRoles.value.filter((role) => role.id !== roleId);
      localStorage.setItem("gameRoles", JSON.stringify(gameRoles.value));

      // 删除对应的token和WebSocket连接
      localTokenStore.removeGameToken(roleId);

      // 如果删除的是当前选中角色，清除选中状态
      if (selectedRole.value && selectedRole.value.id === roleId) {
        selectedRole.value = null;
        localStorage.removeItem("selectedRole");
      }

      return { success: true, message: "删除角色成功，已清理相关token" };
    } catch (error) {
      console.error("删除游戏角色失败:", error);
      return { success: false, message: "删除角色失败" };
    } finally {
      isLoading.value = false;
    }
  };

  // 选择角色 - 添加WebSocket连接功能
  const selectRole = (role) => {
    selectedRole.value = role;
    localStorage.setItem("selectedRole", JSON.stringify(role));

    // 自动建立WebSocket连接
    const tokenData = localTokenStore.getGameToken(role.id);
    if (tokenData && tokenData.token) {
      try {
        localTokenStore.createWebSocketConnection(
          role.id,
          tokenData.token,
          tokenData.wsUrl,
        );
        console.log(`已为角色 ${role.name} 建立WebSocket连接`);
      } catch (error) {
        console.error(`建立WebSocket连接失败 [${role.name}]:`, error);
      }
    }
  };

  // 初始化数据
  const initGameRoles = () => {
    const cachedRoles = localStorage.getItem("gameRoles");
    const cachedSelectedRole = localStorage.getItem("selectedRole");

    if (cachedRoles) {
      try {
        gameRoles.value = JSON.parse(cachedRoles);
      } catch (error) {
        console.error("解析缓存的游戏角色数据失败:", error);
      }
    }

    if (cachedSelectedRole) {
      try {
        selectedRole.value = JSON.parse(cachedSelectedRole);
      } catch (error) {
        console.error("解析缓存的选中角色数据失败:", error);
      }
    }
  };

  return {
    // 状态
    gameRoles,
    isLoading,
    selectedRole,

    // 方法
    fetchGameRoles,
    addGameRole,
    updateGameRole,
    deleteGameRole,
    selectRole,
    initGameRoles,
  };
});
