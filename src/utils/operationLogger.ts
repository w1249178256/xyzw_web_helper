import { useOperationLogStore } from '@/stores/operationLogStore'

/**
 * 操作日志记录辅助函数
 * 用于统一记录十殿页面和一键金鱼页面的操作日志
 */
export const logOperation = (
  page: 'shidian' | 'fish-helper',
  operation: string,
  options: {
    cardType?: string
    tokenId?: string
    tokenName?: string
    status?: 'success' | 'error' | 'warning' | 'info'
    message: string
    details?: any
    command?: string
    commandParams?: any
    response?: any
  }
) => {
  const logStore = useOperationLogStore()
  
  logStore.addLog({
    page,
    operation,
    cardType: options.cardType,
    tokenId: options.tokenId,
    tokenName: options.tokenName,
    status: options.status || 'info',
    message: options.message,
    details: options.details,
    command: options.command,
    commandParams: options.commandParams,
    response: options.response
  })
}

/**
 * 记录命令执行的辅助函数
 * 用于记录命令执行和返回结果
 * @param page 页面名称
 * @param operation 操作名称
 * @param tokenId Token ID
 * @param tokenName Token 名称
 * @param command 命令名称
 * @param params 命令参数
 * @param promise 命令执行的 Promise
 * @param logDetails 是否记录命令和响应详情，默认为 true
 * @param cardType 卡片类型（用于日志分类）
 */
export const logCommand = async (
  page: 'shidian' | 'fish-helper',
  operation: string,
  tokenId: string,
  tokenName: string,
  command: string,
  params: any,
  promise: Promise<any>,
  logDetails: boolean = true,
  cardType?: string
) => {
  const logStore = useOperationLogStore()
  
  try {
    const response = await promise
    
    if (logDetails) {
      logStore.addLog({
        page,
        operation,
        tokenId,
        tokenName,
        status: 'success',
        message: `${command} 执行成功`,
        command,
        commandParams: params,
        response,
        cardType
      })
    }
    
    return response
  } catch (error) {
    if (logDetails) {
      logStore.addLog({
        page,
        operation,
        tokenId,
        tokenName,
        status: 'error',
        message: `${command} 执行失败: ${error.message}`,
        command,
        commandParams: params,
        response: error,
        cardType
      })
    }
    
    throw error
  }
}

/**
 * 批量记录操作的辅助函数
 * 用于记录批量操作的开始和结束
 * @param page 页面名称
 * @param operation 操作名称
 * @param tokens Token 列表
 * @param operationFn 操作函数
 */
export const logBatchOperation = async (
  page: 'shidian' | 'fish-helper',
  operation: string,
  tokens: Array<{ id: string; name?: string }>,
  operationFn: (token: { id: string; name?: string }, index: number) => Promise<any>
) => {
  const logStore = useOperationLogStore()
  
  logStore.addLog({
    page,
    operation,
    status: 'info',
    message: `开始批量${operation}，共 ${tokens.length} 个Token`
  })
  
  const results = []
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    try {
      const result = await operationFn(token, i)
      results.push({ tokenId: token.id, success: true, result })
      
      logStore.addLog({
        page,
        operation,
        tokenId: token.id,
        tokenName: token.name,
        status: 'success',
        message: `${token.name || token.id} ${operation}成功 (${i + 1}/${tokens.length})`
      })
    } catch (error) {
      results.push({ tokenId: token.id, success: false, error })
      
      logStore.addLog({
        page,
        operation,
        tokenId: token.id,
        tokenName: token.name,
        status: 'error',
        message: `${token.name || token.id} ${operation}失败: ${error.message}`
      })
    }
  }
  
  const successCount = results.filter(r => r.success).length
  logStore.addLog({
    page,
    operation,
    status: successCount === tokens.length ? 'success' : 'warning',
    message: `批量${operation}完成，成功 ${successCount}/${tokens.length}`
  })
  
  return results
}
