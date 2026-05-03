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
  "芯片": "tools",
  "机器人": "product",
  "智能体": "tools",
  "应用": "product",
};

function mapCategory(raw: string): NewsCategory {
  const cleaned = raw.replace(/^#/, "").trim();
  for (const [cn, en] of Object.entries(KEYWORD_CATEGORIES)) {
    if (cleaned.includes(cn)) return en;
  }
  return "product";
}

const CORE_VALUE_SUFFIXES = [
  "AI 监管开始从讨论走向执行",
  "算力和芯片供给仍是行业上限",
  "具身智能正在加速进入真实场景",
  "AI 正从问答工具转向执行工具",
  "大模型竞争继续向生态和落地延伸",
  "AI 产品正努力改变默认入口",
  "资本正在重新定价 AI 赛道",
  "AI 正在更直接地改变消费和工作流程",
];

function stripCoreValueSuffix(title: string): string {
  for (const suffix of CORE_VALUE_SUFFIXES) {
    if (title.endsWith(suffix)) {
      const idx = title.lastIndexOf(": " + suffix);
      if (idx > 0) return title.substring(0, idx).trim();
      const cnIdx = title.lastIndexOf("：" + suffix);
      if (cnIdx > 0) return title.substring(0, cnIdx).trim();
    }
  }
  return title;
}

interface ParsedMetrics {
  views?: number;
  likes?: number;
  shares?: number;
  heatScore?: number;
  sourceCount?: number;
  favorites?: number;
  comments?: number;
}

function parseMetricValue(raw: string): number {
  return raw.includes("万") ? parseFloat(raw) * 10000 : parseInt(raw);
}

function parseMetricsFromXLine(text: string): ParsedMetrics {
  const result: ParsedMetrics = {};

  // Both "196万 浏览" and "浏览 196万" formats
  const viewsMatch = text.match(/([\d.]+万?)\s*浏览/) ?? text.match(/浏览\s*([\d.]+万?)/);
  if (viewsMatch) {
    result.views = parseMetricValue(viewsMatch[1]);
  }

  const likesMatch = text.match(/([\d.]+万?)\s*点赞/) ?? text.match(/点赞\s*([\d.]+万?)/);
  if (likesMatch) {
    result.likes = parseMetricValue(likesMatch[1]);
  }

  const sharesMatch = text.match(/([\d.]+万?)\s*转发/) ?? text.match(/转发\s*([\d.]+万?)/);
  if (sharesMatch) {
    result.shares = parseMetricValue(sharesMatch[1]);
  }

  // Huxiu-style: "来源数 6 | 收藏数 1 | 评论数 0"
  const sourceCountMatch = text.match(/来源数\s*(\d+)/);
  if (sourceCountMatch) result.sourceCount = parseInt(sourceCountMatch[1]);

  const favMatch = text.match(/收藏数\s*(\d+)/);
  if (favMatch) result.favorites = parseInt(favMatch[1]);

  const commentMatch = text.match(/评论数\s*(\d+)/);
  if (commentMatch) result.comments = parseInt(commentMatch[1]);

  // Huxiu-style heat score or X-style "热度分"
  const heatMatch = text.match(/热度分[*：:]+\s*(\d+)/);
  if (heatMatch) result.heatScore = parseInt(heatMatch[1]);

  // Also try: "热度：634 热度分" pattern from mixed content
  const heatXMatch = text.match(/热度[分：:]\s*(\d+)/);
  if (!result.heatScore && heatXMatch) result.heatScore = parseInt(heatXMatch[1]);

  return result;
}

/**
 * Parse the new blockquote format (aligned with huxiu format):
 *
 * ## [Top N] Title: core value suffix
 * > [!abstract] 核心速递
 * > **分类**: #category | **作者**: xxx | **热度分**: 123
 * > **一句话总结**: summary
 * > **关键词**: #kw1 #kw2 #kw3
 * >
 * > **为何值得关注**: reason
 * >
 * > **互动指标**: views/likes/etc
 * > **原文链接**: [X 原文](url) | **发布时间**: 2026-05-02 12:00
 */
function parseBlockquoteFormat(content: string, date: string): NewsItem[] | null {
  const items: NewsItem[] = [];

  const sectionRegex = /##\s*\[Top\s+\d+\][\s\S]*?(?=\n---\s*\n##\s*\[Top|\n---\s*\n*$|$)/g;
  let match: RegExpExecArray | null;

  while ((match = sectionRegex.exec(content)) !== null) {
    const section = match[0];

    const titleMatch = section.match(/##\s*\[Top\s+\d+\]\s+(.+)/);
    if (!titleMatch) continue;
    const rawTitle = titleMatch[1].trim();
    const title = stripCoreValueSuffix(rawTitle);

    const categoryMatch = section.match(/\*\*分类\*\*[：:]\s*([^|*\n]+)/);
    const category = categoryMatch
      ? mapCategory(categoryMatch[1].trim())
      : "product";

    const linkMatch = section.match(/\[X?\s*原文\]\((https?:\/\/[^\s)]+)\)/);
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
        if (pastBlockquote && trimmed !== "" && !trimmed.startsWith("##") && !trimmed.startsWith("---") && !trimmed.startsWith("*由") && !trimmed.startsWith("<!--")) {
          summaryLines.push(trimmed);
        }
      }
      if (summaryLines.length > 0) {
        summary = summaryLines.join(" ").trim();
      }
    }

    const whyItMattersMatch = section.match(/\*\*为何值得关注\*\*[：:]\s*(.+)/);
    const whyItMatters = whyItMattersMatch ? whyItMattersMatch[1].trim() : undefined;

    const tagsMatch = section.match(/\*\*关键词\*\*[：:]\s*(.+)/);
    let tags: string[] = [];
    if (tagsMatch) {
      tags = tagsMatch[1]
        .trim()
        .split(/\s+/)
        .map((t) => t.replace(/^#/, ""))
        .filter((t) => t.length > 0);
    }

    const timeMatch = section.match(/\*\*发布时间\*\*[：:]\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/);
    const publishedAt = timeMatch
      ? `${timeMatch[1].replace(" ", "T")}+08:00`
      : `${date}T00:00:00+08:00`;

    // Parse metrics from the 互动指标 line
    const metricsMatch = section.match(/\*\*互动指标\*\*[：:]\s*(.+)/);
    const metricsLine = metricsMatch ? metricsMatch[1] : "";
    const parsedMetrics = parseMetricsFromXLine(metricsLine);

    const index = items.length;
    items.push({
      id: `${date}-x-${index}`,
      title,
      summary: summary || title,
      source: "x",
      sourceUrl,
      publishedAt,
      category,
      tags: tags.length > 0 ? tags : undefined,
      whyItMatters,
      metrics: Object.keys(parsedMetrics).length > 0
        ? {
            views: parsedMetrics.views ?? parsedMetrics.heatScore,
            likes: parsedMetrics.likes,
            shares: parsedMetrics.shares,
            heatScore: parsedMetrics.heatScore ?? parsedMetrics.views,
            sourceCount: parsedMetrics.sourceCount,
          }
        : undefined,
    });
  }

  return items.length > 0 ? items : null;
}

/**
 * Legacy parser for the original simple markdown format:
 *
 * ## N. Title
 * - 发布时间：YYYY-MM-DD HH:MM:SS UTC
 * - 链接：https://...
 * - 热度：xxx 浏览 / yyy 点赞 / zzz 转发
 *
 * Summary text
 *
 * ---
 */
function parseLegacyFormat(content: string, date: string): NewsItem[] {
  const items: NewsItem[] = [];
  const sections = content.split(/\n---\n/).filter((s) => s.trim());

  for (const section of sections) {
    const titleMatch = section.match(/##\s+\d+\.\s+(.+)/);
    if (!titleMatch) continue;
    const title = titleMatch[1].trim();

    const timeMatch = section.match(
      /发布时间[：:]\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\s*UTC)/
    );
    const publishedAt = timeMatch
      ? timeMatch[1].replace(" UTC", "Z").replace(" ", "T")
      : `${date}T00:00:00Z`;

    const linkMatch = section.match(/链接[：:]\s*(https?:\/\/[^\s]+)/);
    const sourceUrl = linkMatch ? linkMatch[1] : "";

    const metricsMatch = section.match(/热度[：:]\s*(.+)/);
    const parsedMetrics = metricsMatch
      ? parseMetricsFromXLine(metricsMatch[1])
      : undefined;

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
    const category = mapCategory(`${title} ${summary}`);

    items.push({
      id: `${date}-x-${index}`,
      title,
      summary: summary || title,
      source: "x",
      sourceUrl,
      publishedAt,
      category,
      metrics: parsedMetrics
        ? {
            views: parsedMetrics.views ?? parsedMetrics.heatScore,
            likes: parsedMetrics.likes,
            shares: parsedMetrics.shares,
            heatScore: parsedMetrics.heatScore ?? parsedMetrics.views,
          }
        : undefined,
    });
  }

  return items;
}

export function parseXTopicsMarkdown(content: string, date: string): NewsItem[] {
  // Try new blockquote format first (aligned with huxiu)
  const blockquoteResult = parseBlockquoteFormat(content, date);
  if (blockquoteResult && blockquoteResult.length > 0) {
    return blockquoteResult;
  }

  // Fallback to legacy format
  return parseLegacyFormat(content, date);
}