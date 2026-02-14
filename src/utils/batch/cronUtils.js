/**
 * Cron表达式验证和解析工具
 */

/**
 * 验证Cron字段
 * @param {string} field - 字段值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @param {string} fieldName - 字段名称
 * @returns {object} - 验证结果 {valid: boolean, message: string}
 */
export const validateCronField = (field, min, max, fieldName) => {
  // 处理星号
  if (field === "*") {
    return { valid: true };
  }

  // 处理步长格式，如 */5 或 0/1
  if (field.includes("/")) {
    const parts = field.split("/");
    if (parts.length !== 2) {
      return { valid: false, message: `${fieldName}字段步长格式错误` };
    }
    const [range, stepStr] = parts;
    const step = parseInt(stepStr);
    if (isNaN(step) || step <= 0) {
      return { valid: false, message: `${fieldName}字段步长必须是正整数` };
    }

    // 验证范围部分
    if (range !== "*") {
      // 范围部分可能是列表或单个范围
      if (range.includes(",")) {
        const rangeItems = range.split(",");
        for (const item of rangeItems) {
          if (item.includes("-")) {
            // 处理范围，如 1-5
            const rangeParts = item.split("-");
            if (rangeParts.length !== 2) {
              return {
                valid: false,
                message: `${fieldName}字段范围格式错误`,
              };
            }
            const [start, end] = rangeParts.map(Number);
            if (
              isNaN(start) ||
              isNaN(end) ||
              start < min ||
              end > max ||
              start > end
            ) {
              return {
                valid: false,
                message: `${fieldName}字段范围必须在${min}-${max}之间，且开始值小于等于结束值`,
              };
            }
          } else {
            // 处理单个数字
            const num = parseInt(item);
            if (isNaN(num) || num < min || num > max) {
              return {
                valid: false,
                message: `${fieldName}字段必须在${min}-${max}之间`,
              };
            }
          }
        }
      } else if (range.includes("-")) {
        // 处理范围，如 1-5
        const rangeParts = range.split("-");
        if (rangeParts.length !== 2) {
          return { valid: false, message: `${fieldName}字段范围格式错误` };
        }
        const [start, end] = rangeParts.map(Number);
        if (
          isNaN(start) ||
          isNaN(end) ||
          start < min ||
          end > max ||
          start > end
        ) {
          return {
            valid: false,
            message: `${fieldName}字段范围必须在${min}-${max}之间，且开始值小于等于结束值`,
          };
        }
      } else {
        // 处理单个数字
        const num = parseInt(range);
        if (isNaN(num) || num < min || num > max) {
          return {
            valid: false,
            message: `${fieldName}字段必须在${min}-${max}之间`,
          };
        }
      }
    }
    return { valid: true };
  }

  // 处理列表格式，如 1,3,5 或 1-5,7-9
  if (field.includes(",")) {
    const items = field.split(",");
    for (const item of items) {
      const trimmedItem = item.trim();
      if (trimmedItem.includes("-")) {
        // 处理范围，如 1-5
        const rangeParts = trimmedItem.split("-");
        if (rangeParts.length !== 2) {
          return { valid: false, message: `${fieldName}字段范围格式错误` };
        }
        const [start, end] = rangeParts.map(Number);
        if (
          isNaN(start) ||
          isNaN(end) ||
          start < min ||
          end > max ||
          start > end
        ) {
          return {
            valid: false,
            message: `${fieldName}字段范围必须在${min}-${max}之间，且开始值小于等于结束值`,
          };
        }
      } else {
        // 处理单个数字
        const num = parseInt(trimmedItem);
        if (isNaN(num) || num < min || num > max) {
          return {
            valid: false,
            message: `${fieldName}字段必须在${min}-${max}之间`,
          };
        }
      }
    }
    return { valid: true };
  }

  // 处理范围格式，如 1-5
  if (field.includes("-")) {
    const rangeParts = field.split("-");
    if (rangeParts.length !== 2) {
      return { valid: false, message: `${fieldName}字段范围格式错误` };
    }
    const [start, end] = rangeParts.map(Number);
    if (
      isNaN(start) ||
      isNaN(end) ||
      start < min ||
      end > max ||
      start > end
    ) {
      return {
        valid: false,
        message: `${fieldName}字段范围必须在${min}-${max}之间，且开始值小于等于结束值`,
      };
    }
    return { valid: true };
  }

  // 处理单个数字
  const num = parseInt(field);
  if (isNaN(num) || num < min || num > max) {
    return {
      valid: false,
      message: `${fieldName}字段必须在${min}-${max}之间`,
    };
  }

  return { valid: true };
};

