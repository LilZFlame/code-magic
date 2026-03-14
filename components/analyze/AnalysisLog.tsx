'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Terminal, Copy, Check, Trash2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { LogEntry, LOG_TYPE_CONFIG, LOG_CATEGORY_CONFIG } from '@/lib/types/log'
import { formatJsonForDisplay } from '@/lib/utils/log-utils'

interface AnalysisLogProps {
  entries: LogEntry[]
  isExpanded: boolean
  expandedJsonId: string | null
  onTogglePanel: () => void
  onToggleJson: (id: string | null) => void
  onClear: () => void
}

export function AnalysisLog({
  entries,
  isExpanded,
  expandedJsonId,
  onTogglePanel,
  onToggleJson,
  onClear,
}: AnalysisLogProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const successCount = entries.filter((e) => e.type === 'success').length
  const errorCount = entries.filter((e) => e.type === 'error').length

  return (
    <div className="border-b border-[var(--color-border)]">
      {/* 标题栏 */}
      <button
        onClick={onTogglePanel}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-[var(--color-bg-tertiary)] transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 text-[var(--color-text-muted)]" />
          ) : (
            <ChevronRight className="w-3 h-3 text-[var(--color-text-muted)]" />
          )}
          <Terminal className="w-4 h-4 text-[var(--color-text-secondary)]" />
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">工作日志</span>
          {entries.length > 0 && (
            <span className="text-xs text-[var(--color-text-muted)]">({entries.length})</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {successCount > 0 && (
            <span className="text-xs text-green-500">✓{successCount}</span>
          )}
          {errorCount > 0 && (
            <span className="text-xs text-red-500">✗{errorCount}</span>
          )}
        </div>
      </button>

      {/* 日志内容 */}
      {isExpanded && (
        <div className="px-3 pb-2">
          {entries.length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)] text-center py-2">暂无日志</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {entries.map((entry) => (
                <LogItem
                  key={entry.id}
                  entry={entry}
                  isJsonExpanded={expandedJsonId === entry.id}
                  onToggleJson={() => onToggleJson(entry.id)}
                  copiedId={copiedId}
                  onCopy={handleCopy}
                />
              ))}
            </div>
          )}

          {/* 清空按钮 */}
          {entries.length > 0 && (
            <button
              onClick={onClear}
              className="mt-2 w-full text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] flex items-center justify-center gap-1 py-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              清空日志
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// 单条日志项 - 卡片样式
function LogItem({
  entry,
  isJsonExpanded,
  onToggleJson,
  copiedId,
  onCopy,
}: {
  entry: LogEntry
  isJsonExpanded: boolean
  onToggleJson: () => void
  copiedId: string | null
  onCopy: (text: string, id: string) => void
}) {
  const typeConfig = LOG_TYPE_CONFIG[entry.type]
  const categoryConfig = LOG_CATEGORY_CONFIG[entry.category]
  const isAI = entry.category === 'ai' && entry.aiDetails

  // 格式化时间
  const time = new Date(entry.timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <div className={cn(
      'rounded-lg border p-2 text-xs transition-colors',
      'border-[var(--color-border)] bg-[var(--color-bg-secondary)]',
      isAI && 'border-cyan-500/30 bg-gradient-to-r from-cyan-500/5 to-transparent'
    )}>
      {/* 日志标题行 */}
      <div className="flex items-start gap-1.5">
        {isAI && <Sparkles className="w-3 h-3 text-cyan-400 flex-shrink-0" />}
        <span className={cn('flex-shrink-0', typeConfig.color)}>
          {typeConfig.icon}
        </span>
        <div className="flex-1 min-w-0">
          <span className="text-[var(--color-text-muted)]">[{time}]</span>
          <span className="text-[var(--color-text-secondary)] ml-1">[{categoryConfig.label}]</span>
          <span className="text-[var(--color-text-primary)] ml-1">{entry.message}</span>
        </div>
      </div>

      {/* AI详情 - 提示词和响应 */}
      {entry.aiDetails && (
        <div className="mt-2 space-y-2">
          {/* 提示词 */}
          <div className="rounded bg-[var(--color-bg-tertiary)] p-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-cyan-400 font-medium">提示词</span>
              {entry.aiDetails.model && (
                <span className="text-[10px] text-[var(--color-text-muted)]">{entry.aiDetails.model}</span>
              )}
            </div>
            <pre className="text-[10px] text-[var(--color-text-secondary)] whitespace-pre-wrap break-all max-h-24 overflow-auto">
              {entry.aiDetails.prompt}
            </pre>
          </div>

          {/* 响应 */}
          <div className="rounded bg-[var(--color-bg-tertiary)] p-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-green-400 font-medium">响应</span>
              {entry.aiDetails.tokens && (
                <span className="text-[10px] text-[var(--color-text-muted)]">
                  {entry.aiDetails.tokens.total || entry.aiDetails.tokens.input || 0} tokens
                </span>
              )}
            </div>
            <pre className="text-[10px] text-[var(--color-text-secondary)] whitespace-pre-wrap break-all max-h-32 overflow-auto">
              {entry.aiDetails.response}
            </pre>
          </div>
        </div>
      )}

      {/* 可展开的JSON详情 */}
      {entry.details && !entry.aiDetails && (
        <div className="ml-4 mt-1">
          <button
            onClick={onToggleJson}
            className="text-primary-500 hover:text-primary-600 text-xs flex items-center gap-1"
          >
            {isJsonExpanded ? '收起' : '展开'}详情
            {isJsonExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>

          {isJsonExpanded && (
            <div className="mt-1 relative">
              <div className="bg-gray-900 rounded p-2 text-gray-100 font-mono text-[10px] overflow-auto max-h-48">
                <pre className="whitespace-pre-wrap break-all">
                  {formatJsonForDisplay(entry.details)}
                </pre>
              </div>
              <button
                onClick={() => onCopy(JSON.stringify(entry.details, null, 2), entry.id)}
                className="absolute top-1 right-1 p-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
              >
                {copiedId === entry.id ? (
                  <Check className="w-3 h-3 text-green-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}