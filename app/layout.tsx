import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "相聚 · Together",
  description: "給家人與朋友的活動、投票、文章與自訂頁面",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen paper-grain">{children}</body>
    </html>
  );
}
