import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { ref } from "vue";

// 数据库结构定义
interface ArrayBufferDB extends DBSchema {
  tokens: {
    key: string;
    value: {
      id: string;
      data: ArrayBuffer;
      createdAt: Date;
      updatedAt: Date;
      metadata?: Record<string, any>;
    };
    indexes: { "by-created": Date };
  };
}

// Hook 返回类型
interface UseIndexedDBReturn {
  // 状态
  isReady: Ref<boolean>;
  error: Ref<string | null>;

  // 操作方法
  storeArrayBuffer: (
    key: string,
    data: ArrayBuffer,
    metadata?: Record<string, any>,
  ) => Promise<boolean>;
  getArrayBuffer: (key: string) => Promise<ArrayBuffer | null>;
  getAllKeys: () => Promise<string[]>;
  deleteArrayBuffer: (key: string) => Promise<boolean>;
  clearAll: () => Promise<boolean>;
  getStorageInfo: () => Promise<{ totalSize: number; keyCount: number }>;
}

// 配置接口
interface DBConfig {
  dbName?: string;
  version?: number;
  storeName?: "tokens";
}

/**
 * Vue3 Hook for IndexedDB ArrayBuffer storage
 */
export function useIndexedDB(config: DBConfig = {}): UseIndexedDBReturn {
  const { dbName = "xyzw", version = 1, storeName = "tokens" } = config;

  // 响应式状态
  const isReady = ref(false);
  const error = ref<string | null>(null);
  const db = ref<IDBPDatabase<ArrayBufferDB> | null>(null);

  /**
   * 初始化数据库
   */
  const initDB = async (): Promise<void> => {
    try {
      error.value = null;

      const database = await openDB<ArrayBufferDB>(dbName, version, {
        upgrade(db) {
          // 创建对象存储空间（如果不存在）
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: "id" });
            // 创建创建时间索引
            store.createIndex("by-created", "createdAt");
            console.log(`✅ IndexedDB 存储空间 "${storeName}" 创建成功`);
          }
        },
        blocked() {
          error.value =
            "数据库被其他标签页阻塞，请关闭其他使用相同数据库的标签页";
        },
        blocking() {
          error.value = "数据库需要升级，请关闭所有标签页后重试";
        },
        terminated() {
          error.value = "数据库连接意外终止";
        },
      });

      db.value = database;
      isReady.value = true;
      console.log(`✅ IndexedDB "${dbName}" 初始化成功`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "未知错误";
      error.value = `初始化数据库失败: ${errorMessage}`;
      console.error("❌ IndexedDB 初始化错误:", err);
    }
  };

  /**
   * 存储 ArrayBuffer 数据
   */
  const storeArrayBuffer = async (
    key: string,
    data: ArrayBuffer,
    metadata?: Record<string, any>,
  ): Promise<boolean> => {
    if (!db.value) {
      error.value = "数据库未初始化";
      return false;
    }

    try {
      const item = {
        id: key,
        data,
        metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.value.put(storeName, item);
      console.log(
        `✅ ArrayBuffer 存储成功，键: ${key}, 大小: ${data.byteLength} 字节`,
      );
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "未知错误";
      error.value = `存储数据失败: ${errorMessage}`;
      console.error("❌ 存储 ArrayBuffer 错误:", err);
      return false;
    }
  };

  /**
   * 获取 ArrayBuffer 数据
   */
  const getArrayBuffer = async (key: string): Promise<ArrayBuffer | null> => {
    if (!db.value) {
      error.value = "数据库未初始化";
      return null;
    }

    try {
      const result = await db.value.get(storeName, key);

      if (!result) {
        console.warn(`⚠️ 未找到键为 "${key}" 的数据`);
        return null;
      }

      console.log(
        `✅ ArrayBuffer 读取成功，键: ${key}, 大小: ${result.data.byteLength} 字节`,
      );
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "未知错误";
      error.value = `读取数据失败: ${errorMessage}`;
      console.error("❌ 读取 ArrayBuffer 错误:", err);
      return null;
    }
  };

  /**
   * 获取所有存储的键
   */
  const getAllKeys = async (): Promise<string[]> => {
    if (!db.value) {
      error.value = "数据库未初始化";
      return [];
    }

    try {
      return await db.value.getAllKeys(storeName);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "未知错误";
      error.value = `获取键列表失败: ${errorMessage}`;
      console.error("❌ 获取键列表错误:", err);
      return [];
    }
  };

  /**
   * 删除指定的 ArrayBuffer 数据
   */
  const deleteArrayBuffer = async (key: string): Promise<boolean> => {
    if (!db.value) {
      error.value = "数据库未初始化";
      return false;
    }

    try {
      await db.value.delete(storeName, key);
      console.log(`✅ ArrayBuffer 删除成功，键: ${key}`);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "未知错误";
      error.value = `删除数据失败: ${errorMessage}`;
      console.error("❌ 删除 ArrayBuffer 错误:", err);
      return false;
    }
  };

  /**
   * 清空所有数据
   */
  const clearAll = async (): Promise<boolean> => {
    if (!db.value) {
      error.value = "数据库未初始化";
      return false;
    }

    try {
      await db.value.clear(storeName);
      console.log("✅ 所有 ArrayBuffer 数据已清空");
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "未知错误";
      error.value = `清空数据失败: ${errorMessage}`;
      console.error("❌ 清空数据错误:", err);
      return false;
    }
  };

  /**
   * 获取存储信息
   */
  const getStorageInfo = async (): Promise<{
    totalSize: number;
    keyCount: number;
  }> => {
    if (!db.value) {
      return { totalSize: 0, keyCount: 0 };
    }

    try {
      const allItems = await db.value.getAll(storeName);
      const totalSize = allItems.reduce(
        (size, item) => size + item.data.byteLength,
        0,
      );
      const keyCount = allItems.length;

      return { totalSize, keyCount };
    } catch (err) {
      console.error("❌ 获取存储信息错误:", err);
      return { totalSize: 0, keyCount: 0 };
    }
  };

  initDB();

  return {
    // 状态
    isReady,
    error,

    // 方法
    storeArrayBuffer,
    getArrayBuffer,
    getAllKeys,
    deleteArrayBuffer,
    clearAll,
    getStorageInfo,
  };
}

export default useIndexedDB;
