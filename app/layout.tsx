import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "洛克王国世界孵蛋预测工具 | Rocom Egg Oracle",
  description: "输入精灵蛋尺寸和重量，反查可能孵出的洛克王国世界精灵。基于公开孵蛋区间数据，支持严格匹配与 R 值排序。",
  robots: "index, follow",
  openGraph: {
    title: "洛克王国世界孵蛋预测工具",
    description: "输入精灵蛋尺寸和重量，反查可能孵出的精灵。",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e2722d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
