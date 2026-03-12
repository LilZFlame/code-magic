// 日志状态管理

import { create } from 'zustand'
import { LogEntry } from '@/lib/types/log'

interface LogState {
  // 日志条目列表
  entries: LogEntry[]
  // 面板是否展开
  isPanelExpanded: boolean
  // 当前展开查看JSON的日志ID
  expandedJsonId: string | null

  // 添加日志
  addLog: (entry: LogEntry) => void
  // 批量添加日志
  addLogs: (entries: LogEntry[]) => void
  // 清空日志
  clearLogs: () => void
  // 切换面板展开状态
  togglePanel: () => void
  // 切换JSON展开状态
  toggleJson: (id: string | null) => void
  // 设置展开状态
  setPanelExpanded: (expanded: boolean) => void
}

export const useLogStore = create<LogState>((set) => ({
  entries: [],
  isPanelExpanded: true,
  expandedJsonId: null,

  addLog: (entry) =>
    set((state) => ({
      entries: [...state.entries, entry],
    })),

  addLogs: (entries) =>
    set((state) => ({
      entries: [...state.entries, ...entries],
    })),

  clearLogs: () =>
    set({
      entries: [],
      expandedJsonId: null,
    }),

  togglePanel: () =>
    set((state) => ({
      isPanelExpanded: !state.isPanelExpanded,
    })),

  toggleJson: (id) =>
    set((state) => ({
      expandedJsonId: state.expandedJsonId === id ? null : id,
    })),

  setPanelExpanded: (expanded) =>
    set({
      isPanelExpanded: expanded,
    }),
}))