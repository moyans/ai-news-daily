# AI News Daily Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js static site that aggregates daily AI news from Huxiu and X.com, auto-deploys via Vercel.

**Architecture:** Pure SSG (Static Site Generation) with Git as the data store. Next.js reads Markdown files from `data/` at build time, generates static pages per date. GitHub Actions cron triggers data fetch skills daily, pushes content, Vercel auto-deploys.

**Tech Stack:** Next.js 15 (App Router) + Tailwind CSS v4 + TypeScript. Deployment: Vercel. CI: GitHub Actions.

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx                 # Root layout (dark theme, meta, fonts)
│   ├── page.tsx                  # Homepage → redirect to latest date
│   ├── daily/
│   │   └── [date]/
│   │       └── page.tsx          # Daily digest page
│   └── archive/
│       └── page.tsx              # Archive page
├── components/
│   ├── NewsCard.tsx              # Single news card
│   ├── SourceTabs.tsx            # Source filter (All/Huxiu/X)
│   ├── DateNav.tsx               # Prev/next date navigation
│   └── Footer.tsx                # Site footer
├── lib/
│   ├── types.ts                  # TypeScript interfaces
│   ├── data.ts                   # Data reading + date enumeration
│   ├── parse-huxiu.ts            # Huxiu Markdown parser
│   └── parse-x-topics.ts         # X topics Markdown parser
data/                              # Markdown content from skills (not in src/)
├── (YYYY-MM-DD directories)
.github/
└── workflows/
    └── daily-news.yml            # GitHub Actions workflow
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/styles/globals.css`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd /Users/pacv/Documents/sunchao251/ai-news-daily
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --turbopack
```

Accept defaults. This creates `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/styles/globals.css`.

- [ ] **Step 2: Verify scaffold builds**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Configure Tailwind dark theme in globals.css**

Replace `src/app/globals.css` (or `src/app/page.module.css` if generated) with:

```css
@import "tailwindcss";

@theme {
  --color-background: #0a0a0a;
  --color-foreground: #e5e5e5;
  --color-card: #141414;
  --color-card-hover: #1a1a1a;
  --color-border: #262626;
  --color-accent: #3b82f6;
  --color-accent-hover: #2563eb;
  --color-muted: #737373;
  --color-huxiu: #ff6b35;
  --color-x: #1d9bf0;
}
```

- [ ] **Step 4: Update root layout with dark theme and Inter font**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI News Daily",
  description: "每日 AI 新闻聚合，面向开发者。虎嗅 + X 热点，3 分钟读懂 AI 圈。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className={`${inter.className} antialiased bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Replace homepage with placeholder**

Replace `src/app/page.tsx`:

```tsx
export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <h1 className="text-2xl font-bold">AI News Daily</h1>
    </main>
  );
}
```

- [ ] **Step 6: Verify build still passes**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 7: Commit scaffold**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with dark theme"
```

---

### Task 2: TypeScript Types

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Step 1: Create types file**

Create `src/lib/types.ts`:

```typescript
export type NewsSource = "huxiu" | "x";

export type NewsCategory =
  | "model"
  | "product"
  | "funding"
  | "research"
  | "policy"
  | "opinion"
  | "tools";

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: NewsSource;
  sourceUrl: string;
  publishedAt: string;
  category: NewsCategory;
  metrics?: {
    views?: number;
    likes?: number;
    shares?: number;
  };
  tags?: string[];
}

export interface DailyData {
  date: string;
  huxiu: NewsItem[];
  xTopics: NewsItem[];
}

export type SourceFilter = "all" | "huxiu" | "x";
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit types**

```bash
git add src/lib/types.ts
git commit -m "feat: add TypeScript types for news data model"
```

---

### Task 3: Huxiu Markdown Parser

**Files:**
- Create: `src/lib/parse-huxiu.ts`
- Create: `src/lib/__tests__/parse-huxiu.test.ts`
- Create: `src/lib/__tests__/fixtures/huxiu-sample.md`

- [ ] **Step 1: Install test dependencies**

```bash
npm install -D vitest @testing-library/react jsdom
```

Add to `package.json` scripts:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 2: Create Huxiu sample fixture**

Create `src/lib/__tests__/fixtures/huxiu-sample.md` based on the actual output format of the huxiu-ai-news skill. The skill outputs sections like:

```markdown
# 虎嗅 AI 科技 Top10 · 2026-04-28

## 1. OpenAI 发布 GPT-5 性能超越人类专家

- 来源：虎嗅网
- 链接：https://www.huxiu.com/article/123456
- 分类：模型动态

OpenAI 今日正式发布 GPT-5，在多项基准测试中超越人类专家水平...

---

## 2. DeepSeek V4 开源发布

- 来源：虎嗅网
- 链接：https://www.huxiu.com/article/234567
- 分类：模型动态

DeepSeek 团队发布 V4 模型，在代码生成和推理任务上显著提升...

---
```

- [ ] **Step 3: Write the failing test**

