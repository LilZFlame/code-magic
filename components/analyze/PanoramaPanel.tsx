'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import { ZoomIn, ZoomOut, RotateCcw, GitBranch } from 'lucide-react'
import { FunctionCallTreeNode, SUB_FUNCTION_TYPE_CONFIG } from '@/lib/types/sub-function'
import { useMounted } from '@/hooks/useMounted'
import { useThemeStore } from '@/stores/theme-store'
import { getFileName } from '@/lib/utils/path'

interface PanoramaPanelProps {
  callTree: FunctionCallTreeNode | null
  onNodeClick?: (node: FunctionCallTreeNode) => void
  onContinueAnalyze?: (node: FunctionCallTreeNode) => void
}

// 节点尺寸常量
const NODE_WIDTH = 240  // 从 200 增加到 240，为文件名提供更多空间
const NODE_HEIGHT = 120  // 从 80 增加到 120
const INDENT = 60         // 层级缩进
const VERTICAL_GAP = 100  // 节点间垂直间距（从 80 增加到 100）
const PADDING = 40

export function PanoramaPanel({ callTree, onNodeClick, onContinueAnalyze }: PanoramaPanelProps) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [clickStart, setClickStart] = useState<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const mounted = useMounted()
  const { mode } = useThemeStore()
  const isDark = mounted && (
    mode === 'dark' ||
    (mode === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  )

  // 递归布局计算函数 - 层级缩进树形结构
  const calculateLayout = useCallback(
    (
      node: FunctionCallTreeNode,
      depth: number,    // 层级深度
      startY: number,   // 当前 Y 位置
      nodePositions: Map<string, { x: number; y: number; node: FunctionCallTreeNode }>
    ): number => {
      // 根据层级缩进（加上父节点宽度的一半，使分支线更合理）
      const x = PADDING + depth * (INDENT + NODE_WIDTH / 2)
      const y = startY

      nodePositions.set(node.function.id, { x, y, node })

      let currentY = y + NODE_HEIGHT + VERTICAL_GAP

      // 递归放置子节点（层级+1，向右缩进）
      for (const child of node.children) {
        currentY = calculateLayout(child, depth + 1, currentY, nodePositions)
      }

      return currentY
    },
    []
  )

  // 计算文本宽度（暂时不用，但保留以备后续优化）
  // const measureTextWidth = useCallback((text: string, fontSize: number): number => {
  //   if (typeof document === 'undefined') return text.length * fontSize * 0.6
  //   const canvas = document.createElement('canvas')
  //   const ctx = canvas.getContext('2d')
  //   if (!ctx) return text.length * fontSize * 0.6
  //   ctx.font = `${fontSize}px monospace`
  //   return ctx.measureText(text).width
  // }, [])

  // 计算树形布局
  const layout = useMemo(() => {
    if (!callTree) return null

    // 递归计算布局（层级缩进）
    const nodePositions = new Map<string, { x: number; y: number; node: FunctionCallTreeNode }>()
    const totalHeight = calculateLayout(callTree, 0, PADDING, nodePositions)

    // 计算最大宽度
    let maxWidth = 0
    nodePositions.forEach((pos) => {
      maxWidth = Math.max(maxWidth, pos.x + NODE_WIDTH)
    })

    return {
      nodePositions,
      width: maxWidth + PADDING,
      height: totalHeight + PADDING,
    }
  }, [callTree, calculateLayout])

  const zoomIn = useCallback(() => setScale(prev => Math.min(3, prev + 0.1)), [])
  const zoomOut = useCallback(() => setScale(prev => Math.max(0.25, prev - 0.1)), [])
  const resetView = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  // 拖拽处理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }, [position])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setScale(prev => Math.max(0.25, Math.min(3, prev + delta)))
  }, [])

  // 空状态
  if (!callTree || !layout) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-[var(--color-text-muted)]">
        <GitBranch className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm font-medium">函数调用全景图</p>
        <p className="text-xs mt-1 opacity-70">完成入口识别后查看函数调用关系</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* 工具栏 */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex items-center justify-end gap-1">
        <button
          onClick={zoomOut}
          className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
          title="缩小"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs text-[var(--color-text-muted)] w-12 text-center select-none">{Math.round(scale * 100)}%</span>
        <button
          onClick={zoomIn}
          className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
          title="放大"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-[var(--color-border)] mx-1" />
        <button
          onClick={resetView}
          className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
          title="重置视图"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* 全景图区域 */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          <svg
            width={layout.width}
            height={layout.height}
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            className="overflow-visible"
          >
            {/* SVG 渐变定义 */}
            <defs>
              <linearGradient id="tree-line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={isDark ? '#22d3ee' : '#0891b2'} />
                <stop offset="100%" stopColor={isDark ? '#a855f7' : '#7c3aed'} />
              </linearGradient>
              {/* 发光滤镜 */}
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* 树形连接线 - 主干线 + 分支线 */}
            <g className="tree-lines">
              {Array.from(layout.nodePositions.values()).map((nodePos) => {
                const children = nodePos.node.children
                if (children.length === 0) return null

                // 父节点底部中心
                const parentCenterX = nodePos.x + NODE_WIDTH / 2
                const parentBottomY = nodePos.y + NODE_HEIGHT

                // 收集子节点位置
                const childPositions = children
                  .map(child => layout.nodePositions.get(child.function.id))
                  .filter(Boolean) as { x: number; y: number; node: FunctionCallTreeNode }[]

                if (childPositions.length === 0) return null

                // 子节点 Y 坐标范围（只需最后一个）
                const lastChildY = childPositions[childPositions.length - 1].y + NODE_HEIGHT / 2

                // 连线颜色
                const lineColor = isDark ? '#22d3ee' : '#0891b2'

                return (
                  <g key={`lines-${nodePos.node.function.id}`}>
                    {/* 主干竖线：从父节点底部到最后一个子节点 */}
                    <line
                      x1={parentCenterX}
                      y1={parentBottomY}
                      x2={parentCenterX}
                      y2={lastChildY}
                      stroke={lineColor}
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      className="transition-all duration-300"
                    />
                    {/* 分支横线：从主干线到每个子节点左侧中心 */}
                    {childPositions.map((childPos) => {
                      const childCenterY = childPos.y + NODE_HEIGHT / 2
                      const childLeftX = childPos.x

                      return (
                        <line
                          key={`branch-${childPos.node.function.id}`}
                          x1={parentCenterX}
                          y1={childCenterY}
                          x2={childLeftX}
                          y2={childCenterY}
                          stroke={lineColor}
                          strokeWidth="2"
                          strokeDasharray="5,5"
                          className="transition-all duration-300"
                        />
                      )
                    })}
                  </g>
                )
              })}
            </g>

            {/* 节点卡片 */}
            <g className="nodes">
              {Array.from(layout.nodePositions.values()).map(({ x, y, node }) => (
                <g
                  key={node.function.id}
                  transform={`translate(${x}, ${y})`}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    setClickStart({ x: e.clientX, y: e.clientY })
                  }}
                  onMouseUp={(e) => {
                    if (clickStart) {
                      const dx = e.clientX - clickStart.x
                      const dy = e.clientY - clickStart.y
                      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
                        onNodeClick?.(node)
                      }
                      setClickStart(null)
                    }
                  }}
                  onMouseLeave={() => setClickStart(null)}
                  className="cursor-pointer"
                >
                  {/* 节点背景 */}
                  <rect
                    x="0"
                    y="0"
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx="8"
                    fill={isDark ? '#0f172a' : '#ffffff'}
                    stroke={isDark ? '#334155' : '#e2e8f0'}
                    strokeWidth="2"
                    className="transition-all duration-300"
                  />

                  {/* 顶部文件名区域 */}
                  <rect
                    x="0"
                    y="0"
                    width={NODE_WIDTH}
                    height="24"
                    rx="8"
                    fill={isDark ? '#1e293b' : '#f1f5f9'}
                  />
                  <rect
                    x="0"
                    y="16"
                    width={NODE_WIDTH}
                    height="8"
                    fill={isDark ? '#1e293b' : '#f1f5f9'}
                  />

                  {/* 分隔线 */}
                  <line
                    x1="0"
                    y1="24"
                    x2={NODE_WIDTH}
                    y2="24"
                    stroke={isDark ? '#334155' : '#e2e8f0'}
                    strokeWidth="1"
                  />

                  {/* 文件名和函数类型气泡 */}
                  <g>
                    {/* 文件名 */}
                    <text
                      x="10"
                      y="16"
                      textAnchor="start"
                      fill={isDark ? '#94a3b8' : '#64748b'}
                      fontSize="10"
                      fontFamily="monospace"
                    >
                      <title>{node.function.filePath || 'unknown'}</title>
                      {(() => {
                        const fileName = getFileName(node.function.filePath || 'unknown')
                        return fileName.length > 25 ? fileName.slice(0, 23) + '..' : fileName
                      })()}
                    </text>

                    {/* 函数类型气泡 */}
                    <g transform={`translate(${NODE_WIDTH - 60}, 4)`}>
                      <rect
                        x="0"
                        y="0"
                        width="50"
                        height="16"
                        rx="8"
                        fill={isDark ? '#1e293b' : '#f8fafc'}
                        stroke={isDark ? '#475569' : '#cbd5e1'}
                        strokeWidth="1"
                      />
                      <text
                        x="25"
                        y="11"
                        textAnchor="middle"
                        fill={isDark ? '#94a3b8' : '#64748b'}
                        fontSize="8"
                      >
                        {SUB_FUNCTION_TYPE_CONFIG[node.function.functionType].label}
                      </text>
                    </g>
                  </g>

                  {/* 函数名 */}
                  <text
                    x={NODE_WIDTH / 2}
                    y="44"
                    textAnchor="middle"
                    fill={isDark ? '#f1f5f9' : '#0f172a'}
                    fontSize="13"
                    fontFamily="monospace"
                    fontWeight="600"
                  >
                    {node.function.name.length > 18
                      ? node.function.name.slice(0, 16) + '...'
                      : node.function.name}
                  </text>

                  {/* 功能描述 */}
                  <text
                    x={NODE_WIDTH / 2}
                    y="62"
                    textAnchor="middle"
                    fill={isDark ? '#64748b' : '#94a3b8'}
                    fontSize="10"
                  >
                    {node.function.description.length > 22
                      ? node.function.description.slice(0, 20) + '...'
                      : node.function.description}
                  </text>

                  {/* 操作按钮区域 */}
                  <foreignObject x="10" y="75" width="220" height="40">
                    <div className="flex gap-1.5 justify-end" style={{ height: '100%', paddingTop: '4px' }}>
                      {/* 继续分析按钮 - 仅对未分析且推荐分析的节点显示 */}
                      {!node.isAnalyzed && node.function.drillDownRecommendation >= 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onContinueAnalyze?.(node)
                          }}
                          className="px-2 py-0.5 text-[9px] rounded bg-[var(--color-bg-tertiary)] text-cyan-400 border border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_8px_rgba(34,211,238,0.5)] hover:text-cyan-300 transition-all duration-300"
                        >
                          继续分析
                        </button>
                      )}

                      {/* 查看代码按钮 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onNodeClick?.(node)
                        }}
                        className="px-2 py-0.5 text-[9px] rounded bg-[var(--color-bg-tertiary)] text-purple-400 border border-purple-500/30 hover:border-purple-400 hover:shadow-[0_0_8px_rgba(168,85,247,0.5)] hover:text-purple-300 transition-all duration-300"
                      >
                        查看代码
                      </button>
                    </div>
                  </foreignObject>
                </g>
              ))}
            </g>
          </svg>
        </div>
      </div>
    </div>
  )
}