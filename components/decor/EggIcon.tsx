/**
 * components/decor/EggIcon.tsx
 *
 * SVG 自绘的精灵蛋图标。用于 Hero 区中央装饰与 CandidateCard 的 fallback。
 * 支持按精灵属性着色，6 种主色：草/火/水/光/暗/普通。
 */

import * as React from "react";
import { cn } from "@/lib/utils";

const TYPE_TO_TONE: Record<string, { shell: string; spots: string; accent: string }> = {
  草: { shell: "#d9f0c5", spots: "#86c462", accent: "#3f8a3f" },
  火: { shell: "#ffd9b8", spots: "#ff9355", accent: "#d04a1a" },
  水: { shell: "#cee8ff", spots: "#5ca6e8", accent: "#2a6bb2" },
  光: { shell: "#fff3c5", spots: "#f7c84a", accent: "#a87800" },
  暗: { shell: "#cfc8db", spots: "#7c6c9c", accent: "#46365e" },
  电: { shell: "#fff2a8", spots: "#f3c419", accent: "#a98000" },
  冰: { shell: "#dff2fb", spots: "#7fc4e0", accent: "#3b6f8a" },
  毒: { shell: "#e3d5f2", spots: "#a479d4", accent: "#62358a" },
  虫: { shell: "#e0eec4", spots: "#9fb858", accent: "#4f6620" },
  龙: { shell: "#d6e0ff", spots: "#6e85d9", accent: "#324086" },
  鬼: { shell: "#dccef0", spots: "#8a6abf", accent: "#4a3179" },
  幻: { shell: "#dccef0", spots: "#8a6abf", accent: "#4a3179" },
  幽: { shell: "#dccef0", spots: "#8a6abf", accent: "#4a3179" },
  恶: { shell: "#c8c0d4", spots: "#6c5f7e", accent: "#3a2f4d" },
  机械: { shell: "#d8dde5", spots: "#7a8395", accent: "#3a4250" },
  武: { shell: "#f0ddd2", spots: "#b48067", accent: "#6a4029" },
  地: { shell: "#e4d7c0", spots: "#b39660", accent: "#6b502a" },
  萌: { shell: "#ffd9eb", spots: "#ff8fc4", accent: "#b04088" },
  风: { shell: "#dff5f0", spots: "#7fcfb6", accent: "#3a8770" },
  普通: { shell: "#efe8d8", spots: "#b8a886", accent: "#74663f" },
};

const DEFAULT_TONE = { shell: "#fbf4e8", spots: "#b8a886", accent: "#74663f" };

export type EggIconProps = {
  /** 精灵主属性，决定颜色 */
  type?: string;
  /** 异色蛋会加金边 */
  shiny?: boolean;
  /** 同乘蛋会加坐骑标记 */
  mount?: boolean;
  size?: number;
  className?: string;
  /** 顶部裂纹（hero 装饰时显示） */
  cracked?: boolean;
};

export function EggIcon({
  type,
  shiny = false,
  mount = false,
  size = 48,
  className,
  cracked = false,
}: EggIconProps) {
  const tone = (type && TYPE_TO_TONE[type]) || DEFAULT_TONE;
  const id = React.useId();
  return (
    <svg
      role="img"
      aria-label={shiny ? "异色精灵蛋" : "精灵蛋"}
      viewBox="0 0 64 80"
      width={size}
      height={(size * 80) / 64}
      className={cn("inline-block select-none", className)}
    >
      <defs>
        <radialGradient id={`g-${id}`} cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="white" stopOpacity="0.85" />
          <stop offset="55%" stopColor={tone.shell} stopOpacity="1" />
          <stop offset="100%" stopColor={tone.accent} stopOpacity="0.85" />
        </radialGradient>
        <radialGradient id={`s-${id}`} cx="50%" cy="100%" r="60%">
          <stop offset="0%" stopColor="black" stopOpacity="0.18" />
          <stop offset="100%" stopColor="black" stopOpacity="0" />
        </radialGradient>
        {shiny && (
          <linearGradient id={`r-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffd955" />
            <stop offset="50%" stopColor="#ffeb99" />
            <stop offset="100%" stopColor="#ffb33c" />
          </linearGradient>
        )}
      </defs>

      {/* 阴影 */}
      <ellipse cx="32" cy="73" rx="20" ry="3.5" fill={`url(#s-${id})`} />

      {/* 蛋壳 主形 */}
      <path
        d="M32 6 C50 6 56 28 56 46 C56 62 46 74 32 74 C18 74 8 62 8 46 C8 28 14 6 32 6 Z"
        fill={`url(#g-${id})`}
        stroke={shiny ? `url(#r-${id})` : tone.accent}
        strokeWidth={shiny ? 1.6 : 0.8}
        strokeOpacity={shiny ? 1 : 0.6}
      />

      {/* 蛋壳斑点 */}
      <g fill={tone.spots} opacity="0.7">
        <ellipse cx="22" cy="30" rx="3.6" ry="2.4" transform="rotate(-15 22 30)" />
        <ellipse cx="40" cy="22" rx="2.8" ry="2" transform="rotate(20 40 22)" />
        <ellipse cx="44" cy="44" rx="3.2" ry="2.2" transform="rotate(-10 44 44)" />
        <ellipse cx="20" cy="52" rx="2.6" ry="1.8" />
        <ellipse cx="34" cy="58" rx="3.4" ry="2.2" transform="rotate(15 34 58)" />
      </g>

      {/* 高光 */}
      <ellipse cx="24" cy="22" rx="5" ry="9" fill="white" opacity="0.45" transform="rotate(-18 24 22)" />

      {/* 裂纹（cracked 时显示） */}
      {cracked && (
        <path
          d="M30 8 L34 14 L29 18 L36 24"
          fill="none"
          stroke={tone.accent}
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.7"
        />
      )}

      {/* 坐骑标记 */}
      {mount && (
        <g>
          <circle cx="48" cy="58" r="7" fill="white" stroke={tone.accent} strokeWidth="1.2" />
          <text
            x="48"
            y="61.5"
            textAnchor="middle"
            fontSize="8"
            fontWeight="bold"
            fill={tone.accent}
          >
            乘
          </text>
        </g>
      )}
    </svg>
  );
}
