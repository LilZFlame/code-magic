/**
 * 入口文件研判器
 *
 * 负责逐个分析AI识别的入口文件，确定真实的入口点
 */

import { getFileContent, getRepoInfo } from '@/lib/github/api'
import { createAIAdapter, getAIConfigFromEnv } from '@/lib/ai'
import { getFileName } from '@/lib/utils/path'
import {
  EntryPoint,
  EntryPointAnalysisData,
  AnalyzedEntryPoint,
} from '@/lib/types/ai-analysis'
import { LogEntry } from '@/lib/types/log'
import { generateEntryPointPrompt } from '@/lib/ai/prompt/entrypoint-analysis'

// 文件行数限制
const MAX_LINES = 4000
const HALF_LINES = 2000

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * 截取文件内容（超过4000行时取前后各2000行）
 */
function truncateFileContent(content: string): {
  content: string
  totalLines: number
  isTruncated: boolean
} {
  const lines = content.split('\n')
  const totalLines = lines.length

  if (totalLines <= MAX_LINES) {
    return { content, totalLines, isTruncated: false }
  }

  const firstHalf = lines.slice(0, HALF_LINES).join('\n')
  const secondHalf = lines.slice(-HALF_LINES).join('\n')

  return {
    content: `${firstHalf}\n\n// ... 中间省略 ${totalLines - MAX_LINES} 行 ...\n\n${secondHalf}`,
    totalLines,
    isTruncated: true,
  }
}

/**
 * 根据文件扩展名获取语言标识
 */
function getLanguageFromPath(path: string): string {
  const fileName = getFileName(path)
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    go: 'go',
    java: 'java',
    rs: 'rust',
    rb: 'ruby',
    php: 'php',
    cs: 'csharp',
    cpp: 'cpp',
    c: 'c',
    swift: 'swift',
    kt: 'kotlin',
    vue: 'vue',
    svelte: 'svelte',
  }
  return languageMap[ext] || ext
}

/**
 * 研判选项
 */
export interface AnalyzeEntryPointsOptions {
  owner: string
  repo: string
  entryPoints: EntryPoint[]
  primaryLanguage: string
  projectType: string
  /** 已有的日志数组，会追加新日志 */
  logs: LogEntry[]
}

/**
 * 研判结果
 */
export interface AnalyzeEntryPointsResult {
  /** 确认的入口文件 */
  confirmedEntry: AnalyzedEntryPoint | null
  /** 所有研判过的入口文件 */
  analyzedEntries: AnalyzedEntryPoint[]
  /** 是否找到确认入口 */
  foundEntry: boolean
}

/**
 * 执行入口文件研判
 *
 * 逐个分析entryPoints，一旦确认就停止
 */
