import Link from "next/link";

export default function DailyNotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">\u672A\u627E\u5230\u8BE5\u65E5\u671F\u7684\u65B0\u95FB</h1>
        <p className="text-muted mb-6">\u53EF\u80FD\u8BE5\u65E5\u671F\u6682\u65E0\u6570\u636E\u3002</p>
        <Link href="/" className="text-accent hover:text-accent-hover transition-colors">
          \u8FD4\u56DE\u9996\u9875
        </Link>
      </div>
    </main>
  );
}