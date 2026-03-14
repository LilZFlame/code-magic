/**
 * 函数定位器 - 三阶段定位策略
 */

import { getFileContent } from './github/api'
import { TreeNode } from './github/types'
import { createAIAdapter, getSubFunctionAIConfig } from './ai'
import { generateFunctionLocationPrompt, FunctionLocationPrediction } from './ai/prompt/function-location'

/**
 * 函数定位结果
 */
export interface FunctionLocation {
  filePath: string
  code: string
  startLine?: number
  endLine?: number
}

/**
 * 函数定位上下文
 */
export interface LocationContext {
  callerFilePath: string
  fileTree: TreeNode[]
  primaryLanguage: string
}

/**
 * 生成函数定义的正则表达式（支持多种编程语言）
 */
function generateFunctionRegex(functionName: string, language: string): RegExp[] {
  const escapedName = functionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  const patterns: RegExp[] = []

  switch (language.toLowerCase()) {
    case 'javascript':
    case 'typescript':
      patterns.push(
        // function declaration
        new RegExp(`^\\s*(?:export\\s+)?(?:async\\s+)?function\\s+${escapedName}\\s*\\(`, 'm'),
        // arrow function
        new RegExp(`^\\s*(?:export\\s+)?const\\s+${escapedName}\\s*=\\s*(?:async\\s+)?\\(`, 'm'),
        // method definition
        new RegExp(`^\\s*(?:async\\s+)?${escapedName}\\s*\\(`, 'm'),
        // class method
        new RegExp(`^\\s*(?:public|private|protected)?\\s*(?:async\\s+)?${escapedName}\\s*\\(`, 'm')
      )
      break

    case 'python':
      patterns.push(
        new RegExp(`^\\s*def\\s+${escapedName}\\s*\\(`, 'm'),
        new RegExp(`^\\s*async\\s+def\\s+${escapedName}\\s*\\(`, 'm')
      )
      break

    case 'java':
    case 'c#':
      patterns.push(
        new RegExp(`^\\s*(?:public|private|protected)?\\s+(?:static\\s+)?(?:\\w+\\s+)+${escapedName}\\s*\\(`, 'm')
      )
      break

    case 'go':
      patterns.push(
        new RegExp(`^\\s*func\\s+(?:\\(\\w+\\s+\\*?\\w+\\)\\s+)?${escapedName}\\s*\\(`, 'm')
      )
      break

    case 'rust':
      patterns.push(
        new RegExp(`^\\s*(?:pub\\s+)?(?:async\\s+)?fn\\s+${escapedName}\\s*[<(]`, 'm')
      )
      break

    case 'c':
    case 'c++':
      patterns.push(
        new RegExp(`^\\s*(?:\\w+\\s+)+${escapedName}\\s*\\(`, 'm')
      )
      break

    default:
      // 通用模式
      patterns.push(
        new RegExp(`\\b${escapedName}\\s*[=:]?\\s*(?:function|=>|\\()`, 'm')
      )
  }

  return patterns
}

/**
 * 从文件内容中提取函数代码
 */
export function extractFunctionCode(
  fileContent: string,
  functionName: string,
  language: string
): string | null {
  const patterns = generateFunctionRegex(functionName, language)

  for (const pattern of patterns) {
    const match = pattern.exec(fileContent)
    if (match) {
      const startIndex = match.index
      const lines = fileContent.split('\n')

      // 找到函数开始行
      let currentPos = 0
      let startLine = 0
      for (let i = 0; i < lines.length; i++) {
        if (currentPos + lines[i].length >= startIndex) {
          startLine = i
          break
        }
        currentPos += lines[i].length + 1 // +1 for newline
      }

      // 简单的括号匹配来找到函数结束
      let braceCount = 0
      let inFunction = false
      let endLine = startLine

      for (let i = startLine; i < lines.length; i++) {
        const line = lines[i]
        for (const char of line) {
          if (char === '{') {
            braceCount++
            inFunction = true
          } else if (char === '}') {
            braceCount--
            if (inFunction && braceCount === 0) {
              endLine = i
              break
            }
          }
        }
        if (inFunction && braceCount === 0) break
      }

      // 提取函数代码（最多100行）
      const maxLines = 100
      const actualEndLine = Math.min(endLine + 1, startLine + maxLines)
      const functionCode = lines.slice(startLine, actualEndLine).join('\n')

      return functionCode
    }
  }

  return null
}

/**
 * 阶段1：在调用者同一文件中搜索
 */
async function searchInCallerFile(
  functionName: string,
  owner: string,
  repo: string,
  callerFilePath: string,
  language: string
): Promise<FunctionLocation | null> {
  try {
    const fileData = await getFileContent(owner, repo, callerFilePath)
    const code = extractFunctionCode(fileData.content, functionName, language)

    if (code) {
      return {
        filePath: callerFilePath,
        code
      }
    }
  } catch (error) {
    // 文件读取失败，继续下一阶段
  }

  return null
}

/**
 * 生成项目结构摘要
 */
