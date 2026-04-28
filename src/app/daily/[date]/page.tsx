import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getDailyData, getAvailableDates } from "@/lib/data";
import { SourceFilter } from "@/lib/types";
import NewsCard from "@/components/NewsCard";
import SourceTabs from "@/components/SourceTabs";
import DateNav from "@/components/DateNav";
import Footer from "@/components/Footer";

export function generateStaticParams() {
  const dates = getAvailableDates();
  return dates.map((date) => ({ date }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  return {
    title: `AI News Daily \u00B7 ${date}`,
    description: `${date} AI \u65B0\u95FB\u65E5\u62A5\uFF0C\u6765\u81EA\u864E\u55C3\u548C X.com`,
  };
}

export default async function DailyPage({
  params,
  searchParams,
}: {
  params: Promise<{ date: string }>;
  searchParams: Promise<{ source?: string }>;
}) {
  const { date } = await params;
  const { source } = await searchParams;
  const data = getDailyData(date);

  if (!data) {
    notFound();
  }

  const dates = getAvailableDates();
  const currentIndex = dates.indexOf(date);
  const prevDate = currentIndex < dates.length - 1 ? dates[currentIndex + 1] : null;
  const nextDate = currentIndex > 0 ? dates[currentIndex - 1] : null;

  const activeFilter: SourceFilter =
    source === "huxiu" ? "huxiu" : source === "x" ? "x" : "all";

  const allItems =
    activeFilter === "all"
      ? [...data.huxiu, ...data.xTopics]
      : activeFilter === "huxiu"
        ? data.huxiu
        : data.xTopics;

  allItems.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">
          <a href="/" className="hover:text-accent transition-colors">
            AI News Daily
          </a>
        </h1>
        <p className="text-sm text-muted mt-1">
          \u6BCF\u65E5 AI \u65B0\u95FB\u805A\u5408 \u00B7 \u9762\u5411\u5F00\u53D1\u8005
        </p>
      </header>

      <Suspense fallback={<div className="flex gap-2 mb-6"><div className="px-4 py-2 rounded-lg bg-card text-muted text-sm">...</div><div className="px-4 py-2 rounded-lg bg-card text-muted text-sm">...</div><div className="px-4 py-2 rounded-lg bg-card text-muted text-sm">...</div></div>}>
        <SourceTabs
          active={activeFilter}
          date={date}
          counts={{ huxiu: data.huxiu.length, x: data.xTopics.length }}
        />
      </Suspense>

      <div className="space-y-4">
        {allItems.length > 0 ? (
          allItems.map((item) => <NewsCard key={item.id} item={item} />)
        ) : (
          <p className="text-center text-muted py-12">
            \u6682\u65E0\u8BE5\u6765\u6E90\u7684\u65B0\u95FB\u6570\u636E
          </p>
        )}
      </div>

      <DateNav prevDate={prevDate} nextDate={nextDate} currentDate={date} />
      <Footer />
    </main>
  );
}