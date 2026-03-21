# AI News Daily

每日 AI 新闻聚合与展示平台

🌐 **网站**: https://moyans.github.io/ai-news-daily

## 项目结构

```
.
├── data/                    # 原始 Markdown 新闻数据
│   └── YYYY-MM-DD/         # 按日期组织
│       ├── huxiu/          # 虎嗅 AI 频道
│       ├── x/              # X (Twitter) AI 热点
│       └── techcrunch-ai/  # TechCrunch AI
├── docs/                    # GitHub Pages 发布目录
│   ├── index.html          # 主页面
│   ├── style.css           # 极简样式
│   ├── app.js              # 筛选/搜索逻辑
│   ├── data.json           # 所有新闻数据
│   └── archive/            # 按日期归档
│       └── YYYY-MM-DD.json
├── scripts/
│   ├── build.py            # Markdown → JSON 构建
│   └── publish.sh          # 一键发布脚本
└── README.md
```

## 数据源

| 来源 | 目录 | 说明 |
|------|------|------|
| 虎嗅 AI | `data/YYYY-MM-DD/huxiu/` | 虎嗅 AI 科技频道 Top10 |
| X AI 热点 | `data/YYYY-MM-DD/x/` | X (Twitter) AI 热点 |
| TechCrunch AI | `data/YYYY-MM-DD/techcrunch-ai/` | TechCrunch AI 新闻 |

## 快速开始

### 添加新闻数据

将 Markdown 文件放入对应目录：

```bash
data/2026-03-21/huxiu/content.md
data/2026-03-21/x/content.md
data/2026-03-21/techcrunch-ai/content.md
```

### 一键发布

```bash
# 进入项目目录
cd ai-news-daily

# 执行发布脚本
./scripts/publish.sh

# 自定义提交信息
./scripts/publish.sh "添加今日新闻"
```

脚本会自动：
1. 构建 `docs/data.json`（所有新闻）
2. 生成 `docs/archive/YYYY-MM-DD.json`（按日期归档）
3. Git 提交并推送到远程仓库

## Markdown 格式

```markdown
---
## [Top 1] 标题
> [!abstract] 核心速递
> **分类**: #模型 | **热度分**: 1,632,046
> **一句话总结**: ...
> **关键词**: #GPT #Claude #模型
>
> **为何值得关注**: ...
>
> **原文链接**: [链接](https://...) | **发布时间**: 2026-03-21
---
```

## 网站功能

- ✅ 分类筛选（模型、智能体、融资等）
- ✅ 日期归档（查看历史新闻）
- ✅ 实时搜索（标题/摘要/标签）
- ✅ 热度排名（千分位显示）
- ✅ 响应式布局（移动端适配）

## 数据流程

```
data/YYYY-MM-DD/source/content.md
          ↓
     build.py（构建）
          ↓
docs/data.json + docs/archive/*.json
          ↓
     publish.sh（发布）
          ↓
     GitHub Pages（自动更新）
```

## 本地开发

```bash
# 构建数据
python3 scripts/build.py

# 本地预览（需要 HTTP 服务器）
cd docs && python3 -m http.server 8000
# 访问 http://localhost:8000
```

## 技术栈

- 前端：纯静态 HTML/CSS/JS（无框架）
- 数据：Markdown → JSON
- 托管：GitHub Pages
- 构建：Python 3