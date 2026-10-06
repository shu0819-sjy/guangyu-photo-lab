# Guangyu Photo Lab (光屿 · 智能构图裁切)

[![CI](https://github.com/shu0819-sjy/guangyu-photo-lab/actions/workflows/ci.yml/badge.svg)](https://github.com/shu0819-sjy/guangyu-photo-lab/actions/workflows/ci.yml)
[![Deploy GitHub Pages](https://github.com/shu0819-sjy/guangyu-photo-lab/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/shu0819-sjy/guangyu-photo-lab/actions/workflows/deploy-pages.yml)

一个基于 Vite 和原生 JavaScript 的本地照片构图与调色实验室。选择照片后，可以在浏览器中完成构图裁切、光影调整、色彩预设和质量评分；图片处理在浏览器本地完成，不上传到后端。

在线预览：[GitHub Pages](https://shu0819-sjy.github.io/guangyu-photo-lab/)。页面内容为中文，代码和 CI 文档以英文为主。

## 功能

| 模块 | 说明 |
|---|---|
| 构图裁切 | 三分法、居中、极简、电影宽银幕等预设；支持自由比例、1:1 到 16:9、缩放和偏移。 |
| 光影 | 亮度和阴影实时调整。 |
| 色彩 | 风景、人像、胶片、商业、黑白预设，以及 R/O/Y/G/C/B/M 通道微调。 |
| 评分报告 | 按构图 30、光影 25、色彩 25、细节 20 的规则权重生成提示，并在本地保留历史。 |

评分是规则启发式结果，不是训练模型或专业摄影结论。

## 环境要求

- Node.js 20 LTS 或更新版本；CI 覆盖 Node 20 和 Node 22；
- npm 10 或更新版本；使用仓库提交的 `package-lock.json`；
- 支持 Windows、macOS、Linux 的 Node/Vite 开发环境；
- 运行时只需要现代浏览器，不需要后端或数据库。

## 安装与开发

在仓库根目录执行：

```sh
npm ci
npm run dev
```

`npm ci` 按 lockfile 安装精确依赖。开发服务器监听 `0.0.0.0`，终端会显示本地访问地址。常用命令：

```sh
npm run build    # 生产构建到 dist/
npm run preview  # 预览 dist/ 构建结果
npm run lint     # ESLint 静态检查
```

`dist/` 是构建产物，不需要手工编辑。GitHub Pages 工作流会在 Ubuntu/Node 20 上重新安装依赖、构建并发布 `dist/`；CI 的其他平台只验证构建与静态检查。

## 浏览器验证边界

仓库目前没有 Playwright、Cypress 等真实浏览器测试框架，因此 CI 不会声称已经自动验证图片上传、Canvas 预览、拖拽裁切或移动端触控。发布前请在目标浏览器手工验证：

1. 选择本地 JPG/PNG 图片，确认预览和裁切比例切换正常；
2. 调整光影、色彩、缩放和偏移，确认预览没有报错或明显溢出；
3. 打开评分报告，确认建议和历史记录可显示；
4. 在桌面 Chromium、Firefox、Safari（如适用）和窄屏视口各检查一次；
5. 断开网络后刷新，确认本地资源仍可加载；外部图片资源若存在，确认降级效果可接受。

## CI 与发布

CI 在 Windows、macOS、Ubuntu 上运行 Node 20/22 矩阵：`npm ci`、ESLint、Vite build 和 `dist/index.html` 产物检查。GitHub Pages 部署保持单独的 Ubuntu/Node 20 工作流，避免把部署权限扩散到普通 Pull Request 检查。

## 项目结构

```text
src/
  main.js      # 应用状态、构图方案和比例选项
  light.js     # 光影模块
  color.js     # 色彩预设和通道微调
  detail.js    # 细节模块
  score.js     # 评分报告与本地历史
public/        # 示例资源
.github/
  workflows/ci.yml
  workflows/deploy-pages.yml
```

示例资源是占位 SVG。仓库不包含后端、账号体系或云端图片存储。

## 许可证

本项目采用 [MIT License](./LICENSE)。示例资源和第三方依赖可能有额外许可，请在再分发前分别确认。
