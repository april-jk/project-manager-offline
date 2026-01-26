# 安装和部署指南

本文档详细说明如何安装、配置和部署 Project Hub 应用。

## 目录

1. [系统要求](#系统要求)
2. [开发环境安装](#开发环境安装)
3. [生产部署](#生产部署)
4. [Docker 部署](#docker-部署)
5. [故障排除](#故障排除)

## 系统要求

### 最低要求
- **Node.js**: 22.13.0 或更高版本
- **npm**: 10.0.0 或更高版本（或 pnpm 10.0.0+）
- **操作系统**: Windows、macOS、Linux
- **浏览器**: Chrome、Firefox、Safari、Edge（最新版本）

### 推荐配置
- **Node.js**: 22.13.0 LTS
- **pnpm**: 10.15.1（推荐使用 pnpm 以获得更快的安装速度）
- **磁盘空间**: 至少 500MB（包括 node_modules）
- **内存**: 至少 2GB RAM

## 开发环境安装

### 1. 克隆项目

```bash
# 使用 HTTPS
git clone https://github.com/your-username/project-manager-offline.git
cd project-manager-offline

# 或使用 SSH
git clone git@github.com:your-username/project-manager-offline.git
cd project-manager-offline
```

### 2. 安装依赖

```bash
# 使用 pnpm（推荐）
pnpm install

# 或使用 npm
npm install

# 或使用 yarn
yarn install
```

### 3. 启动开发服务器

```bash
# 使用 pnpm
pnpm dev

# 或使用 npm
npm run dev
```

应用将在 `http://localhost:3000` 启动。

### 4. 开发工作流

```bash
# 类型检查
pnpm check

# 代码格式化
pnpm format

# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview
```

## 生产部署

### 1. 构建应用

```bash
# 构建静态文件
pnpm build

# 输出目录: dist/
```

### 2. 部署到静态托管服务

#### Vercel（推荐）

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```

#### Netlify

```bash
# 安装 Netlify CLI
npm i -g netlify-cli

# 部署
netlify deploy --prod --dir=dist
```

#### GitHub Pages

```bash
# 在 package.json 中添加
"homepage": "https://your-username.github.io/project-manager-offline"

# 构建
pnpm build

# 部署到 gh-pages 分支
git subtree push --prefix dist origin gh-pages
```

#### AWS S3 + CloudFront

```bash
# 构建
pnpm build

# 上传到 S3
aws s3 sync dist/ s3://your-bucket-name/ --delete

# 清除 CloudFront 缓存
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### 3. 自托管（Nginx）

```bash
# 构建
pnpm build

# 复制文件到 Nginx 目录
sudo cp -r dist/* /var/www/html/project-hub/

# Nginx 配置
```

**Nginx 配置示例** (`/etc/nginx/sites-available/project-hub`):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/html/project-hub;
    index index.html;

    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 处理 SPA 路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/project-hub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. 自托管（Apache）

**Apache 配置示例** (`.htaccess`):

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    
    # 不重写已存在的文件或目录
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    
    # 所有请求重定向到 index.html
    RewriteRule ^ index.html [QSA,L]
</IfModule>

# 缓存设置
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/html "access plus 0 seconds"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType image/* "access plus 1 year"
</IfModule>
```

## Docker 部署

### 1. 创建 Dockerfile

在项目根目录创建 `Dockerfile`:

```dockerfile
# 构建阶段
FROM node:22.13.0-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json pnpm-lock.yaml ./

# 安装依赖
RUN npm install -g pnpm && pnpm install

# 复制源代码
COPY . .

# 构建应用
RUN pnpm build

# 运行阶段
FROM node:22.13.0-alpine

WORKDIR /app

# 安装 serve 用于提供静态文件
RUN npm install -g serve

# 从构建阶段复制构建结果
COPY --from=builder /app/dist ./dist

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["serve", "-s", "dist", "-l", "3000"]
```

### 2. 创建 .dockerignore

```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env.local
dist
.DS_Store
```

### 3. 构建和运行 Docker 镜像

```bash
# 构建镜像
docker build -t project-hub:latest .

# 运行容器
docker run -p 3000:3000 project-hub:latest

# 访问 http://localhost:3000
```

### 4. Docker Compose

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  project-hub:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

启动：

```bash
docker-compose up -d
```

## 故障排除

### 问题 1: 端口 3000 已被占用

```bash
# 使用不同的端口
pnpm dev -- --port 3001

# 或杀死占用端口的进程
lsof -i :3000
kill -9 <PID>
```

### 问题 2: 依赖安装失败

```bash
# 清除缓存
pnpm store prune

# 重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### 问题 3: 构建失败

```bash
# 检查 TypeScript 错误
pnpm check

# 清除构建缓存
rm -rf dist .next

# 重新构建
pnpm build
```

### 问题 4: 应用在生产环境中无法加载

- 检查 `dist/` 目录是否存在
- 确认 Web 服务器配置正确（特别是 SPA 路由配置）
- 检查浏览器控制台的错误信息
- 验证 CORS 配置（如果有跨域请求）

### 问题 5: 数据未保存

- 检查浏览器是否启用了 LocalStorage
- 确认没有使用隐私/无痕浏览模式
- 检查浏览器存储限制（通常为 5-10MB）

## 性能优化

### 1. 启用 Gzip 压缩

**Nginx**:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
```

**Apache**:
```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/css application/javascript
</IfModule>
```

### 2. 启用 HTTP/2

**Nginx**:
```nginx
listen 443 ssl http2;
```

### 3. 使用 CDN

将 `dist/` 目录的静态文件上传到 CDN（如 Cloudflare、AWS CloudFront）。

## 安全建议

1. **启用 HTTPS**: 在生产环境中始终使用 HTTPS
2. **安全头**: 配置 CSP、X-Frame-Options 等安全头
3. **定期更新**: 定期更新 Node.js 和依赖包
4. **备份数据**: 定期导出用户数据作为备份
5. **监控日志**: 监控服务器日志以检测异常活动

## 常见问题

**Q: 应用支持离线使用吗？**  
A: 是的，应用完全离线工作。所有数据存储在浏览器 LocalStorage 中。

**Q: 可以在多个设备上同步数据吗？**  
A: 目前不支持自动同步。您可以通过导出/导入功能手动同步数据。

**Q: 数据会丢失吗？**  
A: 只要浏览器 LocalStorage 未被清除，数据就会保留。建议定期导出数据作为备份。

**Q: 支持多用户吗？**  
A: 目前不支持多用户。每个浏览器实例有独立的数据存储。

---

**最后更新**: 2026-01-25
