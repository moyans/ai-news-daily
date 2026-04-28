---
name: huxiu-ai-news
description: 抓取虎嗅 AI 科技频道 Top10 新闻，解析详情页并生成固定 Markdown 报告。使用在需要提取虎嗅 AI / 前沿科技列表、整理标题摘要、分类、关键词、热度分和原文链接时。
---

# 虎嗅 AI 新闻抓取

## 快速开始

运行脚本抓取虎嗅 AI 频道 Top10，并把结果输出为 Markdown 文件：

```bash
python3 scripts/fetch_huxiu_ai_news.py --limit 10
```

默认会写入：

```text
./data/YYYY-MM-DD/huxiu/content.md
```

如果要换机器或换仓库，先设置 `AI_NEWS_DAILY_DATA_DIR`，再运行脚本。脚本默认会写入 `~/Documents/sunchao251/code/ai-news-daily/data`。

按目录和命名模板保存：

```bash
python3 scripts/fetch_huxiu_ai_news.py --limit 10 --output-dir ./reports --filename-template '{date}/huxiu/content.md'
```

直接指定完整文件路径：

```bash
python3 scripts/fetch_huxiu_ai_news.py --limit 10 --output ./reports/huxiu-ai-top-2026-03-21.md
```

只想打印到标准输出时，加 `--stdout`。

### 自动提交到 Git 仓库

抓取完成后自动提交并推送到 Git 仓库：

```bash
python3 scripts/fetch_huxiu_ai_news.py --limit 10 --git-push
```

自定义提交信息：

```bash
python3 scripts/fetch_huxiu_ai_news.py --limit 10 --git-push --git-message "添加今日虎嗅 AI 新闻"
```

**要求：**
- 输出目录必须在 Git 仓库内
- 仓库需要配置远程仓库（origin）
- 需要有写权限

Markdown 输出会沿用 X 风格的日报骨架：顶部标题、更新时间、来源、仓库信息、总标题，再到每条新闻卡片。

如果想把总结这一步交给执行 skill 的大模型，先输出 JSON 再由模型整理成最终 Markdown：

```bash
python3 scripts/fetch_huxiu_ai_news.py --limit 10 --format json --stdout
```

JSON 转 Markdown 时，直接复用 `references/json-to-markdown-prompt.md` 里的提示词模板。
转换时优先保留完整子句，普通新闻把 `一句话总结` 控制在 60-100 个汉字，模型发布类控制在 90-140 个汉字，尽量不要以省略号结尾。

## 工作流

1. 抓取 `https://www.huxiu.com/ainews/` 列表页。
2. 解析 SSR 的 Nuxt 数据，按页面顺序取前 `N` 条。
3. 对每条新闻抓详情页，补齐作者、来源数、计数和发布时间。
4. 优先用 `--format json` 取结构化数据，再让大模型生成 `一句话总结`、`为何值得关注` 和最终 Markdown。
5. 如果只想快速成稿，可以直接用默认 `markdown` 模式。

## 约定

- 默认优先使用列表页 SSR 数据，不依赖浏览器自动化。
- 仅依赖 Python 标准库，不需要额外安装第三方包。
- 作者字段优先取详情页 `meta[name=author]`，缺失时回退到 `虎嗅网`。
- 热度分由脚本按来源数、收藏数和评论数合成。
- 模型新品发布类新闻的一句话总结可以补充参数、精度、性能或上下文长度信息，但只在 #模型 且属于发布/上线类新闻时这样做。
- JSON 转 Markdown 时，强调总结长度和完整子句，减少中间截断。
- 脚本直出 Markdown 时也会优先按句子边界收尾，只有特别长时才省略。
- 脚本和参考文件都用相对路径引用，执行时由 Codex 自动从 skill 目录解析，不要依赖固定绝对路径。
- Markdown 输出与 `x-ai-trends` 的版式对齐，但字段换成虎嗅可用的数据。
- 输出块必须保持用户要求的固定结构。
- 保存路径优先级为 `--output` > `--output-dir` + `--filename-template` > `AI_NEWS_DAILY_DATA_DIR` > `~/Documents/sunchao251/code/ai-news-daily/data`。
- 默认保存路径为 `~/Documents/sunchao251/code/ai-news-daily/data/YYYY-MM-DD/huxiu/content.md`。
- JSON 模式适合先交给模型再落成 Markdown。

## 资源

- `scripts/fetch_huxiu_ai_news.py`: 抓取与渲染入口。
- `references/huxiu-ai-news.md`: 字段映射、分类和输出规则。
