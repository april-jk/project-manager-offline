# GitHub 权限授权指南

## 问题描述

推送代码时遇到以下错误：

```
refusing to allow a GitHub App to create or update workflow `.github/workflows/build.yml` without `workflows` permission
```

这是因为 GitHub 需要额外的权限来创建和运行工作流。

## 解决方案

### 步骤 1：授权 GitHub App 权限

1. **访问仓库设置**
   - 打开 https://github.com/april-jk/project-manager-offline/settings

2. **进入 Actions 设置**
   - 左侧菜单 → "Actions" → "General"

3. **配置 Workflow 权限**
   - 找到 "Workflow permissions" 部分
   - 选择 **"Read and write permissions"**
   - ✅ 勾选 "Allow GitHub Actions to create and approve pull requests"
   - 点击 "Save"

### 步骤 2：配置 Workflow 权限（可选但推荐）

1. **访问 Actions 权限**
   - 左侧菜单 → "Actions" → "General"
   - 向下滚动到 "Workflow permissions"

2. **启用必要权限**
   - ✅ "Read and write permissions"
   - ✅ "Allow GitHub Actions to create and approve pull requests"

### 步骤 3：推送代码

完成权限配置后，重新推送代码：

```bash
cd /home/ubuntu/project-manager-offline

# 如果之前的推送失败，强制推送
git push origin main -f

# 或者正常推送
git push origin main
```

## 验证权限配置

### 检查工作流是否运行

1. 访问 https://github.com/april-jk/project-manager-offline/actions
2. 应该看到 "Build and Release" 工作流正在运行
3. 等待构建完成（通常需要 10-15 分钟）

### 检查发布是否创建

1. 访问 https://github.com/april-jk/project-manager-offline/releases
2. 应该看到自动创建的 Release
3. Release 中包含所有平台的可执行文件

## 自动化流程说明

### 工作流触发条件

**Build and Release 工作流** 在以下情况下自动触发：

1. **推送到 main 分支** ✅ （每次 commit）
2. **手动触发** ✅ （通过 Actions 页面）

### 工作流执行步骤

1. **为三个平台构建应用**
   - Ubuntu 构建 Linux 版本 (.AppImage, .deb)
   - Windows 构建 Windows 版本 (.exe)
   - macOS 构建 macOS 版本 (.dmg, .zip)

2. **上传构建产物**
   - 每个平台的构建结果上传为 artifacts
   - 保留 7 天

3. **创建 Release**
   - 生成唯一的版本标签（格式：v2026.01.26-abc1234）
   - 创建 Release Notes
   - 上传所有平台的可执行文件

4. **清理旧版本**
   - 自动删除超过 10 个版本的旧 Release
   - 保持仓库整洁

## 工作流配置详解

### 触发条件

```yaml
on:
  push:
    branches:
      - main          # 推送到 main 分支时触发
  workflow_dispatch:  # 手动触发
```

### 矩阵构建

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
```

三个平台并行构建，加快速度。

### 权限配置

```yaml
permissions:
  contents: write     # 允许写入仓库内容
```

允许 GitHub Actions 创建 Release。

## 常见问题

### Q: 为什么工作流没有运行？

**检查清单**：
1. ✅ 权限已配置为 "Read and write"
2. ✅ 代码已推送到 main 分支
3. ✅ `.github/workflows/build.yml` 文件存在
4. ✅ YAML 语法正确

### Q: 为什么构建失败？

**常见原因**：
1. 依赖安装失败 - 检查 pnpm-lock.yaml
2. TypeScript 编译错误 - 本地运行 `pnpm check`
3. 缺少文件 - 确保 assets/icon.png 已提交
4. 权限不足 - 检查 GitHub Token 权限

**调试步骤**：
1. 访问 https://github.com/april-jk/project-manager-offline/actions
2. 点击失败的工作流
3. 查看详细的错误日志

### Q: 如何手动触发工作流？

1. 访问 https://github.com/april-jk/project-manager-offline/actions
2. 点击 "Build and Release" 工作流
3. 点击 "Run workflow"
4. 选择分支（main）
5. 点击 "Run workflow"

### Q: Release 多久会创建？

通常需要 10-15 分钟：
- 构建 Linux 版本：3-5 分钟
- 构建 Windows 版本：3-5 分钟
- 构建 macOS 版本：3-5 分钟
- 创建 Release：1-2 分钟

### Q: 如何下载应用？

1. 访问 https://github.com/april-jk/project-manager-offline/releases
2. 选择最新的 Release
3. 下载对应平台的文件：
   - Windows: `.exe` 文件
   - macOS: `.dmg` 文件
   - Linux: `.AppImage` 或 `.deb` 文件

## 权限说明

### 为什么需要这些权限？

| 权限 | 用途 |
|------|------|
| `contents: write` | 创建 Release 和上传文件 |
| `workflows` | 创建和更新工作流文件 |
| `actions` | 运行和管理工作流 |

### 安全考虑

- GitHub Actions 使用 `GITHUB_TOKEN` 进行身份验证
- Token 自动生成，每次工作流运行时更新
- Token 权限仅限于当前仓库
- 不会暴露个人凭证

## 相关资源

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [GitHub Permissions 文档](https://docs.github.com/en/actions/security-guides/permissions-for-github-token)
- [GitHub Secrets 文档](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

## 支持

如有问题，请：
1. 查看工作流日志
2. 检查权限配置
3. 提交 GitHub Issue
4. 查看项目文档
