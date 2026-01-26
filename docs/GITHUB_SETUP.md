# GitHub 仓库设置指南

本文档介绍如何完成 GitHub 仓库的设置，包括权限配置和 CI/CD 工作流启用。

## 问题：Workflow 权限错误

如果推送时遇到以下错误：

```
refusing to allow a GitHub App to create or update workflow `.github/workflows/build.yml` without `workflows` permission
```

这是因为 GitHub 需要额外的权限来创建和运行工作流。

## 解决方案

### 方案 1：使用个人访问令牌（推荐）

#### 1. 创建个人访问令牌

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 设置令牌名称：`Project Hub Build Token`
4. 选择作用域：
   - ✅ `repo` - 完整的仓库访问权限
   - ✅ `workflow` - 更新 GitHub Actions 工作流
   - ✅ `read:org` - 读取组织数据
5. 点击 "Generate token"
6. 复制生成的令牌（只会显示一次）

#### 2. 配置 Git 使用令牌

**方案 A：使用 Git 凭证管理器（推荐）**

```bash
# 在 macOS 上
git credential-osxkeychain store
# 输入以下内容，然后按 Ctrl+D：
# host=github.com
# username=your_username
# password=your_token

# 在 Windows 上
git credential-manager store
# 输入以下内容，然后按 Ctrl+D：
# host=github.com
# username=your_username
# password=your_token

# 在 Linux 上
git credential-cache store
# 输入以下内容，然后按 Ctrl+D：
# host=github.com
# username=your_username
# password=your_token
```

**方案 B：直接在 URL 中使用令牌（不推荐，安全风险）**

```bash
git remote set-url origin https://your_username:your_token@github.com/april-jk/project-manager-offline.git
```

#### 3. 推送代码

```bash
cd /home/ubuntu/project-manager-offline
git push origin main
```

### 方案 2：通过 GitHub 网页界面启用权限

1. 访问 https://github.com/april-jk/project-manager-offline/settings
2. 左侧菜单选择 "Actions" → "General"
3. 在 "Workflow permissions" 部分：
   - 选择 "Read and write permissions"
   - ✅ 勾选 "Allow GitHub Actions to create and approve pull requests"
4. 点击 "Save"

然后重新推送代码：

```bash
git push origin main
```

## 验证 CI/CD 工作流

### 1. 检查工作流文件

访问 https://github.com/april-jk/project-manager-offline/actions

您应该看到两个工作流：
- **CI** - 在推送到 main/develop 分支时运行
- **Build and Release** - 在创建版本标签时运行

### 2. 创建发布版本

创建第一个发布版本来测试 CI/CD：

```bash
# 创建版本标签
git tag v1.0.0
git push origin v1.0.0
```

然后访问 https://github.com/april-jk/project-manager-offline/actions 观察构建过程。

### 3. 检查发布页面

构建完成后，访问 https://github.com/april-jk/project-manager-offline/releases

您应该看到自动创建的发布，包含：
- Windows 安装程序 (.exe)
- macOS 安装程序 (.dmg)
- Linux 应用程序 (.AppImage, .deb)

## 工作流说明

### CI 工作流 (.github/workflows/ci.yml)

在以下情况下自动运行：
- 推送到 `main` 或 `develop` 分支
- 创建 Pull Request 到 `main` 或 `develop` 分支

执行任务：
- TypeScript 类型检查
- 代码格式检查
- 构建 Web 应用
- 构建 Electron 应用

### Build and Release 工作流 (.github/workflows/build.yml)

在以下情况下自动运行：
- 创建版本标签（例如 `v1.0.0`）
- 手动触发（通过 Actions 页面）

执行任务：
- 为 Windows、macOS、Linux 构建应用
- 上传构建产物
- 创建 GitHub Release
- 发布可下载的应用程序

## 环境变量和密钥

### GitHub Token

工作流中自动提供 `GITHUB_TOKEN`，用于：
- 创建 Release
- 上传构建产物
- 发布应用程序

无需手动配置。

### 代码签名（可选）

如果需要代码签名，添加以下 Secrets：

1. 访问 https://github.com/april-jk/project-manager-offline/settings/secrets/actions
2. 点击 "New repository secret"
3. 添加以下密钥：

**macOS 代码签名**
- `CSC_LINK` - 证书文件的 Base64 编码
- `CSC_KEY_PASSWORD` - 证书密码

**Windows 代码签名**
- `WIN_CSC_LINK` - 证书文件的 Base64 编码
- `WIN_CSC_KEY_PASSWORD` - 证书密码

## 故障排除

### 问题：工作流不运行

**检查清单**：
1. ✅ 确保工作流文件在 `.github/workflows/` 目录中
2. ✅ 确保文件名以 `.yml` 或 `.yaml` 结尾
3. ✅ 检查 YAML 语法是否正确
4. ✅ 检查分支名称是否匹配（main/develop）
5. ✅ 检查 Actions 权限是否启用

### 问题：构建失败

**常见原因**：
1. 依赖安装失败 - 检查 `pnpm-lock.yaml` 是否正确
2. TypeScript 编译错误 - 运行 `pnpm check` 本地检查
3. 缺少文件 - 确保 `assets/icon.png` 已提交
4. 权限问题 - 检查 GitHub Token 权限

**调试步骤**：
1. 访问 https://github.com/april-jk/project-manager-offline/actions
2. 点击失败的工作流
3. 查看详细的错误日志
4. 根据错误信息修复问题

### 问题：Release 未自动创建

**检查**：
1. ✅ 确保标签格式为 `v*`（例如 `v1.0.0`）
2. ✅ 确保构建成功完成
3. ✅ 检查 GitHub Token 权限

## 最佳实践

1. **版本管理**
   - 使用语义化版本（Semantic Versioning）
   - 标签格式：`v1.0.0`, `v1.0.1`, `v2.0.0` 等

2. **发布说明**
   - 为每个版本编写详细的发布说明
   - 列出新功能、修复和改进

3. **测试**
   - 在发布前，在本地测试构建
   - 验证所有平台的应用都能正常运行

4. **安全**
   - 定期更新依赖
   - 使用 GitHub 的安全扫描功能
   - 不要在代码中提交密钥

## 相关资源

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [GitHub Secrets 文档](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub Releases 文档](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)
- [个人访问令牌](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)

## 支持

如有问题，请：
1. 查看 GitHub Actions 的详细日志
2. 提交 GitHub Issue
3. 查看项目文档
