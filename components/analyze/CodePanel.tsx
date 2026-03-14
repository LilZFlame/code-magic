'use client'

import { useState, useEffect } from 'react'
import { FileCode, FileSearch } from 'lucide-react'
import { CodeViewer } from './CodeViewer'
import { Loading } from '@/components/ui/Loading'
import { useThemeStore } from '@/stores/theme-store'
import { useMounted } from '@/hooks/useMounted'
import { resolvePathAlias } from '@/lib/utils/path'

interface CodePanelProps {
  owner: string
  repo: string
  filePath: string | null
}

export function CodePanel({ owner, repo, filePath }: CodePanelProps) {
  const [content, setContent] = useState<string>('')
  const [language, setLanguage] = useState<string>('text')
  const [filename, setFilename] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { mode } = useThemeStore()
  const mounted = useMounted()

  const isDark = mounted && (
    mode === 'dark' ||
    (mode === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  )

  useEffect(() => {
    const fetchContent = async () => {
      if (!filePath) {
        setContent('')
        setFilename('')
        setLanguage('text')
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        // 解析路径别名（如 @/、~/、#/ 等）
        const resolvedPath = resolvePathAlias(filePath)

        const response = await fetch(
          `/api/file-content?owner=${owner}&repo=${repo}&path=${encodeURIComponent(resolvedPath)}`
        )
        const data = await response.json()

        if (data.error) {
          setError(data.error)
        } else {
          setContent(data.content)
          setFilename(data.name)
          setLanguage(data.language)
        }
      } catch (err) {
        setError('获取文件内容失败')
      } finally {
        setIsLoading(false)
      }
    }

    fetchContent()
  }, [owner, repo, filePath])

  // 空状态
  if (!filePath) {
    return (
      <div className={cn(
        'h-full flex flex-col items-center justify-center p-6',
        isDark ? 'text-slate-400' : 'text-slate-500'
      )}>
        <FileSearch className={cn(
          'w-12 h-12 mb-3',
          isDark ? 'text-slate-600' : 'text-slate-300'
        )} />
        <p className="text-sm font-medium">选择文件查看代码</p>
        <p className="text-xs mt-1 opacity-70">从左侧文件树中选择一个文件</p>
      </div>
    )
  }

  // 加载中
  if (isLoading) {
    return (
      <div className="h-full p-4 flex items-center justify-center">
        <Loading text="加载文件内容..." />
      </div>
    )
  }

  // 错误状态
  if (error) {
    return (
      <div className="h-full p-4 flex flex-col items-center justify-center">
        <div className={cn(
          'p-8 rounded-xl border text-center max-w-md',
          isDark ? 'border-red-500/30 bg-red-500/10' : 'border-red-200 bg-red-50'
        )}>
          <FileCode className="w-16 h-16 mb-4 opacity-50 mx-auto text-red-500" />
          <p className="text-lg text-red-500 mb-2">文件加载失败</p>
          <p className="text-sm text-red-400 mb-3">{filePath}</p>
          <p className="text-xs opacity-70">
            {error}。如果是点击全景图节点跳转，可能是 AI 推断的文件路径不准确。
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full">
      <CodeViewer code={content} language={language} filename={filename} />
    </div>
  )
}

// 辅助函数
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}