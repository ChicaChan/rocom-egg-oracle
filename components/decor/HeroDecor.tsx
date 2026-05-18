"use client";

/**
 * Hero 区背景装饰：蛋壳纹理 SVG + 柔光渐变 + 漂浮蛋形。
 * 全部 CSS-only，prefers-reduced-motion 时关闭浮动动画。
 * pointer-events-none，不影响交互。
 */
export function HeroDecor() {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      {/* 顶部柔光 */}
      <div className="absolute -top-32 left-1/2 h-[480px] w-[680px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute -top-24 right-1/4 h-64 w-64 rounded-full bg-amber-300/10 blur-2xl" />

      {/* 蛋壳纹理 — 由 SVG 半透明圆点构成 */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.04] dark:opacity-[0.06]"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern
            id="eggshell"
            x="0"
            y="0"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="10" cy="10" r="1.2" fill="currentColor" />
            <circle cx="30" cy="20" r="0.8" fill="currentColor" />
            <circle cx="20" cy="32" r="1" fill="currentColor" />
            <circle cx="5" cy="28" r="0.6" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="400" height="400" fill="url(#eggshell)" />
      </svg>

      {/* 漂浮蛋 - 隐藏在小屏，桌面端显示 */}
      <div className="hidden md:block">
        <span className="absolute left-[6%] top-[18%] text-2xl opacity-30 motion-safe:animate-[float_6s_ease-in-out_infinite]">
          🥚
        </span>
        <span
          className="absolute right-[8%] top-[28%] text-xl opacity-20 motion-safe:animate-[float_7s_ease-in-out_infinite]"
          style={{ animationDelay: "1.2s" }}
        >
          🥚
        </span>
        <span
          className="absolute left-[15%] bottom-[12%] text-lg opacity-25 motion-safe:animate-[float_5.5s_ease-in-out_infinite]"
          style={{ animationDelay: "2.4s" }}
        >
          🥚
        </span>
      </div>
    </div>
  );
}
