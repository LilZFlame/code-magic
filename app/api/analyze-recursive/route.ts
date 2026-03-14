import { NextRequest, NextResponse } from 'next/server'
import { recursiveAnalyzeSubFunctions } from '@/lib/recursive-analyzer'
import { getRepoTree } from '@/lib/github/api'
import { LogEntry } from '@/lib/types/log'
import { AnalyzedEntryPoint } from '@/lib/types/ai-analysis'

export const maxDuration = 300 // 5分钟超时（Vercel Pro）

export async function POST(request: NextRequest) {
  const logs: LogEntry[] = []

  try {
    const body = await request.json()
    const { owner, repo, entryPoint, primaryLanguage, projectType, config } = body

    if (!owner || !repo || !entryPoint) {
      return NextResponse.json({
        status: 'error',
        error: '缺少必要参数',
        logs,
      })
    }

    // 获取文件树
    logs.push({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'info',
      category: 'recursive',
      message: '获取项目文件树...',
    })

    const fileTree = await getRepoTree(owner, repo)

    logs.push({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'info',
      category: 'recursive',
      message: '开始递归分析...',
    })

    // 执行递归分析
    const result = await recursiveAnalyzeSubFunctions({
      owner,
      repo,
      entryPoint: entryPoint as AnalyzedEntryPoint,
      primaryLanguage: primaryLanguage || 'typescript',
      projectType: projectType || 'other',
      fileTree,
      logs,
      config,
    })

    logs.push({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'success',
      category: 'recursive',
      message: `递归分析完成！共分析 ${result.statistics.analyzedFunctions} 个函数`,
      details: {
        data: result.statistics,
      },
    })

    return NextResponse.json({
      status: result.status,
      data: result,
      logs,
    })
  } catch (error) {
    logs.push({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'error',
      category: 'recursive',
      message: `递归分析失败: ${error instanceof Error ? error.message : String(error)}`,
    })

    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : '递归分析失败',
      logs,
    })
  }
}
