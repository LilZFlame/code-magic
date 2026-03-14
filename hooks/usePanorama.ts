'use client'

import { useState, useRef, useCallback } from 'react'

interface Position {
  x: number
  y: number
}

interface UsePanoramaOptions {
  minScale?: number
  maxScale?: number
  scaleStep?: number
}

export function usePanorama(options: UsePanoramaOptions = {}) {
  const { minScale = 0.25, maxScale = 3, scaleStep = 0.1 } = options

  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<Position>({ x: 0, y: 0 })

  // 鼠标按下
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return // 只响应左键
      setIsDragging(true)
      dragStartRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      }
    },
    [position]
  )

  // 鼠标移动
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return
      setPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      })
    },
    [isDragging]
  )

  // 鼠标抬起
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // 滚轮缩放
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -scaleStep : scaleStep
      setScale((prev) => Math.max(minScale, Math.min(maxScale, prev + delta)))
    },
    [minScale, maxScale, scaleStep]
  )

  // 放大
  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(maxScale, prev + scaleStep))
  }, [maxScale, scaleStep])

  // 缩小
  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(minScale, prev - scaleStep))
  }, [minScale, scaleStep])

  // 重置视图
  const resetView = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  // 适应容器
  const fitToContainer = useCallback(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    const content = container.firstElementChild as HTMLElement
    if (!content) return

    const containerRect = container.getBoundingClientRect()
    const contentRect = content.getBoundingClientRect()

    const scaleX = (containerRect.width - 40) / contentRect.width
    const scaleY = (containerRect.height - 40) / contentRect.height
    const newScale = Math.max(minScale, Math.min(maxScale, Math.min(scaleX, scaleY)))

    setScale(newScale)
    setPosition({ x: 20, y: 20 })
  }, [minScale, maxScale])

  return {
    containerRef,
    scale,
    position,
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    zoomIn,
    zoomOut,
    resetView,
    fitToContainer,
  }
}