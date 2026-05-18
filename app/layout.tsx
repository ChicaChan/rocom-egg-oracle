import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Rocom Egg Oracle · 洛克王国世界孵蛋反查",
  description:
    "输入精灵蛋尺寸和重量，反查可能孵出的《洛克王国：世界》精灵。基于公开孵蛋区间的启发式匹配工具。",
  metadataBase: new URL("https://rocom.eu.cc"),
  robots: "index, follow",
  alternates: { canonical: "https://rocom.eu.cc" },
  icons: { icon: "/og-image.png" },
  openGraph: {
    title: "Rocom Egg Oracle · 洛克王国世界孵蛋反查",
    description: "输入蛋尺寸和重量，反查可能孵出的精灵",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf4e8" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1a17" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
