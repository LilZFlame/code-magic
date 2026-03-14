// 工作日志类型定义

import { AnalyzedEntryPoint } from './ai-analysis'

export type LogType = 'info' | 'success' | 'error' | 'warning'
export type LogCategory = 'validation' | 'filetree' | 'filter' | 'ai' | 'entrypoint' | 'subfunction' | 'recursive'

// AI日志详情
export interface AILogDetails {
  prompt: string       // 发送给AI的提示词
  response: string     // AI的响应内容
  model?: string       // 使用的模型
  tokens?: {
    input?: number
    output?: number
    total?: number
  }
}

// 日志条目
export interface LogEntry {
  id: string
  timestamp: string
  type: LogType
  category: LogCategory
  message: string
  details?: LogDetails
  aiDetails?: AILogDetails  // AI专用详情
}

// 日志详情（可展开的JSON数据）
export interface LogDetails {
  request?: unknown
  response?: unknown
  data?: unknown
}

// API返回的分析结果（包含日志）
export interface AnalyzeResponseWithLogs {
  status: 'success' | 'error'
  error?: string
  data?: {
    primaryLanguage: string
    languageDistribution: Record<string, number>
    techStack: Array<{
      name: string
      category: string
      description?: string
      confidence: number
    }>
    entryPoints: Array<{
      path: string
      type: string
      description: string
      confidence: number
    }>
    projectType: string
    confidence: number
    /** 确认的入口文件 */
    confirmedEntryPoint?: AnalyzedEntryPoint
    /** 所有研判过的入口文件 */
    analyzedEntryPoints?: AnalyzedEntryPoint[]
  }
  logs?: LogEntry[]
}

// 日志类型图标和颜色配置
export const LOG_TYPE_CONFIG: Record<LogType, { icon: string; color: string; label: string }> = {
  info: { icon: 'ℹ️', color: 'text-blue-500', label: '信息' },
  success: { icon: '✓', color: 'text-green-500', label: '成功' },
  error: { icon: '✗', color: 'text-red-500', label: '错误' },
  warning: { icon: '⚠', color: 'text-yellow-500', label: '警告' },
}

// 日志类别配置
export const LOG_CATEGORY_CONFIG: Record<LogCategory, { label: string }> = {
  validation: { label: '校验' },
  filetree: { label: '文件树' },
  filter: { label: '过滤' },
  ai: { label: 'AI分析' },
  entrypoint: { label: '入口研判' },
  subfunction: { label: '子函数分析' },
  recursive: { label: '递归分析' },
}