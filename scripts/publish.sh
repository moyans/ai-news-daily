#!/bin/bash
# 一键发布脚本：构建数据 + 推送到 GitHub Pages
# 用法: ./scripts/publish.sh ["commit message"]

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATA_DIR="$PROJECT_ROOT/data"
DOCS_DIR="$PROJECT_ROOT/docs"

cd "$PROJECT_ROOT"

echo "📁 项目目录: $PROJECT_ROOT"
echo ""

# 检查是否有新数据
echo "🔍 检查新数据..."
NEW_FILES=$(git status --porcelain data/ 2>/dev/null | grep "^??" | wc -l)
MODIFIED_FILES=$(git status --porcelain data/ 2>/dev/null | grep "^A\|^M" | wc -l)

if [ "$NEW_FILES" -gt 0 ] || [ "$MODIFIED_FILES" -gt 0 ]; then
    echo "✅ 发现新数据文件"
else
    echo "⚠️  未发现新数据文件，检查 docs/ 目录..."
fi

# 运行构建脚本
echo ""
echo "🔨 构建数据..."
python3 scripts/build.py

# 检查构建结果
if [ ! -f "$DOCS_DIR/data.json" ]; then
    echo "❌ 构建失败：data.json 未生成"
    exit 1
fi

echo "✅ 构建完成"

# 统计数据
TOTAL_NEWS=$(python3 -c "import json; print(json.load(open('$DOCS_DIR/data.json'))['meta']['total'])")
ARCHIVE_COUNT=$(ls -1 "$DOCS_DIR/archive/" 2>/dev/null | wc -l | tr -d ' ')
echo "📊 数据统计: $TOTAL_NEWS 条新闻, $ARCHIVE_COUNT 个归档"

# Git 操作
echo ""
echo "📦 Git 操作..."

# 添加所有变更
git add -A

# 检查是否有变更
if git diff --staged --quiet; then
    echo "⚠️  没有需要提交的变更"
    exit 0
fi

# 生成提交信息
if [ -z "$1" ]; then
    TODAY=$(date +"%Y-%m-%d")
    COMMIT_MSG="update: 新闻数据 $TODAY"
else
    COMMIT_MSG="$1"
fi

git commit -m "$COMMIT_MSG"
echo "✅ 提交: $COMMIT_MSG"

# 推送
echo ""
echo "🚀 推送到远程仓库..."
git push origin main
echo "✅ 推送完成"

echo ""
echo "🌐 访问: https://moyans.github.io/ai-news-daily"
echo "✅ 发布成功！"