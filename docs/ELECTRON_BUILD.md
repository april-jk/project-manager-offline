# Electron 桌面应用构建指南

本文档介绍如何为 Project Hub 构建跨平台桌面应用（Windows、macOS、Linux）。

## 系统要求

### 通用要求
- Node.js 22.13.0+
- pnpm 10.4.1+
- Git

### 平台特定要求

#### Windows
- Windows 7 或更高版本
- Visual C++ Redistributable（自动包含在安装程序中）

#### macOS
- macOS 10.13 或更高版本
- Xcode Command Line Tools（可选，用于代码签名）

#### Linux
- Ubuntu 18.04 或更高版本
- 必要的构建工具：
  ```bash
  sudo apt-get install build-essential libx11-dev libxkbfile-dev
  ```

## 开发工作流

### 1. 启动开发环境

```bash
# 启动 Vite 开发服务器和 Electron
pnpm dev:electron
```

这会同时启动：
- Vite 开发服务器（http://localhost:3000）
- Electron 应用窗口

### 2. 调试应用

- 按 `Ctrl+Shift+I`（或 `Cmd+Option+I` 在 macOS）打开开发者工具
- 查看控制台输出和网络请求
- 使用 Chrome DevTools 进行调试

### 3. 热重载

修改源代码后，应用会自动重新加载（通过 Vite HMR）。

## 构建应用

### 构建当前平台

```bash
# 为当前平台构建
pnpm build:electron
```

这会生成：
- **Windows**: `.exe` 安装程序和便携版本
- **macOS**: `.dmg` 安装程序和 `.zip` 压缩包
- **Linux**: `.AppImage` 和 `.deb` 包

### 构建所有平台

```bash
# 为所有平台构建（需要交叉编译工具）
pnpm build:electron:all
```

**注意**: 交叉编译在 Linux 上可能不完全支持。建议在各平台上分别构建。

## 输出文件

构建完成后，输出文件位于 `dist/` 目录：

### Windows
- `Project Hub Setup x.x.x.exe` - NSIS 安装程序
- `Project Hub x.x.x.exe` - 便携版本（无需安装）
- `Project Hub x.x.x.exe.blockmap` - 更新文件映射

### macOS
- `Project Hub-x.x.x.dmg` - DMG 安装程序
- `Project Hub-x.x.x.zip` - ZIP 压缩包
- `Project Hub-x.x.x-mac.zip` - 另一个 ZIP 版本

### Linux
- `Project Hub-x.x.x.AppImage` - AppImage 可执行文件
- `project-hub_x.x.x_amd64.deb` - Debian 包
- `latest-linux.yml` - 更新元数据

## 发布和更新

### 1. 创建发布标签

```bash
# 创建新版本标签
git tag v1.0.1
git push origin v1.0.1
```

### 2. GitHub Actions 自动构建

当推送标签时，GitHub Actions 会自动：
1. 检出代码
2. 安装依赖
3. 为所有平台构建应用
4. 创建 GitHub Release
5. 上传构建产物

### 3. 自动更新

用户运行应用时，会自动检查更新。如果有新版本可用，会显示更新提示。

## 代码签名（可选）

### macOS 代码签名

编辑 `package.json` 中的 `build.mac` 部分：

```json
"mac": {
  "target": ["dmg", "zip"],
  "icon": "assets/icon.png",
  "category": "public.app-category.productivity",
  "identity": "Developer ID Application: Your Name (XXXXXXXXXX)"
}
```

然后设置环境变量：

```bash
export CSC_LINK=/path/to/certificate.p12
export CSC_KEY_PASSWORD=your_password
pnpm build:electron
```

### Windows 代码签名

设置环境变量：

```bash
set WIN_CSC_LINK=C:\path\to\certificate.pfx
set WIN_CSC_KEY_PASSWORD=your_password
pnpm build:electron
```

## 故障排除

### 问题：构建失败，提示找不到图标

**解决**: 确保 `assets/icon.png` 文件存在：
```bash
ls -la assets/icon.png
```

### 问题：Windows 构建失败，提示 NSIS 错误

**解决**: 在 Windows 上安装 NSIS：
```bash
# 使用 Chocolatey
choco install nsis
```

### 问题：macOS 构建失败，提示代码签名错误

**解决**: 跳过代码签名（仅用于开发）：
```bash
export CSC_IDENTITY_AUTO_DISCOVERY=false
pnpm build:electron
```

### 问题：Linux 构建失败，提示缺少依赖

**解决**: 安装必要的依赖：
```bash
sudo apt-get install build-essential libx11-dev libxkbfile-dev
```

## 配置文件

### electron/main.ts
Electron 主进程文件，处理窗口管理和应用生命周期。

### electron/preload.ts
预加载脚本，提供安全的 IPC 通信接口。

### electron/updater.ts
自动更新配置和处理逻辑。

### package.json
包含 `build` 配置，定义平台特定的构建选项。

## 最佳实践

1. **测试构建**: 在发布前，在目标平台上测试构建的应用
2. **版本管理**: 使用语义化版本（Semantic Versioning）
3. **发布说明**: 为每个版本编写详细的发布说明
4. **代码签名**: 对生产版本进行代码签名，提高用户信任
5. **自动更新**: 利用 electron-updater 提供无缝的更新体验

## 相关资源

- [Electron 官方文档](https://www.electronjs.org/docs)
- [electron-builder 文档](https://www.electron.build/)
- [electron-updater 文档](https://www.electron.build/auto-update)
- [GitHub Actions 文档](https://docs.github.com/en/actions)

## 支持

如有问题，请提交 GitHub Issue 或查看项目文档。
