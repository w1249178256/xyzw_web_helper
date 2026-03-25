/**
 * 从 answer.json 文件加载题目数据的答题工具
 * 用于一键答题功能，从公共目录读取题目数据
 */

let questionsData = null;
let isLoading = false;

const queryPromise = (async () => {
  // Try loading from the app base URL first (supports Vite `base` config / GitHub Pages subpaths),
  // then fall back to common locations.
  const base = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.BASE_URL)
    ? import.meta.env.BASE_URL
    : "/";

  const candidates = [
    `${base.replace(/\/$/, "")}/answer.json`,
    `/answer.json`,
    `answer.json`,
  ];

  isLoading = true;
  for (let i = 0; i < candidates.length; i++) {
    const url = candidates[i];
    try {
      const response = await fetch(url);
      if (!response.ok) {
        // try next
        continue;
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        // If server returned HTML (like a 404 page), skip
        try {
          const text = await response.text();
          console.warn(`studyQuestionsFromJSON: ${url} returned non-JSON response (length ${text.length})`);
        } catch (e) {
          // ignore
        }
        continue;
      }

      const data = await response.json();
      isLoading = false;
      return data;
    } catch (error) {
      // try next candidate
      console.warn(`studyQuestionsFromJSON: failed to fetch ${url}:`, error);
      continue;
    }
  }

  isLoading = false;
  console.error("❌ 加载答题数据失败: 无法找到 answer.json（尝试了多个路径）");
  return [];
})();

/**
 * 异步加载答题数据
 * @returns {Promise<Array>} 题目数据数组
 */
export async function loadQuestionsData() {
  return queryPromise;
}

/**
 * 模糊匹配函数 - 查找题目中的关键词
 * @param {string} questionFromDB - 数据库中的题目
 * @param {string} actualQuestion - 实际收到的题目
 * @param {number} threshold - 匹配阈值（1表示包含匹配）
 * @returns {boolean} - 是否匹配
 */
export function matchQuestion(questionFromDB, actualQuestion, threshold = 1) {
  if (!questionFromDB || !actualQuestion) return false;

  // 简单的包含匹配
  if (threshold === 1) {
    // 去除空格和特殊字符进行匹配
    const cleanDB = questionFromDB.replace(/\s+/g, "").toLowerCase();
    const cleanActual = actualQuestion.replace(/\s+/g, "").toLowerCase();

    return cleanActual.includes(cleanDB) || cleanDB.includes(cleanActual);
  }

  return false;
}

/**
 * 查找题目答案
 * @param {string} question - 题目文本
 * @returns {Promise<number|null>} - 答案选项(1-4)，未找到返回null
 */
export async function findAnswer(question) {
  try {
    const questions = await loadQuestionsData();

    if (!questions || questions.length === 0) {
      // 降噪
      return null;
    }

    // 遍历所有题目寻找匹配
    for (let i = 0; i < questions.length; i++) {
      const item = questions[i];
      if (!item.name || !item.value) continue;

      if (matchQuestion(item.name, question, 1)) {
        // 降噪
        return item.value;
      }
    }

    // 降噪
    return null; // 未找到匹配的题目
  } catch (error) {
    console.error("❌ 查找答案时出错:", error);
    return null;
  }
}

/**
 * 获取已加载的题目数量
 * @returns {Promise<number>} 题目数量
 */
export async function getQuestionCount() {
  const questions = await loadQuestionsData();
  return questions ? questions.length : 0;
}

/**
 * 预加载答题数据（可选，用于提前加载）
 * @returns {Promise<void>}
 */
export async function preloadQuestions() {
  try {
    await loadQuestionsData();
    // 降噪
  } catch (error) {
    console.error("❌ 答题数据预加载失败:", error);
  }
}

/**
 * 清除缓存，强制重新加载（用于调试）
 */
export function clearCache() {
  questionsData = null;
  // 降噪
}
