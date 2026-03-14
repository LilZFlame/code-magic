/**
 * 递归子函数分析器
 * 对所有 drillDownRecommendation >= 0 的子函数进行递归下钻分析
 */

import { analyzeSubFunctions, analyzeSubFunctionsFromCode } from './sub-function-analyzer'
import { locateFunctionDefinition } from './function-locator'
import { getFileContent } from './github/api'
import { TreeNode } from './github/types'
import {
  SubFunction,
  FunctionCallTreeNode,
  SubFunctionAnalysisResult,
} from './types/sub-function'
import { AnalyzedEntryPoint } from './types/ai-analysis'
import { LogEntry } from './types/log'

/**
 * 递归分析配置
 */
export interface RecursiveAnalysisConfig {
  /** 最大递归深度 */
  maxDepth: number
  /** 是否启用并行分析 */
  enableParallel: boolean
  /** 每层最大分析函数数 */
  maxFunctionsPerLevel: number
  /** 是否启用缓存 */
  enableCache: boolean
}

/**
 * 递归分析选项
 */
export interface RecursiveAnalysisOptions {
  owner: string
  repo: string
  entryPoint: AnalyzedEntryPoint
  primaryLanguage: string
  projectType: string
  fileTree: TreeNode[]
  logs: LogEntry[]
  config?: Partial<RecursiveAnalysisConfig>
}

/**
 * 递归分析结果
 */
export interface RecursiveAnalysisResult {
  status: 'success' | 'error' | 'partial'
  error?: string
  callTree: FunctionCallTreeNode
  statistics: {
    totalFunctions: number
    analyzedFunctions: number
    skippedFunctions: number
    failedFunctions: number
    maxDepthReached: number
    analysisTimeMs: number
  }
  metadata: {
    model: string
    analyzedAt: string
  }
}

/**
 * 默认递归配置
 */
const DEFAULT_RECURSIVE_CONFIG: RecursiveAnalysisConfig = {
  maxDepth: 3,
  enableParallel: true,
  maxFunctionsPerLevel: 10,
  enableCache: true,
}

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * 计算节点总数
 */
function countNodes(node: FunctionCallTreeNode): number {
  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0)
}

/**
 * 递归分析单个节点
 */
async function analyzeNodeRecursively(
  subFunction: SubFunction,
  currentDepth: number,
  parentPath: string[],
  context: {
    owner: string
    repo: string
    primaryLanguage: string
    projectType: string
    fileTree: TreeNode[]
    logs: LogEntry[]
    config: RecursiveAnalysisConfig
    cache: Map<string, SubFunction[]>
    statistics: RecursiveAnalysisResult['statistics']
  }
): Promise<FunctionCallTreeNode> {
  const { owner, repo, primaryLanguage, projectType, fileTree, logs, config, cache, statistics } = context

  const node: FunctionCallTreeNode = {
    function: subFunction,
    children: [],
    depth: currentDepth,
    isAnalyzed: false,
    parentPath,
  }

  // 终止条件1: 达到最大深度
  if (currentDepth >= config.maxDepth) {
    logs.push({
      id: generateId(),
      timestamp: new Date().toISOString(),
      type: 'info',
      category: 'recursive',
      message: `达到最大深度 ${config.maxDepth}，停止分析 ${subFunction.name}`,
    })
    statistics.skippedFunctions++
    return node
  }

  // 终止条件2: 循环检测
  if (parentPath.includes(subFunction.name)) {
    logs.push({
      id: generateId(),
      timestamp: new Date().toISOString(),
      type: 'warning',
      category: 'recursive',
      message: `检测到循环调用: ${subFunction.name}`,
    })
    statistics.skippedFunctions++
    return node
  }

  // 终止条件3: 不推荐分析的函数
  if (subFunction.drillDownRecommendation < 0) {
    statistics.skippedFunctions++
    return node
  }

  // 检查缓存
  const cacheKey = `${subFunction.filePath}:${subFunction.name}`
  if (config.enableCache && cache.has(cacheKey)) {
    const cachedSubFunctions = cache.get(cacheKey)!
    node.children = cachedSubFunctions.map((sf) => ({
      function: sf,
      children: [],
      depth: currentDepth + 1,
      isAnalyzed: false,
      parentPath: [...parentPath, subFunction.name],
    }))
    node.isAnalyzed = true
    logs.push({
      id: generateId(),
      timestamp: new Date().toISOString(),
      type: 'info',
      category: 'recursive',
      message: `使用缓存: ${subFunction.name}`,
    })
    return node
  }

  // 1. 定位函数定义
  logs.push({
    id: generateId(),
    timestamp: new Date().toISOString(),
    type: 'info',
    category: 'recursive',
    message: `定位函数: ${subFunction.name} (深度 ${currentDepth})`,
  })

  const location = await locateFunctionDefinition(subFunction.name, owner, repo, {
    callerFilePath: subFunction.filePath || '',
    fileTree,
    primaryLanguage,
  })

  if (!location) {
    logs.push({
      id: generateId(),
      timestamp: new Date().toISOString(),
      type: 'error',
      category: 'recursive',
      message: `无法定位函数: ${subFunction.name}`,
    })
    statistics.failedFunctions++
    return node
  }

  // 更新函数文件路径
  subFunction.filePath = location.filePath

  // 2. 分析该函数的子函数
  logs.push({
    id: generateId(),
    timestamp: new Date().toISOString(),
    type: 'info',
    category: 'recursive',
    message: `分析函数 ${subFunction.name} 的子函数`,
  })

  try {
    const analysisResult = await analyzeSubFunctionsFromCode({
      owner,
      repo,
      functionName: subFunction.name,
      filePath: location.filePath,
      fileContent: location.code,
      primaryLanguage,
      projectType,
      logs,
    })

    if (analysisResult.status === 'success') {
      node.isAnalyzed = true
      statistics.analyzedFunctions++

      // 缓存结果
      if (config.enableCache) {
        cache.set(cacheKey, analysisResult.subFunctions)
      }

      // 3. 递归分析子函数（限制数量）
      const functionsToAnalyze = analysisResult.subFunctions
        .filter((sf) => sf.drillDownRecommendation >= 0)
        .slice(0, config.maxFunctionsPerLevel)

      if (functionsToAnalyze.length > 0) {
        if (config.enableParallel) {
          node.children = await Promise.all(
            functionsToAnalyze.map((sf) =>
              analyzeNodeRecursively(sf, currentDepth + 1, [...parentPath, subFunction.name], context)
            )
          )
        } else {
          for (const sf of functionsToAnalyze) {
            const childNode = await analyzeNodeRecursively(
              sf,
              currentDepth + 1,
              [...parentPath, subFunction.name],
              context
            )
            node.children.push(childNode)
          }
        }
      }

      // 更新最大深度
      if (currentDepth + 1 > statistics.maxDepthReached) {
        statistics.maxDepthReached = currentDepth + 1
      }
    } else {
      statistics.failedFunctions++
    }
  } catch (error) {
    logs.push({
      id: generateId(),
      timestamp: new Date().toISOString(),
      type: 'error',
      category: 'recursive',
      message: `分析函数 ${subFunction.name} 失败: ${error instanceof Error ? error.message : String(error)}`,
    })
    statistics.failedFunctions++
  }

  return node
}

