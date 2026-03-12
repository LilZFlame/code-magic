import { NextRequest, NextResponse } from 'next/server'
import { getFileContent } from '@/lib/github/api'
import { detectLanguage, isBinaryFile } from '@/lib/utils/language-detector'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const owner = searchParams.get('owner')
    const repo = searchParams.get('repo')
    const path = searchParams.get('path')
    const branch = searchParams.get('branch') || undefined

    if (!owner || !repo || !path) {
      return NextResponse.json(
        { content: '', name: '', path: '', size: 0, language: 'text', error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 检查是否为二进制文件
    const filename = path.split('/').pop() || ''
    if (isBinaryFile(filename)) {
      return NextResponse.json({
        content: '[二进制文件，无法显示]',
        name: filename,
        path,
        size: 0,
        language: 'text',
      })
    }

    const result = await getFileContent(owner, repo, path, branch)

    // 限制文件大小（超过 500KB 显示提示）
    const MAX_SIZE = 500 * 1024
    if (result.size > MAX_SIZE) {
      return NextResponse.json({
        content: `[文件过大 (${(result.size / 1024).toFixed(1)}KB)，请使用 GitHub 查看]`,
        name: result.name,
        path,
        size: result.size,
        language: 'text',
      })
    }

    return NextResponse.json({
      content: result.content,
      name: result.name,
      path,
      size: result.size,
      language: detectLanguage(result.name),
    })
  } catch (error) {
    console.error('获取文件内容失败:', error)
    return NextResponse.json(
      { content: '', name: '', path: '', size: 0, language: 'text', error: '获取文件内容失败' },
      { status: 500 }
    )
  }
}