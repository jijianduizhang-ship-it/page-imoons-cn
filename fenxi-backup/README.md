# fenxi.imoons.cn 备份包

> 备份时间：2026-04-10

## 目录说明

```
fenxi-backup/
├── dsa-web/           # 完整源码（已排除 node_modules）
│   ├── src/           # React 源代码
│   ├── public/        # 静态资源
│   ├── package.json   # 依赖清单
│   ├── vite.config.ts # Vite 构建配置
│   └── ...
├── DEPLOYMENT.md      # 完整部署文档
├── build.sh           # 一键构建脚本
└── README.md          # 本文件
```

## 快速开始

### 本地开发
```bash
cd dsa-web
npm install
npm run dev
# 访问 http://localhost:5173
```

### 一键构建
```bash
cd dsa-web
bash ../build.sh production
```

### 部署到 Cloudflare Pages
详见 `DEPLOYMENT.md` 第四章

## 技术栈
React 19 + TypeScript + Vite + TailwindCSS + Recharts + Zustand

## 后端
后端 API 地址：https://api.imoons.cn
后端在宝塔服务器独立部署，非本项目范围。
