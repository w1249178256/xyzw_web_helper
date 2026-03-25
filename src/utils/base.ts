import moment from "moment";

// 判断当前时间是否在本周内（周一00点重置）
export const isInCurrentWeek = (timestamp: number, weekStart = 1) => {
  // 设置周一为一周的开始
  moment.locale("zh-cn", {
    week: {
      dow: 1, // 周一为一周的第一天
      doy: 4,
    },
  });
  const t = moment(timestamp);
  const today = moment();
  return t.isSame(today, "week");
};

/** 生成 [min,max] 的随机整数 */
export const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Promise 版 sleep */
export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
