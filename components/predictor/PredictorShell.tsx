"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import type { Pet } from "@/lib/data/schema";
import { predictEgg, type PredictionResult } from "@/lib/predict";
import { parseParams, serializeParams } from "@/lib/url/params";
import { EggInputPanel } from "./EggInputPanel";
import { PresetButtons, type Preset } from "./PresetButtons";
import { EmptyState } from "./EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type PredictorShellProps = {
  pets: Pet[];
  totalCount: number;
};

export function PredictorShell({ pets, totalCount }: PredictorShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = React.useMemo(
    () => parseParams(searchParams.toString()),
    [searchParams],
  );

  const [sizeM, setSizeM] = React.useState<number | null>(initial.sizeM);
  const [weightKg, setWeightKg] = React.useState<number | null>(initial.weightKg);

  /* 同步 URL（防抖 200ms） */
  React.useEffect(() => {
    const handle = setTimeout(() => {
      const qs = serializeParams({ sizeM: sizeM ?? undefined, weightKg: weightKg ?? undefined });
      const next = qs ? `?${qs}` : "/";
      router.replace(next, { scroll: false });
    }, 200);
    return () => clearTimeout(handle);
  }, [sizeM, weightKg, router]);

  const result: PredictionResult | null = React.useMemo(() => {
    if (sizeM == null || weightKg == null) return null;
    return predictEgg(pets, { sizeM, weightKg, topN: 10 });
  }, [pets, sizeM, weightKg]);

  const copyShareLink = async () => {
    const qs = serializeParams({ sizeM: sizeM ?? undefined, weightKg: weightKg ?? undefined });
    const url = `${window.location.origin}${qs ? "/?" + qs : "/"}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("链接已复制");
    } catch {
      toast.error("复制失败，请手动复制地址栏");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-6">
          <EggInputPanel
            sizeM={sizeM}
            weightKg={weightKg}
            onChange={({ sizeM: s, weightKg: w }) => {
              setSizeM(s);
              setWeightKg(w);
            }}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <PresetButtons
              onPick={(p: Preset) => {
                setSizeM(p.sizeM);
                setWeightKg(p.weightKg);
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={copyShareLink}
              disabled={sizeM == null && weightKg == null}
            >
              <Copy className="size-3.5" />
              复制分享链接
            </Button>
          </div>
        </CardContent>
      </Card>

      {!result || !result.ok ? (
        <>
          {result && !result.ok && result.errors.length > 0 && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {result.errors.join(" / ")}
            </div>
          )}
          <EmptyState />
        </>
      ) : (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            数据库 {totalCount} 只精灵中，严格命中 {result.stats.strictMatchCount} 只，
            邻近参考 {result.nearby.length} 只。
            <span className="ml-2 text-xs">
              R ≈ {result.input.rValue.toFixed(2)} kg/m
            </span>
          </div>

          {/* MVP 阶段：列表渲染下一步阶段 4 接入。这里先用最小列表占位 */}
          <ul className="grid gap-2">
            {result.matches.map((c, i) => (
              <li
                key={c.pet.id}
                className="flex items-baseline justify-between rounded-lg border px-4 py-3"
              >
                <span className="font-medium">
                  {i + 1}. {c.pet.displayName}
                </span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {c.confidence.label} · {c.matchScore.toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>

          {result.matches.length === 0 && result.nearby.length > 0 && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
              当前数据库没有精灵能严格命中此尺寸 + 重量组合。
              你可以试试稍微调整数值，或参考下面邻近候选。
            </div>
          )}

          {result.nearby.length > 0 && (
            <details className="mt-4 rounded-lg border px-4 py-3 text-sm">
              <summary className="cursor-pointer text-muted-foreground">
                邻近参考（{result.nearby.length}）
              </summary>
              <ul className="mt-2 space-y-1.5">
                {result.nearby.map((c) => (
                  <li
                    key={c.pet.id}
                    className="flex items-baseline justify-between text-muted-foreground"
                  >
                    <span>{c.pet.displayName}</span>
                    <span className="text-xs tabular-nums">
                      {c.confidence.label} · {c.matchScore.toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
