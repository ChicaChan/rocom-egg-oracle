import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "洛克王国世界孵蛋预测工具 | Rocom Egg Oracle",
  description: "输入精灵蛋尺寸和重量，反查可能孵出的洛克王国世界精灵。基于公开孵蛋区间数据，支持严格匹配与 R 值排序。",
  metadataBase: new URL("https://rocom.eu.cc"),
  robots: "index, follow",
  alternates: { canonical: "https://rocom.eu.cc" },
  icons: { icon: "/og-image.png" },
  openGraph: {
    title: "洛克王国世界孵蛋预测工具",
    description: "输入精灵蛋尺寸和重量，反查可能孵出的精灵。",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
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
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'}if(t==='dark'){document.documentElement.setAttribute('data-theme','dark')}})()`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
