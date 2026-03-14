'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { SplitPane, Pane } from 'react-split-pane'
import 'react-split-pane/styles.css'
import { FolderTree, Code2, Network } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/analyze/Sidebar'
import { FileTree } from '@/components/analyze/FileTree'
import { CodePanel } from '@/components/analyze/CodePanel'
import { PanoramaPanel } from '@/components/analyze/PanoramaPanel'
import { useAnalysisStore } from '@/stores/analysis-store'
import { useLogStore } from '@/stores/log-store'
import { usePanelStore } from '@/stores/panel-store'
import { LogEntry } from '@/lib/types/log'
import { AnalyzedEntryPoint } from '@/lib/types/ai-analysis'

function AnalyzeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [owner, setOwner] = useState<string>('')
  const [repo, setRepo] = useState<string>('')
  const [selectedPath, setSelectedPath] = useState<string | null>(null)

  const { subFunctionResult, recursiveResult, setSubFunctionResult, setRecursiveResult, setIsAnalyzing, setIsRecursiveAnalyzing, updateNodeChildren } = useAnalysisStore()
  const { addLogs } = useLogStore()
  const {
    fileTreeVisible, codePanelVisible, panoramaVisible,
  } = usePanelStore()

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
    setSubFunctionResult(null)
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

  // 处理子函数分析
  const handleAnalyzeSubFunctions = async (entryPoint: AnalyzedEntryPoint, primaryLanguage: string, projectType: string) => {
    if (!owner || !repo) return

    setIsAnalyzing(true)

    try {
      const response = await fetch('/api/analyze-subfunctions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner,
          repo,
          entryPoint,
          primaryLanguage,
          projectType,
        }),
      })

      const data = await response.json()

      if (data.logs && Array.isArray(data.logs)) {
        addLogs(data.logs as LogEntry[])
      }

      if (data.status === 'success' && data.data) {
        setSubFunctionResult(data.data)
      }
    } catch (error) {
      console.error('子函数分析失败:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // 处理递归分析
  const handleRecursiveAnalyze = async (entryPoint: AnalyzedEntryPoint, primaryLanguage: string, projectType: string) => {
    if (!owner || !repo) return

    setIsRecursiveAnalyzing(true)

    try {
      const response = await fetch('/api/analyze-recursive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner,
          repo,
          entryPoint,
          primaryLanguage,
          projectType,
          config: {
            maxDepth: 3,
            enableParallel: true,
            maxFunctionsPerLevel: 10,
            enableCache: true,
          },
        }),
      })

      const data = await response.json()

      if (data.logs && Array.isArray(data.logs)) {
        addLogs(data.logs as LogEntry[])
      }

      if (data.status === 'success' && data.data) {
        setRecursiveResult(data.data)
      }
    } catch (error) {
      console.error('递归分析失败:', error)
    } finally {
      setIsRecursiveAnalyzing(false)
    }
  }

  // 处理节点继续分析
  const handleContinueAnalyze = async (node: any) => {
    if (!owner || !repo) return

    setIsRecursiveAnalyzing(true)

    try {
      const response = await fetch('/api/analyze-node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner,
          repo,
          targetNode: node,
          primaryLanguage: 'typescript',
          projectType: 'other',
        }),
      })

      const data = await response.json()

      if (data.logs && Array.isArray(data.logs)) {
        addLogs(data.logs as LogEntry[])
      }

      if (data.status === 'success' && data.data) {
        // 更新调用树：将分析结果合并到现有树中
        updateNodeChildren(data.data.nodeId, data.data.children)
      }
    } catch (error) {
      console.error('节点分析失败:', error)
    } finally {
      setIsRecursiveAnalyzing(false)
    }
  }

  // 可切换面板列表（不包含 Sidebar）- 必须在早期返回之前调用
  const toggleablePanels = useMemo(() => {
    if (!owner || !repo) return []

    const panels: { id: string; content: React.ReactNode }[] = []

    if (fileTreeVisible) {
      panels.push({
        id: 'fileTree',
        content: (
          <div className="h-full flex flex-col">
            <div className="panel-header">
              <FolderTree className="panel-header-icon" />
              <h2 className="panel-header-title">文件结构</h2>
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
        ),
      })
    }

    if (codePanelVisible) {
      panels.push({
        id: 'codePanel',
        content: (
          <div className="h-full flex flex-col">
            <div className="panel-header">
              <Code2 className="panel-header-icon" />
              <h2 className="panel-header-title">源代码</h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <CodePanel
                owner={owner}
                repo={repo}
                filePath={selectedPath}
              />
            </div>
          </div>
        ),
      })
    }

    if (panoramaVisible) {
      panels.push({
        id: 'panorama',
        content: (
          <div className="h-full flex flex-col">
            <div className="panel-header">
              <Network className="panel-header-icon" />
              <h2 className="panel-header-title">函数调用全景图</h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <PanoramaPanel
                callTree={recursiveResult?.callTree || subFunctionResult?.callTree || null}
                onNodeClick={(node) => {
                  const filePath = node.function.filePath
                  if (filePath) {
                    setSelectedPath(filePath)
                  } else {
                    console.warn(`函数 ${node.function.name} 的文件路径未知`)
                  }
                }}
                onContinueAnalyze={handleContinueAnalyze}
              />
            </div>
          </div>
        ),
      })
    }

    return panels
  }, [fileTreeVisible, codePanelVisible, panoramaVisible, owner, repo, selectedPath, subFunctionResult?.callTree, recursiveResult?.callTree])

  if (!owner || !repo) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
          <p className="text-[var(--color-text-muted)]">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--color-bg-primary)]">
      <Header owner={owner} repo={repo} />

      <div className="flex-1 overflow-hidden min-h-0 p-3">
        <SplitPane direction="horizontal" key={`${owner}-${repo}-${toggleablePanels.map(p => p.id).join('-')}`}>
          {/* Sidebar - 始终可见 */}
          <Pane defaultSize={240} minSize={180} maxSize={400} className="h-full">
            <div className="h-full p-[2.5px]">
              <div className="panel-card h-full">
                <Sidebar
                  owner={owner}
                  repo={repo}
                  onRepoChange={handleRepoChange}
                  onEntryClick={handleEntryClick}
                  onAnalyzeSubFunctions={handleAnalyzeSubFunctions}
                />
              </div>
            </div>
          </Pane>

          {/* 可切换面板 - 动态渲染，自动平分剩余空间 */}
          {toggleablePanels.map((panel) => (
            <Pane
              key={panel.id}
              minSize={200}
              className="h-full"
            >
              <div className="h-full p-[2.5px]">
                <div className="panel-card h-full">
                  {panel.content}
                </div>
              </div>
            </Pane>
          ))}
        </SplitPane>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
        <p className="text-[var(--color-text-muted)]">加载中...</p>
      </div>
    </div>
  )
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AnalyzeContent />
    </Suspense>
  )
}