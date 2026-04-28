import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border py-8 mt-12 text-center text-xs text-muted">
      <div className="flex items-center justify-center gap-4 mb-2">
        <Link href="/" className="hover:text-accent transition-colors">
          \u9996\u9875
        </Link>
        <Link href="/archive" className="hover:text-accent transition-colors">
          \u5F52\u6863
        </Link>
      </div>
      <p>AI News Daily \u00B7 \u6570\u636E\u6765\u6E90\uFF1A\u864E\u55C3 AI + X.com</p>
      <p className="mt-1">\u6BCF\u65E5\u81EA\u52A8\u66F4\u65B0\uFF0C\u9762\u5411\u5F00\u53D1\u8005</p>
    </footer>
  );
}