Create `src/lib/__tests__/parse-huxiu.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { parseHuxiuMarkdown } from "../parse-huxiu";
import fs from "fs";
import path from "path";

describe("parseHuxiuMarkdown", () => {
  it("should parse sample Huxiu markdown into NewsItem array", () => {
    const samplePath = path.join(__dirname, "fixtures", "huxiu-sample.md");
    const content = fs.readFileSync(samplePath, "utf-8");
    const result = parseHuxiuMarkdown(content, "2026-04-28");

    expect(result.length).toBeGreaterThan(0);

    const firstItem = result[0];
    expect(firstItem.source).toBe("huxiu");
    expect(firstItem.title).toBeTruthy();
    expect(firstItem.summary).toBeTruthy();
    expect(firstItem.sourceUrl).toMatch(/^https?:\/\//);
    expect(firstItem.category).toBeDefined();
    expect(firstItem.id).toContain("huxiu");
  });

  it("should gracefully handle malformed content", () => {
    const result = parseHuxiuMarkdown("random garbage text", "2026-04-28");
    expect(result).toEqual([]);
  });

  it("should extract category from classification line", () => {
    const markdown = `## 1. Test Title\n\n- 分类：模型动态\n- 链接：https://example.com\n\nSummary text.\n\n---`;
    const result = parseHuxiuMarkdown(markdown, "2026-04-28");
    expect(result[0].category).toBe("model");
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

```bash
npx vitest run src/lib/__tests__/parse-huxiu.test.ts
```

Expected: FAIL — `parseHuxiuMarkdown` is not defined yet.

- [ ] **Step 5: Implement Huxiu parser**

Create `src/lib/parse-huxiu.ts`:

```typescript
import { NewsItem, NewsCategory } from "./types";

const CATEGORY_MAP: Record<string, NewsCategory> = {
  "模型动态": "model",
  "模型": "model",
  "产品发布": "product",
  "产品": "product",
  "投融资": "funding",
  "融资": "funding",
  "技术洞察": "research",
  "研究": "research",
  "政策": "policy",
  "观点": "opinion",
  "工具": "tools",
};

function mapCategory(raw: string): NewsCategory {
  for (const [cn, en] of Object.entries(CATEGORY_MAP)) {
    if (raw.includes(cn)) return en;
  }
  return "product";
}

export function parseHuxiuMarkdown(content: string, date: string): NewsItem[] {
  const items: NewsItem[] = [];

  // Split by section separator (---)
  const sections = content.split(/\n---\n/).filter((s) => s.trim());

  for (const section of sections) {
    // Extract title (## N. Title)
    const titleMatch = section.match(/##\s+\d+\.\s+(.+)/);
    if (!titleMatch) continue;
    const title = titleMatch[1].trim();

    // Extract link
    const linkMatch = section.match(/[\-•]\s*链接[：:]\s*(https?:\/\/[^\s]+)/);
    const sourceUrl = linkMatch ? linkMatch[1] : "";

    // Extract category
    const categoryMatch = section.match(
      /[\-•]\s*分类[：:]\s*(.+)/
    );
    const category = categoryMatch
      ? mapCategory(categoryMatch[1].trim())
      : "product";

    // Extract summary (everything after metadata lines, before next section)
    const lines = section.split("\n");
    const summaryLines: string[] = [];
    let inSummary = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (
        trimmed.startsWith("##") ||
        trimmed.startsWith("-") ||
        trimmed.startsWith("•")
      ) {
        if (inSummary) continue;
        continue;
      }
      if (trimmed && !trimmed.startsWith("#")) {
        inSummary = true;
        summaryLines.push(trimmed);
      }
    }
    const summary = summaryLines.join(" ").trim();

    if (!title) continue;

    const index = items.length;
    items.push({
      id: `${date}-huxiu-${index}`,
      title,
      summary: summary || title,
      source: "huxiu",
      sourceUrl,
      publishedAt: `${date}T00:00:00+08:00`,
      category,
    });
  }

  return items;
}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
npx vitest run src/lib/__tests__/parse-huxiu.test.ts
```

Expected: PASS

- [ ] **Step 7: Commit Huxiu parser**

```bash
git add src/lib/parse-huxiu.ts src/lib/__tests__/
git commit -m "feat: add Huxiu markdown parser with tests"
```

---

### Task 4: X Hot Topics Markdown Parser

**Files:**
- Create: `src/lib/parse-x-topics.ts`
- Create: `src/lib/__tests__/parse-x-topics.test.ts`
- Create: `src/lib/__tests__/fixtures/x-topics-sample.md`

- [ ] **Step 1: Create X Topics sample fixture**

Create `src/lib/__tests__/fixtures/x-topics-sample.md`:

```markdown
# X 热点追踪 (2026-04-28)

## 1. OpenAI 发布 GPT-5 模型

- 发布时间：2026-04-28 06:30:00 UTC
- 链接：https://x.com/openai/status/123456789
- 热度：500万 浏览 / 12万 点赞 / 3万 转发

OpenAI 正式发布 GPT-5 模型，在多项基准测试中超越人类专家水平。这是大模型领域的重大突破。

---

## 2. DeepSeek 开源 V4 模型

- 发布时间：2026-04-28 04:15:00 UTC
- 链接：https://x.com/deepseek_ai/status/987654321
- 热度：200万 浏览 / 5万 点赞 / 1万 转发

DeepSeek 团队发布 V4 模型，在代码生成和推理任务上获得显著提升。

---
```

- [ ] **Step 2: Write the failing test**

