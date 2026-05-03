import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AI News Daily",
    template: "%s · AI News Daily",
  },
  description: "每日 AI 新闻聚合，面向开发者。虎嗅 + X 热点，3 分钟读懂 AI 圈。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
