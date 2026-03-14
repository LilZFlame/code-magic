import { Octokit } from '@octokit/rest'
import { buildNestedTree } from './parser'
import { TreeNode } from './types'

// 创建 Octokit 实例
// 配置 GitHub Token 来提高请求限制
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

/**
 * 验证仓库是否存在
 */
export async function validateRepo(owner: string, repo: string): Promise<boolean> {
  try {
    await octokit.rest.repos.get({
      owner,
      repo,
    })
    return true
  } catch {
    return false
  }
}

/**
 * 获取仓库的默认分支
 */
export async function getDefaultBranch(owner: string, repo: string): Promise<string> {
  try {
    const { data } = await octokit.rest.repos.get({
      owner,
      repo,
    })
    return data.default_branch
  } catch {
    return 'main'
  }
}

/**
 * 获取仓库文件树
 */
export async function getRepoTree(
  owner: string,
  repo: string,
  branch?: string
): Promise<TreeNode[]> {
  // 如果没有指定分支，获取默认分支
  const targetBranch = branch || (await getDefaultBranch(owner, repo))

  try {
    // 获取分支的最新 commit SHA
    const { data: ref } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${targetBranch}`,
    })

    // 获取完整的树结构（递归）
    const { data: tree } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: ref.object.sha,
      recursive: 'true',
    })

    // 转换为嵌套结构
    return buildNestedTree(tree.tree)
  } catch (error) {
    console.error('获取文件树失败:', error)
    throw new Error('无法获取仓库文件结构')
  }
}

/**
 * 获取文件内容
 */
export async function getFileContent(
  owner: string,
  repo: string,
  path: string,
  branch?: string
): Promise<{ content: string; size: number; name: string }> {
  const targetBranch = branch || (await getDefaultBranch(owner, repo))

  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: targetBranch,
    })

    // 检查是否为文件
    if (!('content' in data) || data.type !== 'file') {
      throw new Error('请求的路径不是一个文件')
    }

    // Base64 解码内容
    const content = Buffer.from(data.content, 'base64').toString('utf-8')

    return {
      content,
      size: data.size,
      name: data.name,
    }
  } catch (error) {
    console.error('获取文件内容失败:', error)
    throw new Error('无法获取文件内容')
  }
}

/**
 * 获取仓库信息
 */
export async function getRepoInfo(owner: string, repo: string) {
  try {
    const { data } = await octokit.rest.repos.get({
      owner,
      repo,
    })
    return {
      name: data.name,
      fullName: data.full_name,
      description: data.description,
      stars: data.stargazers_count,
      forks: data.forks_count,
      language: data.language,
      defaultBranch: data.default_branch,
    }
  } catch (error) {
    console.error('获取仓库信息失败:', error)
    throw new Error('无法获取仓库信息')
  }
}