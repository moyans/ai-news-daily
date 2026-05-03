import Link from "next/link";

export default function DateNav({
  prevDate,
  nextDate,
  currentDate,
}: {
  prevDate: string | null;
  nextDate: string | null;
  currentDate: string;
}) {
  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-");
    return `${y}年${parseInt(m)}月${parseInt(d)}日`;
  };

  return (
    <nav className="flex items-center justify-between py-4 border-t border-border mt-6">
      {prevDate ? (
        <Link
          href={`/daily/${prevDate}`}
          className="text-sm text-muted hover:text-accent transition-colors"
        >
          &larr; {formatDate(prevDate)}
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm font-medium text-foreground">
        {formatDate(currentDate)}
      </span>
      {nextDate ? (
        <Link
          href={`/daily/${nextDate}`}
          className="text-sm text-muted hover:text-accent transition-colors"
        >
          {formatDate(nextDate)} &rarr;
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}