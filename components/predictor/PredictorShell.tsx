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
import { CandidateList } from "./CandidateList";
import { NearbyReference } from "./NearbyReference";
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
      const qs = serializeParams({
        sizeM: sizeM ?? undefined,
        weightKg: weightKg ?? undefined,
      });
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
    const qs = serializeParams({
      sizeM: sizeM ?? undefined,
      weightKg: weightKg ?? undefined,
    });
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
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span>
              数据库 <strong className="text-foreground">{totalCount}</strong> 只精灵
              · 严格命中{" "}
              <strong className="text-foreground">{result.stats.strictMatchCount}</strong> 只
              · 邻近 {result.nearby.length} 只
            </span>
            <span className="text-xs">R ≈ {result.input.rValue.toFixed(2)} kg/m</span>
          </div>

          {result.matches.length > 0 ? (
            <CandidateList matches={result.matches} />
          ) : (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
              当前数据库没有精灵能严格命中这组尺寸 × 重量。
              你可以试试微调数值，或查看下方邻近参考。
            </div>
          )}

          <NearbyReference candidates={result.nearby} />
        </div>
      )}
    </div>
  );
}
