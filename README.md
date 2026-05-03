# AI News Daily

每日 AI 新闻聚合站，面向开发者。数据来源：虎嗅 AI + X.com 热点。

**在线地址**：[ai-news-daily.vercel.app](https://ai-news-daily.vercel.app)

## 技术栈

- **框架**：Next.js 15（App Router + Turbopack）
- **语言**：TypeScript (strict)
- **样式**：Tailwind CSS v4
- **测试**：Vitest 3
- **部署**：Vercel

## 内容管道

```
Python 脚本 / 浏览器 Skill → data/YYYY-MM-DD/ → Next.js 解析器 → 渲染页面
```

| 来源 | 目录 | 获取方式 |
|------|------|----------|
| 虎嗅 AI | `data/YYYY-MM-DD/huxiu/content.md` | Python 脚本自动抓取 |
| X 热点 | `data/YYYY-MM-DD/x-hot-topics/content.md` | 浏览器 Skill 手动抓取 |

`data/` 目录纳入 Git 版本控制，**是内容存储本身**。

## 页面路由

| 路由 | 说明 |
|------|------|
| `/` | 自动跳转到 `/daily/<最新日期>` |
| `/daily/[date]` | 每日新闻视图（支持 `?source=huxiu` / `?source=x` 筛选） |
| `/archive` | 所有日期归档 |
| `robots.txt` + `sitemap.xml` | SEO |

## 本地开发

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # 生产构建
npm test           # 运行测试
```

## 每日更新流程

### 虎嗅 AI 新闻（自动）

```bash
python3 .opencode/skills/huxiu-ai-news/scripts/fetch_huxiu_ai_news.py --limit 10
```

通过 GitHub Actions 每天 UTC 23:00（CST 07:00）自动执行，抓取后自动 commit & push。

### X 热点新闻（手动）

使用 OpenCode 的 `x-hot-topics-daily` Skill 通过浏览器抓取，写入 `data/YYYY-MM-DD/x-hot-topics/content.md`。

> CI 中的 X 抓取为占位步骤，需认证浏览器会话或 X API v2 才能自动化。

## 数据格式

两种来源共用一致的 blockquote 格式，以 `---` 分隔：

```markdown
## [Top N] 标题: 核心价值提炼
> [!abstract] 核心速递
> **分类**: #product | **作者**: author | **热度分**: 123
> **一句话总结**: 摘要内容
> **关键词**: #kw1 #kw2 #kw3
>
> **为何值得关注**: 原因
>
> **互动指标**: 浏览 X万 | 点赞 Y | 转发 Z
> **原文链接**: [X 原文](url) | **发布时间**: YYYY-MM-DD HH:MM
```

## 许可

MIT