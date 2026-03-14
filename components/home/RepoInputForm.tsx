'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { parseGitHubUrl } from '@/lib/github/parser'

export function RepoInputForm() {
  const router = useRouter()
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!inputValue.trim()) {
      setError('请输入 GitHub 仓库地址')
      return
    }

    // 先进行本地格式校验
    const parsed = parseGitHubUrl(inputValue.trim())
    if (!parsed) {
      setError('无效的 GitHub 仓库地址格式')
      return
    }

    setIsLoading(true)

    try {
      // 调用 API 验证仓库是否存在
      const response = await fetch('/api/validate-repo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: inputValue.trim() }),
      })

      const data = await response.json()

      if (!data.valid) {
        setError(data.error || '仓库不存在或无法访问')
        setIsLoading(false)
        return
      }

      // 跳转到分析页面
      router.push(`/analyze?owner=${data.owner}&repo=${data.repo}`)
    } catch (err) {
      console.error('验证失败:', err)
      setError('网络错误，请稍后重试')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <Input
          type="text"
          placeholder="输入 GitHub 仓库地址，如：facebook/react"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setError(null)
          }}
          error={error || undefined}
          disabled={isLoading}
          className="pr-12"
        />
      </div>

      <Button
        type="submit"
        variant="cta"
        size="lg"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            分析中...
          </>
        ) : (
          <>
            <Search className="w-5 h-5" />
            开始分析
          </>
        )}
      </Button>

      <p className="text-xs text-center text-[var(--color-text-muted)]">
        支持格式：github.com/owner/repo 或 owner/repo
      </p>
    </form>
  )
}