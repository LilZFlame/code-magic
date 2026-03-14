'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, AlertCircle } from 'lucide-react'
import { FunctionCallTreeNode, SUB_FUNCTION_TYPE_CONFIG, DRILL_DOWN_CONFIG } from '@/lib/types/sub-function'

interface CallTreeViewerProps {
  tree: FunctionCallTreeNode
  onNodeClick?: (node: FunctionCallTreeNode) => void
}

export function CallTreeViewer({ tree, onNodeClick }: CallTreeViewerProps) {
  return (
    <div className="p-4 space-y-2">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        函数调用树
      </h3>
      <TreeNode node={tree} onNodeClick={onNodeClick} />
    </div>
  )
}

function TreeNode({
  node,
  onNodeClick,
}: {
  node: FunctionCallTreeNode
  onNodeClick?: (node: FunctionCallTreeNode) => void
}) {
  const [isExpanded, setIsExpanded] = useState(node.depth < 2) // 默认展开前2层

  const hasChildren = node.children.length > 0
  const typeConfig = SUB_FUNCTION_TYPE_CONFIG[node.function.functionType]
  const drillDownConfig = DRILL_DOWN_CONFIG[node.function.drillDownRecommendation]

  return (
    <div className="select-none">
      {/* 节点内容 */}
      <div
        className={`flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
          !node.isAnalyzed ? 'opacity-60' : ''
        }`}
        onClick={() => {
          if (hasChildren) setIsExpanded(!isExpanded)
          onNodeClick?.(node)
        }}
      >
        {/* 展开/折叠图标 */}
        <div className="w-4 h-4 flex-shrink-0">
          {hasChildren &&
            (isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            ))}
        </div>

        {/* 函数名 */}
        <span className="font-mono text-sm text-primary-600 dark:text-primary-400">
          {node.function.name}
        </span>

        {/* 研判标签 */}
        <span className={`text-xs ${drillDownConfig.color}`}>{drillDownConfig.label}</span>

        {/* 未分析标记 */}
        {!node.isAnalyzed && hasChildren && (
          <div title="未完成分析">
            <AlertCircle className="w-3 h-3 text-yellow-500" />
          </div>
        )}

        {/* 深度标记 */}
        <span className="text-xs text-gray-400 ml-auto">L{node.depth}</span>
      </div>

      {/* 函数描述 */}
      {node.function.description && (
        <div className="ml-6 text-xs text-gray-500 dark:text-gray-400 mb-1">
          {node.function.description}
        </div>
      )}

      {/* 子节点 */}
      {isExpanded && hasChildren && (
        <div className="ml-6 border-l-2 border-gray-200 dark:border-gray-700 pl-2 space-y-1">
          {node.children.map((child, index) => (
            <TreeNode key={`${child.function.id}-${index}`} node={child} onNodeClick={onNodeClick} />
          ))}
        </div>
      )}
    </div>
  )
}
