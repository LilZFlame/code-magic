/**
 * 函数定位 AI 推测 Prompt
 * 用于推测函数定义最可能所在的文件
 */

export const FUNCTION_LOCATION_PROMPT = `你是一个代码项目结构分析专家。请根据函数名和项目结构，推测函数定义最可能所在的文件。

## 项目信息
- 主要编程语言: {primaryLanguage}
- 调用者文件: {callerFilePath}
- 函数名: {functionName}

## 项目结构概览
{projectStructure}

## 代码文件列表（前100个）
{codeFiles}

## 分析要求

请根据以下线索推测函数定义的位置：

1. **命名约定**: 函数名与文件名的关联（如 \`getUserData\` 可能在 \`user.ts\` 或 \`userData.ts\`）
2. **目录结构**: 常见的项目组织模式（如 \`utils/\`, \`lib/\`, \`services/\`, \`components/\`）
3. **调用关系**: 同一模块的函数通常在相近的目录
4. **语言惯例**: 不同语言的文件组织习惯

请返回JSON格式的预测结果（只返回JSON，不要其他文本）：

{
  "functionName": "函数名",
  "candidates": [
    {
      "filePath": "预测的文件路径",
      "confidence": 0.0到1.0,
      "reasoning": "推理依据（中文，简短）"
    }
  ]
}

注意：
1. 最多返回5个候选文件
2. 按 confidence 降序排列
3. confidence 应该基于命名相似度、目录结构合理性等因素
4. 确保 filePath 在提供的文件列表中存在
`

/**
 * 生成函数定位提示词
 */
export function generateFunctionLocationPrompt(params: {
  functionName: string
  callerFilePath: string
  primaryLanguage: string
  codeFiles: string[]
  projectStructure: string
}): string {
  return FUNCTION_LOCATION_PROMPT
    .replace('{functionName}', params.functionName)
    .replace('{callerFilePath}', params.callerFilePath)
    .replace('{primaryLanguage}', params.primaryLanguage)
    .replace('{codeFiles}', params.codeFiles.join('\n'))
    .replace('{projectStructure}', params.projectStructure)
}

/**
 * AI 推测结果类型
 */
export interface FunctionLocationPrediction {
  functionName: string
  candidates: Array<{
    filePath: string
    confidence: number
    reasoning: string
  }>
}