export async function analyzeEntryPoints(
  options: AnalyzeEntryPointsOptions
): Promise<AnalyzeEntryPointsResult> {
  const { owner, repo, entryPoints, primaryLanguage, projectType, logs } = options
  const config = getAIConfigFromEnv()
  const adapter = createAIAdapter(config)

  // 获取仓库信息作为项目简介
  let projectDescription = ''
  try {
    const repoInfo = await getRepoInfo(owner, repo)
    projectDescription = repoInfo.description || `${owner}/${repo} 项目`
  } catch {
    projectDescription = `${owner}/${repo} 项目`
  }

  const githubUrl = `https://github.com/${owner}/${repo}`
  const analyzedEntries: AnalyzedEntryPoint[] = []

  // 添加研判开始日志
  logs.push({
    id: generateId(),
    timestamp: new Date().toISOString(),
    type: 'info',
    category: 'entrypoint',
    message: `开始研判 ${entryPoints.length} 个候选入口文件`,
    details: {
      data: {
        candidates: entryPoints.map((e) => ({ path: e.path, type: e.type })),
      },
    },
  })

  // 按置信度排序，优先研判高置信度的入口
  const sortedEntryPoints = [...entryPoints].sort((a, b) => b.confidence - a.confidence)

  for (const entryPoint of sortedEntryPoints) {
    // 添加读取文件日志
    logs.push({
      id: generateId(),
      timestamp: new Date().toISOString(),
      type: 'info',
      category: 'entrypoint',
      message: `读取候选入口文件: ${entryPoint.path}`,
    })

    try {
      // 1. 读取文件内容
      const fileData = await getFileContent(owner, repo, entryPoint.path)
      const { content: truncatedContent, totalLines, isTruncated } = truncateFileContent(
        fileData.content
      )

      // 添加文件信息日志
      if (isTruncated) {
        logs.push({
          id: generateId(),
          timestamp: new Date().toISOString(),
          type: 'info',
          category: 'entrypoint',
          message: `文件较大(${totalLines}行)，截取前后各${HALF_LINES}行`,
        })
      }

      // 2. 构建研判Prompt
      const prompt = generateEntryPointPrompt({
        githubUrl,
        projectDescription,
        primaryLanguage,
        projectType,
        filePath: entryPoint.path,
        expectedType: entryPoint.type,
        expectedDescription: entryPoint.description,
        fileContent: truncatedContent,
        language: getLanguageFromPath(entryPoint.path),
      })

      // 3. 调用AI研判
      const analysisResult = await adapter.analyze(prompt)

      // 4. 处理研判结果
      if (analysisResult.status === 'success' && analysisResult.data) {
        const analysisData = analysisResult.data as unknown as EntryPointAnalysisData
        const analyzedEntry: AnalyzedEntryPoint = {
          ...entryPoint,
          isVerified: true,
          analysisData,
        }
        analyzedEntries.push(analyzedEntry)

        // 添加研判结果日志
        logs.push({
          id: generateId(),
          timestamp: new Date().toISOString(),
          type: analysisData.isConfirmedEntry ? 'success' : 'warning',
          category: 'entrypoint',
          message: analysisData.isConfirmedEntry
            ? `确认入口: ${entryPoint.path} (${Math.round(analysisData.confidence * 100)}%置信度)`
            : `排除候选: ${entryPoint.path} - ${analysisData.reasoning.slice(0, 50)}...`,
          aiDetails: {
            prompt: prompt.slice(0, 2000) + (prompt.length > 2000 ? '...(已截断)' : ''),
            response: JSON.stringify(analysisData, null, 2),
            model: config.model,
          },
        })

        // 5. 如果确认是入口，立即返回
        if (analysisData.isConfirmedEntry && analysisData.confidence >= 0.8) {
          logs.push({
            id: generateId(),
            timestamp: new Date().toISOString(),
            type: 'success',
            category: 'entrypoint',
            message: `入口研判完成，确认入口文件: ${entryPoint.path}`,
            details: {
              data: {
                path: entryPoint.path,
                type: analysisData.entryType,
                functionality: analysisData.functionality,
                startupHint: analysisData.startupHint,
              },
            },
          })

          return {
            confirmedEntry: analyzedEntry,
            analyzedEntries,
            foundEntry: true,
          }
        }
      } else {
        // AI研判失败
        logs.push({
          id: generateId(),
          timestamp: new Date().toISOString(),
          type: 'error',
          category: 'entrypoint',
          message: `研判失败: ${entryPoint.path} - ${analysisResult.error}`,
        })

        analyzedEntries.push({
          ...entryPoint,
          isVerified: false,
        })
      }
    } catch (error) {
      // 文件读取失败或其他错误
      logs.push({
        id: generateId(),
        timestamp: new Date().toISOString(),
        type: 'error',
        category: 'entrypoint',
        message: `处理失败: ${entryPoint.path} - ${error instanceof Error ? error.message : String(error)}`,
      })

      analyzedEntries.push({
        ...entryPoint,
        isVerified: false,
      })
    }
  }

  // 所有候选都已研判，未找到确认入口
  logs.push({
    id: generateId(),
    timestamp: new Date().toISOString(),
    type: 'warning',
    category: 'entrypoint',
    message: '所有候选入口已研判，未找到高置信度入口文件',
    details: {
      data: {
        analyzedCount: analyzedEntries.length,
        bestMatch: analyzedEntries
          .filter((e) => e.analysisData)
          .sort(
            (a, b) => (b.analysisData?.confidence || 0) - (a.analysisData?.confidence || 0)
          )[0],
      },
    },
  })

  // 返回置信度最高的作为参考
  const bestEntry = analyzedEntries
    .filter((e) => e.analysisData && e.analysisData.confidence >= 0.5)
    .sort((a, b) => (b.analysisData?.confidence || 0) - (a.analysisData?.confidence || 0))[0]

  return {
    confirmedEntry: bestEntry || null,
    analyzedEntries,
    foundEntry: false,
  }
}