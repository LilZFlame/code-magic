'use client'

import { useState, useEffect } from 'react'
import {
  Code,
  Layers,
  FileCode,
  ChevronDown,
  ChevronRight,
  Tag,
  Loader2,
  RefreshCw,
  AlertCircle,
  GitBranch,
  Network,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import {
  AIAnalysisResult,
  TechStackTag,
  EntryPoint,
  AnalyzedEntryPoint,
  PROJECT_TYPE_LABELS,
  CATEGORY_CONFIG,
} from '@/lib/types/ai-analysis'
import { LogEntry } from '@/lib/types/log'
import { useLogStore } from '@/stores/log-store'
import { useAnalysisStore } from '@/stores/analysis-store'

interface ProjectAnalysisProps {
  owner: string
  repo: string
  onEntryClick?: (path: string) => void
  onAnalyzeSubFunctions?: (entryPoint: AnalyzedEntryPoint, primaryLanguage: string, projectType: string) => void
}

export function ProjectAnalysis({ owner, repo, onEntryClick, onAnalyzeSubFunctions }: ProjectAnalysisProps) {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['language', 'techStack', 'entryPoints'])
  )

  const { addLogs, clearLogs } = useLogStore()
  const { isAnalyzing, getProjectAnalysis, setProjectAnalysis } = useAnalysisStore()

  const fetchAnalysis = async () => {
    if (!owner || !repo) return

    // 先检查缓存
    const cached = getProjectAnalysis(owner, repo)
    if (cached) {
      setAnalysis(cached)
      return
    }

    // 缓存不存在，发送 API 请求
    setIsLoading(true)
    setError(null)
    clearLogs()

    try {
      const response = await fetch('/api/analyze-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo }),
      })

      const data = await response.json()

      // 提取日志并添加到store
      if (data.logs && Array.isArray(data.logs)) {
        addLogs(data.logs as LogEntry[])
      }

      setAnalysis(data)

      // 缓存分析结果
      if (data.status === 'success') {
        setProjectAnalysis(owner, repo, data)
      }
    } catch (err) {
      setError('分析失败')
      setAnalysis(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalysis()
  }, [owner, repo])

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  // 加载状态
  if (isLoading) {
    return (
      <div className="p-4 flex flex-col items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary-500 animate-spin mb-2" />
        <p className="text-sm text-gray-500">分析项目中...</p>
      </div>
    )
  }

  // 错误状态
  if (error || (analysis && analysis.status === 'error')) {
    return (
      <div className="p-3">
        <div className="flex items-center gap-2 text-red-500 mb-2">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error || analysis?.error || '分析失败'}</span>
        </div>
        <button
          onClick={fetchAnalysis}
          className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
        >
          <RefreshCw className="w-3 h-3" />
          重试
        </button>
      </div>
    )
  }

  // 无数据
  if (!analysis || !analysis.data) {
    return null
  }

  const { data } = analysis

  return (
    <div className="flex flex-col text-sm h-full overflow-auto">
      {/* 项目类型 */}
      <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 mx-2 rounded-lg mb-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary-500" />
          <span className="font-medium text-gray-800 dark:text-gray-200">
            {PROJECT_TYPE_LABELS[data.projectType as keyof typeof PROJECT_TYPE_LABELS] || data.projectType}
          </span>
        </div>
      </div>

      {/* 主要语言 */}
      <Section
        title="主要语言"
        icon={<Code className="w-4 h-4 text-blue-500" />}
        expanded={expandedSections.has('language')}
        onToggle={() => toggleSection('language')}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-800 dark:text-gray-200">
              {data.primaryLanguage}
            </span>
            <span className="text-xs text-gray-500">
              ({data.languageDistribution[data.primaryLanguage] || 0} 文件)
            </span>
          </div>
          {/* 语言分布条 */}
          <LanguageBar distribution={data.languageDistribution} />
        </div>
      </Section>

      {/* 技术栈 */}
      <Section
        title="技术栈"
        icon={<Tag className="w-4 h-4 text-green-500" />}
        expanded={expandedSections.has('techStack')}
        onToggle={() => toggleSection('techStack')}
      >
        <div className="flex flex-wrap gap-1">
          {data.techStack.slice(0, 12).map((tag, index) => (
            <TechTag key={`${tag.name}-${index}`} tag={tag} />
          ))}
        </div>
      </Section>

      {/* 入口文件 */}
      <Section
        title="入口文件"
        icon={<FileCode className="w-4 h-4 text-purple-500" />}
        expanded={expandedSections.has('entryPoints')}
        onToggle={() => toggleSection('entryPoints')}
      >
        <div className="space-y-2">
          {/* 确认的入口（高亮显示） */}
          {data.confirmedEntryPoint && (
            <div className="p-2 rounded-lg border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20">
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mb-1">
                <span className="font-medium">✓ 已确认入口</span>
              </div>
              <EntryItem
                entry={data.confirmedEntryPoint}
                onClick={() => onEntryClick?.(data.confirmedEntryPoint!.path)}
                isConfirmed
              />
              {data.confirmedEntryPoint.analysisData?.startupHint && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 pl-1">
                  💡 {data.confirmedEntryPoint.analysisData.startupHint}
                </p>
              )}
              {/* 分析子函数按钮 */}
              {onAnalyzeSubFunctions && (
                <button
                  onClick={() => onAnalyzeSubFunctions(
                    data.confirmedEntryPoint!,
                    data.primaryLanguage,
                    data.projectType
                  )}
                  disabled={isAnalyzing}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md
                    text-xs font-medium text-white bg-primary-500 hover:bg-primary-600
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors duration-200"
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <GitBranch className="w-3 h-3" />
                  )}
                  {isAnalyzing ? '分析中...' : '分析子函数'}
                </button>
              )}
            </div>
          )}

          {/* 其他候选入口 */}
          {data.analyzedEntryPoints
            ?.filter((e) => e.path !== data.confirmedEntryPoint?.path)
            .map((entry, index) => (
              <EntryItem
                key={`analyzed-${entry.path}-${index}`}
                entry={entry}
                onClick={() => onEntryClick?.(entry.path)}
                confidence={entry.analysisData?.confidence}
              />
            ))}

          {/* 兼容旧数据：没有研判结果时显示原始列表 */}
          {!data.confirmedEntryPoint &&
            !data.analyzedEntryPoints &&
            data.entryPoints.map((entry, index) => (
              <EntryItem
                key={`entry-${entry.path}-${index}`}
                entry={entry}
                onClick={() => onEntryClick?.(entry.path)}
              />
            ))}
        </div>
      </Section>
    </div>
  )
}

