import { NextRequest, NextResponse } from 'next/server'
import { getRepoTree } from '@/lib/github/api'
import { extractCodeFiles, countLanguageDistribution } from '@/lib/utils/code-filter'
import { createAIAdapter, getAIConfigFromEnv } from '@/lib/ai'
import { AIAnalysisResult } from '@/lib/types/ai-analysis'
import { LogEntry, AnalyzeResponseWithLogs } from '@/lib/types/log'
import { analyzeEntryPoints } from '@/lib/entrypoint-analyzer'

// 生成唯一ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// AI Prompt 模板
const ANALYSIS_PROMPT = `你是一个代码项目分析专家。请分析以下GitHub项目的文件结构，并返回JSON格式的分析结果。

项目: {owner}/{repo}

代码文件列表:
{fileList}

语言分布:
{languageStats}

请严格按照以下JSON格式返回分析结果（不要包含任何其他文本，只返回JSON）:
{
  "primaryLanguage": "主要编程语言（如 TypeScript, Python, Java 等）",
  "languageDistribution": {"语言名": 文件数量},
  "techStack": [
    {"name": "技术名称", "category": "类别", "description": "简短中文描述", "confidence": 0.95}
  ],
  "entryPoints": [
    {"path": "文件路径", "type": "入口类型", "description": "中文描述该入口文件的作用", "confidence": 0.9}
  ],
  "projectType": "项目类型",
  "confidence": 0.85
}

注意：
1. techStack数组按confidence降序排列，最多返回15个
2. entryPoints数组按confidence降序排列，最多返回5个
3. category必须是以下之一: framework, library, language, runtime, tool, platform, database, other
4. projectType必须是以下之一: web-frontend, web-backend, fullstack, cli-tool, library, mobile-app, desktop-app, api-service, system, embedded, data-science, other
5. confidence是0-1之间的数值，表示分析结果的置信度
6. 请根据文件名和目录结构推断技术栈，例如：看到 next.config.js 表示使用 Next.js，看到 tailwind.config.js 表示使用 TailwindCSS
7. entryPoints中的description必须使用中文描述该入口文件的作用
8. techStack中的name保持英文，但description必须使用简短的中文描述该技术的作用
`

