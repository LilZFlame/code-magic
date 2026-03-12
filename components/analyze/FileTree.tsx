'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Folder, File, FileCode, FileJson, FileText, Image as ImageIcon, Settings, Lock } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { TreeNode } from '@/lib/github/types'
import { Loading } from '@/components/ui/Loading'

interface FileTreeProps {
  owner: string
  repo: string
  selectedPath: string | null
  onFileSelect: (path: string) => void
}

// 文件图标映射
function getFileIcon(filename: string, isDir: boolean) {
  if (isDir) {
    return <Folder className="w-4 h-4 text-yellow-500" />
  }

  const ext = filename.split('.').pop()?.toLowerCase() || ''

  if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'go', 'rs', 'c', 'cpp', 'rb'].includes(ext)) {
    return <FileCode className="w-4 h-4 text-blue-500" />
  }
  if (['json', 'yaml', 'yml', 'toml'].includes(ext)) {
    return <FileJson className="w-4 h-4 text-orange-500" />
  }
  if (['env', 'config', 'conf', 'ini'].some((s) => filename.includes(s))) {
    return <Settings className="w-4 h-4 text-gray-500" />
  }
  if (['md', 'txt', 'rst', 'log'].includes(ext)) {
    return <FileText className="w-4 h-4 text-gray-500" />
  }
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
    return <ImageIcon className="w-4 h-4 text-green-500" />
  }
  if (filename.includes('lock')) {
    return <Lock className="w-4 h-4 text-gray-400" />
  }

  return <File className="w-4 h-4 text-gray-400" />
}

interface TreeNodeItemProps {
  node: TreeNode
  level: number
  expandedPaths: Set<string>
  selectedPath: string | null
  onToggle: (path: string) => void
  onSelect: (path: string) => void
}

function TreeNodeItem({
  node,
  level,
  expandedPaths,
  selectedPath,
  onToggle,
  onSelect,
}: TreeNodeItemProps) {
  const isDir = node.type === 'dir'
  const isExpanded = expandedPaths.has(node.path)
  const isSelected = selectedPath === node.path

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-1.5 cursor-pointer',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          isSelected && 'bg-primary-50 dark:bg-primary-900/30',
          'rounded text-sm'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => {
          if (isDir) {
            onToggle(node.path)
          } else {
            onSelect(node.path)
          }
        }}
      >
        {isDir && (
          <span
            className={cn(
              'w-4 h-4 flex items-center justify-center text-gray-400',
              'transition-transform duration-150',
              isExpanded && 'rotate-90'
            )}
          >
            ▶
          </span>
        )}
        {!isDir && <span className="w-4" />}

        {getFileIcon(node.name, isDir)}

        <span
          className={cn(
            'truncate flex-1',
            isSelected
              ? 'text-primary-700 dark:text-primary-300 font-medium'
              : 'text-gray-700 dark:text-gray-300'
          )}
        >
          {node.name}
        </span>
      </div>

      {isDir && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.path}
              node={child}
              level={level + 1}
              expandedPaths={expandedPaths}
              selectedPath={selectedPath}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FileTree({ owner, repo, selectedPath, onFileSelect }: FileTreeProps) {
  const [tree, setTree] = useState<TreeNode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())

  // 获取文件树
  useEffect(() => {
    const fetchTree = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/repo-tree?owner=${owner}&repo=${repo}`)
        const data = await response.json()

        if (data.error) {
          setError(data.error)
        } else {
          setTree(data.tree)
          // 默认展开第一层
          const firstLevelPaths = data.tree
            .filter((node: TreeNode) => node.type === 'dir')
            .map((node: TreeNode) => node.path)
          setExpandedPaths(new Set(firstLevelPaths))
        }
      } catch (err) {
        setError('获取文件树失败')
      } finally {
        setIsLoading(false)
      }
    }

    if (owner && repo) {
      fetchTree()
    }
  }, [owner, repo])

  const handleToggle = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loading text="加载文件结构..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-red-500 text-sm text-center">{error}</p>
      </div>
    )
  }

  if (tree.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-gray-500 text-sm text-center">仓库为空</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto py-2">
      {tree.map((node) => (
        <TreeNodeItem
          key={node.path}
          node={node}
          level={0}
          expandedPaths={expandedPaths}
          selectedPath={selectedPath}
          onToggle={handleToggle}
          onSelect={onFileSelect}
        />
      ))}
    </div>
  )
}