'use client'

import { useEffect } from 'react'
import { useThemeStore, ThemeMode } from '@/stores/theme-store'

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: 'light' | 'dark') {
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(theme)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { mode, setMode } = useThemeStore()

  useEffect(() => {
    // 初始应用主题
    const theme = mode === 'system' ? getSystemTheme() : mode
    applyTheme(theme)

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      if (mode === 'system') {
        applyTheme(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [mode])

  return <>{children}</>
}