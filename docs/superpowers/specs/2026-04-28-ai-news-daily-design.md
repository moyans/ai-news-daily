# AI News Daily — Product Design Spec

**Date**: 2026-04-28
**Status**: Draft
**Author**: Sisyphus (with user input)

---

## 1. Overview

AI News Daily 是一个面向 AI 从业者/开发者的每日 AI 新闻聚合网站，核心数据源为虎嗅 AI 频道和 X.com 热点，每日自动抓取→生成→部署，用户打开即可获取当日最新 AI 动态。

### 1.1 Problem Statement

AI 从业者每天需要从多个信息源（X/Twitter、虎嗅、HackerNews 等）获取最新动态，但：

- 信息碎片化，不同平台需要逐一查看
- 缺少面向开发者的中文日报，竞品多为泛科技或泛资讯
- 现有竞品不支持同时聚合 X.com 和虎嗅两个源
- 中文竞品几乎无 RSS/API 支持

### 1.2 Target Audience

**AI 从业者/开发者**

- 关注模型发布、技术论文、开源项目
- 需要快速判断"是否值得关注/跟进"
- 日常信息消费习惯：每天花 3-5 分钟扫读日报

### 1.3 Core Value Proposition

**每日一份，3 分钟读懂 AI 圈**

- 两源聚合（虎嗅 + X）避免信息遗漏
- 开发者视角：不是新闻搬运，而是"可读、可判断、可行动"
- 全自动：cron 抓取→生成→部署，零人工干预
- 深色极简风格，信息密度高

---

## 2. Competitive Analysis Summary

| Competitor | Form | Sources | Standout Feature | Gap |
|---|---|---|---|---|
| 爱窝啦 AI 日报 | Website | Multi-source | Top10 + Trend Prediction | No X.com |
| AI 行业信息流 | Website | GitHub/HF/arXiv/HN | Real-time aggregation | No Chinese curation |
| 智语观潮 | Website+RSS | 25+ curated sources | AI classification + Paper selection | No X.com, no Huxiu |
| aidailytrending | Website | Multi-source | Category-based daily digest | No X.com |
| AI 今日热榜 | Website | 50+ sources | Real-time hot ranking | No developer focus |
| AI产品榜 aicpb | Website | Self-curated | Daily 9:30 morning brief | Product ranking, not news |
| 机器之心 | Website+Newsletter | Self-curated | PRO membership deep analysis | Manual curation, paid |
| Syft (EN) | App | Global sources | AI-personalized summaries | English only |

**Differentiation**:

1. 唯一同时聚合 X.com + 虎嗅的中文日报
2. 开发者视角（vs 泛科技/泛资讯）
3. 全自动 pipeline（vs 人工策展）
4. Git-driven + SSG（vs 数据库驱动）
5. 开源可自部署

---

## 3. Architecture

### 3.1 Design Decision: Pure Static + Git-Driven

**Chosen approach**: Next.js SSG with Git as the data store.

**Rationale**:

- Existing skills (huxiu-ai-news, x-hot-topics-daily) already output Markdown files to git repo
- Daily digest model only needs per-day updates, not real-time
- Zero operational cost (Vercel free tier + GitHub Actions free quota)
- Perfect SEO (pure static HTML)
- Natural upgrade path to ISR (Approach B) when needed

**Upgrade path**: A (Static) → B (ISR + webhook) → C (SSR + DB), incremental, no wasted work.

### 3.2 Data Flow

```
GitHub Actions (cron 07:00 CST)
    │
    ├── [parallel] huxiu-ai-news skill
    │       └──→ data/YYYY-MM-DD/huxiu/content.md
    │
    ├── [parallel] x-hot-topics-daily skill
    │       └──→ data/YYYY-MM-DD/x-hot-topics/content.md
    │
    ├── git push (content: add daily news for YYYY-MM-DD)
    │
    └── Vercel detects push → triggers build
            │
            ├── Next.js SSG reads data/ directory
            ├── generateStaticParams() enumerates all dates
            ├── Generates static pages for each date
            └── Deploys to CDN
```

### 3.3 Deployment

- **Platform**: Vercel (free tier)
- **Domain**: Custom domain (TBD)
- **SSL**: Automatic via Vercel
- **CDN**: Vercel Edge Network (global)

---

## 4. Content Schema

### 4.1 Directory Structure

```
data/
├── 2026-04-28/
│   ├── huxiu/
│   │   └── content.md
│   └── x-hot-topics/
│       └── content.md
├── 2026-04-27/
│   ├── huxiu/
│   │   └── content.md
│   └── x-hot-topics/
│       └── content.md
└── ...
```

### 4.2 TypeScript Types

```typescript
interface NewsItem {
  id: string;                // Unique ID (date + source + index)
  title: string;              // Chinese title
  summary: string;            // 1-3 sentence summary
  source: 'huxiu' | 'x';    // Source identifier
  sourceUrl: string;          // Original URL
  publishedAt: string;        // ISO 8601 datetime
  category: 'model' | 'product' | 'funding' | 'research' | 'policy' | 'opinion' | 'tools';
  metrics?: {                 // Engagement data (optional)
    views?: number;
    likes?: number;
    shares?: number;
  };
  tags?: string[];            // Tags (e.g., GPT-5, DeepSeek, open-source)
}

interface DailyData {
  date: string;               // YYYY-MM-DD
  huxiu: NewsItem[];          // Huxiu data
  xTopics: NewsItem[];        // X hot topics data
}
```

