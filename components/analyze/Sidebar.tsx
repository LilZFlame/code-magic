'use client'

import { useState } from 'react'
import { Search, Loader2, History } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { parseGitHubUrl } from '@/lib/github/parser'
import { ProjectAnalysis } from './ProjectAnalysis'
import { AnalysisLog } from './AnalysisLog'
import { useLogStore } from '@/stores/log-store'
import { AnalyzedEntryPoint } from '@/lib/types/ai-analysis'

interface SidebarProps {
  owner: string
  repo: string
  onRepoChange: (owner: string, repo: string) => void
  onEntryClick?: (path: string) => void
  onAnalyzeSubFunctions?: (entryPoint: AnalyzedEntryPoint, primaryLanguage: string, projectType: string) => void
}

export function Sidebar({ owner, repo, onRepoChange, onEntryClick, onAnalyzeSubFunctions }: SidebarProps) {
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { entries, isPanelExpanded, expandedJsonId, togglePanel, toggleJson, clearLogs } = useLogStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!inputValue.trim()) {
      setError('请输入地址')
      return
    }

    const parsed = parseGitHubUrl(inputValue.trim())
    if (!parsed) {
      setError('格式无效')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/validate-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inputValue.trim() }),
      })

      const data = await response.json()

      if (!data.valid) {
        setError(data.error || '仓库不存在')
        setIsLoading(false)
        return
      }

      onRepoChange(data.owner, data.repo)
    } catch {
      setError('网络错误')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* 面板标题栏 */}
      <div className="panel-header">
        <History className="panel-header-icon" />
        <h2 className="panel-header-title">分析日志</h2>
      </div>

      {/* 输入区域 */}
      <div className="flex-shrink-0 p-3 border-b border-[var(--color-border)]">
        <form onSubmit={handleSubmit} className="space-y-2">
          <Input
            type="text"
            placeholder="切换仓库..."
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              setError(null)
            }}
            error={error || undefined}
            disabled={isLoading}
            className="text-sm py-2"
          />
          <Button
            type="submit"
            size="sm"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Search className="w-4 h-4" />
                分析
              </>
            )}
          </Button>
        </form>
      </div>

      {/* 当前仓库信息 */}
      <div className="flex-shrink-0 p-3 border-b border-[var(--color-border)]">
        <p className="text-xs text-[var(--color-text-muted)]">当前仓库</p>
        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
          {owner}/{repo}
        </p>
      </div>

      {/* 工作日志面板 */}
      <div className="flex-shrink-0">
        <AnalysisLog
          entries={entries}
          isExpanded={isPanelExpanded}
          expandedJsonId={expandedJsonId}
          onTogglePanel={togglePanel}
          onToggleJson={toggleJson}
          onClear={clearLogs}
        />
      </div>

      {/* AI项目分析面板 */}
      <div className="flex-1 overflow-auto">
        <ProjectAnalysis
          owner={owner}
          repo={repo}
          onEntryClick={onEntryClick}
          onAnalyzeSubFunctions={onAnalyzeSubFunctions}
        />
      </div>
    </div>
  )
}