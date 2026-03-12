// OpenAI适配器

import { AIProviderAdapter } from '../adapter'
import { AIAnalysisResult } from '@/lib/types/ai-analysis'

export class OpenAIAdapter implements AIProviderAdapter {
  name = 'openai'
  private apiKey: string
  private model: string

  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    this.apiKey = apiKey
    this.model = model
  }

  async analyze(prompt: string): Promise<AIAnalysisResult> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
        throw new Error(`OpenAI API错误: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new Error('OpenAI返回空响应')
      }

      const parsed = JSON.parse(content)
      return {
        status: 'success',
        data: parsed,
      }
    } catch (error) {
      console.error('OpenAI分析失败:', error)
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'OpenAI分析失败',
      }
    }
  }
}