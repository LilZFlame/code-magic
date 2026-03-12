'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/analyze/Sidebar'
import { FileTree } from '@/components/analyze/FileTree'
import { CodePanel } from '@/components/analyze/CodePanel'

export default function AnalyzePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [owner, setOwner] = useState<string>('')
  const [repo, setRepo] = useState<string>('')
  const [selectedPath, setSelectedPath] = useState<string | null>(null)

  // 从 URL 参数获取仓库信息
  useEffect(() => {
    const ownerParam = searchParams.get('owner')
    const repoParam = searchParams.get('repo')

    if (ownerParam && repoParam) {
      setOwner(ownerParam)
      setRepo(repoParam)
    } else {
      // 如果没有参数，跳转到首页
      router.push('/')
    }
  }, [searchParams, router])

  // 处理仓库切换
  const handleRepoChange = (newOwner: string, newRepo: string) => {
    setOwner(newOwner)
    setRepo(newRepo)
    setSelectedPath(null)
    router.push(`/analyze?owner=${newOwner}&repo=${newRepo}`)
  }

  // 处理文件选择
  const handleFileSelect = (path: string) => {
    setSelectedPath(path)
  }

  // 处理入口文件点击（从AI分析面板）
  const handleEntryClick = (path: string) => {
    setSelectedPath(path)
  }

  if (!owner || !repo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Header owner={owner} repo={repo} />

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧边栏 */}
        <Sidebar
          owner={owner}
          repo={repo}
          onRepoChange={handleRepoChange}
          onEntryClick={handleEntryClick}
        />

        {/* 中间文件树 */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col">
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              文件结构
            </h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <FileTree
              owner={owner}
              repo={repo}
              selectedPath={selectedPath}
              onFileSelect={handleFileSelect}
            />
          </div>
        </div>

        {/* 右侧代码面板 */}
        <div className="flex-1 overflow-hidden">
          <CodePanel
            owner={owner}
            repo={repo}
            filePath={selectedPath}
          />
        </div>
      </div>
    </div>
  )
}