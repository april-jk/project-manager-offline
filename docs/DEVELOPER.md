# 开发者文档

本文档面向想要理解、修改或扩展 Project Hub 的开发者。

## 目录

1. [项目结构](#项目结构)
2. [技术栈](#技术栈)
3. [开发流程](#开发流程)
4. [核心模块](#核心模块)
5. [API 文档](#api-文档)
6. [扩展指南](#扩展指南)
7. [测试](#测试)
8. [常见问题](#常见问题)

## 项目结构

```
project-manager-offline/
├── client/                           # 前端应用
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx             # 主页面
│   │   │   └── NotFound.tsx         # 404 页面
│   │   ├── components/
│   │   │   ├── ui/                  # shadcn/ui 组件
│   │   │   ├── ProjectCard.tsx      # 项目卡片
│   │   │   ├── WebsiteCard.tsx      # 网站卡片
│   │   │   ├── MemoCard.tsx         # 备忘录卡片
│   │   │   └── TreeNav.tsx          # 树状导航
│   │   ├── contexts/
│   │   │   ├── ProjectContext.tsx   # 项目数据管理
│   │   │   ├── EncryptionContext.tsx # 加密管理
│   │   │   └── ThemeContext.tsx     # 主题管理
│   │   ├── lib/
│   │   │   ├── encryption.ts        # 加密算法
│   │   │   ├── storage.ts           # 本地存储管理
│   │   │   └── utils.ts             # 工具函数
│   │   ├── App.tsx                  # 主应用组件
│   │   ├── main.tsx                 # 应用入口
│   │   └── index.css                # 全局样式
│   ├── public/                       # 静态资源
│   ├── index.html                   # HTML 模板
│   └── tsconfig.json                # TypeScript 配置
├── docs/                             # 文档
│   ├── INSTALLATION.md              # 安装指南
│   ├── USER_GUIDE.md                # 用户指南
│   ├── DEVELOPER.md                 # 开发者文档
│   └── API.md                       # API 文档
├── package.json                     # 项目配置
├── tsconfig.json                    # TypeScript 配置
├── vite.config.ts                   # Vite 配置
├── tailwind.config.js               # TailwindCSS 配置
└── README.md                        # 项目说明
```

## 技术栈

### 前端框架
- **React 19**: 用户界面框架
- **Vite**: 快速构建工具
- **TypeScript**: 类型安全的 JavaScript

### 样式和 UI
- **TailwindCSS 4**: 原子化 CSS 框架
- **shadcn/ui**: React 组件库
- **Lucide React**: 图标库

### 状态管理
- **React Context**: 全局状态管理
- **useReducer**: 复杂状态逻辑

### 路由
- **Wouter**: 轻量级路由库

### 加密和存储
- **Web Crypto API**: 浏览器原生加密
- **LocalStorage**: 浏览器本地存储

### 开发工具
- **ESLint**: 代码检查
- **Prettier**: 代码格式化
- **TypeScript**: 类型检查

## 开发流程

### 1. 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 打开浏览器访问 http://localhost:3000
```

### 2. 代码编辑

- 编辑文件后，Vite 会自动热更新（HMR）
- 浏览器会自动刷新显示最新改动

### 3. 类型检查

```bash
# 检查 TypeScript 错误
pnpm check

# 监视模式
pnpm check --watch
```

### 4. 代码格式化

```bash
# 格式化所有文件
pnpm format
```

### 5. 构建生产版本

```bash
# 构建
pnpm build

# 预览构建结果
pnpm preview
```

## 核心模块

### 1. 加密模块 (`lib/encryption.ts`)

**功能**: 使用 Web Crypto API 进行 AES-256-GCM 加密

**主要函数**:

```typescript
// 生成密钥
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey>

// 加密数据
async function encryptData(data: string, key: CryptoKey): Promise<string>

// 解密数据
async function decryptData(encryptedData: string, key: CryptoKey): Promise<string>
```

**使用示例**:

```typescript
import { deriveKey, encryptData, decryptData } from '@/lib/encryption';

// 生成密钥
const salt = crypto.getRandomValues(new Uint8Array(16));
const key = await deriveKey('password', salt);

// 加密
const encrypted = await encryptData('sensitive data', key);

// 解密
const decrypted = await decryptData(encrypted, key);
```

### 2. 存储模块 (`lib/storage.ts`)

**功能**: 管理本地存储和数据结构

**数据结构**:

```typescript
interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  websites: Website[];
  memos: Memo[];
  createdAt: string;
  updatedAt: string;
}

interface Website {
  id: string;
  type: 'website' | 'api';
  name: string;
  url?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  apiSecret?: string;
  apiEndpoint?: string;
  description?: string;
  tags?: string[];
  isEncrypted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Memo {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}
```

**主要函数**:

```typescript
// 获取所有项目
function getProjects(): Project[]

// 创建项目
function createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project

// 更新项目
function updateProject(id: string, updates: Partial<Project>): void

// 删除项目
function deleteProject(id: string): void

// 导出数据
function exportData(): string

// 导入数据
function importData(data: string): void

// 清空数据
function clearAllData(): void
```

### 3. 项目上下文 (`contexts/ProjectContext.tsx`)

**功能**: 管理项目和资源的全局状态

**主要方法**:

```typescript
interface ProjectContextType {
  projects: Project[];
  createProject: (name: string, description: string, color: string) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  createWebsite: (projectId: string, website: Omit<Website, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateWebsiteData: (id: string, updates: Partial<Website>) => void;
  deleteWebsite: (projectId: string, websiteId: string) => void;
  createMemo: (projectId: string, memo: Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateMemo: (projectId: string, memoId: string, updates: Partial<Memo>) => void;
  deleteMemo: (projectId: string, memoId: string) => void;
  exportData: () => string;
  importData: (data: string) => void;
  clearAllData: () => void;
}
```

**使用示例**:

```typescript
import { useProjectContext } from '@/contexts/ProjectContext';

function MyComponent() {
  const { projects, createProject } = useProjectContext();
  
  const handleCreate = () => {
    createProject('新项目', '项目描述', '#3b82f6');
  };
  
  return (
    <div>
      {projects.map(project => (
        <div key={project.id}>{project.name}</div>
      ))}
      <button onClick={handleCreate}>创建项目</button>
    </div>
  );
}
```

### 4. 加密上下文 (`contexts/EncryptionContext.tsx`)

**功能**: 管理加密密钥和解密操作

**主要方法**:

```typescript
interface EncryptionContextType {
  isEncrypted: boolean;
  setEncrypted: (encrypted: boolean) => void;
  encryptValue: (value: string) => Promise<string>;
  decryptValue: (value: string) => Promise<string>;
}
```

## API 文档

### 加密 API

#### `deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey>`

从密码派生加密密钥。

**参数**:
- `password`: 用户密码
- `salt`: 随机盐值（16 字节）

**返回**: CryptoKey 对象

**示例**:
```typescript
const salt = crypto.getRandomValues(new Uint8Array(16));
const key = await deriveKey('mypassword', salt);
```

#### `encryptData(data: string, key: CryptoKey): Promise<string>`

加密数据。

**参数**:
- `data`: 要加密的字符串
- `key`: CryptoKey 对象

**返回**: Base64 编码的加密数据

**示例**:
```typescript
const encrypted = await encryptData('sensitive data', key);
```

#### `decryptData(encryptedData: string, key: CryptoKey): Promise<string>`

解密数据。

**参数**:
- `encryptedData`: Base64 编码的加密数据
- `key`: CryptoKey 对象

**返回**: 解密后的字符串

**示例**:
```typescript
const decrypted = await decryptData(encrypted, key);
```

### 存储 API

#### `getProjects(): Project[]`

获取所有项目。

**返回**: Project 数组

#### `createProject(project: ProjectInput): Project`

创建新项目。

**参数**:
```typescript
interface ProjectInput {
  name: string;
  description: string;
  color: string;
}
```

**返回**: 创建的 Project 对象

#### `exportData(): string`

导出所有数据为 JSON 字符串。

**返回**: JSON 字符串

#### `importData(data: string): void`

导入数据。

**参数**:
- `data`: JSON 字符串

## 扩展指南

### 添加新的资源类型

1. **更新数据结构** (`lib/storage.ts`):

```typescript
interface Website {
  // 现有字段...
  customField?: string; // 新字段
}
```

2. **更新 UI 组件** (`pages/Home.tsx`):

```typescript
// 在资源类型选择对话框中添加新类型
<button onClick={() => handleSelectResourceType('newtype')}>
  新类型
</button>

// 在表单中添加新字段
{selectedResourceType === 'newtype' && (
  <Input
    value={customField}
    onChange={(e) => setCustomField(e.target.value)}
    placeholder="新字段"
  />
)}
```

3. **更新预览对话框** (`pages/Home.tsx`):

```typescript
{previewingResource?.type === 'newtype' && (
  <div>
    <label>新字段</label>
    <div>{previewingResource?.customField}</div>
  </div>
)}
```

### 添加新的功能

1. **创建新的 Context** (如需要):

```typescript
// contexts/MyFeatureContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface MyFeatureContextType {
  // 定义类型
}

const MyFeatureContext = createContext<MyFeatureContextType | undefined>(undefined);

export function MyFeatureProvider({ children }: { children: React.ReactNode }) {
  // 实现逻辑
  return (
    <MyFeatureContext.Provider value={{}}>
      {children}
    </MyFeatureContext.Provider>
  );
}

export function useMyFeature() {
  const context = useContext(MyFeatureContext);
  if (!context) {
    throw new Error('useMyFeature must be used within MyFeatureProvider');
  }
  return context;
}
```

2. **在 App.tsx 中添加 Provider**:

```typescript
<MyFeatureProvider>
  {/* 其他内容 */}
</MyFeatureProvider>
```

### 修改样式

1. **全局样式** (`client/src/index.css`):

```css
@layer components {
  .my-custom-class {
    @apply text-lg font-semibold text-blue-600;
  }
}
```

2. **组件样式** (在 JSX 中):

```typescript
<div className="bg-blue-50 p-4 rounded-lg">
  内容
</div>
```

## 测试

### 单元测试

```bash
# 运行测试
pnpm test

# 监视模式
pnpm test --watch
```

### 集成测试

建议使用 Playwright 或 Cypress 进行 E2E 测试。

### 手动测试清单

- [ ] 创建项目
- [ ] 编辑项目
- [ ] 删除项目
- [ ] 添加网站资源
- [ ] 添加 API 资源
- [ ] 编辑资源
- [ ] 删除资源
- [ ] 查看资源详情
- [ ] 加密/解密功能
- [ ] 导出数据
- [ ] 导入数据
- [ ] 清空数据
- [ ] 响应式设计（桌面、平板、手机）
- [ ] 离线功能

## 常见问题

### Q: 如何添加新的依赖包？

```bash
pnpm add package-name
```

### Q: 如何更新依赖包？

```bash
# 更新所有包
pnpm update

# 更新特定包
pnpm update package-name
```

### Q: 如何调试加密问题？

1. 打开浏览器开发者工具
2. 在 `lib/encryption.ts` 中添加 `console.log()`
3. 检查 LocalStorage 中的加密数据

### Q: 如何处理 TypeScript 错误？

```bash
# 检查错误
pnpm check

# 修复错误后重新检查
pnpm check
```

### Q: 如何优化性能？

1. 使用 React DevTools Profiler
2. 检查不必要的重新渲染
3. 使用 `useMemo` 和 `useCallback` 优化
4. 分析 bundle 大小

### Q: 如何添加新的页面？

1. 在 `pages/` 目录创建新组件
2. 在 `App.tsx` 中添加路由
3. 在导航中添加链接

---

**最后更新**: 2026-01-25

**需要帮助?** 查看 [用户指南](./USER_GUIDE.md) 或提交 GitHub Issue。
