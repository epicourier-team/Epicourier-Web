#!/bin/bash

# Epicourier Demo - 启动脚本
# 使用说明: bash start-demo.sh

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$PROJECT_DIR/web"
BACKEND_DIR="$PROJECT_DIR/backend"

echo "🚀 Epicourier Demo 启动脚本"
echo "================================"
echo ""

# 检查 Docker
echo "✓ 检查 Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查 Node.js
echo "✓ 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 20+"
    exit 1
fi

# 检查 Python
echo "✓ 检查 Python..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 未安装，请先安装 Python 3.9+"
    exit 1
fi

echo ""
echo "📝 后续步骤（分别在 3 个终端中运行）:"
echo ""
echo "终端 1 - 启动 Supabase："
echo "  cd $PROJECT_DIR"
echo "  sudo npx supabase start"
echo ""
echo "终端 2 - 启动后端 API："
echo "  cd $BACKEND_DIR"
echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
echo "  uv run uvicorn api.index:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "终端 3 - 启动前端应用："
echo "  cd $WEB_DIR"
echo "  npm run dev"
echo ""
echo "================================"
echo "完成后访问: http://localhost:3000"
echo ""
