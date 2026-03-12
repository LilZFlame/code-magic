'use client'

import Link from 'next/link'
import { GitBranch, ArrowLeft } from 'lucide-react'

interface HeaderProps {
  owner?: string
  repo?: string
}

export function Header({ owner, repo }: HeaderProps) {
  return (
    <header className="h-14 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">返回首页</span>
        </Link>

        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />

        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <GitBranch className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-gray-900 dark:text-white">
            CodeMagic
          </span>
        </Link>
      </div>

      {owner && repo && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">当前仓库：</span>
          <a
            href={`https://github.com/${owner}/${repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
          >
            {owner}/{repo}
          </a>
        </div>
      )}
    </header>
  )
}