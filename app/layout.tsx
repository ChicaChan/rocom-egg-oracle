import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "洛克王国世界孵蛋预测工具",
  description: "输入精灵蛋尺寸和重量，反查可能孵出的洛克王国世界精灵。",
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
