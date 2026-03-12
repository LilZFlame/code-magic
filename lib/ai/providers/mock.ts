// Mock AI适配器 - 用于测试和开发

import { AIProviderAdapter } from '../adapter'
import { AIAnalysisResult } from '@/lib/types/ai-analysis'

export class MockAIAdapter implements AIProviderAdapter {
  name = 'mock'

  async analyze(prompt: string): Promise<AIAnalysisResult> {
    // 从prompt中提取信息生成模拟结果
    const lines = prompt.split('\n')
    let owner = 'unknown'
    let repo = 'unknown'

    for (const line of lines) {
      if (line.startsWith('项目:')) {
        const match = line.match(/项目:\s*(\S+)\/(\S+)/)
        if (match) {
          owner = match[1]
          repo = match[2]
        }
      }
    }

    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 500))

    // 返回模拟数据
    return {
      status: 'success',
      data: {
        primaryLanguage: 'TypeScript',
        languageDistribution: {
          'TypeScript': 45,
          'JavaScript': 20,
          'JSON': 15,
          'CSS': 10,
          'Markdown': 10,
        },
        techStack: [
          { name: 'React', category: 'framework', confidence: 0.95 },
          { name: 'Next.js', category: 'framework', confidence: 0.92 },
          { name: 'TailwindCSS', category: 'library', confidence: 0.88 },
          { name: 'TypeScript', category: 'language', confidence: 0.95 },
          { name: 'Node.js', category: 'runtime', confidence: 0.85 },
          { name: 'ESLint', category: 'tool', confidence: 0.80 },
        ],
        entryPoints: [
          { path: 'app/page.tsx', type: 'app', description: '主页面入口', confidence: 0.9 },
          { path: 'app/layout.tsx', type: 'app', description: '根布局文件', confidence: 0.85 },
          { path: 'app/api/route.ts', type: 'server', description: 'API路由', confidence: 0.75 },
        ],
        projectType: 'web-frontend',
        confidence: 0.88,
      },
    }
  }
}