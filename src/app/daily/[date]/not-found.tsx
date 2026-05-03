import Link from "next/link";

export default function DailyNotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">未找到该日期的新闻</h1>
        <p className="text-muted mb-6">可能该日期暂无数据。</p>
        <Link href="/" className="text-accent hover:text-accent-hover transition-colors">
          返回首页
        </Link>
      </div>
    </main>
  );
}