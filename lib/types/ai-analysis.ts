// AI分析结果类型定义

export interface AIAnalysisResult {
  /** 分析状态 */
  status: 'success' | 'error'
  /** 错误信息（如果失败） */
  error?: string
  /** 分析数据 */
  data?: AnalysisData
}

export interface AnalysisData {
  /** 主要编程语言 */
  primaryLanguage: string
  /** 语言分布（语言 -> 文件数量） */
  languageDistribution: Record<string, number>
  /** 技术栈标签 */
  techStack: TechStackTag[]
  /** 可能的入口文件 */
  entryPoints: EntryPoint[]
  /** 项目类型 */
  projectType: ProjectType
  /** 分析置信度 (0-1) */
  confidence: number
}

export interface TechStackTag {
  /** 标签名称 */
  name: string
  /** 标签类别 */
  category: TechStackCategory
  /** 置信度 (0-1) */
  confidence: number
}

export type TechStackCategory =
  | 'framework'      // 框架: React, Vue, Next.js
  | 'library'        // 库: lodash, axios
  | 'language'       // 语言: TypeScript, Python
  | 'runtime'        // 运行时: Node.js, Deno
  | 'tool'           // 工具: Webpack, ESLint
  | 'platform'       // 平台: Docker, Kubernetes
  | 'database'       // 数据库: PostgreSQL, MongoDB
  | 'other'          // 其他

export interface EntryPoint {
  /** 文件路径 */
  path: string
  /** 入口类型 */
  type: EntryPointType
  /** 入口说明 */
  description: string
  /** 置信度 */
  confidence: number
}

export type EntryPointType =
  | 'main'           // 主入口 (main函数)
  | 'app'            // 应用入口
  | 'server'         // 服务端入口
  | 'cli'            // 命令行入口
  | 'test'           // 测试入口
  | 'config'         // 配置入口

export type ProjectType =
  | 'web-frontend'     // Web前端项目
  | 'web-backend'      // Web后端项目
  | 'fullstack'        // 全栈项目
  | 'cli-tool'         // 命令行工具
  | 'library'          // 库/包
  | 'mobile-app'       // 移动应用
  | 'desktop-app'      // 桌面应用
  | 'api-service'      // API服务
  | 'system'           // 系统程序
  | 'embedded'         // 嵌入式
  | 'data-science'     // 数据科学
  | 'other'            // 其他

// 项目类型中文映射
export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  'web-frontend': 'Web前端',
  'web-backend': 'Web后端',
  'fullstack': '全栈应用',
  'cli-tool': '命令行工具',
  'library': '库/包',
  'mobile-app': '移动应用',
  'desktop-app': '桌面应用',
  'api-service': 'API服务',
  'system': '系统程序',
  'embedded': '嵌入式',
  'data-science': '数据科学',
  'other': '其他类型',
}

// 技术栈类别配置
export const CATEGORY_CONFIG: Record<TechStackCategory, { color: string; label: string }> = {
  framework: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', label: '框架' },
  library: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', label: '库' },
  language: { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', label: '语言' },
  runtime: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', label: '运行时' },
  tool: { color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', label: '工具' },
  platform: { color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300', label: '平台' },
  database: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', label: '数据库' },
  other: { color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', label: '其他' },
}