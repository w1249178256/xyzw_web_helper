<template>
  <!-- 手动输入表单 -->
  <n-form :model="importForm" :label-placement="'top'" :size="'large'" :show-label="true">


    <n-form-item :label="'bin文件'" :show-label="true">
      <a-upload multiple accept="*.bin,*.dmp" @before-upload="uploadBin" draggable dropzone placeholder="粘贴Token字符串..."
        clearable>
        <!-- <div class="dropzone-content">
          请点击上传或将bind文件拖拽到此处
        </div> -->
      </a-upload>
    </n-form-item>

    <n-form-item label="角色命名格式" :show-label="true">
      <n-input v-model:value="importForm.nameTemplate" placeholder="{name}-{index}-{id}" />
      <template #feedback>
        支持变量: {name}角色名, {id}角色ID, {index}角色序号, {server}区服
      </template>
    </n-form-item>

    <n-card v-if="serverListData && serverListData.length > 0" title="服务器角色列表" style="margin-bottom: 16px;">
      <n-data-table :columns="columns" :data="serverListData" :pagination="{ pageSize: 5 }" :scroll-x="600" />
    </n-card>

    <a-list>
      <a-list-item v-for="(role, index) in roleList" :key="index">
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%">
          <div>
            <strong>角色名称:</strong> {{ role.name || "未命名角色" }}<br />
            <strong>Token:</strong>
            <span style="word-break: break-all">{{ role.token }}</span><br />
            <strong>服务器:</strong> {{ role.server || "未指定" }}<br />
            <strong>角色序号:</strong> {{ role.roleIndex }}
          </div>
          <n-button type="error" size="small" @click="removeRole(index)">
            删除
          </n-button>
        </div>
      </a-list-item>
    </a-list>

    <div class="form-actions">
      <n-button type="primary" size="large" block :loading="isImporting" @click="handleImport">
        <template #icon>
          <n-icon>
            <CloudUpload />
          </n-icon>
        </template>
        添加Token
      </n-button>

      <n-button v-if="tokenStore.hasTokens" size="large" block @click="cancel">
        取消
      </n-button>
    </div>
  </n-form>
</template>

<script lang="ts" setup>
import { ref, reactive, h } from "vue";
import { useTokenStore } from "@/stores/tokenStore";
import { CloudUpload } from "@vicons/ionicons5";

import {
  NForm,
  NFormItem,
  NInput,
  NButton,
  NIcon,
  NCollapse,
  NCollapseItem,
  useMessage,
  NCard,
  NDataTable,
} from "naive-ui";

import PQueue from "p-queue";
import useIndexedDB from "@/hooks/useIndexedDB";
import { getTokenId, transformToken, getServerList } from "@/utils/token";
import { g_utils } from "@/utils/bonProtocol";
import { formatPower } from "@/utils/legionWar";

const $emit = defineEmits(["cancel", "ok"]);

const { storeArrayBuffer } = useIndexedDB();

const cancel = () => {
  roleList.value = [];
  $emit("cancel");
};

const removeRole = (index: number) => {
  roleList.value.splice(index, 1);
};

const tokenStore = useTokenStore();
const message = useMessage();
const isImporting = ref(false);
const importForm = reactive({
  name: "",
  server: "",
  wsUrl: "",
  importMethod: "",
  nameTemplate: "{name}-{index}-{id}",
});
const roleList = ref<
  Array<{
    id: string;
    name: string;
    roleId: string;
    token: string;
    server: string;
    roleIndex?: number;
    wsUrl: string;
    importMethod: string;
  }>
>([]);
const serverListData = ref<any[]>([]);
const currentBinData = ref<ArrayBuffer | null>(null);
const binDecodedResult = ref("");
const originalBinData = ref<any>(null);

