/**
 * 子函数识别分析器
 *
 * 负责分析入口函数调用的关键子函数
 */

import { getFileContent, getRepoInfo } from '@/lib/github/api'
import { createAIAdapter, getSubFunctionAIConfig } from '@/lib/ai'
import { generateSubFunctionPrompt, SubFunctionAnalysisJSON } from '@/lib/ai/prompt/sub-function-analysis'
import { getFileName } from '@/lib/utils/path'
import {
  SubFunction,
  SubFunctionAnalysisResult,
  FunctionCallTreeNode,
  DrillDownRecommendation,
  SubFunctionType,
} from '@/lib/types/sub-function'
import { LogEntry } from '@/lib/types/log'
import { AnalyzedEntryPoint } from '@/lib/types/ai-analysis'

// 文件行数限制
const MAX_LINES = 4000
const HALF_LINES = 2000

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * 截取文件内容
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
 * 获取语言标识
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
 * 提取主函数名
 */
function extractMainFunctionName(content: string, language: string): string {
  const patterns: Record<string, RegExp> = {
    typescript: /(?:function\s+(\w+)|const\s+(\w+)\s*=|export\s+(?:default\s+)?function\s*(\w*))/,
    javascript: /(?:function\s+(\w+)|const\s+(\w+)\s*=|export\s+(?:default\s+)?function\s*(\w*))/,
    python: /def\s+(\w+)\s*\(/,
    go: /func\s+(?:main\s*\(|(\w+)\s*\()/,
    java: /public\s+static\s+void\s+main|class\s+(\w+)/,
    rust: /fn\s+main\s*\(|fn\s+(\w+)\s*\(/,
  }

  const pattern = patterns[language] || patterns.javascript
  const match = content.match(pattern)

  if (match) {
    return match[1] || match[2] || match[3] || 'main'
  }

  return 'main'
}

/**
 * 分析选项
 */
export interface AnalyzeSubFunctionsOptions {
  owner: string
  repo: string
  entryPoint: AnalyzedEntryPoint
  primaryLanguage: string
  projectType: string
  logs: LogEntry[]
}

/**
 * 执行子函数分析
 */
export async function analyzeSubFunctions(
  options: AnalyzeSubFunctionsOptions
): Promise<SubFunctionAnalysisResult> {
  const { owner, repo, entryPoint, primaryLanguage, projectType, logs } = options
  const config = getSubFunctionAIConfig()
  const adapter = createAIAdapter(config)

  // 获取项目信息
  let projectDescription = ''
  try {
    const repoInfo = await getRepoInfo(owner, repo)
    projectDescription = repoInfo.description || `${owner}/${repo} 项目`
  } catch {
    projectDescription = `${owner}/${repo} 项目`
  }

  const githubUrl = `https://github.com/${owner}/${repo}`
  const entryFilePath = entryPoint.path

  // 添加分析开始日志
  logs.push({
    id: generateId(),
    timestamp: new Date().toISOString(),
    type: 'info',
    category: 'subfunction',
    message: `开始分析入口函数的子函数: ${entryFilePath}`,
    details: {
      data: {
        entryPoint: entryPoint.path,
        entryType: entryPoint.analysisData?.entryType,
        model: config.model,
      },
    },
  })

  try {
    // 1. 读取入口文件内容
    const fileData = await getFileContent(owner, repo, entryFilePath)
    const { content: truncatedContent, totalLines, isTruncated } = truncateFileContent(
      fileData.content
    )

    if (isTruncated) {
      logs.push({
        id: generateId(),
        timestamp: new Date().toISOString(),
        type: 'info',
        category: 'subfunction',
        message: `文件较大(${totalLines}行)，截取前后各${HALF_LINES}行`,
      })
    }

    // 2. 构建分析Prompt
    const prompt = generateSubFunctionPrompt({
      githubUrl,
      projectDescription,
      primaryLanguage,
      projectType,
      entryFilePath,
      entryFunctionName: extractMainFunctionName(fileData.content, primaryLanguage),
      entryFunctionality: entryPoint.analysisData?.functionality || '项目入口函数',
      fileContent: truncatedContent,
      language: getLanguageFromPath(entryFilePath),
    })

    logs.push({
      id: generateId(),
      timestamp: new Date().toISOString(),
      type: 'info',
      category: 'subfunction',
      message: `调用AI分析子函数 (${config.model})`,
    })

    // 3. 调用AI分析
    const analysisResult = await adapter.analyze(prompt)

    if (analysisResult.status !== 'success' || !analysisResult.data) {
      throw new Error(analysisResult.error || 'AI分析失败')
    }

    const jsonResult = analysisResult.data as unknown as SubFunctionAnalysisJSON

    // 4. 构建子函数列表
    const subFunctions: SubFunction[] = jsonResult.subFunctions.map((sf, index) => ({
      id: `sf-${generateId()}-${index}`,
      name: sf.name,
      filePath: sf.filePath || undefined,
      description: sf.description,
      drillDownRecommendation: sf.drillDownRecommendation as DrillDownRecommendation,
      reasoning: sf.reasoning,
      confidence: sf.confidence,
      functionType: sf.functionType as SubFunctionType,
      callLine: sf.callLine || undefined,
    }))

    // 5. 构建调用树
    const callTree: FunctionCallTreeNode = {
      function: {
        id: 'root',
        name: entryPoint.analysisData?.functionality || '入口函数',
        filePath: entryFilePath,
        description: entryPoint.analysisData?.functionality || '',
        drillDownRecommendation: 1,
        reasoning: '项目入口函数',
        confidence: 1,
        functionType: 'core-logic',
      },
      children: subFunctions.map((sf) => ({
        function: sf,
        children: [],
        depth: 1,
        isAnalyzed: false,
        parentPath: ['root'],
      })),
      depth: 0,
      isAnalyzed: true,
      parentPath: [],
    }

    // 添加成功日志
    logs.push({
      id: generateId(),
      timestamp: new Date().toISOString(),
      type: 'success',
      category: 'subfunction',
      message: `子函数分析完成，识别 ${subFunctions.length} 个子函数`,
      aiDetails: {
        prompt: prompt.slice(0, 2000) + (prompt.length > 2000 ? '...(已截断)' : ''),
        response: JSON.stringify(jsonResult, null, 2),
        model: config.model,
      },
      details: {
        data: {
          totalSubFunctions: subFunctions.length,
          recommendedCount: subFunctions.filter((sf) => sf.drillDownRecommendation === 1).length,
          skippedCount: subFunctions.filter((sf) => sf.drillDownRecommendation === -1).length,
        },
      },
    })

    return {
      status: 'success',
      entryFilePath,
      entryFunctionName: jsonResult.entryFunctionName,
      subFunctions,
      callTree,
      metadata: {
        model: config.model || 'unknown',
        analyzedAt: new Date().toISOString(),
      },
    }
  } catch (error) {
    logs.push({
      id: generateId(),
      timestamp: new Date().toISOString(),
      type: 'error',
      category: 'subfunction',
      message: `子函数分析失败: ${error instanceof Error ? error.message : String(error)}`,
    })

    return {
      status: 'error',
      error: error instanceof Error ? error.message : '分析失败',
      entryFilePath,
      entryFunctionName: '',
      subFunctions: [],
      callTree: {
        function: {
          id: 'root',
          name: '入口函数',
          filePath: entryFilePath,
          description: '',
          drillDownRecommendation: 1,
          reasoning: '',
          confidence: 1,
          functionType: 'other',
        },
        children: [],
        depth: 0,
        isAnalyzed: false,
        parentPath: [],
      },
      metadata: {
        model: config.model || 'unknown',
        analyzedAt: new Date().toISOString(),
      },
    }
  }
}

/**
 * 从已有代码分析子函数（用于递归分析）
 */
export async function analyzeSubFunctionsFromCode(options: {
  owner: string
  repo: string
  functionName: string
  filePath: string
  fileContent: string
  primaryLanguage: string
  projectType: string
  logs: LogEntry[]
}): Promise<SubFunctionAnalysisResult> {
  const { owner, repo, functionName, filePath, fileContent, primaryLanguage, projectType, logs } = options

  const config = getSubFunctionAIConfig()
  const adapter = createAIAdapter(config)

  // 获取项目信息
  let projectDescription = ''
  try {
    const repoInfo = await getRepoInfo(owner, repo)
    projectDescription = repoInfo.description || `${owner}/${repo} 项目`
  } catch {
    projectDescription = `${owner}/${repo} 项目`
  }

  const githubUrl = `https://github.com/${owner}/${repo}`

  // 截取文件内容
  const { content: truncatedContent, totalLines, isTruncated } = truncateFileContent(fileContent)

  if (isTruncated) {
    logs.push({
      id: generateId(),
      timestamp: new Date().toISOString(),
      type: 'info',
      category: 'subfunction',
      message: `文件较大(${totalLines}行)，截取前后各${HALF_LINES}行`,
    })
  }

  // 构建分析Prompt
  const prompt = generateSubFunctionPrompt({
    githubUrl,
    projectDescription,
    primaryLanguage,
    projectType,
    entryFilePath: filePath,
    entryFunctionName: functionName,
    entryFunctionality: `函数 ${functionName}`,
    fileContent: truncatedContent,
    language: getLanguageFromPath(filePath),
  })

  logs.push({
    id: generateId(),
    timestamp: new Date().toISOString(),
    type: 'info',
    category: 'subfunction',
    message: `分析函数 ${functionName} 的子函数 (${config.model})`,
  })

  try {
    // 调用AI分析
    const analysisResult = await adapter.analyze(prompt)

    if (analysisResult.status !== 'success' || !analysisResult.data) {
      throw new Error(analysisResult.error || 'AI分析失败')
    }

    const jsonResult = analysisResult.data as unknown as SubFunctionAnalysisJSON

    // 构建子函数列表
    const subFunctions: SubFunction[] = jsonResult.subFunctions.map((sf, index) => ({
      id: `sf-${generateId()}-${index}`,
      name: sf.name,
      filePath: sf.filePath || undefined,
      description: sf.description,
      drillDownRecommendation: sf.drillDownRecommendation as DrillDownRecommendation,
      reasoning: sf.reasoning,
      confidence: sf.confidence,
      functionType: sf.functionType as SubFunctionType,
      callLine: sf.callLine || undefined,
    }))

    // 构建调用树
    const callTree: FunctionCallTreeNode = {
      function: {
        id: 'temp',
        name: functionName,
        filePath,
        description: '',
        drillDownRecommendation: 1,
        reasoning: '',
        confidence: 1,
        functionType: 'core-logic',
      },
      children: subFunctions.map((sf) => ({
        function: sf,
        children: [],
        depth: 1,
        isAnalyzed: false,
        parentPath: [functionName],
      })),
      depth: 0,
      isAnalyzed: true,
      parentPath: [],
    }

    logs.push({
      id: generateId(),
      timestamp: new Date().toISOString(),
      type: 'success',
      category: 'subfunction',
      message: `函数 ${functionName} 的子函数分析完成，识别 ${subFunctions.length} 个子函数`,
      details: {
        data: {
          totalSubFunctions: subFunctions.length,
          recommendedCount: subFunctions.filter((sf) => sf.drillDownRecommendation === 1).length,
          skippedCount: subFunctions.filter((sf) => sf.drillDownRecommendation === -1).length,
        },
      },
    })

    return {
      status: 'success',
      entryFilePath: filePath,
      entryFunctionName: functionName,
      subFunctions,
      callTree,
      metadata: {
        model: config.model || 'unknown',
        analyzedAt: new Date().toISOString(),
      },
    }
  } catch (error) {
    logs.push({
      id: generateId(),
      timestamp: new Date().toISOString(),
      type: 'error',
      category: 'subfunction',
      message: `函数 ${functionName} 的子函数分析失败: ${error instanceof Error ? error.message : String(error)}`,
    })

    return {
      status: 'error',
      error: error instanceof Error ? error.message : '分析失败',
      entryFilePath: filePath,
      entryFunctionName: functionName,
      subFunctions: [],
      callTree: {
        function: {
          id: 'temp',
          name: functionName,
          filePath,
          description: '',
          drillDownRecommendation: 1,
          reasoning: '',
          confidence: 1,
          functionType: 'other',
        },
        children: [],
        depth: 0,
        isAnalyzed: false,
        parentPath: [],
      },
      metadata: {
        model: config.model || 'unknown',
        analyzedAt: new Date().toISOString(),
      },
    }
  }
}