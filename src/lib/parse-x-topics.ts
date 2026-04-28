import { NewsItem, NewsCategory } from "./types";

const KEYWORD_CATEGORIES: Record<string, NewsCategory> = {
  "\u53D1\u5E03": "product",
  "\u5F00\u6E90": "tools",
  "\u878D\u8D44": "funding",
  "\u6295\u8D44": "funding",
  "\u8BBA\u6587": "research",
  "\u7814\u7A76": "research",
  "\u653F\u7B56": "policy",
  "\u76D1\u7BA1": "policy",
  "\u89C2\u70B9": "opinion",
  "\u6A21\u578B": "model",
  "GPT": "model",
  "Claude": "model",
  "Gemini": "model",
  "DeepSeek": "model",
  "Llama": "model",
};

function inferCategory(title: string, summary: string): NewsCategory {
  const text = `${title} ${summary}`;
  for (const [keyword, category] of Object.entries(KEYWORD_CATEGORIES)) {
    if (text.includes(keyword)) return category;
  }
  return "product";
}

function parseMetrics(metricsLine: string): { views?: number; likes?: number; shares?: number } {
  const result: { views?: number; likes?: number; shares?: number } = {};

  const viewsMatch = metricsLine.match(/([\d.]+\u4E07?)\s*\u6D4F\u89C8/);
  if (viewsMatch) {
    const raw = viewsMatch[1];
    result.views = raw.includes("\u4E07") ? parseFloat(raw) * 10000 : parseInt(raw);
  }

  const likesMatch = metricsLine.match(/([\d.]+\u4E07?)\s*\u70B9\u8D5E/);
  if (likesMatch) {
    const raw = likesMatch[1];
    result.likes = raw.includes("\u4E07") ? parseFloat(raw) * 10000 : parseInt(raw);
  }

  const sharesMatch = metricsLine.match(/([\d.]+\u4E07?)\s*\u8F6C\u53D1/);
  if (sharesMatch) {
    const raw = sharesMatch[1];
    result.shares = raw.includes("\u4E07") ? parseFloat(raw) * 10000 : parseInt(raw);
  }

  return result;
}

export function parseXTopicsMarkdown(content: string, date: string): NewsItem[] {
  const items: NewsItem[] = [];
  const sections = content.split(/\n---\n/).filter((s) => s.trim());

  for (const section of sections) {
    const titleMatch = section.match(/##\s+\d+\.\s+(.+)/);
    if (!titleMatch) continue;
    const title = titleMatch[1].trim();

    const timeMatch = section.match(
      /\u53D1\u5E03\u65F6\u95F4[\uff1a:]\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\s*UTC)/
    );
    const publishedAt = timeMatch
      ? timeMatch[1].replace(" UTC", "Z").replace(" ", "T")
      : `${date}T00:00:00Z`;

    const linkMatch = section.match(/\u94FE\u63A5[\uff1a:]\s*(https?:\/\/[^\s]+)/);
    const sourceUrl = linkMatch ? linkMatch[1] : "";

    const metricsMatch = section.match(/\u70ED\u5EA6[\uff1a:]\s*(.+)/);
    const metrics = metricsMatch ? parseMetrics(metricsMatch[1]) : undefined;

    const lines = section.split("\n");
    const summaryLines: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("##") || trimmed.startsWith("# ") || trimmed.startsWith("- ") || trimmed.startsWith("<!--") || trimmed === "---") {
        continue;
      }
      if (trimmed) {
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