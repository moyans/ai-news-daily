import { SourceFilter } from "@/lib/types";

const TABS: { key: SourceFilter; label: string }[] = [
  { key: "all", label: "\u5168\u90E8" },
  { key: "huxiu", label: "\u864E\u55C3" },
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