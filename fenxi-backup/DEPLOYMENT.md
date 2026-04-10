# fenxi.imoons.cn 部署文档

> 备份时间：2026-04-10
> 源码路径：`/fenxi-backup/dsa-web/`

---

## 一、项目概述

### 1.1 是什么

**dsa-web** 是一个股票数据分析平台，功能包括：
- 每日选股分析（AI 诊断报告）
- 持仓组合管理（多券商账户）
- 股票回测
- AI 对话分析
- 搜索历史管理

### 1.2 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite 7 |
| UI 框架 | TailwindCSS 4 |
| 图表 | Recharts |
| 状态管理 | Zustand |
| Markdown | react-markdown + remark-gfm |
| 路由 | react-router-dom 7 |
| HTTP 客户端 | axios |
| 部署目标 | 任意静态托管（Cloudflare Pages / Vercel / 宝塔） |

### 1.3 依赖环境

- **Node.js** ≥ 18（建议 20+）
- **npm** ≥ 10

---

## 二、源码结构

```
dsa-web/
├── src/
│   ├── api/               # API 调用层（认证/分析/持仓/回测/系统配置）
│   ├── components/        # React 组件
│   │   ├── common/        # 通用组件（Button/Card/Input/Modal/等25+组件）
│   │   ├── dashboard/     # 仪表盘面板
│   │   ├── history/       # 历史记录
│   │   ├── layout/        # 布局（Shell + Sidebar）
│   │   ├── report/        # 报告展示
│   │   ├── settings/      # 设置页
│   │   ├── StockAutocomplete/  # 股票搜索
│   │   ├── tasks/         # 异步任务追踪
│   │   └── theme/          # 主题切换
│   ├── contexts/          # React Context（AuthContext）
│   ├── hooks/             # 自定义 Hooks
│   ├── pages/             # 页面（Home/Portfolio/Backtest/Chat/Settings/Login）
│   ├── stores/            # Zustand 状态管理
│   ├── types/             # TypeScript 类型定义
│   ├── utils/             # 工具函数
│   ├── App.tsx
│   └── main.tsx
├── public/                # 静态资源
├── index.html
├── package.json
├── vite.config.ts         # Vite 配置
├── tailwind.config.js     # TailwindCSS 配置
└── tsconfig.json          # TypeScript 配置
```

---

## 三、本地开发

### 3.1 安装依赖

```bash
cd dsa-web
npm install
```

### 3.2 启动开发服务器

```bash
npm run dev
# 访问 http://localhost:5173
# API 请求会自动代理到 http://127.0.0.1:8000（本地后端）
```

### 3.3 环境变量配置

创建 `.env.local` 文件：

```bash
# 指定后端 API 地址（不填则同源）
VITE_API_URL=https://api.imoons.cn
```

### 3.4 本地构建

```bash
npm run build
# 输出到 /opt/static（Vite 配置中指定）
```

---

## 四、部署到 Cloudflare Pages（推荐）

### 4.1 方式一：GitHub 持续部署

**前提：** GitHub 仓库已创建（用户名 `jijianduizhang-ship-it`）

**步骤：**

1. 将源码上传到 GitHub：
```bash
cd /fenxi-backup/dsa-web
git init
git add .
git commit -m "dsa-web backup 2026-04-10"
git branch -M main
git remote add origin https://github.com/jijianduizhang-ship-it/dsa-web.git
git push -u origin main
```

2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)

3. 进入 **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**

4. 选择 GitHub 仓库 `jijianduizhang-ship-it/dsa-web`

5. 配置构建：
   - **Project name:** `dsa-web`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `./`

6. 添加环境变量：
   - `VITE_API_URL` = `https://api.imoons.cn`

7. 点击 **Save and Deploy**

### 4.2 方式二：直接上传 dist（离线部署）

```bash
# 在有 Node.js 的机器上构建
cd dsa-web
npm install
npm run build

# 打包 dist 目录
tar -czvf dsa-web-dist.tar.gz dist/

# 上传到新服务器，解压到 Nginx 目录
tar -xzvf dsa-web-dist.tar.gz -C /usr/share/nginx/html/
```

---

## 五、部署到 Vercel

```bash
npm i -g vercel
cd dsa-web
vercel --prod
```

部署时添加环境变量：
- `VITE_API_URL` = `https://api.imoons.cn`

---

## 六、部署到宝塔（nginx）

### 6.1 构建

```bash
cd dsa-web
npm install
npm run build
```

