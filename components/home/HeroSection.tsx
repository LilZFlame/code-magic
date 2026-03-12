import { Logo } from './Logo'

export function HeroSection() {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-6">
        <Logo />
      </div>

      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
        GitHub 项目代码分析
      </h1>

      <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
        输入 GitHub 仓库地址，即可可视化浏览项目结构和代码文件
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          支持公开仓库
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          语法高亮
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-400" />
          树形结构
        </div>
      </div>
    </div>
  )
}