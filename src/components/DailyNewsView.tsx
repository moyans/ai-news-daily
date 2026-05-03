"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { NewsItem, SourceFilter } from "@/lib/types";
import NewsCard from "@/components/NewsCard";
import SourceTabs from "@/components/SourceTabs";

function DailyNewsContent({
  date,
  huxiu,
  xTopics,
}: {
  date: string;
  huxiu: NewsItem[];
  xTopics: NewsItem[];
}) {
  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const activeFilter: SourceFilter =
    source === "huxiu" ? "huxiu" : source === "x" ? "x" : "all";

  const items = useMemo(() => {
    const filtered =
      activeFilter === "all"
        ? [...huxiu, ...xTopics]
        : activeFilter === "huxiu"
          ? [...huxiu]
          : [...xTopics];

    return filtered.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }, [activeFilter, huxiu, xTopics]);

  return (
    <>
      <SourceTabs
        active={activeFilter}
        date={date}
        counts={{ huxiu: huxiu.length, x: xTopics.length }}
      />

      <div className="space-y-4">
        {items.length > 0 ? (
          items.map((item) => <NewsCard key={item.id} item={item} />)
        ) : (
          <p className="text-center text-muted py-12">
            暂无该来源的新闻数据
          </p>
        )}
      </div>
    </>
  );
}

export default function DailyNewsView({
  date,
  huxiu,
  xTopics,
}: {
  date: string;
  huxiu: NewsItem[];
  xTopics: NewsItem[];
}) {
  return (
    <Suspense
      fallback={
        <div className="flex gap-2 mb-6">
          <div className="px-4 py-2 rounded-lg bg-card text-muted text-sm">
            ...
          </div>
          <div className="px-4 py-2 rounded-lg bg-card text-muted text-sm">
            ...
          </div>
          <div className="px-4 py-2 rounded-lg bg-card text-muted text-sm">
            ...
          </div>
        </div>
      }
    >
      <DailyNewsContent date={date} huxiu={huxiu} xTopics={xTopics} />
    </Suspense>
  );
}
