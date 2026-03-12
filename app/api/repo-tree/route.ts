import { NextRequest, NextResponse } from 'next/server'
import { getRepoTree } from '@/lib/github/api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const owner = searchParams.get('owner')
    const repo = searchParams.get('repo')
    const branch = searchParams.get('branch') || undefined

    if (!owner || !repo) {
      return NextResponse.json(
        { tree: [], error: '缺少必要参数' },
        { status: 400 }
      )
    }

    const tree = await getRepoTree(owner, repo, branch)

    return NextResponse.json({ tree })
  } catch (error) {
    console.error('获取文件树失败:', error)
    return NextResponse.json(
      { tree: [], error: '获取文件树失败' },
      { status: 500 }
    )
  }
}