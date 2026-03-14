// 硅基流动适配器
// 硅基流动是一个统一的AI API平台，支持多种模型

import { AIProviderAdapter } from '../adapter'
import { AIAnalysisResult } from '@/lib/types/ai-analysis'

export class SiliconFlowAdapter implements AIProviderAdapter {
  name = 'siliconflow'
  private apiKey: string
  private model: string

  constructor(apiKey: string, model: string = 'Qwen/Qwen2.5-7B-Instruct') {
    this.apiKey = apiKey
    this.model = model
  }

  async analyze(prompt: string): Promise<AIAnalysisResult> {
    try {
      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: '你是一个代码项目分析专家。请严格按照JSON格式返回分析结果，不要包含任何其他文本。',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error?.message || errorData.message || `HTTP ${response.status}`
        throw new Error(`硅基流动 API错误: ${errorMessage}`)
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new Error('硅基流动返回空响应')
      }

      const parsed = JSON.parse(content)
      return {
        status: 'success',
        data: parsed,
      }
    } catch (error) {
      console.error('硅基流动分析失败:', error)
      return {
        status: 'error',
        error: error instanceof Error ? error.message : '硅基流动分析失败',
      }
    }
  }
}