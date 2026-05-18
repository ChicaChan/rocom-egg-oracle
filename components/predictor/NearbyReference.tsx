"use client";

import { ConfidenceBar } from "./ConfidenceBar";
import { Badge } from "@/components/ui/badge";
import type { Candidate } from "@/lib/predict";
import { formatSizeRange, formatWeightRange } from "@/lib/format/number";

export type NearbyReferenceProps = {
  candidates: Candidate[];
};

export function NearbyReference({ candidates }: NearbyReferenceProps) {
  if (candidates.length === 0) return null;
  return (
    <details className="group rounded-xl border bg-card/40">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-muted-foreground select-none flex items-center justify-between">
        <span>邻近参考（{candidates.length}） · 不严格命中但数值最接近</span>
        <span className="text-xs transition-transform group-open:rotate-180">▾</span>
      </summary>
      <ol className="space-y-2 border-t px-4 py-3 text-sm">
        {candidates.map((c) => (
          <li
            key={c.pet.id}
            className="grid grid-cols-[1fr_auto] items-baseline gap-2 gap-x-4"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-medium">{c.pet.displayName}</span>
                {c.pet.form?.label && (
                  <Badge variant="secondary" className="text-[10px]">
                    {c.pet.form.label}
                  </Badge>
                )}
              </div>
              <div className="text-muted-foreground text-xs tabular-nums">
                {formatSizeRange(c.pet.size.minM, c.pet.size.maxM)} ·{" "}
                {formatWeightRange(c.pet.weight.minKg, c.pet.weight.maxKg)}
              </div>
            </div>
            <div className="w-32 shrink-0">
              <ConfidenceBar
                confidence={c.confidence}
                matchScore={c.matchScore}
              />
            </div>
          </li>
        ))}
      </ol>
    </details>
  );
}
