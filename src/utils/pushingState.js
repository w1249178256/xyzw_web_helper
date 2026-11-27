import { reactive, ref } from "vue";

/**
 * 推图运行态。
 *
 * 放在模块级而不是页面组件里：站内切到其它页签时 PushingLevels 组件会被卸载，
 * 已经开始的推图循环和日志需要继续存在，切回来才能接着看、接着推。
 * 这些 ref/reactive 在应用生命周期内是单例。
 */
export const logs = ref([]);
export const runningStates = reactive({});

export const selectedTokenIds = ref([]);
export const selectedGroupIds = ref([]);

export const autoContinue = ref(true);
export const maxRetries = ref(999999);

export const torchRunning = ref(false);
export const torchItemId = ref(1008);
export const torchQuantity = ref(150);
