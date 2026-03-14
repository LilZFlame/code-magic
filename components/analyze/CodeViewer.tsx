'use client'

import { useEffect, useState } from 'react'
import { codeToHtml } from 'shiki'
import { Copy, Check, FileCode } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Loading } from '@/components/ui/Loading'
import { useThemeStore } from '@/stores/theme-store'
import { useMounted } from '@/hooks/useMounted'

interface CodeViewerProps {
  code: string
  language: string
  filename: string
}

export function CodeViewer({ code, language, filename }: CodeViewerProps) {
  const [html, setHtml] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark')

  const { mode } = useThemeStore()
  const mounted = useMounted()

  // 计算 resolvedTheme
  useEffect(() => {
    if (!mounted) return

    const updateResolvedTheme = () => {
      if (mode === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setResolvedTheme(isDark ? 'dark' : 'light')
      } else {
        setResolvedTheme(mode)
      }
    }

    updateResolvedTheme()

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (mode === 'system') {
        updateResolvedTheme()
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [mode, mounted])

  // 代码高亮
  useEffect(() => {
    const highlight = async () => {
      setIsLoading(true)
      const shikiTheme = resolvedTheme === 'dark' ? 'github-dark' : 'github-light'

      try {
        const highlighted = await codeToHtml(code, {
          lang: language === 'text' ? 'plaintext' : language,
          theme: shikiTheme,
          transformers: [
            {
              // 添加行号
              name: 'line-numbers',
              pre(node) {
                node.properties.class = 'shiki-code'
                node.properties.style = ''
              },
              line(node, line) {
                // 为每行添加行号（包括空行）
                const wrapper = {
                  type: 'element',
                  tagName: 'span',
                  properties: { class: 'line-wrapper' },
                  children: [
                    {
                      type: 'element',
                      tagName: 'span',
                      properties: {
                        class: 'line-number',
                        style: 'display: inline-block; width: 3rem; text-align: right; padding-right: 1rem; margin-right: 0.5rem; color: rgba(100, 116, 139, 0.5); user-select: none; vertical-align: top;'
                      },
                      children: [{ type: 'text', value: String(line) }]
                    },
                    node
                  ]
                }
                return wrapper as any
              }
            }
          ],
        })
        setHtml(highlighted)
      } catch {
        // 如果语言不支持，使用纯文本
        const highlighted = await codeToHtml(code, {
          lang: 'plaintext',
          theme: shikiTheme,
        })
        setHtml(highlighted)
      } finally {
        setIsLoading(false)
      }
    }

    highlight()
  }, [code, language, resolvedTheme])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="h-full p-4 flex items-center justify-center">
        <Loading text="处理代码..." />
      </div>
    )
  }

  return (
    <div className="h-full p-4">
      {/* 卡片容器 */}
      <div className={cn(
        'h-full flex flex-col rounded-xl overflow-hidden',
        'border transition-all duration-300',
        resolvedTheme === 'dark'
          ? 'border-gray-700/50 shadow-2xl shadow-black/30'
          : 'border-gray-200 shadow-lg shadow-gray-200/50'
      )}>
        {/* 工具栏 - 卡片头部 */}
        <div className={cn(
          'flex items-center justify-between px-4 py-2.5',
          'neon-border',
          resolvedTheme === 'dark'
            ? 'bg-gray-800/80'
            : 'bg-gray-50'
        )}>
          <div className={cn(
            'flex items-center gap-2 text-sm',
            resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          )}>
            <FileCode className="w-4 h-4" />
            <span className="font-medium">{filename}</span>
            <span className={resolvedTheme === 'dark' ? 'text-gray-600' : 'text-gray-300'}>•</span>
            <span className={cn(
              'px-1.5 py-0.5 rounded text-xs',
              resolvedTheme === 'dark'
                ? 'bg-gray-700 text-cyan-400'
                : 'bg-gray-200 text-blue-600'
            )}>
              {language}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium',
              'transition-all duration-200 neon-btn',
              resolvedTheme === 'dark'
                ? 'text-gray-400 hover:text-cyan-400 hover:bg-gray-700/50'
                : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
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

        {/* 代码内容 - 卡片主体 */}
        <div className={cn(
          'flex-1 overflow-auto',
          resolvedTheme === 'dark'
            ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800'
            : 'bg-white'
        )}>
          <div
            className="min-w-fit shiki-container"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  )
}