/**
 * 验证Cron表达式
 * @param {string} expression - Cron表达式
 * @returns {object} - 验证结果 {valid: boolean, message: string}
 */
export const validateCronExpression = (expression) => {
  if (!expression) return { valid: false, message: "Cron表达式不能为空" };

  const cronParts = expression.split(" ").filter(Boolean);
  if (cronParts.length !== 5) {
    return {
      valid: false,
      message: "Cron表达式必须包含5个字段：分 时 日 月 周",
    };
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = cronParts;

  // Validate minute (0-59)
  const minuteValidation = validateCronField(minute, 0, 59, "分钟");
  if (!minuteValidation.valid) {
    return minuteValidation;
  }

  // Validate hour (0-23)
  const hourValidation = validateCronField(hour, 0, 23, "小时");
  if (!hourValidation.valid) {
    return hourValidation;
  }

  // Validate dayOfMonth (1-31)
  const dayOfMonthValidation = validateCronField(dayOfMonth, 1, 31, "日期");
  if (!dayOfMonthValidation.valid) {
    return dayOfMonthValidation;
  }

  // Validate month (1-12)
  const monthValidation = validateCronField(month, 1, 12, "月份");
  if (!monthValidation.valid) {
    return monthValidation;
  }

  // Validate dayOfWeek (0-7, where 0 and 7 both represent Sunday)
  const dayOfWeekValidation = validateCronField(dayOfWeek, 0, 7, "星期");
  if (!dayOfWeekValidation.valid) {
    return dayOfWeekValidation;
  }

  return { valid: true, message: "Cron表达式格式正确" };
};

/**
 * 解析Cron字段，返回可能的值数组
 * @param {string} field - 字段值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number[]} - 可能的值数组
 */
export const parseCronField = (field, min, max) => {
  const values = new Set();

  // 处理列表，如 1,3,5 或 1-3,5-7
  if (field.includes(",")) {
    const parts = field.split(",");
    for (const part of parts) {
      // 递归处理每个列表项
      const partValues = parseCronField(part.trim(), min, max);
      partValues.forEach((value) => values.add(value));
    }
    return Array.from(values);
  }

  // 处理星号
  if (field === "*") {
    for (let i = min; i <= max; i++) {
      values.add(i);
    }
    return Array.from(values);
  }

  // 处理步长，如 */5 或 0/1 或 1-10/2
  if (field.includes("/")) {
    const [range, step] = field.split("/");
    const stepNum = parseInt(step);

    let start = min;
    let end = max;

    // 处理范围部分
    if (range !== "*") {
      if (range.includes("-")) {
        const [rangeStart, rangeEnd] = range.split("-").map(Number);
        start = rangeStart;
        end = rangeEnd;
      } else {
        start = parseInt(range);
        end = max;
      }
    }

    // 生成步长值
    for (let i = start; i <= end; i += stepNum) {
      values.add(i);
    }
    return Array.from(values);
  }

  // 处理范围，如 1-5
  if (field.includes("-")) {
    const [start, end] = field.split("-").map(Number);
    for (let i = start; i <= end; i++) {
      values.add(i);
    }
    return Array.from(values);
  }

  // 处理单个数字
  const num = parseInt(field);
  if (!isNaN(num)) {
    values.add(num);
  }
  return Array.from(values);
};

/**
 * 计算下次执行时间
 * @param {string} minuteField - 分钟字段
 * @param {string} hourField - 小时字段
 * @param {string} dayOfMonthField - 日期字段
 * @param {string} monthField - 月份字段
 * @param {string} dayOfWeekField - 星期字段
 * @param {number} count - 计算次数
 * @returns {string[]} - 下次执行时间列表
 */
export const calculateNextRuns = (
  minuteField,
  hourField,
  dayOfMonthField,
  monthField,
  dayOfWeekField,
  count = 5
) => {
  const now = new Date();
  const nextRuns = [];
  let current = new Date(now);
  current.setMilliseconds(0);
  current.setSeconds(0);
  current.setMinutes(current.getMinutes() + 1); // Start from next minute

  // Limit the search to 1 year to prevent infinite loops
  const maxDate = new Date(now);
  maxDate.setFullYear(maxDate.getFullYear() + 1);

  while (nextRuns.length < count && current <= maxDate) {
    // Parse each field
    const possibleMinutes = parseCronField(minuteField, 0, 59);
    const possibleHours = parseCronField(hourField, 0, 23);
    const possibleDaysOfMonth = parseCronField(dayOfMonthField, 1, 31);
    const possibleMonths = parseCronField(monthField, 1, 12);
    const possibleDaysOfWeek = parseCronField(dayOfWeekField, 0, 7);

    // Check if current time matches all fields
    const matchesMinute = possibleMinutes.includes(current.getMinutes());
    const matchesHour = possibleHours.includes(current.getHours());
    const matchesDayOfMonth = possibleDaysOfMonth.includes(current.getDate());
    const matchesMonth = possibleMonths.includes(current.getMonth() + 1); // months are 0-based in JS
    const matchesDayOfWeek = possibleDaysOfWeek.includes(current.getDay()); // 0 is Sunday

    // Special handling: if dayOfWeek is specified, it should match either dayOfMonth or dayOfWeek
    const isDayOfWeekSpecified = dayOfWeekField !== "*";
    const isDayOfMonthSpecified = dayOfMonthField !== "*";

    let matchesDay;
    if (isDayOfWeekSpecified && isDayOfMonthSpecified) {
      // If both are specified, match either
      matchesDay = matchesDayOfMonth || matchesDayOfWeek;
    } else {
      // If only one is specified, match that one
      matchesDay = matchesDayOfMonth && matchesDayOfWeek;
    }

    if (matchesMinute && matchesHour && matchesDay && matchesMonth) {
      // Format the date in a readable format with year, month, day, hour, minute, second
      const formatted = current.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      nextRuns.push(formatted);
      // Move to next minute for next iteration
      current.setMinutes(current.getMinutes() + 1);
    } else {
      // Move to next minute if no match
      current.setMinutes(current.getMinutes() + 1);
    }
  }

  return nextRuns;
};

/**
 * 计算下次执行时间（基于任务对象）
 * @param {object} task - 任务对象
 * @returns {Date|null} - 下次执行时间
 */
export const calculateNextExecutionTime = (task) => {
  const now = new Date();

  if (task.runType === "daily") {
    // For daily tasks, parse the runTime and calculate next execution
    const [hours, minutes] = task.runTime.split(":").map(Number);
    const nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);

    // If today's time has passed, schedule for tomorrow
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    return nextRun;
  } else if (task.runType === "cron") {
    // For cron tasks, parse the cron expression
    const cronParts = task.cronExpression.split(" ").filter(Boolean);
    if (cronParts.length < 5) return null;

    const [
      minuteField,
      hourField,
      dayOfMonthField,
      monthField,
      dayOfWeekField,
    ] = cronParts;

    // 解析各个字段的可能值
    const possibleMinutes = parseCronField(minuteField, 0, 59);
    const possibleHours = parseCronField(hourField, 0, 23);
    const possibleDaysOfMonth = parseCronField(dayOfMonthField, 1, 31);
    const possibleMonths = parseCronField(monthField, 1, 12);
    const possibleDaysOfWeek = parseCronField(dayOfWeekField, 0, 7);

    // 从当前时间开始，寻找下一个匹配的时间
    let nextRun = new Date(now);
    nextRun.setSeconds(0, 0);
    nextRun.setMinutes(nextRun.getMinutes() + 1); // 从下一分钟开始检查

    // 最多检查未来一年
    const maxCheckTime = new Date(now);
    maxCheckTime.setFullYear(maxCheckTime.getFullYear() + 1);

    while (nextRun <= maxCheckTime) {
      const minutes = nextRun.getMinutes();
      const hours = nextRun.getHours();
      const dayOfMonth = nextRun.getDate();
      const month = nextRun.getMonth() + 1; // JavaScript月份是0-based
      const dayOfWeek = nextRun.getDay(); // 0是周日

      // 检查所有字段是否匹配
      const matchesMinute = possibleMinutes.includes(minutes);
      const matchesHour = possibleHours.includes(hours);
      const matchesDayOfMonth = possibleDaysOfMonth.includes(dayOfMonth);
      const matchesMonth = possibleMonths.includes(month);
      const matchesDayOfWeek = possibleDaysOfWeek.includes(dayOfWeek);

      // Special handling: if both dayOfMonth and dayOfWeek are specified, they are OR'ed
      const isDayOfWeekSpecified = dayOfWeekField !== "*";
      const isDayOfMonthSpecified = dayOfMonthField !== "*";

      let matchesDay;
      if (isDayOfWeekSpecified && isDayOfMonthSpecified) {
        // If both are specified, match either
        matchesDay = matchesDayOfMonth || matchesDayOfWeek;
      } else {
        // If only one is specified, match that one
        matchesDay = matchesDayOfMonth && matchesDayOfWeek;
      }

      if (matchesMinute && matchesHour && matchesDay && matchesMonth) {
        return nextRun;
      }

      // 检查下一分钟
      nextRun.setMinutes(nextRun.getMinutes() + 1);
    }

    return null;
  }

  return null;
};