Vite 会把产物输出到 `dist/` 目录（Vite 配置 `outDir` 为 `/opt/static`，本地构建产物在 `dist/`）。

### 6.2 Nginx 配置

```nginx
server {
    listen 80;
    server_name fenxi.imoons.cn;

    root /www/wwwroot/fenxi.imoons.cn;
    index index.html;

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理到后端
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 6.3 SSL 证书

在宝塔面板 → 网站 → fenxi.imoons.cn → SSL → Let's Encrypt 申请。

---

## 七、后端 API 说明

dsa-web 是纯前端，SPA 所有 API 请求发送到后端服务。

### 7.1 后端地址配置

前端通过 `VITE_API_URL` 环境变量指定后端地址。

**默认行为（不设置 VITE_API_URL）：** 同源请求，假设后端在同域名下（由 Nginx 代理 `/api/` 到后端服务）。

### 7.2 API 基础路径

- 所有 API 路径前缀：`/api/v1/`
- 认证相关：`/api/v1/auth/*`
- 股票分析：`/api/v1/analysis/*`
- 持仓管理：`/api/v1/portfolio/*`
- 回测：`/api/v1/backtest/*`
- AI Agent：`/api/v1/agent/*`
- 系统配置：`/api/v1/system-config/*`

### 7.3 后端服务部署

后端运行在 **宝塔服务器**（43.139.124.235 或其他 IP），端口 8000。

**后端技术栈（推测）：**
- Node.js + Express
- PostgreSQL 数据库
- SSE（Server-Sent Events）用于异步任务推送

**重启后端：**
```bash
ssh root@<server_ip>
pm2 restart api-imoons-cn
# 或
node /www/wwwroot/api.imoons.cn/server.js
```

---

## 八、数据说明

### 8.1 本地存储

- 用户认证 Token：localStorage
- 主题偏好：localStorage
- 分析历史：后端数据库

### 8.2 数据库

PostgreSQL 数据库，位于后端服务器。

**主要表（从源码类型推断）：**
- `users` — 用户
- `stock_accounts` — 证券账户
- `stock_positions` — 持仓
- `stock_trades` — 成交记录
- `stock_analysis_reports` — 分析报告
- `stock_pool` — 股票池
- `stock_watchlist` — 关注列表
- `backtest_runs` — 回测记录

---

## 九、迁移检查清单

### 迁移前（在原服务器）

- [ ] 导出 PostgreSQL 数据库
- [ ] 备份完整源码（已备份：`/fenxi-backup/dsa-web/`）
- [ ] 记录环境变量（`VITE_API_URL`）
- [ ] 记录 Nginx 配置
- [ ] 记录 PM2/进程管理配置

### 迁移时

- [ ] 上传源码到新服务器
- [ ] 导入数据库
- [ ] 配置 Nginx + SSL
- [ ] 设置环境变量
- [ ] 安装 Node.js 依赖
- [ ] 构建：`npm run build`
- [ ] 配置 API 域名解析

### 迁移后验证

- [ ] 页面可访问
- [ ] 登录功能正常
- [ ] 搜索股票有返回
- [ ] 分析报告可生成
- [ ] 持仓数据正常显示
- [ ] 回测功能正常

---

## 十、快速重新部署（GitHub → CF Pages）

如果已有 GitHub 仓库，每次更新只需：

```bash
cd dsa-web
git add .
git commit -m "update"
git push origin main
# Cloudflare Pages 自动检测到 push，约 1-2 分钟后上线
```

---

## 十一、常见问题

### Q: 构建失败，提示 `react-markdown` 找不到

```bash
npm install
# 或
npm install react-markdown remark-gfm
```

### Q: API 请求 404

检查 `VITE_API_URL` 环境变量是否正确设置，指向有后端服务的地址。

### Q: 页面空白，React 没加载

检查浏览器控制台，可能 `index.html` 中的 `src` 路径有问题，或 TailwindCSS 构建失败。

### Q: 想改后端 API 地址

重新构建，指定环境变量：
```bash
VITE_API_URL=https://new-api.example.com npm run build
```

---

## 十二、相关地址

| 地址 | 说明 |
|------|------|
| https://fenxi.imoons.cn | 原站 |
| https://api.imoons.cn | 后端 API |
| /fenxi-backup/dsa-web/ | 源码备份 |
| Cloudflare Pages | 托管地址（如已迁移）|

---

> 文档生成时间：2026-04-10 🐾
