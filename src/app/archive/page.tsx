import { getAvailableDates, getDailyData } from "@/lib/data";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata = {
  title: "归档 · AI News Daily",
  description: "浏览所有历史日报",
};

export default function ArchivePage() {
  const dates = getAvailableDates();

  const grouped = dates.reduce<Record<string, string[]>>((acc, date) => {
    const month = date.slice(0, 7);
    if (!acc[month]) acc[month] = [];
    acc[month].push(date);
    return acc;
  }, {});

  const formatDate = (dateStr: string) => {
    const [, m, d] = dateStr.split("-");
    return `${parseInt(m)}月${parseInt(d)}日`;
  };

  const formatMonth = (monthStr: string) => {
    const [y, m] = monthStr.split("-");
    return `${y}年${parseInt(m)}月`;
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">
          <Link href="/" className="hover:text-accent transition-colors">
            AI News Daily
          </Link>
        </h1>
        <p className="text-sm text-muted mt-1">归档</p>
      </header>

      {Object.entries(grouped).map(([month, monthDates]) => (
        <section key={month} className="mb-8">
          <h2 className="text-lg font-semibold mb-3">{formatMonth(month)}</h2>
          <div className="space-y-2">
            {monthDates.map((date) => {
              const data = getDailyData(date);
              const huxiuCount = data ? data.huxiu.length : 0;
              const xCount = data ? data.xTopics.length : 0;
              return (
                <Link
                  key={date}
                  href={`/daily/${date}`}
                  className="block border border-border rounded-lg p-3 hover:bg-card-hover transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{formatDate(date)}</span>
                    <span className="text-sm text-muted">
                      {huxiuCount > 0 && <span className="text-huxiu">虎嗅 {huxiuCount}</span>}
                      {huxiuCount > 0 && xCount > 0 && " · "}
                      {xCount > 0 && <span className="text-x">X {xCount}</span>}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      {dates.length === 0 && (
        <p className="text-center text-muted py-12">暂无归档数据</p>
      )}

      <Footer />
    </main>
  );
}