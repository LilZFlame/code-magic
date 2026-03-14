/**
 * 子函数识别分析 Prompt 模板
 */

export const SUB_FUNCTION_ANALYSIS_PROMPT = `你是一个代码项目函数调用分析专家。请分析以下入口函数调用的关键子函数。

## 项目信息
- GitHub: {githubUrl}
- 项目简介: {projectDescription}
- 主要编程语言: {primaryLanguage}
- 项目类型: {projectType}

## 入口函数信息
- 文件路径: {entryFilePath}
- 函数名: {entryFunctionName}
- 功能描述: {entryFunctionality}

## 文件内容
\`\`\`{language}
{fileContent}
\`\`\`

## 分析要求

请识别该入口函数调用的**关键子函数**（不超过20个），并返回JSON格式的分析结果。

### 判断标准

**研判推荐值 (drillDownRecommendation):**
- \`1\`: 值得深入分析 - 核心业务逻辑、关键数据处理、重要组件
- \`0\`: 待定 - 需要更多信息，可能是中间层或代理函数
- \`-1\`: 跳过分析 - 工具函数、简单getter/setter、纯展示函数

**函数类型 (functionType):**
- \`core-logic\`: 核心业务逻辑（如用户认证、订单处理）
- \`data-processing\`: 数据处理（如转换、计算、验证）
- \`io-operation\`: IO操作（如网络请求、文件读写、数据库操作）
- \`ui-component\`: UI组件渲染
- \`utility\`: 工具函数（如格式化、辅助函数）
- \`configuration\`: 配置相关（如环境变量读取、配置加载）
- \`initialization\`: 初始化（如服务启动、状态初始化）
- \`callback\`: 回调函数
- \`handler\`: 事件处理器（如点击事件、API handler）
- \`other\`: 其他

### 过滤规则
1. 跳过标准库/第三方库的函数调用
2. 跳过简单的一行函数
3. 优先识别项目内部定义的函数
4. 对于async函数中的await调用，重点关注

请严格按照以下JSON格式返回结果（不要包含任何其他文本，只返回JSON）:
{
  "entryFunctionName": "入口函数名",
  "entryFilePath": "入口文件路径",
  "subFunctions": [
    {
      "name": "函数名称",
      "filePath": "可能定义的文件路径（相对于仓库根目录的实际路径，未知则null）。注意：必须返回实际的文件系统路径，不要使用 TypeScript 路径别名（如 @/、~/、#/ 等）。例如：'components/home/RepoInputForm.tsx' 而不是 '@/components/home/RepoInputForm.tsx'",
      "description": "简洁中文描述（8-15字，突出核心功能，动词开头）",
      "drillDownRecommendation": 1或0或-1,
      "reasoning": "研判理由（中文，简短）",
      "confidence": 0.0到1.0,
      "functionType": "函数类型",
      "callLine": 调用行号（数字或null）
    }
  ],
  "analysisSummary": "整体分析摘要（中文，一句话）"
}

注意：
1. subFunctions数组按 drillDownRecommendation 降序、confidence 降序排列
2. description 必须简洁有力，8-15个中文字符，使用动词开头
   - 好: "初始化应用配置"、"加载用户数据"、"处理支付请求"
   - 差: "这个函数的作用是初始化应用程序的配置信息"
3. reasoning 也需简短，不超过20字
4. 最多返回20个子函数
5. 确保JSON格式正确，所有字段完整
`

/**
 * 生成子函数分析Prompt
 */
export function generateSubFunctionPrompt(params: {
  githubUrl: string
  projectDescription: string
  primaryLanguage: string
  projectType: string
  entryFilePath: string
  entryFunctionName: string
  entryFunctionality: string
  fileContent: string
  language: string
}): string {
  return SUB_FUNCTION_ANALYSIS_PROMPT
    .replace('{githubUrl}', params.githubUrl)
    .replace('{projectDescription}', params.projectDescription)
    .replace('{primaryLanguage}', params.primaryLanguage)
    .replace('{projectType}', params.projectType)
    .replace('{entryFilePath}', params.entryFilePath)
    .replace('{entryFunctionName}', params.entryFunctionName)
    .replace('{entryFunctionality}', params.entryFunctionality)
    .replace('{language}', params.language)
    .replace('{fileContent}', params.fileContent)
}

/**
 * AI返回的原始JSON格式
 */
export interface SubFunctionAnalysisJSON {
  entryFunctionName: string
  entryFilePath: string
  subFunctions: Array<{
    name: string
    filePath: string | null
    description: string
    drillDownRecommendation: -1 | 0 | 1
    reasoning: string
    confidence: number
    functionType: string
    callLine: number | null
  }>
  analysisSummary: string
}