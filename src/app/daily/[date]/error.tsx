"use client";

export default function DailyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">加载出错</h1>
        <p className="text-muted mb-6">{error.message || "页面加载时发生错误"}</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
        >
          重试
        </button>
      </div>
    </main>
  );
}