'use client'

import { Sun, Moon, Monitor } from 'lucide-react'
import { useThemeStore, ThemeMode } from '@/stores/theme-store'
import { useMounted } from '@/hooks/useMounted'
import { cn } from '@/lib/utils/cn'

const modes: { value: ThemeMode; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: '亮色' },
  { value: 'dark', icon: Moon, label: '暗色' },
  { value: 'system', icon: Monitor, label: '跟随系统' },
]

export function ThemeToggle() {
  const { mode, setMode } = useThemeStore()
  const mounted = useMounted()

  // 避免服务端渲染不匹配
  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-lg bg-surface-secondary" />
    )
  }

  const currentIndex = modes.findIndex(m => m.value === mode)
  const nextIndex = (currentIndex + 1) % modes.length

  const handleToggle = () => {
    setMode(modes[nextIndex].value)
  }

  const CurrentIcon = modes[currentIndex]?.icon ?? Monitor

  return (
    <button
      onClick={handleToggle}
      className={cn(
        'w-9 h-9 rounded-lg flex items-center justify-center',
        'bg-surface-secondary hover:bg-surface-tertiary',
        'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
        'transition-all duration-200 ease-out',
        'cursor-pointer'
      )}
      title={modes[currentIndex]?.label}
      aria-label={`切换主题，当前：${modes[currentIndex]?.label}`}
    >
      <CurrentIcon className="w-5 h-5" />
    </button>
  )
}