import { NewsItem, NewsCategory } from "./types";

const CATEGORY_MAP: Record<string, NewsCategory> = {
  "\u6A21\u578B\u52A8\u6001": "model",
  "\u6A21\u578B": "model",
  "\u4EA7\u54C1\u53D1\u5E03": "product",
  "\u4EA7\u54C1": "product",
  "\u6295\u878D\u8D44": "funding",
  "\u878D\u8D44": "funding",
  "\u6280\u672F\u6D1E\u5BDF": "research",
  "\u7814\u7A76": "research",
  "\u653F\u7B56": "policy",
  "\u89C2\u70B9": "opinion",
  "\u5DE5\u5177": "tools",
};

function mapCategory(raw: string): NewsCategory {
  for (const [cn, en] of Object.entries(CATEGORY_MAP)) {
    if (raw.includes(cn)) return en;
  }
  return "product";
}

export function parseHuxiuMarkdown(content: string, date: string): NewsItem[] {
  const items: NewsItem[] = [];
  const sections = content.split(/\n---\n/).filter((s) => s.trim());

  for (const section of sections) {
    const titleMatch = section.match(/##\s+\d+\.\s+(.+)/);
    if (!titleMatch) continue;
    const title = titleMatch[1].trim();

    const linkMatch = section.match(/[\-\u2022]\s*\u94FE\u63A5[\uff1a:]\s*(https?:\/\/[^\s]+)/);
    const sourceUrl = linkMatch ? linkMatch[1] : "";

    const categoryMatch = section.match(/[\-\u2022]\s*\u5206\u7C7B[\uff1a:]\s*(.+)/);
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