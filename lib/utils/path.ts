/**
 * 路径处理工具函数
 * 兼容不同操作系统的路径分隔符
 */

/**
 * 规范化路径分隔符，统一使用正斜杠
 */
export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/')
}

/**
 * 提取文件名（兼容不同分隔符）
 */
export function getFileName(path: string): string {
  if (!path) return ''
  const normalized = normalizePath(path)
  return normalized.split('/').pop() || ''
}

/**
 * 提取目录路径（兼容不同分隔符）
 */
export function getDirName(path: string): string {
  if (!path) return ''
  const normalized = normalizePath(path)
  const parts = normalized.split('/')
  parts.pop()
  return parts.join('/')
}

/**
 * 检查路径是否包含指定目录（兼容不同分隔符）
 */
export function pathContains(path: string, dir: string): boolean {
  if (!path || !dir) return false
  const normalizedPath = normalizePath(path)
  const normalizedDir = normalizePath(dir)
  return normalizedPath.includes(`/${normalizedDir}/`) ||
         normalizedPath.startsWith(`${normalizedDir}/`)
}

/**
 * 解析路径别名，转换为实际路径
 * 处理常见的 TypeScript 路径别名（@/、~/、#/ 等）
 */
export function resolvePathAlias(path: string): string {
  if (!path) return path

  // 移除常见的路径别名前缀
  const aliases = ['@/', '~/', '#/']
  for (const alias of aliases) {
    if (path.startsWith(alias)) {
      return path.slice(alias.length)
    }
  }

  return path
}
