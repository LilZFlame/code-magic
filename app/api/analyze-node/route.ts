import { NextRequest, NextResponse } from 'next/server'
import { analyzeSubFunctionsFromCode } from '@/lib/sub-function-analyzer'
import { locateFunctionDefinition } from '@/lib/function-locator'
import { getRepoTree } from '@/lib/github/api'
import { LogEntry } from '@/lib/types/log'
import { FunctionCallTreeNode } from '@/lib/types/sub-function'

export const maxDuration = 60 // 1分钟超时

export async function POST(request: NextRequest) {
  const logs: LogEntry[] = []

  try {
    const body = await request.json()
    const { owner, repo, targetNode, primaryLanguage, projectType } = body

    if (!owner || !repo || !targetNode) {
      return NextResponse.json({
        status: 'error',
        error: '缺少必要参数',
        logs,
      })
    }

    // 获取文件树
    const fileTree = await getRepoTree(owner, repo)

    logs.push({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'info',
      category: 'recursive',
      message: `开始分析节点: ${targetNode.function.name}`,
    })

    // 1. 定位函数
    const location = await locateFunctionDefinition(
      targetNode.function.name,
      owner,
      repo,
      {
        callerFilePath: targetNode.function.filePath || '',
        fileTree,
        primaryLanguage
      }
    )

    if (!location) {
      throw new Error(`无法定位函数: ${targetNode.function.name}`)
    }

    // 2. 分析子函数
    const result = await analyzeSubFunctionsFromCode({
      owner,
      repo,
      functionName: targetNode.function.name,
      filePath: location.filePath,
      fileContent: location.code,
      primaryLanguage,
      projectType,
      logs
    })

    if (result.status !== 'success') {
      throw new Error(result.error || '分析失败')
    }

    // 3. 构建子节点
    const children: FunctionCallTreeNode[] = result.subFunctions.map(sf => ({
      function: sf,
      children: [],
      depth: targetNode.depth + 1,
      isAnalyzed: false,
      parentPath: [...targetNode.parentPath, targetNode.function.name]
    }))

    logs.push({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'success',
      category: 'recursive',
      message: `节点分析完成，识别 ${children.length} 个子函数`,
    })

    return NextResponse.json({
      status: 'success',
      data: {
        nodeId: targetNode.function.id,
        children
      },
      logs,
    })
  } catch (error) {
    logs.push({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'error',
      category: 'recursive',
      message: `节点分析失败: ${error instanceof Error ? error.message : String(error)}`,
    })

    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : '节点分析失败',
      logs,
    })
  }
}
