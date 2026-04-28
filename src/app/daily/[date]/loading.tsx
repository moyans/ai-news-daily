export default function DailyLoading() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8 animate-pulse">
      <header className="mb-8">
        <div className="h-7 bg-card rounded w-32 mb-2" />
        <div className="h-4 bg-card rounded w-48" />
      </header>
      <div className="flex gap-2 mb-6">
        <div className="px-4 py-2 bg-card rounded-lg w-16 h-9" />
        <div className="px-4 py-2 bg-card rounded-lg w-14 h-9" />
        <div className="px-4 py-2 bg-card rounded-lg w-10 h-9" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-3 bg-card rounded w-10" />
              <div className="h-3 bg-card rounded w-12" />
            </div>
            <div className="h-5 bg-card rounded w-3/4 mb-3" />
            <div className="h-3 bg-card rounded w-full mb-1" />
            <div className="h-3 bg-card rounded w-2/3" />
          </div>
        ))}
      </div>
    </main>
  );
}