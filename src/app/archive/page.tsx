import { getAvailableDates, getDailyItemCount } from "@/lib/data";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata = {
  title: "\u5F52\u6863 \u00B7 AI News Daily",
  description: "\u6D4F\u89C8\u6240\u6709\u5386\u53F2\u65E5\u62A5",
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
    return `${parseInt(m)}\u6708${parseInt(d)}\u65E5`;
  };

  const formatMonth = (monthStr: string) => {
    const [y, m] = monthStr.split("-");
    return `${y}\u5E74${parseInt(m)}\u6708`;
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">
          <Link href="/" className="hover:text-accent transition-colors">
            AI News Daily
          </Link>
        </h1>
        <p className="text-sm text-muted mt-1">\u5F52\u6863</p>
      </header>

      {Object.entries(grouped).map(([month, monthDates]) => (
        <section key={month} className="mb-8">
          <h2 className="text-lg font-semibold mb-3">{formatMonth(month)}</h2>
          <div className="space-y-2">
            {monthDates.map((date) => {
              const count = getDailyItemCount(date);
              return (
                <Link
                  key={date}
                  href={`/daily/${date}`}
                  className="block border border-border rounded-lg p-3 hover:bg-card-hover transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{formatDate(date)}</span>
                    <span className="text-sm text-muted">{count} \u6761\u65B0\u95FB</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      {dates.length === 0 && (
        <p className="text-center text-muted py-12">\u6682\u65E0\u5F52\u6863\u6570\u636E</p>
      )}

      <Footer />
    </main>
  );
}