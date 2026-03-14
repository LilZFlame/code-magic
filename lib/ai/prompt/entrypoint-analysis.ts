/**
 * 入口文件研判 Prompt 模板
 */

export const ENTRY_POINT_ANALYSIS_PROMPT = `你是一个代码项目入口分析专家。请分析以下文件是否是项目的真实入口文件。

## 项目信息
- GitHub: {githubUrl}
- 项目简介: {projectDescription}
- 主要编程语言: {primaryLanguage}
- 项目类型: {projectType}

## 候选入口文件
- 文件路径: {filePath}
- 推测类型: {expectedType}
- 推测理由: {expectedDescription}

## 文件内容
\`\`\`{language}
{fileContent}
\`\`\`

请严格按照以下JSON格式返回结果（不要包含任何其他文本，只返回JSON）:
{
  "isConfirmedEntry": true或false,
  "confidence": 0.0到1.0之间的数值,
  "reasoning": "简短理由（10-20字）",
  "entryType": "入口类型（main/app/server/cli/test/config）",
  "functionality": "功能描述（8-15字，动词开头）",
  "mainDependencies": ["依赖的模块1", "依赖的模块2"],
  "startupHint": "启动提示（简短）"
}

判断标准：
1. 主入口: 包含 main 函数、程序启动点
2. 应用入口: 应用的根组件、初始化代码
3. 服务入口: 启动HTTP服务、数据库连接
4. CLI入口: 解析命令行参数
5. confidence >= 0.8 表示确认是入口

注意事项：
- 如果文件只是配置文件或类型定义文件，通常不是入口
- 如果文件只是导出其他模块，不是入口
- 需要结合项目类型判断入口类型
- 功能描述必须简洁有力，8-15个中文字符
`

/**
 * 生成入口研判Prompt
 */
export function generateEntryPointPrompt(params: {
  githubUrl: string
  projectDescription: string
  primaryLanguage: string
  projectType: string
  filePath: string
  expectedType: string
  expectedDescription: string
  fileContent: string
  language: string
}): string {
  return ENTRY_POINT_ANALYSIS_PROMPT
    .replace('{githubUrl}', params.githubUrl)
    .replace('{projectDescription}', params.projectDescription)
    .replace('{primaryLanguage}', params.primaryLanguage)
    .replace('{projectType}', params.projectType)
    .replace('{filePath}', params.filePath)
    .replace('{expectedType}', params.expectedType)
    .replace('{expectedDescription}', params.expectedDescription)
    .replace('{language}', params.language)
    .replace('{fileContent}', params.fileContent)
}