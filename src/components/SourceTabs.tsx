"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SourceFilter } from "@/lib/types";

const TABS: { key: SourceFilter; label: string }[] = [
  { key: "all", label: "\u5168\u90E8" },
  { key: "huxiu", label: "\u864E\u55C3" },
  { key: "x", label: "X" },
];

export default function SourceTabs({
  active,
  counts,
  date,
}: {
  active: SourceFilter;
  onChange?: (filter: SourceFilter) => void;
  counts: { huxiu: number; x: number };
  date: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (filter: SourceFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    if (filter === "all") {
      params.delete("source");
    } else {
      params.set("source", filter);
    }
    const query = params.toString();
    router.push(`/daily/${date}${query ? `?${query}` : ""}`);
  };

  return (
    <div className="flex gap-2 mb-6">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => handleChange(tab.key)}
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