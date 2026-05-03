import { NewsItem } from "@/lib/types";

const SOURCE_CONFIG: Record<string, { name: string; color: string; bg: string }> = {
  huxiu: { name: "虎嗅", color: "text-huxiu", bg: "bg-huxiu/10" },
  x: { name: "X", color: "text-x", bg: "bg-x/10" },
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

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 24 && now.getDate() === date.getDate()) {
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  }
  if (diffHours < 48) {
    return `昨天 ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  }
  return `${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

function formatCount(n: number | undefined, unit: string): string | null {
  if (n === undefined || n === 0) return null;
  if (n >= 10000) {
    const wan = n / 10000;
    const wanStr = wan === Math.floor(wan) ? wan.toFixed(0) : wan.toFixed(1);
    return `${wanStr}万${unit}`;
  }
  return `${n.toLocaleString()}${unit}`;
}

export default function NewsCard({ item }: { item: NewsItem }) {
  const source = SOURCE_CONFIG[item.source];

  const metricsElements: string[] = [];
  if (item.source === "huxiu" && item.metrics?.heatScore !== undefined) {
    metricsElements.push(`热度 ${item.metrics.heatScore}`);
    if (item.metrics.sourceCount !== undefined && item.metrics.sourceCount > 0) {
      metricsElements.push(`来源 ${item.metrics.sourceCount}`);
    }
    if (item.metrics.likes !== undefined && item.metrics.likes > 0) {
      metricsElements.push(`${item.metrics.likes}收藏`);
    }
  } else {
    const views = formatCount(item.metrics?.views, "浏览");
    const likes = formatCount(item.metrics?.likes, "赞");
    const shares = formatCount(item.metrics?.shares, "转发");
    if (views) metricsElements.push(views);
    if (likes) metricsElements.push(likes);
    if (shares) metricsElements.push(shares);
  }

  return (
    <article className="group border border-border rounded-lg p-4 hover:bg-card-hover transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${source.color} ${source.bg}`}>
            {source.name}
          </span>
          <span className="text-xs text-muted border border-border rounded px-1">
            {CATEGORY_LABELS[item.category] || item.category}
          </span>
        </div>
        {item.tags && item.tags.length > 0 && (
          <div className="text-xs text-muted/50 mb-1">
            {item.tags.slice(0, 3).join(" · ")}
          </div>
        )}
        <h3 className="text-base font-semibold text-foreground leading-snug mb-2 group-hover:text-accent transition-colors">
          {item.title}
        </h3>
        <p className="text-sm text-muted leading-relaxed">
          {item.summary}
        </p>
        {item.whyItMatters && (
          <p className="text-xs text-accent/70 mt-1">
            ✨ {item.whyItMatters}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 mt-3 text-xs text-muted">
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-accent transition-colors"
        >
          原文
        </a>
        {metricsElements.length > 0 && (
          <span>{metricsElements.join(" · ")}</span>
        )}
        <span>{formatRelativeTime(item.publishedAt)}</span>
      </div>
    </article>
  );
}