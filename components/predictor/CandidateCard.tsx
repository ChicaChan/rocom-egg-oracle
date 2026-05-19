"use client";

import Image from "next/image";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ConfidenceBar } from "./ConfidenceBar";
import type { Candidate } from "@/lib/predict";
import { formatSizeRange, formatWeightRange } from "@/lib/format/number";
import { dataQualityLabel, petImageUrl } from "@/lib/format/pet";
import { EggIcon } from "@/components/decor/EggIcon";

export type CandidateCardProps = {
  candidate: Candidate;
  rank: number;
  /** 排版变体：第 1 名最大，第 2-3 名中等，其余紧凑 */
  variant: "hero" | "medium" | "standard";
};

const RANK_RING: Record<CandidateCardProps["variant"], string> = {
  hero: "ring-2 ring-primary/40 shadow-lg shadow-primary/10 motion-safe:animate-[glow-pulse_3s_ease-in-out_infinite]",
  medium: "ring-1 ring-primary/20",
  standard: "",
};

const RANK_BADGE_CLASS: Record<number, string> = {
  1: "bg-gradient-to-br from-amber-400 to-amber-600 text-white",
  2: "bg-gradient-to-br from-slate-300 to-slate-500 text-white",
  3: "bg-gradient-to-br from-orange-400 to-orange-700 text-white",
};

export function CandidateCard({ candidate, rank, variant }: CandidateCardProps) {
  const { pet, matchScore, confidence, sizeDistance, weightDistance, rValue } =
    candidate;
  const img = petImageUrl(pet);
  const imageSize = variant === "hero" ? 96 : variant === "medium" ? 72 : 56;

  return (
    <Card
      className={cn(
        "relative gap-4 py-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 motion-reduce:transform-none",
        RANK_RING[variant],
        variant === "hero" && "md:py-5",
      )}
    >
      <div className="flex items-start gap-4 px-4">
        {/* 排名徽章 */}
        <span
          className={cn(
            "absolute -top-2 -left-2 inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold tabular-nums shadow",
            RANK_BADGE_CLASS[rank] ?? "bg-muted text-foreground",
          )}
          aria-label={`第 ${rank} 名`}
        >
          {rank}
        </span>

        {/* 立绘 / 占位 */}
        <div
          className="bg-muted/40 flex shrink-0 items-center justify-center rounded-lg overflow-hidden border"
          style={{ width: imageSize, height: imageSize }}
          aria-hidden
        >
          {img ? (
            <Image
              src={img}
              alt={pet.displayName}
              width={imageSize}
              height={imageSize}
              className="object-contain"
              loading={variant === "standard" ? "lazy" : "eager"}
              unoptimized
            />
          ) : (
            <EggIcon
              type={pet.types[0]}
              shiny={pet.isShiny}
              mount={pet.isMount}
              size={Math.round(imageSize * 0.78)}
            />
          )}
        </div>

        {/* 主信息 */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h3
              className={cn(
                "font-semibold leading-tight",
                variant === "hero" ? "text-xl" : "text-base",
              )}
            >
              {pet.displayName}
            </h3>
            {pet.form?.label && (
              <Badge variant="secondary" className="text-[10px]">
                {pet.form.label}
              </Badge>
            )}
            {pet.isMount && (
              <Badge variant="outline" className="text-[10px]">
                同乘
              </Badge>
            )}
            {pet.isShiny && (
              <Badge variant="warning" className="text-[10px]">
                异色
              </Badge>
            )}
          </div>

          {/* 属性 + 区间 */}
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {pet.types.length > 0 && (
              <span className="flex gap-1">
                {pet.types.map((t) => (
                  <Badge key={t} variant="outline" className="text-[10px]">
                    {t}
                  </Badge>
                ))}
              </span>
            )}
            <span className="tabular-nums">
              📏 {formatSizeRange(pet.size.minM, pet.size.maxM)}
            </span>
            <span className="tabular-nums">
              ⚖ {formatWeightRange(pet.weight.minKg, pet.weight.maxKg)}
            </span>
          </div>

          {/* 匹配度 */}
          <ConfidenceBar
            confidence={confidence}
            matchScore={matchScore}
            showLabel={variant !== "standard"}
          />

          {/* 详细距离（仅 hero）*/}
          {variant === "hero" && (
            <div className="text-muted-foreground text-[11px] tabular-nums">
              尺寸偏移 {(sizeDistance * 100).toFixed(0)}% · 重量偏移{" "}
              {(weightDistance * 100).toFixed(0)}% · R={rValue.toFixed(2)} kg/m
            </div>
          )}
        </div>

        {/* 标准卡：右侧紧凑分数 */}
        {variant === "standard" && (
          <div className="shrink-0 text-right text-xs tabular-nums">
            <div className="font-medium">{confidence.label}</div>
            <div className="text-muted-foreground">{matchScore.toFixed(1)}%</div>
          </div>
        )}
      </div>

      {/* 数据来源徽标（底部） */}
      <div className="text-muted-foreground flex flex-wrap items-center gap-2 border-t px-4 pt-3 text-[10px]">
        {pet.dataQuality === "verified" ? (
          <Badge variant="success" className="text-[10px]">
            ✓ 已验证
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px]">
            ~ 估算
          </Badge>
        )}
        <span className="ml-auto">{dataQualityLabel(pet)}</span>
      </div>
    </Card>
  );
}
