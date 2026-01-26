# Project Hub - 离线项目管理工具

![Project Hub](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-22.13.0-brightgreen)

**Project Hub** 是一个功能完整的离线项目管理工具，帮助开发者和运营人员统一管理多个项目的网站、API 密钥和备忘录。所有数据完全存储在浏览器本地，无需网络连接，确保隐私和离线可用性。

## 🎯 核心特性

### 项目管理
- 创建、编辑、删除多个项目
- 为每个项目设置彩色标签便于区分
- 项目统计信息（网站数、API 数、备忘录数）

### 资源管理
- **网站资源**: 支持 URL、可选的用户名和密码
- **API 资源**: 支持 API Key、Secret 和端点存储
- **备忘录**: 支持分类和快速编辑

### 安全特性
- **AES-256-GCM 加密**: 使用 PBKDF2 密钥派生，保护敏感信息
- **本地存储**: 所有数据完全存储在浏览器 LocalStorage，不上传到服务器
- **密码保护**: 可设置主密码保护所有数据
- **密钥隐藏**: 预览时密码和 API Key 默认隐藏，点击查看

### 用户体验
- **高密度网格展示**: 紧凑的网格布局，一行显示多个资源
- **快速访问**: 点击网站资源直接打开链接
- **预览对话框**: 查看资源详情，右上角有编辑和访问按钮
- **响应式设计**: 支持桌面、平板和手机多端访问
- **离线可用**: 完全离线工作，无需网络连接

## 🚀 快速开始

### 系统要求
- Node.js 22.13.0 或更高版本
- npm 或 pnpm 包管理器
- 现代浏览器（Chrome、Firefox、Safari、Edge）

### 安装

```bash
# 克隆项目
git clone <repository-url>
cd project-manager-offline

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

访问 `http://localhost:3000` 查看应用。

### 构建生产版本

```bash
# 构建静态文件
pnpm build

# 预览构建结果
pnpm preview
```

## 📚 文档

- [安装和部署指南](./docs/INSTALLATION.md) - 详细的安装和部署说明
- [使用指南](./docs/USER_GUIDE.md) - 功能使用说明和最佳实践
- [开发者文档](./docs/DEVELOPER.md) - 项目结构、开发流程和扩展指南
- [API 文档](./docs/API.md) - 本地存储 API 和加密函数文档

## 🏗️ 项目结构

```
project-manager-offline/
├── client/                    # 前端应用
│   ├── src/
│   │   ├── pages/            # 页面组件
│   │   ├── components/       # UI 组件
│   │   ├── contexts/         # React Context（数据管理）
│   │   ├── lib/              # 工具函数
│   │   │   ├── encryption.ts # 加密算法
│   │   │   ├── storage.ts    # 本地存储管理
│   │   │   └── utils.ts      # 通用工具
│   │   ├── App.tsx           # 主应用组件
│   │   └── index.css         # 全局样式
│   ├── public/               # 静态资源
│   └── index.html            # HTML 入口
├── docs/                      # 文档
├── package.json              # 项目配置
└── README.md                 # 项目说明
```

## 🔒 数据安全

### 加密方案
- **算法**: AES-256-GCM（对称加密）
- **密钥派生**: PBKDF2（100,000 次迭代）
- **加密字段**: 密码、API Key、API Secret
- **存储位置**: 浏览器 LocalStorage

### 隐私保证
- ✅ 所有数据完全本地存储，不上传到任何服务器
- ✅ 支持主密码保护，增强安全性
- ✅ 可随时导出、导入或清空所有数据
- ✅ 浏览器关闭后数据仍保留

## 💾 数据管理

### 导出数据
在应用菜单中选择"导出数据"，将所有项目和资源导出为 JSON 文件。

### 导入数据
在应用菜单中选择"导入数据"，从之前导出的 JSON 文件恢复数据。

### 清空数据
在应用菜单中选择"清空所有数据"，清除所有本地存储的数据（不可恢复）。

## 🛠️ 技术栈

- **框架**: React 19
- **样式**: TailwindCSS 4
- **UI 组件**: shadcn/ui
- **路由**: Wouter
- **加密**: Web Crypto API
- **构建工具**: Vite
- **包管理**: pnpm

## 📝 使用场景

### 开发者
- 管理多个项目的 API 密钥和端点
- 存储项目相关的网站链接和账户信息
- 快速访问常用的开发工具和文档

### 运营人员
- 管理多个网站的登录账户
- 存储各平台的 API 密钥
- 记录项目相关的备忘信息

### 团队协作
- 导出项目数据分享给团队成员
- 导入团队成员共享的项目数据
- 保持项目信息的统一管理

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](./LICENSE) 文件。

## 🔗 相关链接

- [React 文档](https://react.dev)
- [TailwindCSS 文档](https://tailwindcss.com)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)

## 📞 支持

如有问题或建议，欢迎通过以下方式联系：
- 提交 GitHub Issue
- 发送邮件至项目维护者

---

**最后更新**: 2026-01-25  
**版本**: 1.0.0