export async function POST(request: NextRequest) {
  const logs: LogEntry[] = []
  const now = new Date().toISOString()

  try {
    const body = await request.json()
    const { owner, repo } = body

    if (!owner || !repo) {
      logs.push({
        id: generateId(),
        timestamp: now,
        type: 'error',
        category: 'validation',
        message: '缺少必要参数 owner 或 repo',
      })
      return NextResponse.json({
        status: 'error',
        error: '缺少必要参数',
        logs,
      } as AnalyzeResponseWithLogs)
    }

    // 记录开始分析
    logs.push({
      id: generateId(),
      timestamp: now,
      type: 'info',
      category: 'validation',
      message: `开始分析仓库 ${owner}/${repo}`,
    })

    // 1. 获取文件树
    let tree
    try {
      tree = await getRepoTree(owner, repo)
      const totalFiles = countAllFiles(tree)
      logs.push({
        id: generateId(),
        timestamp: new Date().toISOString(),
        type: 'success',
        category: 'filetree',
        message: `获取文件树成功，共 ${totalFiles} 个文件/目录`,
        details: {
          data: { totalNodes: totalFiles, rootNodes: tree.length },
        },
      })
    } catch (err) {
      logs.push({
        id: generateId(),
        timestamp: new Date().toISOString(),
        type: 'error',
        category: 'filetree',
        message: '获取文件树失败',
        details: { data: { error: String(err) } },
      })
      return NextResponse.json({
        status: 'error',
        error: '获取文件树失败',
        logs,
      } as AnalyzeResponseWithLogs)
    }

    // 2. 提取代码文件
    const totalNodes = countAllFiles(tree)
    const codeFiles = extractCodeFiles(tree, 300)

    logs.push({
      id: generateId(),
      timestamp: new Date().toISOString(),
      type: 'success',
      category: 'filter',
      message: `过滤完成：${totalNodes} → ${codeFiles.length} 个代码文件`,
      details: {
        data: {
          beforeFilter: totalNodes,
          afterFilter: codeFiles.length,
          maxFiles: 300,
        },
      },
    })

    if (codeFiles.length === 0) {
      logs.push({
        id: generateId(),
        timestamp: new Date().toISOString(),
        type: 'warning',
        category: 'filter',
        message: '未找到可分析的代码文件',
      })
      return NextResponse.json({
        status: 'error',
        error: '未找到可分析的代码文件',
        logs,
      } as AnalyzeResponseWithLogs)
    }

    // 3. 统计语言分布
    const languageDistribution = countLanguageDistribution(codeFiles)
    const topLanguages = Object.entries(languageDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang, count]) => `${lang}:${count}`)
      .join(', ')

    logs.push({
      id: generateId(),
      timestamp: new Date().toISOString(),
      type: 'info',
      category: 'filter',
      message: `语言分布: ${topLanguages}`,
    })

    // 4. 构建分析提示词
    const fileListForPrompt = codeFiles.slice(0, 200)
    const prompt = ANALYSIS_PROMPT
      .replace('{owner}', owner)
      .replace('{repo}', repo)
      .replace('{fileList}', fileListForPrompt.join('\n'))
      .replace('{languageStats}', JSON.stringify(languageDistribution, null, 2))

    // 5. 获取AI配置并创建适配器
    const config = getAIConfigFromEnv()

    logs.push({
      id: generateId(),
      timestamp: new Date().toISOString(),
      type: 'info',
      category: 'ai',
      message: `使用AI服务: ${config.provider}`,
      details: {
        request: {
          provider: config.provider,
          model: config.model,
          fileCount: fileListForPrompt.length,
          promptLength: prompt.length,
        },
      },
    })

    // 6. 调用AI分析
    const adapter = createAIAdapter(config)
    const analysisResult = await adapter.analyze(prompt)

    // 记录AI响应（包含提示词和响应详情）
    if (analysisResult.status === 'success') {
      logs.push({
        id: generateId(),
        timestamp: new Date().toISOString(),
        type: 'success',
        category: 'ai',
        message: 'AI分析完成',
        aiDetails: {
          prompt: prompt.slice(0, 2000) + (prompt.length > 2000 ? '...(已截断)' : ''),
          response: JSON.stringify(analysisResult.data, null, 2),
          model: config.model,
        },
      })
    } else {
      logs.push({
        id: generateId(),
        timestamp: new Date().toISOString(),
        type: 'error',
        category: 'ai',
        message: `AI分析失败: ${analysisResult.error}`,
        aiDetails: {
          prompt: prompt.slice(0, 2000) + (prompt.length > 2000 ? '...(已截断)' : ''),
          response: analysisResult.error || '未知错误',
          model: config.model,
        },
      })
    }

    // 7. 补充语言分布数据（确保数据完整）
    if (analysisResult.status === 'success' && analysisResult.data) {
      analysisResult.data.languageDistribution = languageDistribution

      // 8. 入口文件研判
      if (analysisResult.data.entryPoints && analysisResult.data.entryPoints.length > 0) {
        logs.push({
          id: generateId(),
          timestamp: new Date().toISOString(),
          type: 'info',
          category: 'entrypoint',
          message: '开始入口文件研判...',
        })

        const entryPointResult = await analyzeEntryPoints({
          owner,
          repo,
          entryPoints: analysisResult.data.entryPoints,
          primaryLanguage: analysisResult.data.primaryLanguage,
          projectType: analysisResult.data.projectType,
          logs,
        })

        if (entryPointResult.confirmedEntry) {
          analysisResult.data.confirmedEntryPoint = entryPointResult.confirmedEntry
          analysisResult.data.analyzedEntryPoints = entryPointResult.analyzedEntries
        }
      }
    }

    return NextResponse.json({
      ...analysisResult,
      logs,
    } as AnalyzeResponseWithLogs)
  } catch (error) {
    console.error('项目分析失败:', error)
    logs.push({
      id: generateId(),
      timestamp: new Date().toISOString(),
      type: 'error',
      category: 'ai',
      message: `分析过程异常: ${error instanceof Error ? error.message : String(error)}`,
    })
    return NextResponse.json({
      status: 'error',
      error: '分析失败，请稍后重试',
      logs,
    } as AnalyzeResponseWithLogs)
  }
}

// 计算文件树中的所有节点数量
function countAllFiles(nodes: any[]): number {
  let count = 0
  for (const node of nodes) {
    count++
    if (node.children) {
      count += countAllFiles(node.children)
    }
  }
  return count
}