/**
 * 主递归分析函数
 */
export async function recursiveAnalyzeSubFunctions(
  options: RecursiveAnalysisOptions
): Promise<RecursiveAnalysisResult> {
  const { owner, repo, entryPoint, primaryLanguage, projectType, fileTree, logs } = options

  const config: RecursiveAnalysisConfig = {
    ...DEFAULT_RECURSIVE_CONFIG,
    ...options.config,
  }

  const cache = new Map<string, SubFunction[]>()
  const statistics: RecursiveAnalysisResult['statistics'] = {
    totalFunctions: 0,
    analyzedFunctions: 0,
    skippedFunctions: 0,
    failedFunctions: 0,
    maxDepthReached: 0,
    analysisTimeMs: 0,
  }

  const startTime = Date.now()

  try {
    logs.push({
      id: generateId(),
      timestamp: new Date().toISOString(),
      type: 'info',
      category: 'recursive',
      message: `开始递归分析，最大深度: ${config.maxDepth}`,
      details: {
        data: {
          entryPoint: entryPoint.path,
          maxDepth: config.maxDepth,
          enableParallel: config.enableParallel,
          maxFunctionsPerLevel: config.maxFunctionsPerLevel,
        },
      },
    })

    // 1. 分析入口函数（第0层）
    const rootResult = await analyzeSubFunctions({
      owner,
      repo,
      entryPoint,
      primaryLanguage,
      projectType,
      logs,
    })

    if (rootResult.status !== 'success') {
      throw new Error(rootResult.error || '入口函数分析失败')
    }

    const rootNode: FunctionCallTreeNode = {
      function: {
        id: 'root',
        name: entryPoint.analysisData?.functionality || '入口函数',
        filePath: entryPoint.path,
        description: entryPoint.analysisData?.functionality || '',
        drillDownRecommendation: 1,
        reasoning: '项目入口函数',
        confidence: 1,
        functionType: 'core-logic',
      },
      children: [],
      depth: 0,
      isAnalyzed: true,
      parentPath: [],
    }

    statistics.analyzedFunctions++
    statistics.totalFunctions = rootResult.subFunctions.length

    // 2. 递归分析每个子函数
    const functionsToAnalyze = rootResult.subFunctions
      .filter((sf) => sf.drillDownRecommendation >= 0)
      .slice(0, config.maxFunctionsPerLevel)

    const context = {
      owner,
      repo,
      primaryLanguage,
      projectType,
      fileTree,
      logs,
      config,
      cache,
      statistics,
    }

    if (config.enableParallel) {
      rootNode.children = await Promise.all(
        functionsToAnalyze.map((sf) => analyzeNodeRecursively(sf, 1, ['root'], context))
      )
    } else {
      for (const sf of functionsToAnalyze) {
        const childNode = await analyzeNodeRecursively(sf, 1, ['root'], context)
        rootNode.children.push(childNode)
      }
    }

    // 计算总函数数
    statistics.totalFunctions = countNodes(rootNode)

    statistics.analysisTimeMs = Date.now() - startTime

    logs.push({
      id: generateId(),
      timestamp: new Date().toISOString(),
      type: 'success',
      category: 'recursive',
      message: `递归分析完成！共分析 ${statistics.analyzedFunctions} 个函数`,
      details: {
        data: statistics,
      },
    })

    return {
      status: 'success',
      callTree: rootNode,
      statistics,
      metadata: {
        model: 'unknown',
        analyzedAt: new Date().toISOString(),
      },
    }
  } catch (error) {
    statistics.analysisTimeMs = Date.now() - startTime

    logs.push({
      id: generateId(),
      timestamp: new Date().toISOString(),
      type: 'error',
      category: 'recursive',
      message: `递归分析失败: ${error instanceof Error ? error.message : String(error)}`,
    })

    return {
      status: 'error',
      error: error instanceof Error ? error.message : '递归分析失败',
      callTree: {
        function: {
          id: 'root',
          name: '入口函数',
          filePath: entryPoint.path,
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
      statistics,
      metadata: {
        model: 'unknown',
        analyzedAt: new Date().toISOString(),
      },
    }
  }
}
