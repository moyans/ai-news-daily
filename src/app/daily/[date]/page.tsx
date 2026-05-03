import { notFound } from "next/navigation";
import { getDailyData, getAvailableDates } from "@/lib/data";
import DailyNewsView from "@/components/DailyNewsView";
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
    title: `AI News Daily · ${date}`,
    description: `${date} AI 新闻日报，来自虎嗅和 X.com`,
  };
}

export default async function DailyPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const data = getDailyData(date);

  if (!data) {
    notFound();
  }

  const dates = getAvailableDates();
  const currentIndex = dates.indexOf(date);
  const prevDate = currentIndex < dates.length - 1 ? dates[currentIndex + 1] : null;
  const nextDate = currentIndex > 0 ? dates[currentIndex - 1] : null;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">
          <a href="/" className="hover:text-accent transition-colors">
            AI News Daily
          </a>
        </h1>
        <p className="text-sm text-muted mt-1">
          每日 AI 新闻聚合 · 面向开发者
        </p>
      </header>

      <DailyNewsView date={date} huxiu={data.huxiu} xTopics={data.xTopics} />

      <DateNav prevDate={prevDate} nextDate={nextDate} currentDate={date} />
      <Footer />
    </main>
  );
}
