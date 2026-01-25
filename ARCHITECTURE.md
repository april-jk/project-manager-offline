# Project Manager Offline - 架构设计文档

## 1. 数据结构设计

### 核心数据模型

```typescript
// 项目 (Project)
interface Project {
  id: string;                    // 唯一标识符 (UUID)
  name: string;                  // 项目名称
  description?: string;          // 项目描述
  color?: string;                // 项目颜色标签
  createdAt: number;             // 创建时间戳
  updatedAt: number;             // 更新时间戳
  websites: Website[];           // 关联的网站列表
  memos: Memo[];                 // 关联的备忘录列表
}

// 网站资源 (Website)
interface Website {
  id: string;                    // 唯一标识符
  projectId: string;             // 所属项目ID
  name: string;                  // 网站名称
  url: string;                   // 网站URL
  description?: string;          // 网站描述
  icon?: string;                 // 网站图标 (Base64 或 URL)
  tags?: string[];               // 标签分类
  createdAt: number;             // 创建时间戳
}

// 备忘录 (Memo)
interface Memo {
  id: string;                    // 唯一标识符
  projectId: string;             // 所属项目ID
  title: string;                 // 备忘录标题
  content: string;               // 备忘录内容 (可能被加密)
  isEncrypted: boolean;          // 是否加密
  encryptionKey?: string;        // 加密密钥标识符
  category?: string;             // 分类 (如: API Key, Password, Note)
  createdAt: number;             // 创建时间戳
  updatedAt: number;             // 更新时间戳
}

// 加密数据 (EncryptedData)
interface EncryptedData {
  iv: string;                    // 初始化向量 (Base64)
  ciphertext: string;            // 密文 (Base64)
  salt: string;                  // 盐值 (Base64)
  algorithm: string;             // 加密算法标识符
}
```

## 2. 加密方案

### 加密策略

- **算法**: AES-256-GCM (Web Crypto API)
- **密钥派生**: PBKDF2 (密码 → 密钥)
- **存储方式**: 敏感内容加密后以 JSON 格式存储在 LocalStorage

### 加密流程

1. **用户输入主密码** (可选，用于加密敏感信息)
2. **密钥派生**: 使用 PBKDF2 从主密码生成 256 位密钥
3. **生成随机 IV 和 Salt**: 每次加密都生成新的随机值
4. **AES-256-GCM 加密**: 加密敏感内容
5. **存储**: 将 IV、Salt、密文以 JSON 格式保存

### 解密流程

1. **用户输入主密码**
2. **密钥派生**: 使用相同的 Salt 从密码生成密钥
3. **AES-256-GCM 解密**: 使用 IV 和密钥解密密文
4. **返回明文**

## 3. 本地存储结构

### LocalStorage 键名

```
pm-projects: JSON.stringify(Project[])         // 所有项目
pm-encryption-config: JSON.stringify({...})    // 加密配置 (Salt, 算法版本等)
pm-app-settings: JSON.stringify({...})         // 应用设置
```

### 数据备份与导出

- 支持导出为 JSON 文件 (未加密)
- 支持导入 JSON 文件恢复数据
- 支持清空所有数据

## 4. 安全考虑

1. **主密码**: 可选设置，用于加密敏感信息
2. **浏览器隔离**: 数据完全存储在浏览器端，不上传到服务器
3. **加密密钥**: 主密码不存储，每次使用时由用户输入派生
4. **防止 XSS**: 使用 React 的自动转义，避免 innerHTML
5. **防止 CSRF**: 静态应用，无网络请求

## 5. 功能模块

### 模块划分

```
src/
├── contexts/
│   ├── ProjectContext.tsx       // 项目数据管理
│   └── EncryptionContext.tsx    // 加密/解密管理
├── hooks/
│   ├── useProjects.ts           // 项目 CRUD 操作
│   ├── useEncryption.ts         // 加密/解密操作
│   └── useLocalStorage.ts       // LocalStorage 操作
├── lib/
│   ├── encryption.ts            // 加密算法实现
│   ├── storage.ts               // 存储操作
│   └── utils.ts                 // 工具函数
├── components/
│   ├── ProjectList.tsx          // 项目列表
│   ├── ProjectCard.tsx          // 项目卡片
│   ├── WebsiteGrid.tsx          // 网站黄页
│   ├── WebsiteCard.tsx          // 网站卡片
│   ├── MemoList.tsx             // 备忘录列表
│   ├── MemoCard.tsx             // 备忘录卡片
│   └── EncryptionDialog.tsx     // 加密设置对话框
└── pages/
    ├── Home.tsx                 // 首页 (项目列表)
    ├── ProjectDetail.tsx        // 项目详情页
    └── Settings.tsx             // 设置页
```

## 6. UI/UX 设计理念

### 设计风格: 现代极简 + 功能性

- **配色**: 清爽的蓝色系 + 中性灰色
- **排版**: 清晰的字体层级，易于扫描
- **布局**: 卡片式布局，黄页形式展示资源
- **交互**: 流畅的过渡动画，清晰的反馈

### 核心视觉元素

1. **项目卡片**: 彩色标签 + 项目名称 + 资源数量
2. **网站黄页**: 网格布局，每个网站显示图标、名称、描述
3. **备忘录**: 列表形式，支持分类和加密标记
4. **加密指示**: 锁形图标表示已加密内容