const columns = [
  {
    title: "区服",
    key: "serverId",
    render(row: any) {
      let sid = Number(row.serverId);
      if (sid >= 2000000) sid -= 2000000;
      else if (sid >= 1000000) sid -= 1000000;
      return sid - 27;
    },
  },
  {
    title: "角色序号",
    key: "roleIndex",
    render(row: any) {
      const sid = Number(row.serverId);
      if (sid >= 2000000) return 2;
      if (sid >= 1000000) return 1;
      return 0;
    },
  },
  {
    title: "角色ID",
    key: "roleId",
  },
  {
    title: "角色名称",
    key: "name",
  },
  {
    title: "战力",
    key: "power",
    render(row: any) {
      return formatPower(row.power);
    },
    sorter: (row1: any, row2: any) => row1.power - row2.power,
  },
  {
    title: "操作",
    key: "actions",
    render(row: any) {
      return h(
        "div",
        { style: "display: flex; gap: 8px;" },
        [
          h(
            NButton,
            {
              size: "small",
              type: "primary",
              onClick: () => addSelectedRole(row),
            },
            { default: () => "添加" },
          ),
          h(
            NButton,
            {
              size: "small",
              type: "info",
              onClick: () => handleDownload(row),
            },
            { default: () => "下载" },
          ),
        ]
      );
    },
  },
];

const tQueue = new PQueue({ concurrency: 1, interval: 1000 });

const initName = (fileName: string) => {
  if (!fileName) return;
  fileName = fileName.trim();
  let binRes = fileName.match(/^bin-(.*?)服-([0-2])-([0-9]{6,12})-(.*)\.bin$/);
  console.log(binRes);
  if (binRes) {
    importForm.name = `${binRes[1]}_${binRes[2]}_${binRes[4]}`;
    return {
      server: binRes[1],
      roleIndex: binRes[2],
      roleId: binRes[3],
      roleName: binRes[4],
    };
  }
  return {
    server: "",
    roleIndex: "",
    roleId: "",
    roleName: importForm.name || "",
  };
};

const handleDownload = (roleInfo: any) => {
  if (!originalBinData.value) {
    message.error("Bin数据丢失，请重新上传");
    return;
  }
  try {
    const newData = { ...originalBinData.value };
    newData.serverId = roleInfo.serverId; // 确保类型一致
    const newBinBuffer = g_utils.encode(newData) as ArrayBuffer;
    
    // 构造文件名: bin-{server}-0-{roleId}-{name}.bin
    let sid = Number(roleInfo.serverId);
    let roleIndex = 0;
    
    if (sid >= 2000000) {
      roleIndex = 2;
      sid -= 2000000;
    } else if (sid >= 1000000) {
      roleIndex = 1;
      sid -= 1000000;
    }
    
    const serverNum = sid - 27;
    const fileName = `bin-${serverNum}服-${roleIndex}-${roleInfo.roleId}-${roleInfo.name}.bin`;
    
    downloadBinFile(fileName, newBinBuffer);
    message.success(`已开始下载: ${fileName}`);
  } catch (e: any) {
    console.error("下载失败", e);
    message.error("下载失败: " + e.message);
  }
};

const addSelectedRole = async (roleInfo: any) => {
  if (!originalBinData.value) {
    message.error("Bin数据丢失，请重新上传");
    return;
  }

  try {
    const newData = { ...originalBinData.value };
    newData.serverId = roleInfo.serverId; // 确保类型一致
    const newBinBuffer = g_utils.encode(newData) as ArrayBuffer;
    const tokenId = getTokenId(newBinBuffer);
    const roleToken = await transformToken(newBinBuffer);
    const roleName = roleInfo.name || `角色_${roleInfo.roleId}`;

    // 刷新indexDB数据库token数据 (保存原始bin)
    const saved = await storeArrayBuffer(tokenId, newBinBuffer);
    if (!saved) {
      throw new Error("保存BIN数据到IndexedDB失败，请检查浏览器存储空间或权限");
    }

    let sid = Number(roleInfo.serverId);
    let roleIndex = 0;
    if (sid >= 2000000) {
      roleIndex = 2;
      sid -= 2000000;
    } else if (sid >= 1000000) {
      roleIndex = 1;
      sid -= 1000000;
    }
    const serverNum = sid - 27;

    const template = importForm.nameTemplate || "{name}-{index}-{id}";
    const finalName = template
      .replace(/{name}/g, () => roleName)
      .replace(/{index}/g, () => String(roleIndex))
      .replace(/{id}/g, () => String(roleInfo.roleId))
      .replace(/{server}/g, () => String(serverNum) + "服");

    // 检查是否已存在相同配置 (根据角色名称和roleId)
    const exists = roleList.value.some(
      (r) => r.roleId === roleInfo.roleId && r.name === finalName
    );

    if (exists) {
      message.warning(`角色 ${finalName} 已在待添加列表中`);
      return;
    }

    roleList.value.push({
      id: tokenId,
      roleId: roleInfo.roleId,
      token: roleToken,
      name: finalName,
      server: String(serverNum) + "服",
      roleIndex: roleIndex,
      wsUrl: importForm.wsUrl || "",
      importMethod: "bin",
    });

    message.success(`已添加角色: ${finalName}`);

  } catch (e: any) {
    console.error("添加角色失败", e);
    message.error("添加角色失败: " + e.message);
  }
};

