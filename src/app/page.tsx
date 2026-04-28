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
        <p className="text-muted">\u6682\u65E0\u6570\u636E\uFF0C\u8BF7\u7A0D\u540E\u518D\u6765\u3002</p>
      </div>
    </main>
  );
}