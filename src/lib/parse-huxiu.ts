import { NewsItem, NewsCategory } from "./types";

const CATEGORY_MAP: Record<string, NewsCategory> = {
  "政策": "policy",
  "芯片": "tools",       // 芯片 → tools (no direct mapping, closest)
  "机器人": "product",    // 机器人 → product
  "智能体": "tools",     // 智能体 → tools (Agent)
  "模型": "model",
  "产品": "product",
  "融资": "funding",
  "应用": "product",     // 应用 → product
};

function mapCategory(raw: string): NewsCategory {
  // Strip leading # if present (e.g., "#模型" → "模型")
  const cleaned = raw.replace(/^#/, "").trim();
  for (const [cn, en] of Object.entries(CATEGORY_MAP)) {
    if (cleaned.includes(cn)) return en;
  }
  return "product";
}

function extractTagsFromCategory(category: string): string[] {
  const cleaned = category.replace(/^#/, "").trim();
  const TAG_MAP: Record<string, string[]> = {
    "政策": ["政策", "监管"],
    "芯片": ["芯片", "算力"],
    "机器人": ["机器人", "具身智能"],
    "智能体": ["Agent", "智能体"],
    "模型": ["大模型"],
    "产品": ["产品"],
    "融资": ["融资"],
    "应用": ["应用落地"],
  };
  for (const [key, tags] of Object.entries(TAG_MAP)) {
    if (cleaned.includes(key)) return tags;
  }
  return [];
}

interface ParsedMetrics {
  sourceCount?: number;
  favorites?: number;
  comments?: number;
  heatScore?: number;
}

function parseMetricsFromBlock(text: string): ParsedMetrics {
  const result: ParsedMetrics = {};

  const sourceCountMatch = text.match(/来源数\s*(\d+)/);
  if (sourceCountMatch) result.sourceCount = parseInt(sourceCountMatch[1]);

  const favMatch = text.match(/收藏数\s*(\d+)/);
  if (favMatch) result.favorites = parseInt(favMatch[1]);

  const commentMatch = text.match(/评论数\s*(\d+)/);
  if (commentMatch) result.comments = parseInt(commentMatch[1]);

  const heatMatch = text.match(/热度分[*：:]+\s*(\d+)/);
  if (heatMatch) result.heatScore = parseInt(heatMatch[1]);

  return result;
}

/**
 * Parse the markdown format produced by fetch_huxiu_ai_news.py.
 *
 * The script outputs blocks like:
 *
 * ---
 * ## [Top N] Title: core value
 * > [!abstract] 核心速递
 * > **分类**: #模型 | **作者**: xxx | **热度分**: 219
 * > **一句话总结**: summary text
 * > **关键词**: #kw1 #kw2 #kw3
 * >
 * > **为何值得关注**: reason
 * >
 * > **互动指标**: 来源数 2 | 收藏数 0 | 评论数 0
 * > **原文链接**: [虎嗅原文](url) | **发布时间**: 2026-04-28 17:50
 */
export function parseHuxiuMarkdown(content: string, date: string): NewsItem[] {
  const items: NewsItem[] = [];

  const sectionRegex = /##\s*\[Top\s+\d+\][\s\S]*?(?=\n---\n##\s*\[Top|\n---\n*$|$)/g;
  let match: RegExpExecArray | null;

  while ((match = sectionRegex.exec(content)) !== null) {
    const section = match[0];

    const titleMatch = section.match(/##\s*\[Top\s+\d+\]\s+(.+)/);
    if (!titleMatch) continue;
    let title = titleMatch[1].trim();
    const colonIndex = title.indexOf("：");
    if (colonIndex === -1) {
      const asciiColon = title.indexOf(": ");
      if (asciiColon > 0) {
        title = title.substring(0, asciiColon).trim();
      }
    } else {
      const before = title.substring(0, colonIndex).trim();
      if (before.length >= 4 && before.length <= 60) {
        title = before;
      }
    }

    const categoryMatch = section.match(/\*\*分类\*\*[：:]\s*([^|*\n]+)/);
    const category = categoryMatch
      ? mapCategory(categoryMatch[1].trim())
      : "product";

    const linkMatch = section.match(/\[虎嗅原文\]\((https?:\/\/[^\s)]+)\)/);
    const sourceUrl = linkMatch ? linkMatch[1] : "";

    const summaryMatch = section.match(/\*\*一句话总结\*\*[：:]\s*(.+)/);
    let summary = summaryMatch ? summaryMatch[1].trim() : title;

    if (!summaryMatch) {
      const lines = section.split("\n");
      const summaryLines: string[] = [];
      let inBlockquote = false;
      let pastBlockquote = false;
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith(">")) {
          inBlockquote = true;
          continue;
        }
        if (inBlockquote && !trimmed.startsWith(">") && trimmed !== "") {
          pastBlockquote = true;
        }
        if (pastBlockquote && trimmed !== "" && !trimmed.startsWith("##") && !trimmed.startsWith("---") && !trimmed.startsWith("*由")) {
          summaryLines.push(trimmed);
        }
      }
      if (summaryLines.length > 0) {
        summary = summaryLines.join(" ").trim();
      }
    }

    // Tags: **关键词**: #kw1 #kw2 #kw3
    const tagsMatch = section.match(/\*\*关键词\*\*[：:]\s*(.+)/);
    let tags: string[] = [];
    if (tagsMatch) {
      tags = tagsMatch[1]
        .trim()
        .split(/\s+/)
        .map((t) => t.replace(/^#/, ""))
        .filter((t) => t.length > 0);
    } else {
      tags = extractTagsFromCategory(categoryMatch ? categoryMatch[1].trim() : "");
    }

    // Published time: **发布时间**: 2026-04-28 17:50
    const timeMatch = section.match(/\*\*发布时间\*\*[：:]\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/);
    const publishedAt = timeMatch
      ? `${timeMatch[1].replace(" ", "T")}+08:00`
      : `${date}T00:00:00+08:00`;

    // Metrics
    const metrics = parseMetricsFromBlock(section);

    const index = items.length;
    items.push({
      id: `${date}-huxiu-${index}`,
      title,
      summary: summary || title,
      source: "huxiu",
      sourceUrl,
      publishedAt,
      category,
      tags: tags.length > 0 ? tags : undefined,
      metrics: metrics.sourceCount !== undefined
        ? {
            views: metrics.heatScore,
            likes: metrics.favorites,
            shares: metrics.comments,
          }
        : undefined,
    });
  }

  // Fallback: if no items parsed with the new format, try the legacy format
  if (items.length === 0) {
    return parseHuxiuLegacyMarkdown(content, date);
  }

  return items;
}

/**
 * Legacy parser for the original simple markdown format:
 *
 * ## 1. Title
 * - 来源：虎嗅网
 * - 链接：https://...
 * - 分类：模型动态
 *
 * Summary text
 *
 * ---
 */
function parseHuxiuLegacyMarkdown(content: string, date: string): NewsItem[] {
  const items: NewsItem[] = [];
  const sections = content.split(/\n---\n/).filter((s) => s.trim());

  for (const section of sections) {
    const titleMatch = section.match(/##\s+\d+\.\s+(.+)/);
    if (!titleMatch) continue;
    const title = titleMatch[1].trim();

    const linkMatch = section.match(/[\-\u2022]\s*链接[\uff1a:]\s*(https?:\/\/[^\s]+)/);
    const sourceUrl = linkMatch ? linkMatch[1] : "";

    const categoryMatch = section.match(/[\-\u2022]\s*分类[\uff1a:]\s*(.+)/);
    const category = categoryMatch
      ? mapCategory(categoryMatch[1].trim())
      : "product";

    const lines = section.split("\n");
    const summaryLines: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("##") || trimmed.startsWith("-") || trimmed.startsWith("\u2022") || trimmed.startsWith("#") || trimmed === "") {
        continue;
      }
      summaryLines.push(trimmed);
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