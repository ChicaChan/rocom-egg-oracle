"use client";

import { Button } from "@/components/ui/button";

export type Preset = {
  label: string;
  sizeM: number;
  weightKg: number;
};

const PRESETS: Preset[] = [
  { label: "迪莫蛋 (0.28×2.36)", sizeM: 0.28, weightKg: 2.36 },
  { label: "草头鸭 (0.25×1.95)", sizeM: 0.25, weightKg: 1.95 },
  { label: "小灵菇 (0.18×0.09)", sizeM: 0.18, weightKg: 0.09 },
  { label: "鸭吉吉 (0.27×1.55)", sizeM: 0.27, weightKg: 1.55 },
];

export type PresetButtonsProps = {
  onPick: (p: Preset) => void;
};

export function PresetButtons({ onPick }: PresetButtonsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">快捷示例：</span>
      {PRESETS.map((p) => (
        <Button
          key={p.label}
          variant="outline"
          size="sm"
          onClick={() => onPick(p)}
          className="h-7 rounded-full text-xs"
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
}
