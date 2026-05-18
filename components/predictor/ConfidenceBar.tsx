"use client";

import { cn } from "@/lib/utils";
import type { Confidence } from "@/lib/predict/confidence";

const TONE_CLASS: Record<Confidence["tone"], string> = {
  success: "bg-emerald-500",
  primary: "bg-primary",
  warning: "bg-amber-500",
  muted: "bg-muted-foreground",
};

export type ConfidenceBarProps = {
  confidence: Confidence;
  matchScore: number;
  showLabel?: boolean;
  className?: string;
};

export function ConfidenceBar({
  confidence,
  matchScore,
  showLabel = true,
  className,
}: ConfidenceBarProps) {
  const pct = Math.max(0, Math.min(100, matchScore));
  return (
    <div className={cn("space-y-1", className)}>
      {showLabel && (
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-medium">{confidence.label}</span>
          <span className="text-muted-foreground tabular-nums">{pct.toFixed(1)}%</span>
        </div>
      )}
      <div className="bg-muted relative h-1.5 overflow-hidden rounded-full">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-[width]",
            TONE_CLASS[confidence.tone],
          )}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={confidence.label}
        />
      </div>
    </div>
  );
}
