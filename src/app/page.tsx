import { getLatestDate } from "@/lib/data";
import { redirect } from "next/navigation";

export default function HomePage() {
  const latestDate = getLatestDate();

  if (latestDate) {
    redirect(`/daily/${latestDate}`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">AI News Daily</h1>
        <p className="text-muted">暂无数据，请稍后再来。</p>
      </div>
    </main>
  );
}