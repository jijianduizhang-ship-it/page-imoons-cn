#!/bin/bash
# dsa-web 快速构建脚本
# 用法: bash build.sh [production|dev]
#
# production: 设置正式 API 地址并构建
# dev:        仅安装依赖，不设置 API 地址（本地开发用）

set -e

MODE=${1:-production}
cd "$(dirname "$0")"

echo "=== dsa-web 构建脚本 ==="
echo "模式: $MODE"

if [ ! -d "node_modules" ]; then
    echo "[1/3] 安装依赖..."
    npm install
else
    echo "[1/3] 依赖已存在，跳过安装"
fi

echo "[2/3] TypeScript 检查 + 构建..."
if [ "$MODE" = "production" ]; then
    VITE_API_URL="https://api.imoons.cn" npm run build
elif [ "$MODE" = "staging" ]; then
    VITE_API_URL="https://staging-api.imoons.cn" npm run build
else
    # dev 模式，不设置 VITE_API_URL（同源请求）
    npm run build
fi

echo "[3/3] 构建完成！"
echo ""
echo "产物目录: dist/"
echo "如需部署到 Nginx:"
echo "  sudo cp -r dist/* /usr/share/nginx/html/"
echo ""
echo "如需部署到 Cloudflare Pages:"
echo "  将 dist/ 目录下传，或通过 GitHub 触发 CI/CD"
