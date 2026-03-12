// Anthropic Claude适配器

import { AIProviderAdapter } from '../adapter'
import { AIAnalysisResult } from '@/lib/types/ai-analysis'

export class AnthropicAdapter implements AIProviderAdapter {
  name = 'anthropic'
  private apiKey: string
  private model: string

  constructor(apiKey: string, model: string = 'claude-3-haiku-20240307') {
    this.apiKey = apiKey
    this.model = model
  }

  async analyze(prompt: string): Promise<AIAnalysisResult> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 2048,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          system: '你是一个代码项目分析专家。请严格按照JSON格式返回分析结果，不要包含任何其他文本。',
        }),
      })

      if (!response.ok) {
        throw new Error(`Anthropic API错误: ${response.status}`)
      }

      const data = await response.json()
      const content = data.content?.[0]?.text

      if (!content) {
        throw new Error('Anthropic返回空响应')
      }

      // 提取JSON内容
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('无法从响应中提取JSON')
      }

      const parsed = JSON.parse(jsonMatch[0])
      return {
        status: 'success',
        data: parsed,
      }
    } catch (error) {
      console.error('Anthropic分析失败:', error)
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Anthropic分析失败',
      }
    }
  }
}