<template>
  <!-- 手动输入表单 -->
  <n-form :model="importForm" :label-placement="'top'" :size="'large'"
    :show-label="true">
    <n-form-item :label="'游戏角色名称'" :show-label="true">
      <n-input v-model:value="importForm.name" placeholder="例如：主号战士" clearable />
    </n-form-item>

    <n-form-item :label="'bin文件'" :show-label="true">
      <a-upload multiple accept="*.bin,*.dmp" @before-upload="uploadBin" draggable dropzone placeholder="粘贴Token字符串..."
        clearable>
        <!-- <div class="dropzone-content">
          请点击上传或将bind文件拖拽到此处
        </div> -->
      </a-upload>
    </n-form-item>
    <a-list>
      <a-list-item v-for="(role, index) in roleList" :key="index">
        <div>
          <strong>角色名称:</strong> {{ role.name || '未命名角色' }}<br />
          <strong>Token:</strong> <span style="word-break: break-all;">{{ role.token }}</span><br />
          <strong>服务器:</strong> {{ role.server || '未指定' }}
        </div>
      </a-list-item>
    </a-list>

    <!-- 角色详情 -->
    <n-collapse>
      <n-collapse-item title="角色详情 (可选)" name="optional">
        <div class="optional-fields">
          <n-form-item label="服务器">
            <n-input v-model:value="importForm.server" placeholder="服务器名称" />
          </n-form-item>

          <n-form-item label="自定义连接地址">
            <n-input v-model:value="importForm.wsUrl" placeholder="留空使用默认连接" />
          </n-form-item>
        </div>
      </n-collapse-item>
    </n-collapse>


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
import { ref, reactive } from 'vue';
import { useTokenStore } from '@/stores/tokenStore';
import { CloudUpload } from '@vicons/ionicons5';

import { NForm, NFormItem, NInput, NButton, NIcon, NCollapse, NCollapseItem, useMessage } from 'naive-ui';

import PQueue from 'p-queue';
// import { useI18n } from 'vue-i18n';
import useIndexedDB from '@/hooks/useIndexedDB';
import { transformToken } from '@/utils/token';

const $emit = defineEmits(['cancel', 'ok']);

const {
  storeArrayBuffer
} = useIndexedDB();

const cancel = () => {
  roleList.value = [];
  $emit('cancel');
};

const tokenStore = useTokenStore();
const message = useMessage();
const isImporting = ref(false);
const importForm = reactive({
  name: '',
  server: '',
  wsUrl: ''
});
const roleList = ref<Array<{ name: string; token: string; server: string; wsUrl: string }>>([]);

const tQueue = new PQueue({ concurrency: 1, interval: 1000, });



const initName = (fileName: string) => {
  if (!fileName) return;
  fileName = fileName.trim();
  let binRes = fileName.match(/^bin-(.*?)服-([0-2])-([0-9]{6,12})-(.*)\.bin$/);
  console.log(binRes)
  if (binRes) {
    importForm.name = `${binRes[1]}_${binRes[2]}_${binRes[4]}`
    return {
      server: binRes[1],
      roleIndex: binRes[2],
      roleId: binRes[3],
      roleName: binRes[4]
    };
  }
  return {
    server: '',
    roleIndex: '',
    roleId: '',
    roleName: importForm.name || ''
  }
}

const uploadBin = (binFile: File) => {
  tQueue.add(async () => {
    console.log('上传文件数据:', binFile);
    const roleMeta = initName(binFile.name) as any;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const userToken = e.target?.result as ArrayBuffer;
      // console.log('转换Token:', userToken);
      const roleToken = await transformToken(userToken);
      const roleName = roleMeta.roleName || binFile.name.split('.')?.[0] || ''
      // 刷新indexDB数据库token数据
      storeArrayBuffer(roleName, userToken);
      // 上传列表中发现已存在的重复名称，提示消息
      if (roleList.value.some(role => role.name === roleName)) {
        message.error('上传列表中已存在同名角色! ');
        return;
      }
      // 检查待上传的角色是否已在tokenStore中存在
      const existingToken = tokenStore.gameTokens.find(t => t.name === roleName);
      if (existingToken) {
        message.warning(`角色"${roleName}"已存在，将更新该角色的Token`);
      }
      message.success('Token读取成功，请检查角色名称等信息后提交');
      roleList.value.push({
        name: roleName,
        token: roleToken,
        server: roleMeta.server + '' + roleMeta.roleIndex || '',
        wsUrl: importForm.wsUrl || ''
      });
    };
    reader.onerror = () => {
      message.error('读取文件失败，请重试');
    };
    reader.readAsArrayBuffer(binFile);
  });
  return false; // 阻止自动上传
};

const handleImport = async () => {
  if (roleList.value.length === 0) {
    message.error('请先上传bin文件！');
    return;
  }
  roleList.value.forEach(role => {
    // tokenStore.gameTokens中发现已存在的重复名称，则移出token后重新添加
    const gameToken = tokenStore.gameTokens.find(t => t.name === role.name);
    if(gameToken) {
      console.log('移除同名token:', gameToken);
      // tokenStore.removeToken(gameToken.id);
      tokenStore.updateToken(gameToken.id, {
        ...role
      });
    } else {
      tokenStore.addToken({
        ...role
      });
    }
  });
  console.log('当前Token列表:', tokenStore.gameTokens);
  message.success('Token添加成功');
  roleList.value = [];
  $emit('ok');
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
