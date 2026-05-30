import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "相聚 · Together",
  description: "給家人與朋友的活動、投票、文章與自訂頁面",
};

/**
 * Without `width=device-width` the browser renders mobile pages at the
 * default 980px width and scales down — Tailwind's `md:` breakpoint
 * never kicks in. Setting this is the difference between a usable
 * mobile layout and a tiny illegible desktop screenshot.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen paper-grain">{children}</body>
    </html>
  );
}
