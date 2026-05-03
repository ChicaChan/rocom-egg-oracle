"use client";

import petsData from "@/data/pets.json";
import {
  formatHatchTime,
  getEggWeightClassLabel,
  getEggWeightClassLabels,
  predictEgg,
} from "@/src/lib/predict";
import type { PetEggRange, PredictCandidate } from "@/src/lib/types";
import { startTransition, useDeferredValue, useMemo, useState } from "react";

const pets = petsData as PetEggRange[];

const hatchOptions = Array.from(
  new Set(pets.map((pet) => pet.hatchSeconds).filter((value): value is number => Boolean(value))),
).sort((a, b) => a - b);

const dataUpdatedAt = pets[0]?.sourceUpdatedAt
  ? new Date(pets[0].sourceUpdatedAt).toLocaleString("zh-CN")
  : "尚未导入";

export default function Home() {
  const [sizeM, setSizeM] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [hatchSeconds, setHatchSeconds] = useState<number | "all">("all");
  const [topN, setTopN] = useState(12);
  const deferredSizeM = useDeferredValue(sizeM);
  const deferredWeightKg = useDeferredValue(weightKg);
  const isCalculating = deferredSizeM !== sizeM || deferredWeightKg !== weightKg;

  const result = useMemo(
    () =>
      predictEgg(pets, {
        sizeM: Number(deferredSizeM),
        weightKg: Number(deferredWeightKg),
        hatchSeconds,
        topN,
      }),
    [deferredSizeM, deferredWeightKg, hatchSeconds, topN],
  );

  const canShowResults = sizeM.trim() !== "" || weightKg.trim() !== "";

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Rocom Egg Predictor</p>
        <h1>洛克王国世界孵蛋预测工具</h1>
        <p className="heroText">
          输入精灵蛋的尺寸和重量，使用公开孵蛋区间数据进行严格匹配，再按 R 值接近程度排序。
        </p>
      </section>

      <section className="panel inputPanel" aria-label="孵蛋预测输入">
        <div className="fieldGrid">
          <label className="field">
            <span>蛋尺寸</span>
            <div className="inputWrap">
              <input
                inputMode="decimal"
                min="0"
                placeholder="例如 0.35"
                type="number"
                value={sizeM}
                onChange={(event) => setSizeM(normalizeDecimalInput(event.target.value))}
              />
              <b>m</b>
            </div>
          </label>

          <label className="field">
            <span>蛋重量</span>
            <div className="inputWrap">
              <input
                inputMode="decimal"
                min="0"
                placeholder="例如 7.45"
                type="number"
                value={weightKg}
                onChange={(event) => setWeightKg(normalizeDecimalInput(event.target.value))}
              />
              <b>kg</b>
            </div>
          </label>
        </div>

        <div className="filterGrid">
          <label className="field">
            <span>孵化时间</span>
            <select
              value={hatchSeconds}
              onChange={(event) =>
                setHatchSeconds(event.target.value === "all" ? "all" : Number(event.target.value))
              }
            >
              <option value="all">全部时间</option>
              {hatchOptions.map((seconds) => (
                <option key={seconds} value={seconds}>
                  {formatHatchTime(seconds)}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>结果数量</span>
            <select value={topN} onChange={(event) => setTopN(Number(event.target.value))}>
              <option value={8}>Top 8</option>
              <option value={12}>Top 12</option>
              <option value={20}>Top 20</option>
            </select>
          </label>

          <div className="field readonlyField">
            <span>数据范围</span>
            <strong>当前随机蛋池</strong>
          </div>
        </div>

        <div className="examples">
          <button type="button" onClick={() => fillExample("0.35", "7.45")}>
            0.35m / 7.45kg
          </button>
          <button type="button" onClick={() => fillExample("0.23", "2.87")}>
            0.23m / 2.87kg
          </button>
          <button type="button" onClick={() => fillExample("0.49", "29.6")}>
            0.49m / 29.6kg
          </button>
        </div>
      </section>

      <section className="statsGrid" aria-label="数据统计">
        <Stat label="随机蛋池记录" value={String(result.stats.totalRecords)} />
        <Stat label="唯一精灵名" value={String(result.stats.uniquePetNames)} />
        <Stat label="当前筛选池" value={String(result.stats.filteredRecords)} />
      </section>

      <section className="panel resultsPanel" aria-live="polite">
        {!canShowResults ? (
          <EmptyState />
        ) : !result.ok ? (
          <div className="errorBox">
            {result.errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        ) : (
          <>
            <div className="resultHeader">
              <div>
                <p className="sectionLabel">严格命中候选</p>
                <h2>{result.matches.length} 个结果</h2>
              </div>
              <div className="rBadge">
                {result.input ? getEggWeightClassLabel(result.input.eggWeightClass) : "未输入"} ·
                R 值：{result.input?.rValue.toFixed(3)}
              </div>
            </div>

            {isCalculating && <div className="statusStrip">正在更新预测结果...</div>}

            {result.input && (
              <div className="querySummary">
                <span>尺寸 {result.input.sizeM} m</span>
                <span>重量 {result.input.weightKg} kg</span>
                <span>筛选池 {result.stats.filteredRecords} 条</span>
              </div>
            )}

            {result.matches.length > 0 ? (
              <CandidateList candidates={result.matches} />
            ) : (
              <div className="emptyInline">
                未匹配到同时满足尺寸和重量区间的精灵。下方邻近参考只表示数值接近，不代表可能孵出。
              </div>
            )}

            {result.nearby.length > 0 && (
              <div className="nearbyBlock">
                <div className="sectionLabel">邻近参考</div>
                <CandidateList candidates={result.nearby} muted />
              </div>
            )}
          </>
        )}
      </section>

      <section className="panel notes">
        <h2>算法与数据说明</h2>
        <p>
          严格结果必须满足尺寸与重量同时落入候选精灵区间；命中后按
          <code> R = weightKg / sizeM </code>
          与候选区间中心 R 值的差距排序。
        </p>
        <p>
          数据来源于公开仓库 RocomUID 的孵蛋配置，但默认只导入带
          <code> random_eggs_group </code>
          的当前随机蛋池记录，更新时间：{dataUpdatedAt}。结果仅供参考，活动池或版本更新可能导致实际结果不同。
        </p>
      </section>
    </main>
  );

  function fillExample(nextSizeM: string, nextWeightKg: string) {
    startTransition(() => {
      setSizeM(nextSizeM);
      setWeightKg(nextWeightKg);
    });
  }
}

function normalizeDecimalInput(value: string): string {
  return value.replace(/[^\d.]/g, "").replace(/^(\d*\.\d*).*$/, "$1");
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="statCard">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="emptyState">
      <p className="sectionLabel">等待输入</p>
      <h2>填写尺寸和重量开始预测</h2>
      <p>建议直接输入游戏内蛋信息面板显示的 m 和 kg 数值。</p>
    </div>
  );
}

function CandidateList({
  candidates,
  muted = false,
}: {
  candidates: PredictCandidate[];
  muted?: boolean;
}) {
  return (
    <div className={muted ? "candidateGrid muted" : "candidateGrid"}>
      {candidates.map((candidate, index) => (
        <article className="candidateCard" key={`${candidate.pet.id}-${index}`}>
          <div className="rank">{index + 1}</div>
          <div className="candidateMain">
            <h3>{candidate.pet.name}</h3>
            <p>
              {getEggWeightClassLabels(candidate.pet.eggWeightClasses)} ·{" "}
              {formatHatchTime(candidate.pet.hatchSeconds)}
            </p>
          </div>
          <div className="rangeGrid">
            <span>尺寸 {candidate.pet.sizeMinM} - {candidate.pet.sizeMaxM} m</span>
            <span>重量 {candidate.pet.weightMinKg} - {candidate.pet.weightMaxKg} kg</span>
          </div>
          <div className="scoreRow">
            <span>R 差距 {candidate.rDiff.toFixed(3)}</span>
            <b>{candidate.score.toFixed(1)} 分 · {candidate.confidenceText}</b>
          </div>
        </article>
      ))}
    </div>
  );
}
