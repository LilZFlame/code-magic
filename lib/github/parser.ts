import { TreeNode } from './types'

/**
 * 解析 GitHub URL，提取 owner 和 repo
 * 支持格式:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo.git
 * - git@github.com:owner/repo.git
 * - owner/repo
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const trimmedUrl = url.trim()

  // https://github.com/owner/repo 或 https://github.com/owner/repo.git
  const httpsPattern = /github\.com\/([^/\s]+)\/([^/\s.?]+)(?:\.git)?$/i
  const httpsMatch = trimmedUrl.match(httpsPattern)
  if (httpsMatch) {
    return {
      owner: httpsMatch[1],
      repo: httpsMatch[2],
    }
  }

  // git@github.com:owner/repo.git
  const sshPattern = /git@github\.com:([^/]+)\/([^/\s]+?)(?:\.git)?$/i
  const sshMatch = trimmedUrl.match(sshPattern)
  if (sshMatch) {
    return {
      owner: sshMatch[1],
      repo: sshMatch[2],
    }
  }

  // owner/repo 简短格式
  const shortPattern = /^([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)$/
  const shortMatch = trimmedUrl.match(shortPattern)
  if (shortMatch) {
    return {
      owner: shortMatch[1],
      repo: shortMatch[2],
    }
  }

  return null
}

/**
 * 将 GitHub API 返回的扁平文件树转换为嵌套结构
 */
export function buildNestedTree(
  items: Array<{ path: string; type: string; mode?: string }>
): TreeNode[] {
  const root: TreeNode[] = []
  const map = new Map<string, TreeNode>()

  // 过滤掉 .git 目录和其他不需要的文件
  const filteredItems = items.filter((item) => {
    const pathParts = item.path.split('/')
    return !pathParts.some(
      (part) => part === '.git' || part === 'node_modules' || part === '.next'
    )
  })

  // 按路径深度排序，确保父目录先处理
  filteredItems.sort((a, b) => {
    const depthA = a.path.split('/').length
    const depthB = b.path.split('/').length
    return depthA - depthB
  })

  for (const item of filteredItems) {
    const parts = item.path.split('/')
    const name = parts[parts.length - 1]
    const isDir = item.type === 'tree'

    const node: TreeNode = {
      name,
      path: item.path,
      type: isDir ? 'dir' : 'file',
      children: isDir ? [] : undefined,
    }

    map.set(item.path, node)

    if (parts.length === 1) {
      root.push(node)
    } else {
      const parentPath = parts.slice(0, -1).join('/')
      const parent = map.get(parentPath)
      if (parent && parent.children) {
        parent.children.push(node)
      }
    }
  }

  // 排序：文件夹优先，然后按名称排序
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'dir' ? -1 : 1
      }
      return a.name.localeCompare(b.name, undefined, { numeric: true })
    })
    nodes.forEach((n) => n.children && sortNodes(n.children))
  }
  sortNodes(root)

  return root
}

/**
 * 从文件路径获取文件扩展名
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  if (parts.length > 1) {
    return parts[parts.length - 1].toLowerCase()
  }
  return ''
}