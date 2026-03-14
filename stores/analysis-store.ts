/**
 * 分析结果状态管理
 */

import { create } from 'zustand'
import { SubFunctionAnalysisResult, FunctionCallTreeNode } from '@/lib/types/sub-function'
import { RecursiveAnalysisResult } from '@/lib/recursive-analyzer'
import { AIAnalysisResult } from '@/lib/types/ai-analysis'

interface AnalysisState {
  /** 子函数分析结果 */
  subFunctionResult: SubFunctionAnalysisResult | null
  /** 递归分析结果 */
  recursiveResult: RecursiveAnalysisResult | null
  /** 当前选中的节点 */
  selectedNode: FunctionCallTreeNode | null
  /** 项目分析结果缓存（按 owner/repo 缓存） */
  projectAnalysisCache: Record<string, AIAnalysisResult>
  /** 分析状态 */
  isAnalyzing: boolean
  /** 递归分析状态 */
  isRecursiveAnalyzing: boolean

  /** 设置分析结果 */
  setSubFunctionResult: (result: SubFunctionAnalysisResult | null) => void
  /** 设置递归分析结果 */
  setRecursiveResult: (result: RecursiveAnalysisResult | null) => void
  /** 设置选中节点 */
  setSelectedNode: (node: FunctionCallTreeNode | null) => void
  /** 设置分析状态 */
  setIsAnalyzing: (isAnalyzing: boolean) => void
  /** 设置递归分析状态 */
  setIsRecursiveAnalyzing: (isAnalyzing: boolean) => void
  /** 更新调用树中的特定节点 */
  updateNodeChildren: (nodeId: string, children: FunctionCallTreeNode[]) => void
  /** 设置项目分析结果 */
  setProjectAnalysis: (owner: string, repo: string, result: AIAnalysisResult) => void
  /** 获取项目分析结果 */
  getProjectAnalysis: (owner: string, repo: string) => AIAnalysisResult | null
  /** 清空项目分析缓存 */
  clearProjectAnalysisCache: () => void
  /** 清空分析结果 */
  clearAnalysis: () => void
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  subFunctionResult: null,
  recursiveResult: null,
  selectedNode: null,
  isAnalyzing: false,
  isRecursiveAnalyzing: false,
  projectAnalysisCache: {},

  setSubFunctionResult: (result) =>
    set({
      subFunctionResult: result,
      selectedNode: null,
    }),

  setRecursiveResult: (result) =>
    set({
      recursiveResult: result,
      selectedNode: null,
    }),

  setSelectedNode: (node) => set({ selectedNode: node }),

  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),

  setIsRecursiveAnalyzing: (isAnalyzing) => set({ isRecursiveAnalyzing: isAnalyzing }),

  updateNodeChildren: (nodeId, children) =>
    set((state) => {
      if (!state.recursiveResult && !state.subFunctionResult) return state

      // 递归查找并更新节点
      const updateNode = (node: FunctionCallTreeNode): FunctionCallTreeNode => {
        if (node.function.id === nodeId) {
          return {
            ...node,
            children,
            isAnalyzed: true
          }
        }
        return {
          ...node,
          children: node.children.map(updateNode)
        }
      }

      // 更新递归结果或子函数结果
      if (state.recursiveResult) {
        return {
          recursiveResult: {
            ...state.recursiveResult,
            callTree: updateNode(state.recursiveResult.callTree)
          }
        }
      } else if (state.subFunctionResult) {
        return {
          subFunctionResult: {
            ...state.subFunctionResult,
            callTree: updateNode(state.subFunctionResult.callTree)
          }
        }
      }

      return state
    }),

  setProjectAnalysis: (owner, repo, result) =>
    set((state) => ({
      projectAnalysisCache: {
        ...state.projectAnalysisCache,
        [`${owner}/${repo}`]: result
      }
    })),

  getProjectAnalysis: (owner, repo) => {
    const cache = get().projectAnalysisCache
    return cache[`${owner}/${repo}`] || null
  },

  clearProjectAnalysisCache: () => set({ projectAnalysisCache: {} }),

  clearAnalysis: () =>
    set({
      subFunctionResult: null,
      recursiveResult: null,
      selectedNode: null,
      isAnalyzing: false,
      isRecursiveAnalyzing: false,
    }),
}))