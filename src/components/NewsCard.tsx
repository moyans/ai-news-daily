import { NewsItem } from "@/lib/types";

const SOURCE_CONFIG: Record<string, { name: string; color: string }> = {
  huxiu: { name: "\u864E\u55C3", color: "text-huxiu" },
  x: { name: "X", color: "text-x" },
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

export default function NewsCard({ item }: { item: NewsItem }) {
  const source = SOURCE_CONFIG[item.source];

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
          \u539F\u6587\u94FE\u63A5
        </a>
        {item.metrics && (
          <span>
            {item.metrics.views && `${(item.metrics.views / 10000).toFixed(1)}\u4E07\u6D4F\u89C8`}
            {item.metrics.likes && ` \u00B7 ${item.metrics.likes.toLocaleString()}\u8D5E`}
            {item.metrics.shares && ` \u00B7 ${item.metrics.shares.toLocaleString()}\u8F6C\u53D1`}
          </span>
        )}
      </div>
    </article>
  );
}