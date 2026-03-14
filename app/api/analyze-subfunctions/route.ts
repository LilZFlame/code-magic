import { NextRequest, NextResponse } from 'next/server'
import { analyzeSubFunctions } from '@/lib/sub-function-analyzer'
import { LogEntry } from '@/lib/types/log'
import { AnalyzedEntryPoint } from '@/lib/types/ai-analysis'

export async function POST(request: NextRequest) {
  const logs: LogEntry[] = []

  try {
    const body = await request.json()
    const { owner, repo, entryPoint, primaryLanguage, projectType } = body

    if (!owner || !repo || !entryPoint) {
      return NextResponse.json({
        status: 'error',
        error: '缺少必要参数',
        logs,
      })
    }

    const result = await analyzeSubFunctions({
      owner,
      repo,
      entryPoint: entryPoint as AnalyzedEntryPoint,
      primaryLanguage: primaryLanguage || 'typescript',
      projectType: projectType || 'other',
      logs,
    })

    return NextResponse.json({
      status: result.status,
      data: result,
      logs,
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : '分析失败',
      logs,
    })
  }
}