### 4.3 Markdown Parsing Strategy

- **Huxiu**: Existing skill outputs structured Markdown with title + summary + link + category. Parse with regex.
- **X Topics**: Skill defines strict output template (`## N. 中文标题` + datetime + link + metrics + summary). Parse with regex.
- **Unified**: Both formats normalize to `NewsItem[]` at build time.
- **Graceful fallback**: If parsing fails, preserve at least title and link.

---

## 5. Page Structure & Components

### 5.1 Routes

| Route | Page | Description |
|---|---|---|
| `/` | Homepage (latest daily) | Redirect to or display latest available date |
| `/daily/[date]` | Daily detail page | Full news digest for a specific date |
| `/archive` | Archive | Browse historical daily digests by month/week |

### 5.2 Daily Page Layout

```
┌──────────────────────────────────────────┐
│ AI News Daily · 2026年4月28日            │  ← Date + navigation
├──────────────────────────────────────────┤
│ ┌──────────────────────────────────────┐ │
│ │ 🔥 虎嗅 [5条]    🐦 X [6条]         │ │  ← Source filter tabs
│ └──────────────────────────────────────┘ │
│                                          │
│ ┌─ News Card ─────────────────────────┐ │
│ │ 📌 OpenAI 发布 GPT-5               │ │
│ │    Summary text, 1-3 sentences...   │ │
│ │    🔗 Original · 📊 Metrics          │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ ┌─ News Card ─────────────────────────┐ │
│ │ 🔬 DeepSeek V4 发布                  │ │
│ │    Summary...                        │ │
│ │    🔗 Original · 📊 Metrics          │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ ─── More news ───                       │
│                                          │
│ ← Apr 27        Apr 29 →                │  ← Date navigation
└──────────────────────────────────────────┘
```

### 5.3 Components

1. **DailyPage** — Main daily digest page, renders all news for a date
2. **SourceTabs** — Source filter tabs (Huxiu / X / All)
3. **NewsCard** — Single news card (title, summary, source icon, link, metrics)
4. **DateNav** — Previous/next day navigation + date picker
5. **ArchivePage** — Historical archive calendar view

### 5.4 Design Style

- **Dark minimalist theme** (developer-oriented aesthetic)
- No sidebar, no ad slots
- Compact card spacing, high information density
- Mobile-first responsive design
- Font: Inter or similar clean sans-serif
- Color palette: Dark background (#0a0a0a), accent blue (#3b82f6)

---

## 6. Automation Pipeline

### 6.1 GitHub Actions Workflow

```yaml
# .github/workflows/daily-news.yml
name: Daily AI News
on:
  schedule:
    - cron: '0 23 * * *'   # UTC 23:00 = CST 07:00
  workflow_dispatch:         # Manual trigger support

jobs:
  fetch-huxiu:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Fetch Huxiu AI News
        run: python3 scripts/fetch_huxiu_ai_news.py --limit 10 --git-push
        env:
          AI_NEWS_DAILY_DATA_DIR: ./data

  fetch-x-topics:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Fetch X Hot Topics
        run: python3 scripts/fetch_x_hot_topics.py --git-push
        env:
          AI_NEWS_DAILY_DATA_DIR: ./data

  build-and-verify:
    needs: [fetch-huxiu, fetch-x-topics]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install & Build
        run: npm ci && npm run build
      - name: Verify output
        run: npm run test
```

### 6.3 X Hot Topics CI Adaptation

The `x-hot-topics-daily` skill currently uses browser automation to scrape X.com. For V1 in GitHub Actions CI:

1. Use Playwright headless mode (Ubuntu runner supports headless Chromium)
2. Add `npx playwright install --with-deps chromium` step to the workflow
3. If X.com blocks headless scraping, fallback strategy: manual `workflow_dispatch` trigger with local browser-run data push

V2 will evaluate X API integration for reliability.

### 6.4 Key Design Decisions

1. **Parallel fetch**: Huxiu and X jobs run independently for speed
2. **Build needs both**: `needs` dependency ensures complete data before build
3. **workflow_dispatch**: Support manual re-runs for data patching

---

## 7. Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Framework | Next.js 15 (App Router) | SSG, TypeScript, great DX |
| Styling | Tailwind CSS v4 | Utility-first, fast iteration |
| Data | Markdown files in data/ | Git-driven, no database |
| Parsing | gray-matter + remark | Markdown frontmatter + content |
| Deployment | Vercel | Zero-config for Next.js |
| CI/CD | GitHub Actions | Cron trigger + auto deploy |
| Language | TypeScript | Type safety |

---

## 8. Non-Goals (Explicitly Out of Scope for V1)

- User accounts / login
- Comments system
- RSS feed (V2 consideration)
- Search functionality (V2)
- Email newsletter distribution (V2)
- Real-time updates (needs ISR — V2)
- Dark/light theme toggle (dark only for V1)
- i18n / English version

---

## 9. Success Metrics (Qualitative)

- Site loads in < 1s on 3G connection
- Daily content available by 07:30 CST
- Each daily digest scannable in < 3 minutes
- Mobile experience is primary, desktop is secondary