'use client'

import Link from 'next/link'
import { GitBranch, ArrowLeft, PanelLeft, Code2, Network } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { usePanelStore } from '@/stores/panel-store'
import { cn } from '@/lib/utils/cn'

interface HeaderProps {
  owner?: string
  repo?: string
}

export function Header({ owner, repo }: HeaderProps) {
  const {
    fileTreeVisible, codePanelVisible, panoramaVisible,
    toggleFileTree, toggleCodePanel, togglePanorama,
  } = usePanelStore()

  return (
    <header className="h-14 px-4 flex items-center justify-between glass sticky top-0 z-50">
      <div className="flex items-center gap-4">
        {owner && repo && (
          <>
            <Link
              href="/"
              className="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">返回首页</span>
            </Link>

            <div className="h-5 w-px bg-[var(--color-border)]" />
          </>
        )}

        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md">
            <GitBranch className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-[var(--color-text-primary)]">
            CodeMagic
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {owner && repo && (
          <>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[var(--color-text-muted)]">当前仓库：</span>
              <a
                href={`https://github.com/${owner}/${repo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
              >
                {owner}/{repo}
              </a>
            </div>

            {/* 面板开关按钮组 */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <button
                onClick={toggleFileTree}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  fileTreeVisible
                    ? "text-primary-500 bg-primary-500/10"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]"
                )}
                title={fileTreeVisible ? "隐藏文件树" : "显示文件树"}
              >
                <PanelLeft className="w-4 h-4" />
              </button>
              <button
                onClick={toggleCodePanel}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  codePanelVisible
                    ? "text-primary-500 bg-primary-500/10"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]"
                )}
                title={codePanelVisible ? "隐藏代码面板" : "显示代码面板"}
              >
                <Code2 className="w-4 h-4" />
              </button>
              <button
                onClick={togglePanorama}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  panoramaVisible
                    ? "text-primary-500 bg-primary-500/10"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]"
                )}
                title={panoramaVisible ? "隐藏全景图" : "显示全景图"}
              >
                <Network className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        <ThemeToggle />
      </div>
    </header>
  )
}