// 文件扩展名到语言的映射
const extensionMap: Record<string, string> = {
  // JavaScript/TypeScript
  'js': 'javascript',
  'jsx': 'jsx',
  'ts': 'typescript',
  'tsx': 'tsx',
  'mjs': 'javascript',
  'cjs': 'javascript',

  // Python
  'py': 'python',
  'pyw': 'python',
  'pyi': 'python',

  // Java/JVM
  'java': 'java',
  'kt': 'kotlin',
  'kts': 'kotlin',
  'scala': 'scala',
  'groovy': 'groovy',

  // C/C++
  'c': 'c',
  'h': 'c',
  'cpp': 'cpp',
  'hpp': 'cpp',
  'cc': 'cpp',
  'cxx': 'cpp',

  // Go/Rust
  'go': 'go',
  'rs': 'rust',

  // Web
  'html': 'html',
  'htm': 'html',
  'css': 'css',
  'scss': 'scss',
  'sass': 'sass',
  'less': 'less',
  'vue': 'vue',
  'svelte': 'svelte',

  // Data/Config
  'json': 'json',
  'yaml': 'yaml',
  'yml': 'yaml',
  'toml': 'toml',
  'xml': 'xml',

  // Shell/Script
  'sh': 'bash',
  'bash': 'bash',
  'zsh': 'bash',
  'ps1': 'powershell',
  'bat': 'bat',
  'cmd': 'bat',

  // Other languages
  'rb': 'ruby',
  'php': 'php',
  'swift': 'swift',
  'lua': 'lua',
  'r': 'r',
  'sql': 'sql',
  'md': 'markdown',
  'mdx': 'mdx',

  // Styling
  'dockerfile': 'dockerfile',
  'makefile': 'makefile',
  'cmake': 'cmake',
}

// 特殊文件名映射
const filenameMap: Record<string, string> = {
  'dockerfile': 'dockerfile',
  'makefile': 'makefile',
  'vagrantfile': 'ruby',
  'gemfile': 'ruby',
  'rakefile': 'ruby',
  'procfile': 'yaml',
}

export function detectLanguage(filename: string): string {
  const lowerFilename = filename.toLowerCase()

  // 检查特殊文件名
  if (filenameMap[lowerFilename]) {
    return filenameMap[lowerFilename]
  }

  // 获取扩展名
  const ext = lowerFilename.split('.').pop() || ''
  return extensionMap[ext] || 'text'
}

export function isBinaryFile(filename: string): boolean {
  const binaryExtensions = [
    'png', 'jpg', 'jpeg', 'gif', 'ico', 'svg', 'webp',
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'zip', 'tar', 'gz', 'rar', '7z',
    'mp3', 'mp4', 'wav', 'avi', 'mov',
    'exe', 'dll', 'so', 'dylib',
    'ttf', 'otf', 'woff', 'woff2', 'eot',
    'node_modules', 'lock', 'sqlite', 'db',
  ]

  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return binaryExtensions.includes(ext)
}