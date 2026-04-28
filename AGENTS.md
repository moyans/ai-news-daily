# AGENTS.md — ai-news-daily

## Stack

- Next.js 15 (App Router, Turbopack) + React 19 + TypeScript (strict)
- Tailwind CSS v4 (via `@tailwindcss/postcss`, NOT v3 config style)
- Vitest 3 (node environment, `@` path alias via `vitest.config.ts`)
- Deployed on Vercel (`vercel.json`)
- Python 3.12 scripts for data fetching (no pip dependencies, stdlib only)

## Commands

```bash
npm run dev          # next dev --turbopack
npm run build        # next build
npm run lint         # next lint
npm test             # vitest run
npm run test:watch   # vitest
```

No separate typecheck command — `next build` handles it.

## Architecture

**Content pipeline:** Python scripts (skills) → `data/` markdown files → Next.js parsers → rendered pages

- `data/YYYY-MM-DD/huxiu/content.md` — 虎嗅 AI news (fetched by Python script)
- `data/YYYY-MM-DD/x-hot-topics/content.md` — X hot topics (fetched by browser skill)
- `src/lib/parse-huxiu.ts` and `src/lib/parse-x-topics.ts` parse these markdown files at build/render time
- `src/lib/data.ts` reads `data/` dir via `fs` (server-side only) — all data access goes through this module
- `data/` is **tracked in git** (NOT gitignored) — it IS the content store

**App Router pages:**

| Route | File | Purpose |
|---|---|---|
| `/` | `src/app/page.tsx` | Redirects to `/daily/<latest-date>` |
| `/daily/[date]` | `src/app/daily/[date]/page.tsx` | Main news view, SSG via `generateStaticParams` |
| `/archive` | `src/app/archive/page.tsx` | All dates grouped by month |
| `robots.txt` + `sitemap.xml` | `src/app/robots.ts`, `src/app/sitemap.ts` | SEO |

**Key conventions:**

- Pages are **server components** by default; `SourceTabs` uses `window.location.href` for client-side nav (no `useState`/router)
- Source filtering via `?source=huxiu` or `?source=x` query param on `/daily/[date]`
- All pages are Chinese-language (`lang="zh-CN"`, dark mode by default)
- Custom theme colors defined in `globals.css` via `@theme` (Tailwind v4): `--color-huxiu`, `--color-x`, `--color-accent`, etc.

## Data Format

Both markdown files use the same structure, separated by `---`:

```markdown
## N. Title

- 发布时间：YYYY-MM-DD HH:MM:SS UTC   # x-topics only
- 链接：https://...
- 分类：模型动态 / 产品 / 投融资 / ...   # huxiu only
- 热度：X万 浏览 / Y万 点赞            # x-topics only

Summary text (1-3 sentences)

---
```

Category mapping: `模型动态→model, 产品→product, 投融资/融资→funding, 技术洞察/研究→research, 政策→policy, 观点→opinion, 工具→tools` (see `parse-huxiu.ts` CATEGORY_MAP).

## Skills (Data Fetching)

Two OpenCode skills produce the data files:

1. **huxiu-ai-news** — Python script, runs headless:
   ```bash
   python3 .opencode/skills/huxiu-ai-news/scripts/fetch_huxiu_ai_news.py --limit 10 --git-push
   ```
   Env: `AI_NEWS_DAILY_DATA_DIR` overrides default output dir. Script uses only Python stdlib (no pip install needed).

2. **x-hot-topics-daily** — Browser automation via Playwright (not headless-scriptable yet for CI). Currently a placeholder in CI workflow.

## CI

`.github/workflows/daily-news.yml`:
- Cron: `0 23 * * *` UTC (= CST 07:00 daily)
- Runs huxiu fetch → build → test
- X-topics step is a TODO placeholder
- `build-verify` job runs `npm ci && npm run build && npm test`

## Testing

- Test files: `src/lib/__tests__/parse-huxiu.test.ts`, `parse-x-topics.test.ts`
- Tests use inline string fixtures (no external fixture files currently)
- Vitest config: node environment, `@` alias resolved
- Tests cover: parsing, category mapping, metrics extraction, malformed input resilience

## Gotchas

- **`data/` must exist and contain dated subdirs** for the site to show content; empty `data/` → "暂无数据" fallback
- Date dirs must match `YYYY-MM-DD` regex (`/^\d{4}-\d{2}-\d{2}$/`) to be discovered
- `generateStaticParams` reads `data/` at **build time** — new dates require a rebuild or ISR
- `SourceTabs` is a client component that uses `window.location.href` for navigation (not Next.js router)
- Tailwind v4 uses `@import "tailwindcss"` and `@theme {}` in CSS — NOT the v3 `tailwind.config.ts` `theme.extend` pattern
- The `tailwind.config.ts` at root only sets `content` paths; all theme customization is in `globals.css`
- Python fetch script default path (`~/Documents/sunchao251/code/ai-news-daily/data`) differs from actual repo path — use `AI_NEWS_DAILY_DATA_DIR` env var or `--output-dir` flag
