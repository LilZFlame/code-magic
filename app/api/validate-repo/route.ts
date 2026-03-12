import { NextRequest, NextResponse } from 'next/server'
import { parseGitHubUrl } from '@/lib/github/parser'
import { validateRepo } from '@/lib/github/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json(
        { valid: false, error: '请输入 GitHub 仓库地址' },
        { status: 400 }
      )
    }

    // 解析 URL
    const parsed = parseGitHubUrl(url)
    if (!parsed) {
      return NextResponse.json(
        { valid: false, error: '无效的 GitHub 仓库地址格式' },
        { status: 400 }
      )
    }

    const { owner, repo } = parsed

    // 验证仓库是否存在
    const isValid = await validateRepo(owner, repo)
    if (!isValid) {
      return NextResponse.json(
        { valid: false, error: '仓库不存在或无法访问' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      valid: true,
      owner,
      repo,
    })
  } catch (error) {
    console.error('验证仓库失败:', error)
    return NextResponse.json(
      { valid: false, error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}