export default function ArchiveLoading() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8 animate-pulse">
      <header className="mb-8">
        <div className="h-7 bg-card rounded w-32 mb-2" />
        <div className="h-4 bg-card rounded w-12" />
      </header>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border border-border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-card rounded w-20" />
              <div className="h-3 bg-card rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}