function generateProjectStructureSummary(fileTree: TreeNode[]): string {
  const summary: string[] = []

  function traverse(nodes: TreeNode[], prefix = '', depth = 0) {
    if (depth > 3) return // 只显示3层

    for (const node of nodes) {
      if (node.type === 'dir') {
        summary.push(`${prefix}${node.name}/`)
        if (node.children) {
          traverse(node.children, `${prefix}  `, depth + 1)
        }
      }
    }
  }

  traverse(fileTree)
  return summary.join('\n')
}

/**
 * 收集所有代码文件
 */
function collectCodeFiles(fileTree: TreeNode[], language: string): string[] {
  const files: string[] = []

  function traverse(nodes: TreeNode[], basePath = '') {
    for (const node of nodes) {
      const fullPath = basePath ? `${basePath}/${node.name}` : node.name
      if (node.type === 'file' && isCodeFile(node.name, language)) {
        files.push(fullPath)
      } else if (node.type === 'dir' && node.children) {
        traverse(node.children, fullPath)
      }
    }
  }

  traverse(fileTree)
  return files
}

/**
 * 阶段2：AI 推测可能的文件位置（增强版）
 */
async function searchByAIPrediction(
  functionName: string,
  owner: string,
  repo: string,
  fileTree: TreeNode[],
  language: string,
  callerFilePath: string
): Promise<FunctionLocation | null> {
  try {
    // 1. 收集所有代码文件
    const codeFiles = collectCodeFiles(fileTree, language)

    // 2. 生成项目结构摘要
    const projectStructure = generateProjectStructureSummary(fileTree)

    // 3. 调用AI推测
    const config = getSubFunctionAIConfig()
    const adapter = createAIAdapter(config)

    const prompt = generateFunctionLocationPrompt({
      functionName,
      callerFilePath,
      primaryLanguage: language,
      codeFiles: codeFiles.slice(0, 100), // 限制文件数量
      projectStructure
    })

    const result = await adapter.analyze(prompt)

    if (result.status === 'success' && result.data) {
      const prediction = result.data as unknown as FunctionLocationPrediction

      // 4. 按置信度顺序搜索预测的文件
      for (const candidate of prediction.candidates.slice(0, 5)) {
        try {
          const fileData = await getFileContent(owner, repo, candidate.filePath)
          const code = extractFunctionCode(fileData.content, functionName, language)

          if (code) {
            return {
              filePath: candidate.filePath,
              code
            }
          }
        } catch (error) {
          continue
        }
      }
    }
  } catch (error) {
    console.error('AI推测失败:', error)
  }

  return null
}

/**
 * 阶段3：全局搜索（遍历所有代码文件）
 */
async function searchGlobally(
  functionName: string,
  owner: string,
  repo: string,
  fileTree: TreeNode[],
  language: string,
  excludeFiles: string[]
): Promise<FunctionLocation | null> {
  const codeFiles: string[] = []

  function collectCodeFiles(nodes: TreeNode[], basePath = '') {
    for (const node of nodes) {
      const fullPath = basePath ? `${basePath}/${node.name}` : node.name
      if (node.type === 'file' && isCodeFile(node.name, language) && !excludeFiles.includes(fullPath)) {
        codeFiles.push(fullPath)
      } else if (node.type === 'dir' && node.children) {
        collectCodeFiles(node.children, fullPath)
      }
    }
  }

  collectCodeFiles(fileTree)

  // 限制搜索文件数量，避免过多 API 调用
  const maxFiles = 20
  for (const filePath of codeFiles.slice(0, maxFiles)) {
    try {
      const fileData = await getFileContent(owner, repo, filePath)
      const code = extractFunctionCode(fileData.content, functionName, language)

      if (code) {
        return {
          filePath,
          code
        }
      }
    } catch (error) {
      continue
    }
  }

  return null
}

/**
 * 判断是否为代码文件
 */
function isCodeFile(fileName: string, language: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (!ext) return false

  const codeExtensions: Record<string, string[]> = {
    javascript: ['js', 'jsx', 'mjs', 'cjs'],
    typescript: ['ts', 'tsx'],
    python: ['py'],
    java: ['java'],
    'c#': ['cs'],
    go: ['go'],
    rust: ['rs'],
    c: ['c', 'h'],
    'c++': ['cpp', 'hpp', 'cc', 'cxx']
  }

  const extensions = codeExtensions[language.toLowerCase()] || []
  return extensions.includes(ext)
}

/**
 * 定位函数定义（三阶段策略）
 */
export async function locateFunctionDefinition(
  functionName: string,
  owner: string,
  repo: string,
  context: LocationContext
): Promise<FunctionLocation | null> {
  const { callerFilePath, fileTree, primaryLanguage } = context

  // 阶段1：在调用者同一文件中搜索
  const stage1Result = await searchInCallerFile(
    functionName,
    owner,
    repo,
    callerFilePath,
    primaryLanguage
  )
  if (stage1Result) {
    return stage1Result
  }

  // 阶段2：AI 推测可能的文件
  const stage2Result = await searchByAIPrediction(
    functionName,
    owner,
    repo,
    fileTree,
    primaryLanguage,
    callerFilePath
  )
  if (stage2Result) {
    return stage2Result
  }

  // 阶段3：全局搜索
  const stage3Result = await searchGlobally(
    functionName,
    owner,
    repo,
    fileTree,
    primaryLanguage,
    [callerFilePath] // 排除已搜索的文件
  )

  return stage3Result
}
