#!/bin/bash
# 每日虎嗅AI新闻自动抓取 + 上传 + 发布
# 用法: bash scripts/daily_update.sh

set -e

SKILL_DIR="/root/.openclaw/skills/huxiu-news"
REPO_DIR="/root/.openclaw/workspace/ai-news-daily"
TODAY=$(date +%Y-%m-%d)
TODAY_UTC=$(date -u +%Y-%m-%d)
TARGET_DIR="data/${TODAY}/huxiu"
OUTPUT_FILE="${REPO_DIR}/${TARGET_DIR}/content.md"

echo "=== 虎嗅AI新闻每日更新 $(date) ==="

# 1. 抓取新闻
echo "[1/5] 抓取虎嗅AI新闻..."
python3 "${SKILL_DIR}/scripts/fetch_huxiu.py" --limit 10 --output /tmp/huxiu_news.json --quiet 2>&1

# 2. 转换为 ai-news-daily 格式的 Markdown
echo "[2/5] 转换格式..."
python3 << 'PYEOF'
import json
from datetime import datetime

with open('/tmp/huxiu_news.json') as f:
    data = json.load(f)

date = data['date']
items = data['items']

md = f"# 虎嗅AI热点 {date}\n\n"
for i, item in enumerate(items):
    content = item['raw_json'].get('content_text', item['raw_json'].get('summary', ''))
    md += f"## [Top {i+1}] {item['title']}\n\n"
    md += f"**时间**: {item['captured_at']}\n\n"
    # 摘要取前200字
    summary = content[:300].strip() if content else ''
    md += f"{summary}\n\n"
    md += f"---\n\n"

with open('/tmp/huxiu_news.md', 'w') as f:
    f.write(md)
print("done")
PYEOF

# 3. 写入仓库
echo "[3/5] 写入仓库..."
mkdir -p "${REPO_DIR}/${TARGET_DIR}"
cp /tmp/huxiu_news.md "${OUTPUT_FILE}"
echo "  -> ${TARGET_DIR}/content.md"

# 4. Git add + commit
cd "${REPO_DIR}"
git add "${TARGET_DIR}/content.md"

if git diff --cached --quiet; then
    echo "[4/5] 无新变更，跳过 commit"
else
    COMMIT_MSG="content(huxiu): add daily AI news for ${TODAY}"
    git commit -m "${COMMIT_MSG}"
    echo "[4/5] 提交: ${COMMIT_MSG}"
fi

# 5. 推送到远程
echo "[5/5] 推送..."
git push origin main 2>&1

# 6. 运行发布脚本
echo ""
echo "=== 运行发布脚本 ==="
cd "${REPO_DIR}"
bash scripts/publish.sh "update: 新闻数据 ${TODAY}"

echo ""
echo "=== 完成 $(date) ==="
