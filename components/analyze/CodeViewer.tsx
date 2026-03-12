'use client'

import { useEffect, useState, useMemo } from 'react'
import { codeToHtml } from 'shiki'
import { Copy, Check, FileCode } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Loading } from '@/components/ui/Loading'

interface CodeViewerProps {
  code: string
  language: string
  filename: string
}

export function CodeViewer({ code, language, filename }: CodeViewerProps) {
  const [html, setHtml] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const highlight = async () => {
      setIsLoading(true)
      try {
        const highlighted = await codeToHtml(code, {
          lang: language === 'text' ? 'plaintext' : language,
          theme: 'github-dark',
        })
        setHtml(highlighted)
      } catch {
        // 如果语言不支持，使用纯文本
        const highlighted = await codeToHtml(code, {
          lang: 'plaintext',
          theme: 'github-dark',
        })
        setHtml(highlighted)
      } finally {
        setIsLoading(false)
      }
    }

    highlight()
  }, [code, language])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loading text="处理代码..." />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <FileCode className="w-4 h-4" />
          <span>{filename}</span>
          <span className="text-gray-600">•</span>
          <span>{language}</span>
        </div>
        <button
          onClick={handleCopy}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded text-sm',
            'text-gray-400 hover:text-gray-200 hover:bg-gray-700',
            'transition-colors'
          )}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-green-400">已复制</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>复制</span>
            </>
          )}
        </button>
      </div>

      {/* 代码内容 */}
      <div className="flex-1 overflow-auto">
        <div
          className="min-w-fit"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  )
}