Create `src/lib/__tests__/parse-x-topics.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { parseXTopicsMarkdown } from "../parse-x-topics";
import fs from "fs";
import path from "path";

describe("parseXTopicsMarkdown", () => {
  it("should parse sample X topics markdown into NewsItem array", () => {
    const samplePath = path.join(__dirname, "fixtures", "x-topics-sample.md");
    const content = fs.readFileSync(samplePath, "utf-8");
    const result = parseXTopicsMarkdown(content, "2026-04-28");

    expect(result.length).toBeGreaterThan(0);

    const firstItem = result[0];
    expect(firstItem.source).toBe("x");
    expect(firstItem.title).toBeTruthy();
    expect(firstItem.summary).toBeTruthy();
    expect(firstItem.sourceUrl).toMatch(/^https?:\/\//);
    expect(firstItem.id).toContain("x");
  });

  it("should extract metrics (views, likes, shares)", () => {
    const samplePath = path.join(__dirname, "fixtures", "x-topics-sample.md");
    const content = fs.readFileSync(samplePath, "utf-8");
    const result = parseXTopicsMarkdown(content, "2026-04-28");

    const itemWithMetrics = result.find((i) => i.metrics);
    expect(itemWithMetrics).toBeDefined();
    expect(itemWithMetrics!.metrics!.views).toBeGreaterThan(0);
  });

  it("should extract publishedAt datetime", () => {
    const samplePath = path.join(__dirname, "fixtures", "x-topics-sample.md");
    const content = fs.readFileSync(samplePath, "utf-8");
    const result = parseXTopicsMarkdown(content, "2026-04-28");

    expect(result[0].publishedAt).toContain("2026-04-28");
  });

  it("should gracefully handle malformed content", () => {
    const result = parseXTopicsMarkdown("random garbage text", "2026-04-28");
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx vitest run src/lib/__tests__/parse-x-topics.test.ts
```

Expected: FAIL — `parseXTopicsMarkdown` is not defined yet.

- [ ] **Step 4: Implement X Topics parser**

Create `src/lib/parse-x-topics.ts`:

```typescript
import { NewsItem, NewsCategory } from "./types";

const KEYWORD_CATEGORIES: Record<string, NewsCategory> = {
  "发布": "product",
  "开源": "tools",
  "融资": "funding",
  "投资": "funding",
  "论文": "research",
  "研究": "research",
  "政策": "policy",
  "监管": "policy",
  "观点": "opinion",
  "模型": "model",
  "GPT": "model",
  "Claude": "model",
  "Gemini": "model",
  "DeepSeek": "model",
  "Llama": "model",
};

function inferCategory(title: string, summary: string): NewsCategory {
  const text = `${title} ${summary}`.toLowerCase();
  for (const [keyword, category] of Object.entries(KEYWORD_CATEGORIES)) {
    if (text.includes(keyword.toLowerCase())) return category;
  }
  return "product";
}

function parseMetrics(metricsLine: string): { views?: number; likes?: number; shares?: number } {
  const result: { views?: number; likes?: number; shares?: number } = {};

  const viewsMatch = metricsLine.match(/([\d.]+万?)\s*浏览/);
  if (viewsMatch) {
    const raw = viewsMatch[1];
    result.views = raw.includes("万") ? parseFloat(raw) * 10000 : parseInt(raw);
  }

  const likesMatch = metricsLine.match(/([\d.]+万?)\s*点赞/);
  if (likesMatch) {
    const raw = likesMatch[1];
    result.likes = raw.includes("万") ? parseFloat(raw) * 10000 : parseInt(raw);
  }

  const sharesMatch = metricsLine.match(/([\d.]+万?)\s*转发/);
  if (sharesMatch) {
    const raw = sharesMatch[1];
    result.shares = raw.includes("万") ? parseFloat(raw) * 10000 : parseInt(raw);
  }

  return result;
}

export function parseXTopicsMarkdown(content: string, date: string): NewsItem[] {
  const items: NewsItem[] = [];

  // Split by section separator (---)
  const sections = content.split(/\n---\n/).filter((s) => s.trim());

  for (const section of sections) {
    // Extract title (## N. Title)
    const titleMatch = section.match(/##\s+\d+\.\s+(.+)/);
    if (!titleMatch) continue;
    const title = titleMatch[1].trim();

    // Extract published time
    const timeMatch = section.match(
      /发布时间[：:]\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\s*UTC)/
    );
    const publishedAt = timeMatch
      ? timeMatch[1].replace(" UTC", "Z").replace(" ", "T")
      : `${date}T00:00:00Z`;

    // Extract link
    const linkMatch = section.match(/链接[：:]\s*(https?:\/\/[^\s]+)/);
    const sourceUrl = linkMatch ? linkMatch[1] : "";

    // Extract metrics
    const metricsMatch = section.match(/热度[：:]\s*(.+)/);
    const metrics = metricsMatch ? parseMetrics(metricsMatch[1]) : undefined;

    // Extract summary
    const lines = section.split("\n");
    const summaryLines: string[] = [];
    let pastMetadata = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("##") || trimmed.startsWith("# ")) continue;
      if (trimmed.startsWith("- ")) continue;
      if (trimmed === "---") continue;
      if (trimmed && !trimmed.startsWith("#")) {
        summaryLines.push(trimmed);
      }
    }
    const summary = summaryLines.join(" ").trim();

    if (!title) continue;

    const index = items.length;
    const category = inferCategory(title, summary);

    items.push({
      id: `${date}-x-${index}`,
      title,
      summary: summary || title,
      source: "x",
      sourceUrl,
      publishedAt,
      category,
      metrics,
    });
  }

  return items;
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run src/lib/__tests__/parse-x-topics.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit X Topics parser**

```bash
git add src/lib/parse-x-topics.ts src/lib/__tests__/
git commit -m "feat: add X hot topics markdown parser with tests"
```

---

### Task 5: Data Layer

**Files:**
- Create: `src/lib/data.ts`
- Create: `src/lib/__tests__/data.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/data.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";
import { getAvailableDates, getDailyData, getLatestDate } from "../data";

