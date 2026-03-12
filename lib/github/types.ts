// GitHub 相关类型定义

export interface TreeNode {
  name: string
  path: string
  type: 'file' | 'dir'
  children?: TreeNode[]
}

export interface GitHubRepo {
  owner: string
  repo: string
  branch?: string
}

export interface FileContent {
  content: string
  name: string
  path: string
  size: number
  language: string
}

export interface ValidateRepoResponse {
  valid: boolean
  owner?: string
  repo?: string
  error?: string
}

export interface RepoTreeResponse {
  tree: TreeNode[]
  error?: string
}

export interface FileContentResponse {
  content: string
  name: string
  path: string
  size: number
  language: string
  error?: string
}