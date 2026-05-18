"use client";

import * as React from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { clamp, normalizeDecimalInput, roundTo } from "@/lib/format/number";

export type EggInputPanelProps = {
  sizeM: number | null;
  weightKg: number | null;
  onChange: (next: { sizeM: number | null; weightKg: number | null }) => void;
};

const SIZE_MIN = 0.05;
const SIZE_MAX = 3;
const SIZE_STEP = 0.01;

const WEIGHT_MIN = 0.05;
const WEIGHT_MAX = 50;
const WEIGHT_STEP = 0.01;

export function EggInputPanel({ sizeM, weightKg, onChange }: EggInputPanelProps) {
  const sizeForSlider = sizeM ?? SIZE_MIN;
  const weightForSlider = weightKg ?? WEIGHT_MIN;

  const onSizeText = (raw: string) => {
    const cleaned = normalizeDecimalInput(raw);
    if (cleaned === "") return onChange({ sizeM: null, weightKg });
    const n = Number(cleaned);
    if (!Number.isFinite(n) || n <= 0) return;
    onChange({ sizeM: roundTo(clamp(n, SIZE_MIN, 10), 3), weightKg });
  };

  const onWeightText = (raw: string) => {
    const cleaned = normalizeDecimalInput(raw);
    if (cleaned === "") return onChange({ sizeM, weightKg: null });
    const n = Number(cleaned);
    if (!Number.isFinite(n) || n <= 0) return;
    onChange({ sizeM, weightKg: roundTo(clamp(n, WEIGHT_MIN, 5_000), 3) });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* 尺寸 */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <label htmlFor="size-input" className="text-sm font-medium">
            蛋尺寸
          </label>
          <span className="text-xs text-muted-foreground">
            在游戏蛋详情面板复制此数值
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Input
            id="size-input"
            type="text"
            inputMode="decimal"
            value={sizeM ?? ""}
            placeholder="例 0.28"
            onChange={(e) => onSizeText(e.target.value)}
            className="w-24 text-right tabular-nums"
            aria-label="蛋尺寸"
          />
          <span className="text-sm text-muted-foreground">m</span>
          <Slider
            min={SIZE_MIN}
            max={SIZE_MAX}
            step={SIZE_STEP}
            value={[sizeForSlider]}
            onValueChange={([v]) => onChange({ sizeM: roundTo(v, 2), weightKg })}
            className="flex-1"
            aria-label="蛋尺寸滑块"
          />
        </div>
      </div>

      {/* 重量 */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <label htmlFor="weight-input" className="text-sm font-medium">
            蛋重量
          </label>
          <span className="text-xs text-muted-foreground">单位 kg</span>
        </div>
        <div className="flex items-center gap-3">
          <Input
            id="weight-input"
            type="text"
            inputMode="decimal"
            value={weightKg ?? ""}
            placeholder="例 2.36"
            onChange={(e) => onWeightText(e.target.value)}
            className="w-24 text-right tabular-nums"
            aria-label="蛋重量"
          />
          <span className="text-sm text-muted-foreground">kg</span>
          <Slider
            min={WEIGHT_MIN}
            max={WEIGHT_MAX}
            step={WEIGHT_STEP}
            value={[weightForSlider]}
            onValueChange={([v]) => onChange({ sizeM, weightKg: roundTo(v, 2) })}
            className="flex-1"
            aria-label="蛋重量滑块"
          />
        </div>
      </div>
    </div>
  );
}
