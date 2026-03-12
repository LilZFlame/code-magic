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
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import {
  AIAnalysisResult,
  TechStackTag,
  EntryPoint,
  PROJECT_TYPE_LABELS,
  CATEGORY_CONFIG,
} from '@/lib/types/ai-analysis'
import { LogEntry } from '@/lib/types/log'
import { useLogStore } from '@/stores/log-store'

interface ProjectAnalysisProps {
  owner: string
  repo: string
  onEntryClick?: (path: string) => void
}

export function ProjectAnalysis({ owner, repo, onEntryClick }: ProjectAnalysisProps) {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['language', 'techStack', 'entryPoints'])
  )

  const { addLogs, clearLogs } = useLogStore()

  const fetchAnalysis = async () => {
    if (!owner || !repo) return

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
    <div className="flex flex-col text-sm">
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
        <div className="space-y-1">
          {data.entryPoints.map((entry, index) => (
            <EntryItem
              key={`${entry.path}-${index}`}
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

// 入口文件项
function EntryItem({ entry, onClick }: { entry: EntryPoint; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-2 py-1.5 rounded text-xs',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        'flex flex-col gap-0.5',
        onClick && 'cursor-pointer'
      )}
    >
      <span className="font-mono text-primary-600 dark:text-primary-400 truncate">
        {entry.path}
      </span>
      <span className="text-gray-500 dark:text-gray-400 truncate">
        {entry.description}
      </span>
    </button>
  )
}