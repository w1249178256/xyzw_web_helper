import moment from "moment";


// 判断当前时间是否在本周内（周一00点重置）
export const isInCurrentWeek = (timestamp: number, weekStart = 1) => {
  // 设置周一为一周的开始
  moment.locale('zh-cn', {
    week: {
      dow: 1, // 周一为一周的第一天
      doy: 4
    }
  });
  const t = moment(timestamp);
  const today = moment();
  return t.isSame(today, 'week');
}
