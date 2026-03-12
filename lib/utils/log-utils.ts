// 生成唯一ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// 截断长字符串
export function truncateLongStrings(obj: unknown, maxLength = 500): unknown {
  if (typeof obj === 'string') {
    if (obj.length > maxLength) {
      const remaining = obj.length - maxLength
      return obj.slice(0, maxLength) + `···剩余${remaining}字节`
    }
    return obj
  }
  if (Array.isArray(obj)) {
    return obj.map(item => truncateLongStrings(item, maxLength))
  }
  if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = truncateLongStrings(value, maxLength)
    }
    return result
  }
  return obj
}

// 格式化JSON显示
export function formatJsonForDisplay(obj: unknown): string {
  const truncated = truncateLongStrings(obj)
  return JSON.stringify(truncated, null, 2)
}