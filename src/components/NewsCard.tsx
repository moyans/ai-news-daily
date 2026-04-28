import { NewsItem } from "@/lib/types";

const SOURCE_CONFIG: Record<string, { name: string; color: string; bg: string }> = {
  huxiu: { name: "\u864E\u55C3", color: "text-huxiu", bg: "bg-huxiu/10" },
  x: { name: "X", color: "text-x", bg: "bg-x/10" },
};

const CATEGORY_LABELS: Record<string, string> = {
  model: "\u6A21\u578B",
  product: "\u4EA7\u54C1",
  funding: "\u878D\u8D44",
  research: "\u7814\u7A76",
  policy: "\u653F\u7B56",
  opinion: "\u89C2\u70B9",
  tools: "\u5DE5\u5177",
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
    return `\u6628\u5929 ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  }
  return `${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

function formatCount(n: number | undefined, unit: string): string | null {
  if (n === undefined || n === 0) return null;
  if (n >= 10000) {
    const wan = n / 10000;
    const wanStr = wan === Math.floor(wan) ? wan.toFixed(0) : wan.toFixed(1);
    return `${wanStr}\u4E07${unit}`;
  }
  return `${n.toLocaleString()}${unit}`;
}

export default function NewsCard({ item }: { item: NewsItem }) {
  const source = SOURCE_CONFIG[item.source];

  const metricsElements: string[] = [];
  if (item.source === "huxiu" && item.metrics?.heatScore !== undefined) {
    metricsElements.push(`\u70ED\u5EA6 ${item.metrics.heatScore}`);
    if (item.metrics.sourceCount !== undefined && item.metrics.sourceCount > 0) {
      metricsElements.push(`\u6765\u6E90 ${item.metrics.sourceCount}`);
    }
    if (item.metrics.likes !== undefined && item.metrics.likes > 0) {
      metricsElements.push(`${item.metrics.likes}\u6536\u85CF`);
    }
  } else {
    const views = formatCount(item.metrics?.views, "\u6D4F\u89C8");
    const likes = formatCount(item.metrics?.likes, "\u8D5E");
    const shares = formatCount(item.metrics?.shares, "\u8F6C\u53D1");
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
            {item.tags.slice(0, 3).join(" \u00B7 ")}
          </div>
        )}
        <h3 className="text-base font-semibold text-foreground leading-snug mb-2 group-hover:text-accent transition-colors">
          {item.title}
        </h3>
        <p className="text-sm text-muted leading-relaxed line-clamp-2">
          {item.summary}
        </p>
        {item.whyItMatters && (
          <p className="text-xs text-accent/70 mt-1 line-clamp-1">
            \u2728 {item.whyItMatters}
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
          \u539F\u6587
        </a>
        {metricsElements.length > 0 && (
          <span>{metricsElements.join(" \u00B7 ")}</span>
        )}
        <span>{formatRelativeTime(item.publishedAt)}</span>
      </div>
    </article>
  );
}