// 可折叠区域组件
function Section({
  title,
  icon,
  expanded,
  onToggle,
  children,
}: {
  title: string
  icon: React.ReactNode
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50"
      >
        {expanded ? (
          <ChevronDown className="w-3 h-3 text-gray-400" />
        ) : (
          <ChevronRight className="w-3 h-3 text-gray-400" />
        )}
        {icon}
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {title}
        </span>
      </button>
      {expanded && <div className="px-3 pb-2">{children}</div>}
    </div>
  )
}

// 语言分布条
function LanguageBar({ distribution }: { distribution: Record<string, number> }) {
  const sorted = Object.entries(distribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const total = sorted.reduce((sum, [, count]) => sum + count, 0)
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
  ]

  if (total === 0) return null

  return (
    <div>
      <div className="flex h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
        {sorted.map(([lang, count], index) => (
          <div
            key={lang}
            className={cn(colors[index % colors.length])}
            style={{ width: `${(count / total) * 100}%` }}
            title={`${lang}: ${count} 文件`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mt-1">
        {sorted.map(([lang, count], index) => (
          <span key={lang} className="text-xs text-gray-500">
            <span className={cn('inline-block w-2 h-2 rounded-full mr-1', colors[index % colors.length])} />
            {lang}
          </span>
        ))}
      </div>
    </div>
  )
}

// 技术标签
function TechTag({ tag }: { tag: TechStackTag }) {
  const config = CATEGORY_CONFIG[tag.category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.other

  return (
    <span
      className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs', config.color)}
      title={`置信度: ${Math.round(tag.confidence * 100)}%`}
    >
      {tag.name}
      {tag.confidence < 0.7 && <span className="text-[10px] opacity-60">?</span>}
    </span>
  )
}

// 入口文件项 - 卡片样式
function EntryItem({
  entry,
  onClick,
  isConfirmed,
  confidence,
}: {
  entry: EntryPoint
  onClick?: () => void
  isConfirmed?: boolean
  confidence?: number
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-2 rounded-lg text-xs',
        isConfirmed
          ? 'border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
          : 'border border-[var(--color-border)] bg-[var(--color-bg-secondary)]',
        'hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600',
        'transition-all duration-200',
        'flex flex-col gap-1',
        onClick && 'cursor-pointer'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-primary-600 dark:text-primary-400 truncate">
          {entry.path}
        </span>
        {confidence !== undefined && !isConfirmed && (
          <span className="text-[10px] text-gray-400 ml-1">{Math.round(confidence * 100)}%</span>
        )}
      </div>
      <span className="text-[var(--color-text-muted)] truncate text-[11px]">
        {entry.description}
      </span>
    </button>
  )
}