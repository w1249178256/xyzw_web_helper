/**
 * 页面Token数据存储工具
 * 用于保存和加载与特定token相关的页面设置
 */

/**
 * 保存页面Token卡片数据
 */
export async function savePageTokenCards(pageName, data) {
  try {
    const key = `pageTokenData_${pageName}`
    localStorage.setItem(key, JSON.stringify(data))
    console.log(`[pageTokenStorage] 已保存 ${pageName} 数据`)
    return true
  } catch (error) {
    console.error(`[pageTokenStorage] 保存 ${pageName} 数据失败:`, error)
    return false
  }
}

/**
 * 加载页面Token卡片数据
 */
export async function loadPageTokenCards(pageName) {
  try {
    const key = `pageTokenData_${pageName}`
    const valueStr = localStorage.getItem(key)
    if (valueStr) {
      const value = JSON.parse(valueStr)
      console.log(`[pageTokenStorage] 已加载 ${pageName} 数据`)
      return value
    }
    return {}
  } catch (error) {
    console.error(`[pageTokenStorage] 加载 ${pageName} 数据失败:`, error)
    return {}
  }
}