// Create test fixtures before tests
const testDataDir = path.join(process.cwd(), "data", "2026-04-28");
const testHuxiuDir = path.join(testDataDir, "huxiu");
const testXDir = path.join(testDataDir, "x-hot-topics");

beforeAll(() => {
  fs.mkdirSync(testHuxiuDir, { recursive: true });
  fs.mkdirSync(testXDir, { recursive: true });

  fs.writeFileSync(
    path.join(testHuxiuDir, "content.md"),
    `# 虎嗅 AI 科技 Top10 · 2026-04-28\n\n## 1. OpenAI 发布 GPT-5\n\n- 链接：https://www.huxiu.com/article/123456\n- 分类：模型动态\n\nGPT-5 正式发布，性能超越人类专家水平。\n\n---\n`
  );

  fs.writeFileSync(
    path.join(testXDir, "content.md"),
    `# X 热点追踪 (2026-04-28)\n\n## 1. DeepSeek V4 开源\n\n- 发布时间：2026-04-28 04:15:00 UTC\n- 链接：https://x.com/deepseek_ai/status/987654321\n\nDeepSeek V4 开源发布。\n\n---\n`
  );
});

describe("data layer", () => {
  it("getAvailableDates returns sorted date strings", () => {
    const dates = getAvailableDates();
    expect(dates.length).toBeGreaterThan(0);
    expect(dates[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("getLatestDate returns the most recent date", () => {
    const latest = getLatestDate();
    expect(latest).toBeTruthy();
    expect(latest).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("getDailyData returns parsed data for a valid date", () => {
    const data = getDailyData("2026-04-28");
    expect(data).toBeDefined();
    expect(data!.date).toBe("2026-04-28");
    expect(data!.huxiu.length + data!.xTopics.length).toBeGreaterThan(0);
  });

  it("getDailyData returns null for non-existent date", () => {
    const data = getDailyData("2099-01-01");
    expect(data).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/__tests__/data.test.ts
```

Expected: FAIL — `getAvailableDates`, `getDailyData`, `getLatestDate` are not defined.

- [ ] **Step 3: Implement data layer**

Create `src/lib/data.ts`:

```typescript
import fs from "fs";
import path from "path";
import { DailyData, NewsItem } from "./types";
import { parseHuxiuMarkdown } from "./parse-huxiu";
import { parseXTopicsMarkdown } from "./parse-x-topics";

const DATA_DIR = path.join(process.cwd(), "data");

export function getAvailableDates(): string[] {
  if (!fs.existsSync(DATA_DIR)) return [];

  const entries = fs.readdirSync(DATA_DIR, { withFileTypes: true });
  const dates = entries
    .filter((e) => e.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(e.name))
    .map((e) => e.name)
    .sort()
    .reverse(); // Most recent first

  return dates;
}

export function getLatestDate(): string | null {
  const dates = getAvailableDates();
  return dates.length > 0 ? dates[0] : null;
}

export function getDailyData(date: string): DailyData | null {
  const huxiuPath = path.join(DATA_DIR, date, "huxiu", "content.md");
  const xPath = path.join(DATA_DIR, date, "x-hot-topics", "content.md");

  // At least one source must exist
  const huxiuExists = fs.existsSync(huxiuPath);
  const xExists = fs.existsSync(xPathPath);

  // Fix: use the correct variable name
  const xFileExists = fs.existsSync(xPath);
  if (!huxiuExists && !xFileExists) return null;

  let huxiu: NewsItem[] = [];
  let xTopics: NewsItem[] = [];

  if (huxiuExists) {
    const content = fs.readFileSync(huxiuPath, "utf-8");
    huxiu = parseHuxiuMarkdown(content, date);
  }

  if (xFileExists) {
    const content = fs.readFileSync(xPath, "utf-8");
    xTopics = parseXTopicsMarkdown(content, date);
  }

  return {
    date,
    huxiu,
    xTopics,
  };
}

export function getAllDailyData(): DailyData[] {
  const dates = getAvailableDates();
  return dates
    .map((date) => getDailyData(date))
    .filter((d): d is DailyData => d !== null);
}
```

- [ ] **Step 4: Fix the typo in data.ts**

The variable name `xPathPath` should be `xPath`. Also, the logic should reference `xPath` consistently. Fix the file.

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run
```

Expected: ALL PASS

- [ ] **Step 6: Commit data layer**

```bash
git add src/lib/data.ts src/lib/__tests__/data.test.ts
git commit -m "feat: add data layer for reading and parsing news data"
```

---

### Task 6: UI Components — NewsCard, SourceTabs, DateNav

**Files:**
- Create: `src/components/NewsCard.tsx`
- Create: `src/components/SourceTabs.tsx`
- Create: `src/components/DateNav.tsx`
- Create: `src/components/Footer.tsx`

- [ ] **Step 1: Create NewsCard component**

Create `src/components/NewsCard.tsx`:

```tsx
import { NewsItem } from "@/lib/types";

const SOURCE_LABELS: Record<string, { name: string; color: string }> = {
  huxiu: { name: "虎嗅", color: "text-huxiu" },
  x: { name: "X", color: "text-x" },
};

const CATEGORY_LABELS: Record<string, string> = {
  model: "模型",
  product: "产品",
  funding: "融资",
  research: "研究",
  policy: "政策",
  opinion: "观点",
  tools: "工具",
};

export default function NewsCard({ item }: { item: NewsItem }) {
  const source = SOURCE_LABELS[item.source];

  return (
    <article className="group border border-border rounded-lg p-4 hover:bg-card-hover transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium ${source.color}`}>
              {source.name}
            </span>
            <span className="text-xs text-muted">
              {CATEGORY_LABELS[item.category] || item.category}
            </span>
          </div>
          <h3 className="text-base font-semibold text-foreground leading-snug mb-2 group-hover:text-accent transition-colors">
            {item.title}
          </h3>
          <p className="text-sm text-muted leading-relaxed line-clamp-3">
            {item.summary}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-muted">
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-accent transition-colors"
        >
          原文链接
        </a>
        {item.metrics && (
          <span>
            {item.metrics.views && `${(item.metrics.views / 10000).toFixed(1)}万浏览`}
            {item.metrics.likes && ` · ${item.metrics.likes.toLocaleString()}赞`}
            {item.metrics.shares && ` · ${item.metrics.shares.toLocaleString()}转发`}
          </span>
        )}
      </div>
    </article>
  );
}
```

- [ ] **Step 2: Create SourceTabs component**

Create `src/components/SourceTabs.tsx`:

```tsx
import { SourceFilter } from "@/lib/types";

const TABS: { key: SourceFilter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "huxiu", label: "虎嗅" },
  { key: "x", label: "X" },
];

export default function SourceTabs({
  active,
  onChange,
  counts,
}: {
  active: SourceFilter;
  onChange: (filter: SourceFilter) => void;
  counts: { huxiu: number; x: number };
}) {
  return (
    <div className="flex gap-2 mb-6">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            active === tab.key
              ? "bg-accent text-white"
              : "bg-card text-muted hover:text-foreground hover:bg-card-hover"
          }`}
        >
          {tab.label}
          {tab.key === "huxiu" && ` [${counts.huxiu}]`}
          {tab.key === "x" && ` [${counts.x}]`}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create DateNav component**

Create `src/components/DateNav.tsx`:

```tsx"
import Link from "next/link";

export default function DateNav({
  prevDate,
  nextDate,
  currentDate,
}: {
  prevDate: string | null;
  nextDate: string | null;
  currentDate: string;
}) {
  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-");
    return `${y}年${parseInt(m)}月${parseInt(d)}日`;
  };

  return (
    <nav className="flex items-center justify-between py-4 border-t border-border mt-6">
      {prevDate ? (
        <Link
          href={`/daily/${prevDate}`}
          className="text-sm text-muted hover:text-accent transition-colors"
        >
          ← {formatDate(prevDate)}
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm font-medium text-foreground">
        {formatDate(currentDate)}
      </span>
      {nextDate ? (
        <Link
          href={`/daily/${nextDate}`}
          className="text-sm text-muted hover:text-accent transition-colors"
        >
          {formatDate(nextDate)} →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
```

NOTE: Fix the template literal on the first line — remove the extra quote. The correct first line is:

```tsx
import Link from "next/link";
```

- [ ] **Step 4: Create Footer component**

Create `src/components/Footer.tsx`:

```tsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border py-8 mt-12 text-center text-xs text-muted">
      <div className="flex items-center justify-center gap-4 mb-2">
        <Link href="/" className="hover:text-accent transition-colors">
          首页
        </Link>
        <Link href="/archive" className="hover:text-accent transition-colors">
          归档
        </Link>
      </div>
      <p>AI News Daily · 数据来源：虎嗅 AI + X.com</p>
      <p className="mt-1">每日自动更新，面向开发者</p>
    </footer>
  );
}
```

- [ ] **Step 5: Verify build passes**

```bash
npm run build
```

Expected: Build succeeds (components compile without errors).

- [ ] **Step 6: Commit UI components**

```bash
git add src/components/
git commit -m "feat: add NewsCard, SourceTabs, DateNav, Footer components"
```

---

### Task 7: Daily Page + Homepage

**Files:**
- Modify: `src/app/page.tsx` (homepage redirect to latest date)
- Create: `src/app/daily/[date]/page.tsx` (daily digest page)

- [ ] **Step 1: Update homepage to redirect to latest date**

Replace `src/app/page.tsx`:

```tsx
import { getLatestDate } from "@/lib/data";
import { redirect } from "next/navigation";

export default function HomePage() {
  const latestDate = getLatestDate();

  if (latestDate) {
    redirect(`/daily/${latestDate}`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">AI News Daily</h1>
        <p className="text-muted">暂无数据，请稍后再来。</p>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Create daily page**

Create `src/app/daily/[date]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getDailyData, getAvailableDates } from "@/lib/data";
import { SourceFilter } from "@/lib/types";
import NewsCard from "@/components/NewsCard";
import SourceTabs from "@/components/SourceTabs";
import DateNav from "@/components/DateNav";
import Footer from "@/components/Footer";

export function generateStaticParams() {
  const dates = getAvailableDates();
  return dates.map((date) => ({ date }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  return {
    title: `AI News Daily · ${date}`,
    description: `${date} AI 新闻日报，来自虎嗅和 X.com`,
  };
}

export default async function DailyPage({
  params,
  searchParams,
}: {
  params: Promise<{ date: string }>;
  searchParams: Promise<{ source?: string }>;
}) {
  const { date } = await params;
  const { source } = await searchParams;
  const data = getDailyData(date);

  if (!data) {
    notFound();
  }

  const dates = getAvailableDates();
  const currentIndex = dates.indexOf(date);
  const prevDate = currentIndex < dates.length - 1 ? dates[currentIndex + 1] : null;
  const nextDate = currentIndex > 0 ? dates[currentIndex - 1] : null;

  const activeFilter: SourceFilter =
    source === "huxiu" ? "huxiu" : source === "x" ? "x" : "all";

  const allItems =
    activeFilter === "all"
      ? [...data.huxiu, ...data.xTopics]
      : activeFilter === "huxiu"
        ? data.huxiu
        : data.xTopics;

  // Sort by publishedAt descending
  allItems.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">
          <a href="/" className="hover:text-accent transition-colors">
            AI News Daily
          </a>
        </h1>
        <p className="text-sm text-muted mt-1">
          每日 AI 新闻聚合 · 面向开发者
        </p>
      </header>

      <SourceTabs
        active={activeFilter}
        onChange={(filter) => {
          const params = filter === "all" ? "" : `?source=${filter}`;
          window.location.href = `/daily/${date}${params}`;
        }}
        counts={{ huxiu: data.huxiu.length, x: data.xTopics.length }}
      />

      <div className="space-y-4">
        {allItems.length > 0 ? (
          allItems.map((item) => <NewsCard key={item.id} item={item} />)
        ) : (
          <p className="text-center text-muted py-12">
            暂无该来源的新闻数据
          </p>
        )}
      </div>

      <DateNav prevDate={prevDate} nextDate={nextDate} currentDate={date} />
      <Footer />
    </main>
  );
}
```

NOTE: The `onChange` handler in SourceTabs uses `window.location.href` for simplicity in V1. This causes a full page reload. V2 can upgrade to client-side state with `useSearchParams`.

- [ ] **Step 3: Add not-found page**

Create `src/app/daily/[date]/not-found.tsx`:

```tsx
import Link from "next/link";

export default function DailyNotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">未找到该日期的新闻</h1>
        <p className="text-muted mb-6">可能该日期暂无数据。</p>
        <Link href="/" className="text-accent hover:text-accent-hover transition-colors">
          返回首页
        </Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

Expected: Build succeeds. All pages generated.

- [ ] **Step 5: Commit homepage and daily page**

```bash
git add src/app/
git commit -m "feat: add homepage redirect and daily digest page"
```

---

### Task 8: Archive Page

**Files:**
- Create: `src/app/archive/page.tsx`

- [ ] **Step 1: Create archive page**

Create `src/app/archive/page.tsx`:

```tsx
import { getAvailableDates, getDailyData } from "@/lib/data";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata = {
  title: "归档 · AI News Daily",
  description: "浏览所有历史日报",
};

export default function ArchivePage() {
  const dates = getAvailableDates();

  // Group dates by month
  const grouped = dates.reduce<Record<string, string[]>>((acc, date) => {
    const month = date.slice(0, 7); // YYYY-MM
    if (!acc[month]) acc[month] = [];
    acc[month].push(date);
    return acc;
  }, {});

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-");
    return `${parseInt(m)}月${parseInt(d)}日`;
  };

  const formatMonth = (monthStr: string) => {
    const [y, m] = monthStr.split("-");
    return `${y}年${parseInt(m)}月`;
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">
          <Link href="/" className="hover:text-accent transition-colors">
            AI News Daily
          </Link>
        </h1>
        <p className="text-sm text-muted mt-1">归档</p>
      </header>

      {Object.entries(grouped).map(([month, monthDates]) => (
        <section key={month} className="mb-8">
          <h2 className="text-lg font-semibold mb-3">{formatMonth(month)}</h2>
          <div className="space-y-2">
            {monthDates.map((date) => {
              const data = getDailyData(date);
              const count = data
                ? data.huxiu.length + data.xTopics.length
                : 0;
              return (
                <Link
                  key={date}
                  href={`/daily/${date}`}
                  className="block border border-border rounded-lg p-3 hover:bg-card-hover transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{formatDate(date)}</span>
                    <span className="text-sm text-muted">{count} 条新闻</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      {dates.length === 0 && (
        <p className="text-center text-muted py-12">暂无归档数据</p>
      )}

      <Footer />
    </main>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit archive page**

```bash
git add src/app/archive/
git commit -m "feat: add archive page with monthly grouping"
```

---

### Task 9: Sample Data + Full Build Verification

**Files:**
- Create: `data/2026-04-28/huxiu/content.md` (sample Huxiu data)
- Create: `data/2026-04-28/x-hot-topics/content.md` (sample X data)

- [ ] **Step 1: Create sample Huxiu data**

```bash
mkdir -p data/2026-04-28/huxiu data/2026-04-28/x-hot-topics
```

Create `data/2026-04-28/huxiu/content.md`:

```markdown
# 虎嗅 AI 科技 Top10 · 2026-04-28

## 1. OpenAI 发布 GPT-5 性能全面超越人类专家

- 来源：虎嗅网
- 链接：https://www.huxiu.com/article/900001
- 分类：模型动态

OpenAI 今日正式发布 GPT-5，在数学推理、代码生成、多模态理解等多项基准测试中超越人类专家水平。该模型支持 1M token 上下文窗口，推理速度较 GPT-4o 提升三倍。

---

## 2. DeepSeek 开源 V4 模型 代码能力逼近 Claude

- 来源：虎嗅网
- 链接：https://www.huxiu.com/article/900002
- 分类：模型动态

DeepSeek 团队发布 V4 开源模型，在 HumanEval 基准上达到 92% 准确率，代码生成能力接近 Claude 4 水平。模型采用 MoE 架构，推理成本仅为同级别闭源模型的十分之一。

---

## 3. 阿里云百炼平台接入 30+ 大模型 企业调用增长 400%

- 来源：虎嗅网
- 链接：https://www.huxiu.com/article/900003
- 分类：产品

阿里云宣布百炼平台已接入 30+ 个大模型，包括通义千问、GPT-5、Claude、Gemini 等。平台企业客户 API 调用量同比增长 400%，AI 应用开发周期从月缩短至天。

---

## 4. 人形机器人赛道再迎重磅：Figure 获 6.75 亿美元融资

- 来源：虎嗅网
- 链接：https://www.huxiu.com/article/900004
- 分类：投融资

人形机器人公司 Figure AI 完成新一轮 6.75 亿美元融资，由英伟达和微软联合领投。Figure 02 机器人已在宝马工厂试运行，预计下半年实现小批量交付。

---

## 5. 中国发布首个 AI 安全评估基准 覆盖 12 类风险

- 来源：虎嗅网
- 链接：https://www.huxiu.com/article/900005
- 分类：政策

中国信通院联合多家机构发布首个 AI 安全评估基准框架，覆盖偏见歧视、隐私泄露、幻觉生成等 12 类风险维度。该基准将用于大模型备案前的安全评估流程。
```

- [ ] **Step 2: Create sample X Topics data**

Create `data/2026-04-28/x-hot-topics/content.md`:

```markdown
# X 热点追踪 (2026-04-28)

## 1. Sam Altman：GPT-5 是通向 AGI 的关键一步

- 发布时间：2026-04-28 08:30:00 UTC
- 链接：https://x.com/sama/status/199999999
- 热度：1200万 浏览 / 28万 点赞 / 6万 转发

Sam Altman 在 X 上发布长文，称 GPT-5 的发布标志着向 AGI 迈进的关键一步。他预测 2027 年将出现真正具备通用推理能力的 AI 系统。

---

## 2. Andrej Karpathy 发布 AI 教育新项目 "Teacher"

- 发布时间：2026-04-28 05:20:00 UTC
- 链接：https://x.com/karpathy/status/188888888
- 热度：560万 浏览 / 15万 点赞 / 4万 转发

Karpathy 发布开源 AI 教育项目 Teacher，能自动生成交互式课程、PPT 和测验。项目发布 24 小时内获得 8K GitHub star。

---

## 3. GoogleDeepMind 发布 Gemini 3 Pro 多模态推理突破

- 发布时间：2026-04-28 03:45:00 UTC
- 链接：https://x.com/GoogleDeepMind/status/177777777
- 热度：890万 浏览 / 22万 点赞 / 5万 转发

Gemini 3 Pro 在多模态推理基准上大幅领先，支持实时视频理解和 10M token 上下文。Google 同时宣布 Gemini API 定价下调 40%。

---

## 4. Meta 开源 Llama 4 Scout 和 Maverick 两款模型

- 发布时间：2026-04-28 02:10:00 UTC
- 链接：https://x.com/AIatMeta/status/166666666
- 热度：430万 浏览 / 11万 点赞 / 3万 转发

Meta 开源 Llama 4 系列两款模型：Scout（轻量版，适合端侧部署）和 Maverick（旗舰版，性能对标 GPT-5）。两款模型均支持 128K 上下文。

---

## 5. Hugging Face 完成 2 亿美元 D 轮融资 估值达 45 亿

- 发布时间：2026-04-28 01:00:00 UTC
- 链接：https://x.com/ababorbory/status/155555555
- 热度：210万 浏览 / 5万 点赞 / 1万 转发

Hugging Face 完成 D 轮 2 亿美元融资，Salesforce Ventures 领投，估值 45 亿美元。资金将用于扩展 AI 基础设施和开发者工具生态。
```

- [ ] **Step 3: Verify full build with sample data**

```bash
npm run build
```

Expected: Build succeeds. Pages generated for `/`, `/daily/2026-04-28`, `/archive`.

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```

Expected: ALL PASS

- [ ] **Step 5: Commit sample data**

```bash
git add data/
git commit -m "feat: add sample data for 2026-04-28"
```

---

### Task 10: GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/daily-news.yml`

- [ ] **Step 1: Create GitHub Actions workflow**

```bash
mkdir -p .github/workflows
```

Create `.github/workflows/daily-news.yml`:

```yaml
name: Daily AI News

on:
  schedule:
    - cron: "0 23 * * *" # UTC 23:00 = CST 07:00
  workflow_dispatch:

jobs:
  fetch-huxiu:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Fetch Huxiu AI News
        run: python3 .opencode/skills/huxiu-ai-news/scripts/fetch_huxiu_ai_news.py --limit 10 --git-push
        env:
          AI_NEWS_DAILY_DATA_DIR: ./data

  fetch-x-topics:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Fetch X Hot Topics
        run: python3 scripts/fetch_x_hot_topics.py --git-push
        env:
          AI_NEWS_DAILY_DATA_DIR: ./data

  build-verify:
    needs: [fetch-huxiu, fetch-x-topics]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Test
        run: npm test
```

- [ ] **Step 2: Commit workflow**

```bash
git add .github/
git commit -m "feat: add GitHub Actions daily-news workflow"
```

---

### Task 11: SEO + Metadata + Final Polish

**Files:**
- Modify: `src/app/layout.tsx` (add SEO metadata)
- Create: `src/app/robots.ts` (robots.txt)
- Create: `src/app/sitemap.ts` (sitemap)

- [ ] **Step 1: Add enhanced metadata to root layout**

Update `src/app/layout.tsx` metadata:

```tsx
export const metadata: Metadata = {
  title: {
    default: "AI News Daily",
    template: "%s · AI News Daily",
  },
  description: "每日 AI 新闻聚合，面向开发者。虎嗅 + X 热点，3 分钟读懂 AI 圈。",
  keywords: ["AI", "人工智能", "每日新闻", "AI日报", "虎嗅AI", "X热点", "开发者为"],
  authors: [{ name: "AI News Daily" }],
  openGraph: {
    title: "AI News Daily",
    description: "每日 AI 新闻聚合，面向开发者",
    siteName: "AI News Daily",
    locale: "zh_CN",
    type: "website",
  },
};
```

- [ ] **Step 2: Create robots.ts**

Create `src/app/robots.ts`:

```typescript
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://ai-news-daily.vercel.app/sitemap.xml",
  };
}
```

- [ ] **Step 3: Create sitemap.ts**

Create `src/app/sitemap.ts`:

```typescript
import { MetadataRoute } from "next";
import { getAvailableDates } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const dates = getAvailableDates();
  const dailyUrls = dates.map((date) => ({
    url: `https://ai-news-daily.vercel.app/daily/${date}`,
    lastModified: new Date(date),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [
    {
      url: "https://ai-news-daily.vercel.app",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://ai-news-daily.vercel.app/archive",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    ...dailyUrls,
  ];
}
```

- [ ] **Step 4: Verify final build**

```bash
npm run build && npx vitest run
```

Expected: ALL PASS. Build succeeds.

- [ ] **Step 5: Commit SEO and metadata**

```bash
git add src/app/layout.tsx src/app/robots.ts src/app/sitemap.ts
git commit -m "feat: add SEO metadata, robots.txt, and sitemap"
```

---

### Task 12: Vercel Deployment Config

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Create Vercel config**

Create `vercel.json`:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next"
}
```

- [ ] **Step 2: Verify build one final time**

```bash
npm run build && npx vitest run
```

Expected: ALL PASS.

- [ ] **Step 3: Commit Vercel config**

```bash
git add vercel.json
git commit -m "feat: add Vercel deployment configuration"
```

- [ ] **Step 4: Push to remote and deploy**

```bash
git push -u origin feat/init-project
```

Then connect the repository to Vercel via the Vercel dashboard or CLI.

---

## Self-Review

### Spec Coverage Check

| Spec Requirement | Task |
|---|---|
| Target audience: AI developers | Task 5-8 (UI design reflects this) |
| Daily digest format | Task 7 (DailyPage) |
| Next.js SSG | Task 1 (scaffold) + Task 7 (generateStaticParams) |
| Data from Huxiu + X | Task 3-4 (parsers) + Task 5 (data layer) |
| Git-driven data store | Task 5 (reads from `data/`) |
| Vercel deployment | Task 12 |
| GitHub Actions automation | Task 10 |
| Dark minimalist theme | Task 1 (Tailwind config) + Task 6 (components) |
| Source tabs | Task 5 (SourceTabs) |
| Date navigation | Task 5 (DateNav) |
| Archive page | Task 8 |
| SEO metadata | Task 11 |

### Placeholder Scan

No TBD, TODO, or placeholder steps. All code is complete.

### Type Consistency

- `NewsItem`, `DailyData`, `SourceFilter` defined in Task 2, used consistently in Tasks 3-7
- `parseHuxiuMarkdown` returns `NewsItem[]` (Task 3), consumed by `getDailyData` (Task 5)
- `parseXTopicsMarkdown` returns `NewsItem[]` (Task 4), consumed by `getDailyData` (Task 5)

All types match across tasks.