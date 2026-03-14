// 代码文件过滤工具

import { TreeNode } from '@/lib/github/types'
import { isBinaryFile } from './language-detector'
import { normalizePath, getFileName } from './path'

/**
 * 需要排除的目录
 */
const EXCLUDED_DIRS = [
  'node_modules',
  '.git',
  '.github',
  '.next',
  '.nuxt',
  'dist',
  'build',
  'out',
  'vendor',
  '__pycache__',
  '.venv',
  'venv',
  'env',
  'target',
  'bin',
  'obj',
  '.idea',
  '.vscode',
  '.DS_Store',
  'coverage',
  '.cache',
]

/**
 * 需要排除的文件模式
 */
const EXCLUDED_PATTERNS = [
  /\.lock$/,
  /\.min\.(js|css)$/,
  /\.d\.ts$/,
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
  /\.snap$/,
  /\.log$/,
  /\.bak$/,
  /\.tmp$/,
  /\.swp$/,
]

/**
 * 代码文件扩展名白名单
 */
const CODE_EXTENSIONS = new Set([
  // JavaScript/TypeScript
  'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',
  // Python
  'py', 'pyw', 'pyi',
  // Java/JVM
  'java', 'kt', 'kts', 'scala', 'groovy', 'gradle',
  // C/C++
  'c', 'h', 'cpp', 'hpp', 'cc', 'cxx', 'c++', 'hxx',
  // Go/Rust
  'go', 'rs', 'mod', 'sum',
  // Ruby
  'rb', 'rake', 'gemspec',
  // PHP
  'php',
  // Swift/Objective-C
  'swift', 'm', 'mm',
  // C#
  'cs', 'csproj',
  // Other languages
  'lua', 'r', 'ex', 'exs', 'erl', 'hs', 'clj', 'cljs', 'vim', 'sh', 'bash', 'zsh', 'ps1',
  // Web
  'html', 'htm', 'css', 'scss', 'sass', 'less', 'vue', 'svelte', 'astro',
  // Data/Config (参与分析)
  'json', 'yaml', 'yml', 'toml', 'xml',
  // Documentation
  'md', 'mdx', 'rst',
  // SQL
  'sql',
  // Docker
  'dockerfile',
])

/**
 * 配置文件名称（特殊处理）
 */
const CONFIG_FILENAMES = new Set([
  'package.json',
  'tsconfig.json',
  'jsconfig.json',
  '.eslintrc',
  '.prettierrc',
  'babel.config.js',
  'webpack.config.js',
  'vite.config.ts',
  'next.config.js',
  'nuxt.config.ts',
  'tailwind.config.js',
  'tailwind.config.ts',
  'docker-compose.yml',
  'Dockerfile',
  'Makefile',
  'Cargo.toml',
  'go.mod',
  'requirements.txt',
  'pyproject.toml',
  'Gemfile',
  'composer.json',
  'pom.xml',
  'build.gradle',
])

/**
 * 判断文件是否应该参与AI分析
 */
export function shouldAnalyzeFile(path: string, filename: string): boolean {
  // 排除二进制文件
  if (isBinaryFile(filename)) {
    return false
  }

  // 排除特定目录
  const pathParts = normalizePath(path).split('/')
  if (pathParts.some(part => EXCLUDED_DIRS.includes(part))) {
    return false
  }

  // 排除特定模式
  if (EXCLUDED_PATTERNS.some(pattern => pattern.test(filename))) {
    return false
  }

  // 检查是否为配置文件名
  if (CONFIG_FILENAMES.has(filename)) {
    return true
  }

  // 获取扩展名
  const ext = filename.split('.').pop()?.toLowerCase() || ''

  // 检查是否为代码文件
  return CODE_EXTENSIONS.has(ext)
}

/**
 * 从TreeNode树中提取需要分析的文件列表
 */
export function extractCodeFiles(
  nodes: TreeNode[],
  maxFiles: number = 500
): string[] {
  const files: string[] = []

  function traverse(node: TreeNode) {
    if (files.length >= maxFiles) return

    if (node.type === 'file') {
      if (shouldAnalyzeFile(node.path, node.name)) {
        files.push(node.path)
      }
    } else if (node.children) {
      for (const child of node.children) {
        traverse(child)
      }
    }
  }

  for (const node of nodes) {
    traverse(node)
  }

  return files
}

/**
 * 统计语言分布
 */
export function countLanguageDistribution(files: string[]): Record<string, number> {
  const distribution: Record<string, number> = {}

  for (const file of files) {
    const filename = getFileName(file)
    const ext = filename.split('.').pop()?.toLowerCase() || ''

    // 简化的语言映射
    const languageMap: Record<string, string> = {
      'js': 'JavaScript',
      'jsx': 'JavaScript',
      'ts': 'TypeScript',
      'tsx': 'TypeScript',
      'mjs': 'JavaScript',
      'cjs': 'JavaScript',
      'py': 'Python',
      'java': 'Java',
      'kt': 'Kotlin',
      'go': 'Go',
      'rs': 'Rust',
      'c': 'C',
      'h': 'C',
      'cpp': 'C++',
      'hpp': 'C++',
      'cc': 'C++',
      'rb': 'Ruby',
      'php': 'PHP',
      'swift': 'Swift',
      'cs': 'C#',
      'scala': 'Scala',
      'lua': 'Lua',
      'r': 'R',
      'sh': 'Shell',
      'bash': 'Shell',
      'css': 'CSS',
      'scss': 'SCSS',
      'less': 'Less',
      'html': 'HTML',
      'json': 'JSON',
      'yaml': 'YAML',
      'yml': 'YAML',
      'md': 'Markdown',
      'sql': 'SQL',
      'vue': 'Vue',
      'svelte': 'Svelte',
    }

    const language = languageMap[ext] || ext.toUpperCase()
    distribution[language] = (distribution[language] || 0) + 1
  }

  return distribution
}

/**
 * 获取语言的简要统计信息
 */
export function getLanguageSummary(distribution: Record<string, number>): string {
  const sorted = Object.entries(distribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return sorted.map(([lang, count]) => `${lang}: ${count}`).join(', ')
}