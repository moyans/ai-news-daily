import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border py-8 mt-12 text-center text-xs text-muted">
      <div className="flex items-center justify-center gap-4 mb-2">
        <Link href="/" className="hover:text-accent transition-colors">
          首页
        </Link>
        <Link href="/archive" className="hover:text-accent transition-colors">
          归档
        </Link>
      </div>
      <p>AI News Daily · 数据来源：虎嗅 AI + X.com</p>
      <p className="mt-1">每日自动更新，面向开发者</p>
    </footer>
  );
}