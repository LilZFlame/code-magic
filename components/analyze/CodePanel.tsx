'use client'

import { useState, useEffect } from 'react'
import { FileCode, Loader2, FileSearch } from 'lucide-react'
import { CodeViewer } from './CodeViewer'
import { Loading } from '@/components/ui/Loading'

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
        const response = await fetch(
          `/api/file-content?owner=${owner}&repo=${repo}&path=${encodeURIComponent(filePath)}`
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
      <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
        <FileSearch className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg">选择文件查看代码</p>
        <p className="text-sm mt-1">从左侧文件树中选择一个文件</p>
      </div>
    )
  }

  // 加载中
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loading text="加载文件内容..." />
      </div>
    )
  }

  // 错误状态
  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-red-500">
        <FileCode className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg">{error}</p>
      </div>
    )
  }

  return (
    <div className="h-full bg-gray-900">
      <CodeViewer code={content} language={language} filename={filename} />
    </div>
  )
}