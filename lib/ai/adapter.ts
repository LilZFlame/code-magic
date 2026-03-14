// AI服务适配器接口

import { AIAnalysisResult } from '@/lib/types/ai-analysis'

/**
 * AI服务适配器接口
 * 所有AI服务商都需要实现此接口
 */
export interface AIProviderAdapter {
  /** 服务名称 */
  name: string

  /**
   * 执行AI分析
   * @param prompt 分析提示词
   * @returns 结构化分析结果
   */
  analyze(prompt: string): Promise<AIAnalysisResult>
}

/**
 * AI服务提供商类型
 */
export type AIProviderType = 'openai' | 'anthropic' | 'siliconflow' | 'mock'

/**
 * AI分析用途类型
 */
export type AIAnalysisPurpose =
  | 'project-analysis'    // 项目分析（需要较强模型）
  | 'entrypoint-analysis' // 入口研判（需要较强模型）
  | 'subfunction-analysis' // 子函数分析（可用经济模型）

/**
 * AI分析配置
 */
export interface AIConfig {
  /** 选择的AI服务商 */
  provider: AIProviderType
  /** API密钥 */
  apiKey?: string
  /** 模型名称（可选） */
  model?: string
}