/**
 * 格式化时间差
 * @param {number} ms - 毫秒数
 * @returns {string} - 格式化后的时间字符串
 */
export const formatTimeDifference = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const remainingHours = hours % 24;
  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;

  let result = "";
  if (days > 0) result += `${days}天`;
  if (remainingHours > 0 || days > 0) result += `${remainingHours}小时`;
  if (remainingMinutes > 0 || remainingHours > 0 || days > 0)
    result += `${remainingMinutes}分`;
  result += `${remainingSeconds}秒`;

  return result;
};

/**
 * 检查当前时间是否匹配Cron表达式
 * @param {string} cronExpression - Cron表达式
 * @param {Date} now - 当前时间
 * @returns {boolean} - 是否匹配
 */
export const matchesCronExpression = (cronExpression, now = new Date()) => {
  const cronParts = cronExpression.split(" ").filter(Boolean);
  if (cronParts.length < 5) return false;

  const [minuteField, hourField, dayOfMonthField, monthField, dayOfWeekField] =
    cronParts;

  const possibleMinutes = parseCronField(minuteField, 0, 59);
  const possibleHours = parseCronField(hourField, 0, 23);
  const possibleDaysOfMonth = parseCronField(dayOfMonthField, 1, 31);
  const possibleMonths = parseCronField(monthField, 1, 12);
  const possibleDaysOfWeek = parseCronField(dayOfWeekField, 0, 7);

  const matchesMinute = possibleMinutes.includes(now.getMinutes());
  const matchesHour = possibleHours.includes(now.getHours());
  const matchesDayOfMonth = possibleDaysOfMonth.includes(now.getDate());
  const matchesMonth = possibleMonths.includes(now.getMonth() + 1);
  const matchesDayOfWeek = possibleDaysOfWeek.includes(now.getDay());

  const isDayOfWeekSpecified = dayOfWeekField !== "*";
  const isDayOfMonthSpecified = dayOfMonthField !== "*";

  let matchesDay;
  if (isDayOfWeekSpecified && isDayOfMonthSpecified) {
    matchesDay = matchesDayOfMonth || matchesDayOfWeek;
  } else {
    matchesDay = matchesDayOfMonth && matchesDayOfWeek;
  }

  return matchesMinute && matchesHour && matchesDay && matchesMonth;
};
