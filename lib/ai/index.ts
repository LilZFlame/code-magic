// AI服务统一导出

import { AIProviderAdapter, AIProviderType, AIConfig, AIAnalysisPurpose } from './adapter'
import { OpenAIAdapter } from './providers/openai'
import { AnthropicAdapter } from './providers/anthropic'
import { SiliconFlowAdapter } from './providers/siliconflow'
import { MockAIAdapter } from './providers/mock'

export type { AIProviderAdapter, AIProviderType, AIConfig, AIAnalysisPurpose }
export { OpenAIAdapter, AnthropicAdapter, SiliconFlowAdapter, MockAIAdapter }

/**
 * 创建AI服务适配器
 */
export function createAIAdapter(config: AIConfig): AIProviderAdapter {
  const { provider, apiKey, model } = config

  switch (provider) {
    case 'openai':
      if (!apiKey) {
        console.warn('OpenAI API Key未配置，使用模拟数据')
        return new MockAIAdapter()
      }
      return new OpenAIAdapter(apiKey, model)

    case 'anthropic':
      if (!apiKey) {
        console.warn('Anthropic API Key未配置，使用模拟数据')
        return new MockAIAdapter()
      }
      return new AnthropicAdapter(apiKey, model)

    case 'siliconflow':
      if (!apiKey) {
        console.warn('硅基流动 API Key未配置，使用模拟数据')
        return new MockAIAdapter()
      }
      return new SiliconFlowAdapter(apiKey, model)

    case 'mock':
    default:
      return new MockAIAdapter()
  }
}

/**
 * 从环境变量获取AI配置
 */
export function getAIConfigFromEnv(): AIConfig {
  const provider = (process.env.AI_PROVIDER as AIProviderType) || 'mock'

  let apiKey: string | undefined
  let model: string | undefined

  switch (provider) {
    case 'openai':
      apiKey = process.env.OPENAI_API_KEY
      model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
      break
    case 'anthropic':
      apiKey = process.env.ANTHROPIC_API_KEY
      model = process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307'
      break
    case 'siliconflow':
      apiKey = process.env.SILICONFLOW_API_KEY
      model = process.env.SILICONFLOW_MODEL || 'Qwen/Qwen2.5-7B-Instruct'
      break
  }

  return { provider, apiKey, model }
}

/**
 * 获取子函数分析专用AI配置
 * 优先使用专用配置，否则回退到主配置
 */
export function getSubFunctionAIConfig(): AIConfig {
  const provider = (process.env.SUBFUNCTION_AI_PROVIDER as AIProviderType)
    || (process.env.AI_PROVIDER as AIProviderType)
    || 'mock'

  let apiKey: string | undefined
  let model: string | undefined

  // 优先使用专用配置
  switch (provider) {
    case 'openai':
      apiKey = process.env.SUBFUNCTION_AI_API_KEY || process.env.OPENAI_API_KEY
      model = process.env.SUBFUNCTION_AI_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini'
      break
    case 'anthropic':
      apiKey = process.env.SUBFUNCTION_AI_API_KEY || process.env.ANTHROPIC_API_KEY
      model = process.env.SUBFUNCTION_AI_MODEL || process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307'
      break
    case 'siliconflow':
      apiKey = process.env.SUBFUNCTION_AI_API_KEY || process.env.SILICONFLOW_API_KEY
      model = process.env.SUBFUNCTION_AI_MODEL || process.env.SILICONFLOW_MODEL || 'Qwen/Qwen2.5-32B-Instruct'
      break
  }

  return { provider, apiKey, model }
}