const uploadBin = (binFile: File) => {
  tQueue.add(async () => {
    console.log("上传文件数据:", binFile);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const userToken = e.target?.result as ArrayBuffer;
      currentBinData.value = userToken;

      // 获取服务器角色列表
      try {
        const listStr = await getServerList(userToken);
        const parsedList = JSON.parse(listStr);
        // 转换为数组
        if (parsedList && typeof parsedList === 'object') {
          serverListData.value = Object.values(parsedList).sort((a: any, b: any) => b.power - a.power);
        } else {
          serverListData.value = [];
        }
        console.log("Server List:", parsedList);
        message.success("获取服务器角色列表成功，请选择角色添加");
      } catch (err) {
        console.error("Failed to get server list", err);
        message.warning("获取服务器角色列表失败，请检查文件是否正确");
        serverListData.value = [];
      }

      // 尝试解析 bin 文件内容
      try {
        const binMsg = g_utils.parse(userToken);
        let binData = binMsg.getData();
        if (!binData && (binMsg as any)._raw) {
          console.log("Bin文件 getData() 为空，尝试使用 _raw");
          binData = { ...(binMsg as any)._raw };
        }

        console.log("Bin文件解析:", binData);
        binDecodedResult.value = JSON.stringify(binData, null, 2);
        originalBinData.value = binData;
      } catch (err: any) {
        console.error("Bin文件解析失败", err);
        binDecodedResult.value = "Bin文件解析失败: " + (err.message || err);
      }
    };
    reader.onerror = () => {
      message.error("读取文件失败，请重试");
    };
    reader.readAsArrayBuffer(binFile);
  });
  return false; // 阻止自动上传
};

const handleImport = async () => {
  if (roleList.value.length === 0) {
    message.error("请先上传bin文件！");
    return;
  }
  roleList.value.forEach((role) => {
    // tokenStore.gameTokens中发现已存在的重复名称，则移出token后重新添加
    const gameToken = tokenStore.gameTokens.find((t) => t.id === role.id);
    if (gameToken) {
      console.log("移除同名token:", gameToken);
      // tokenStore.removeToken(gameToken.id);
      tokenStore.updateToken(gameToken.id, {
        ...role,
      });
    } else {
      tokenStore.addToken({
        ...role,
      });
    }
  });
  console.log("当前Token列表:", tokenStore.gameTokens);
  message.success("Token添加成功");
  roleList.value = [];
  $emit("ok");
};

const downloadBinFile = (fileName, bin) => {
  const blob = new Blob([new Uint8Array(bin)], {
    type: "application/octet-stream",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};
</script>

<style scoped lang="scss">
.optional-fields {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;

  n-form-item {
    flex: 1;
    min-width: 200px;
  }
}

.form-actions {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dropzone-content {
  width: 100%;
  border: 1px dashed #fcc;
  border-radius: 8px;
  text-align: center;
  color: #888;
  padding: 40px 20px;
  font-size: 12px;
}
</style>
