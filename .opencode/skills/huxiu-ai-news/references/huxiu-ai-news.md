# 虎嗅 AI 新闻抓取参考

## 数据源

- 列表页: `https://www.huxiu.com/ainews/`
- 详情页: `https://www.huxiu.com/ainews/{ainews_id}.html`

## 抓取策略

1. 优先解析页面内的 `__NUXT_DATA__` JSON。
2. 列表页按页面顺序取前 `N` 条，默认 `N=10`。
3. 详情页用于补齐作者、来源列表、计数与正文摘要。
4. 遇到字段缺失时保守回退，不要让整条新闻失败。

## 参数

- `--limit`: 控制抓取数量，默认 `10`。
- `--output`: 直接写入指定文件路径，优先级最高。
- `--output-dir`: 输出根目录，优先读取 `AI_NEWS_DAILY_DATA_DIR`，否则使用 `~/Documents/sunchao251/code/ai-news-daily/data`。
- `--filename-template`: 文件名模板，默认 `{date}/huxiu/content.md`。
- `--format`: 输出格式，`markdown` 直接生成 Markdown，`json` 输出结构化数据，适合交给大模型继续整理。
- `--stdout`: 只打印到标准输出，不落盘。

JSON 模式下，Markdown 整理建议复用 [json-to-markdown-prompt.md](json-to-markdown-prompt.md)。

文件名模板支持占位符：

- `{date}`: 运行当天的 `YYYY-MM-DD`
- `{timestamp}`: 运行时间戳 `YYYYMMDD-HHMMSS`
- `{limit}`: 抓取条数

默认落盘路径拼接结果为：

```text
./data/YYYY-MM-DD/huxiu/content.md
```

跨机器复用时，建议优先设置 `AI_NEWS_DAILY_DATA_DIR`；不设置时，脚本会使用 `~/Documents/sunchao251/code/ai-news-daily/data`。

## 字段映射

- `title`: 详情页标题，缺失时回退列表页标题。
- `summary`: 优先用详情页 `desc`，再回退列表页 `desc`。
- 如果是 `#模型` 且属于新品发布、版本上线或模型发布类新闻，`summary` 可以采用“前半句 + 1-2 个参数、精度、性能、上下文长度、速度或 benchmark 信息”的方式，让一句话总结稍微更具体。
- 在 `json` 模式下，这类摘要更适合由执行 skill 的大模型根据结构化字段自行润色，而不是由脚本硬编码生成。
- `author_handle`: 优先取 `meta[name=author]`, 再回退 `虎嗅网`。
- `heat_score`: 由 `来源数 + 收藏数 + 评论数` 组合生成，保持整数。
- `posted_at`: 将 `publish_time` 转成 `Asia/Shanghai` 的 `YYYY-MM-DD HH:MM`。

## 分类规则

优先命中最具体的标签，顺序建议如下：

1. `#政策`
2. `#芯片`
3. `#机器人`
4. `#智能体`
5. `#模型`
6. `#产品`
7. `#融资`
8. `#应用`

## 关键词规则

- 输出 3 个关键词，优先使用标题和摘要里的显式实体。
- 如果显式实体不足 3 个，用分类默认词补齐。
- 关键词保持短而稳定，尽量避免泛词。

## 输出模板

每条新闻都要保持下面的块级结构：

```markdown
# 虎嗅 AI 科技热点 | YYYY-MM-DD

> 更新时间: YYYY-MM-DD HH:MM:SS
> 来源: 虎嗅 AI News
> 仓库: ai-news-daily

---

## Top N 虎嗅 AI 热点

---
## [Top N] [标题: 提炼核心价值]
> [!abstract] 核心速递
> **分类**: #category | **作者**: author_handle | **热度分**: heat_score
> **一句话总结**: summary (新手友好)
> **关键词**: #keyword1 #keyword2 #keyword3
>
> **为何值得关注**: why_it_matters (从技术深度或产品影响度分析)
>
> **互动指标**: 来源数 source_count | 收藏数 favorite_num | 评论数 comment_num
>
> **原文链接**: [虎嗅原文](url) | **发布时间**: posted_at

*由 huxiu-ai-news Skill 自动生成*
```

## 渲染提示

- `Top N` 从 1 开始编号。
- `标题: 提炼核心价值` 这一段建议把标题和一句核心判断放在同一行。
- 如果标题过长，优先压缩“核心价值”而不是删掉新闻主体。
