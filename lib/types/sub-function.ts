/**
 * 子函数分析相关类型定义
 */

/**
 * 子函数研判推荐值
 * -1: 不值得分析（工具函数、简单函数）
 *  0: 待定（需要更多信息）
 *  1: 值得分析（核心业务逻辑、关键组件）
 */
export type DrillDownRecommendation = -1 | 0 | 1

/**
 * 子函数类型
 */
export type SubFunctionType =
  | 'core-logic'      // 核心业务逻辑
  | 'data-processing' // 数据处理
  | 'io-operation'    // IO操作（网络、文件）
  | 'ui-component'    // UI组件
  | 'utility'         // 工具函数
  | 'configuration'   // 配置相关
  | 'initialization'  // 初始化
  | 'callback'        // 回调函数
  | 'handler'         // 事件处理器
  | 'other'           // 其他

/**
 * 子函数定义
 */
export interface SubFunction {
  /** 函数唯一标识 */
  id: string
  /** 函数名称 */
  name: string
  /** 函数所在文件路径（推断） */
  filePath?: string
  /** 函数功能简介 */
  description: string
  /** 是否值得进一步下钻分析 */
  drillDownRecommendation: DrillDownRecommendation
  /** 研判理由 */
  reasoning: string
  /** 置信度 (0-1) */
  confidence: number
  /** 函数类型 */
  functionType: SubFunctionType
  /** 调用位置（行号） */
  callLine?: number
}

/**
 * 函数调用树节点（支持递归）
 */
export interface FunctionCallTreeNode {
  /** 函数信息 */
  function: SubFunction
  /** 子节点（递归分析后填充） */
  children: FunctionCallTreeNode[]
  /** 分析深度 */
  depth: number
  /** 是否已分析 */
  isAnalyzed: boolean
  /** 父节点路径 */
  parentPath: string[]
}

/**
 * 子函数分析结果
 */
export interface SubFunctionAnalysisResult {
  /** 分析状态 */
  status: 'success' | 'error' | 'partial'
  /** 错误信息 */
  error?: string
  /** 入口函数路径 */
  entryFilePath: string
  /** 入口函数名 */
  entryFunctionName: string
  /** 识别的子函数列表 */
  subFunctions: SubFunction[]
  /** 函数调用树 */
  callTree: FunctionCallTreeNode
  /** 分析元数据 */
  metadata: {
    /** 使用的模型 */
    model: string
    /** 分析时间 */
    analyzedAt: string
    /** Token消耗（可选） */
    tokens?: {
      input: number
      output: number
    }
  }
}

/**
 * 子函数类型标签配置
 */
export const SUB_FUNCTION_TYPE_CONFIG: Record<SubFunctionType, {
  label: string
  color: string
  icon: string
}> = {
  'core-logic': {
    label: '核心逻辑',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    icon: '🎯'
  },
  'data-processing': {
    label: '数据处理',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    icon: '📊'
  },
  'io-operation': {
    label: 'IO操作',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    icon: '🔌'
  },
  'ui-component': {
    label: 'UI组件',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    icon: '🎨'
  },
  'utility': {
    label: '工具函数',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    icon: '🔧'
  },
  'configuration': {
    label: '配置',
    color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
    icon: '⚙️'
  },
  'initialization': {
    label: '初始化',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    icon: '🚀'
  },
  'callback': {
    label: '回调',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    icon: '📞'
  },
  'handler': {
    label: '处理器',
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    icon: '🎬'
  },
  'other': {
    label: '其他',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    icon: '📦'
  },
}

/**
 * 研判推荐配置
 */
export const DRILL_DOWN_CONFIG: Record<DrillDownRecommendation, {
  label: string
  color: string
  description: string
}> = {
  [-1]: {
    label: '跳过',
    color: 'text-gray-500',
    description: '不值得分析（工具函数、简单函数）'
  },
  0: {
    label: '待定',
    color: 'text-yellow-500',
    description: '需要更多信息判断'
  },
  1: {
    label: '推荐',
    color: 'text-green-500',
    description: '值得深入分析（核心业务逻辑）'
  },
}