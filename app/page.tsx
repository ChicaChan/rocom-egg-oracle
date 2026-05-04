"use client";

import petsData from "@/data/pets.json";
import {
  formatHatchTime,
  getEggWeightClassLabel,
  getEggWeightClassLabels,
  predictEgg,
} from "@/src/lib/predict";
import type { PetEggRange, PredictCandidate } from "@/src/lib/types";
import { useRouter, useSearchParams } from "next/navigation";
import {
  startTransition,
  Suspense,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const pets = petsData as PetEggRange[];

const hatchOptions = Array.from(
  new Set(pets.map((pet) => pet.hatchSeconds).filter((value): value is number => Boolean(value))),
).sort((a, b) => a - b);

const dataUpdatedAt = pets[0]?.sourceUpdatedAt
  ? new Date(pets[0].sourceUpdatedAt).toLocaleString("zh-CN")
  : "尚未导入";

export default function Home() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [sizeM, setSizeM] = useState(() => searchParams.get("size") ?? "");
  const [weightKg, setWeightKg] = useState(() => searchParams.get("weight") ?? "");
  const [hatchSeconds, setHatchSeconds] = useState<number | "all">(() => {
    const hatch = searchParams.get("hatch");
    if (hatch && !Number.isNaN(Number(hatch))) return Number(hatch);
    return "all";
  });
  const [topN, setTopN] = useState(() => {
    const top = searchParams.get("top");
    if (top && !Number.isNaN(Number(top))) return Number(top);
    return 12;
  });
  const [searchQuery, setSearchQuery] = useState("");

  const deferredSizeM = useDeferredValue(sizeM);
  const deferredWeightKg = useDeferredValue(weightKg);
  const isCalculating = deferredSizeM !== sizeM || deferredWeightKg !== weightKg;

  const initialLoadRef = useRef(true);
  const hasParams = sizeM !== "" || weightKg !== "";

  useEffect(() => {
    if (initialLoadRef.current && hasParams) {
      initialLoadRef.current = false;
      requestAnimationFrame(() => {
        document.querySelector(".resultsPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [hasParams]);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (initialLoadRef.current) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (sizeM) params.set("size", sizeM);
      if (weightKg) params.set("weight", weightKg);
      if (hatchSeconds !== "all") params.set("hatch", String(hatchSeconds));
      if (topN !== 12) params.set("top", String(topN));
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false });
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [sizeM, weightKg, hatchSeconds, topN, router]);

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

  const dataAgeDays = useMemo(() => {
    if (!pets[0]?.sourceUpdatedAt) return 0;
    return (Date.now() - new Date(pets[0].sourceUpdatedAt).getTime()) / (1000 * 60 * 60 * 24);
  }, []);

  return (
    <>
      <Toast />
      <main className="shell">
        <section className="hero">
          <p className="eyebrow">Rocom Egg Oracle</p>
          <h1>洛克王国世界 · 孵蛋预测</h1>
          <p className="heroText">
            输入精灵蛋的尺寸和重量，基于公开孵蛋区间数据反查匹配精灵。
            <br />
            <small>R = 重量 / 尺寸，比值越接近候选中心值，可能性越高</small>
          </p>
        </section>

        <section className="panel inputPanel" aria-label="预测输入">
          <div className="inputRow">
            <label className="field">
              <span className="fieldLabel">蛋尺寸</span>
              <div className="inputWrap">
                <input
                  inputMode="decimal"
                  min="0"
                  placeholder="0.35"
                  type="number"
                  value={sizeM}
                  onChange={(e) => setSizeM(normalizeDecimalInput(e.target.value))}
                />
                <span className="unit">m</span>
              </div>
            </label>
            <label className="field">
              <span className="fieldLabel">蛋重量</span>
              <div className="inputWrap">
                <input
                  inputMode="decimal"
                  min="0"
                  placeholder="7.45"
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(normalizeDecimalInput(e.target.value))}
                />
                <span className="unit">kg</span>
              </div>
            </label>
            <label className="field">
              <span className="fieldLabel">孵化时间</span>
              <select
                value={hatchSeconds}
                onChange={(e) =>
                  setHatchSeconds(e.target.value === "all" ? "all" : Number(e.target.value))
                }
              >
                <option value="all">全部</option>
                {hatchOptions.map((s) => (
                  <option key={s} value={s}>{formatHatchTime(s)}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="filterRow">
            <label className="field">
              <span className="fieldLabel">结果数量</span>
              <select value={topN} onChange={(e) => setTopN(Number(e.target.value))}>
                <option value={8}>Top 8</option>
                <option value={12}>Top 12</option>
                <option value={20}>Top 20</option>
              </select>
            </label>
            <div className="poolBadge">
              当前随机蛋池 · {result.stats.totalRecords} 条记录
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
          </div>
        </section>

        <div className="statsRow" aria-label="数据统计">
          <div className="statChip">
            <span className="statChipLabel">随机蛋池</span>
            <span className="statChipValue">{result.stats.totalRecords}</span>
          </div>
          <div className="statChip">
            <span className="statChipLabel">唯一精灵</span>
            <span className="statChipValue">{result.stats.uniquePetNames}</span>
          </div>
          <div className="statChip">
            <span className="statChipLabel">筛选池</span>
            <span className="statChipValue">{result.stats.filteredRecords}</span>
          </div>
          {hatchSeconds !== "all" && (
            <span className="filterHint">已按 {formatHatchTime(hatchSeconds)} 筛选</span>
          )}
        </div>

        <DataFreshnessBanner ageDays={dataAgeDays} />

        {isCalculating && <div className="statusStrip">正在更新预测结果...</div>}

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
                  <p className="sectionLabel">严格命中</p>
                  <h2>{result.matches.length} 个结果</h2>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {result.input && (
                    <div className="rBadge">
                      {getEggWeightClassLabel(result.input.eggWeightClass)}
                      <span className="rBadgeSep">·</span>
                      R = {result.input.rValue.toFixed(3)}
                    </div>
                  )}
                  {canShowResults && <ShareButton />}
                </div>
              </div>

              {result.input && (
                <div className="querySummary">
                  <span>尺寸 {result.input.sizeM} m</span>
                  <span>重量 {result.input.weightKg} kg</span>
                  <span>筛选池 {result.stats.filteredRecords} 条</span>
                </div>
              )}

              {result.matches.length > 0 && (
                <div className="searchRow">
                  <input
                    className="searchInput"
                    placeholder="搜索精灵名称..."
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              )}

              {result.matches.length > 0 ? (
                <CandidateList candidates={result.matches} searchQuery={searchQuery} />
              ) : (
                <div className="emptyInline">
                  未匹配到同时满足尺寸和重量区间的精灵。下方邻近参考只表示数值接近，不代表可能孵出。
                </div>
              )}

              {result.nearby.length > 0 && (
                <div className="nearbyBlock">
                  <p className="sectionLabel">邻近参考</p>
                  <p className="nearbyHint">以下为数值邻近参考，非严格匹配</p>
                  <CandidateList candidates={result.nearby} muted searchQuery="" />
                </div>
              )}
            </>
          )}
        </section>

        <section className="panel notes">
          <h2>算法与数据说明</h2>
          <p>
            数据来源于公开仓库 RocomUID，默认只导入带 <code>random_eggs_group</code> 的当前随机蛋池记录。
            更新时间：{dataUpdatedAt}。活动池或版本更新可能导致实际结果不同。
          </p>
        </section>
      </main>
    </>
  );

  function fillExample(nextSizeM: string, nextWeightKg: string) {
    startTransition(() => {
      setSizeM(nextSizeM);
      setWeightKg(nextWeightKg);
      requestAnimationFrame(() => {
        document.querySelector(".resultsPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }
}

/* ── Share ── */

function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // fallback for non-HTTPS
    });
  }, []);

  return (
    <button className="shareBtn" type="button" onClick={handleCopy}>
      {copied ? "已复制链接 ✓" : "分享"}
    </button>
  );
}

/* ── Data Freshness ── */

function DataFreshnessBanner({ ageDays }: { ageDays: number }) {
  if (ageDays <= 7) return null;
  const isStale = ageDays > 30;
  return (
    <div className={`freshnessBanner${isStale ? " freshnessBannerStale" : ""}`}>
      {isStale
        ? `数据已超过 ${Math.floor(ageDays)} 天未更新，可能严重滞后`
        : `数据已 ${Math.floor(ageDays)} 天未更新，建议尽快更新`}
    </div>
  );
}

let toastTimer: ReturnType<typeof setTimeout>;
let toastId = 0;

function showToast(message: string) {
  clearTimeout(toastTimer);
  toastId += 1;
  const el = document.getElementById("toast");
  if (el) {
    el.textContent = message;
    el.className = "toast toastVisible";
    toastTimer = setTimeout(() => {
      el.className = "toast";
    }, 2000);
  }
}

function Toast() {
  return <div id="toast" className="toast" aria-live="polite" />;
}

/* ── Shared components ── */

function normalizeDecimalInput(value: string): string {
  return value.replace(/[^\d.]/g, "").replace(/^(\d*\.\d*).*$/, "$1");
}

function EmptyState() {
  return (
    <div className="emptyState">
      <div className="emptyIcon" aria-hidden="true">🥚</div>
      <h2>填写尺寸和重量开始预测</h2>
      <p>在游戏中打开蛋信息面板，输入 m 和 kg 数值即可</p>
      <p className="emptyHint">点击上方快捷示例快速体验</p>
    </div>
  );
}

function LoadingShell() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Rocom Egg Oracle</p>
        <h1>洛克王国世界 · 孵蛋预测</h1>
        <p className="heroText">加载中...</p>
      </section>
    </main>
  );
}

function CandidateList({
  candidates,
  muted = false,
  searchQuery = "",
}: {
  candidates: PredictCandidate[];
  muted?: boolean;
  searchQuery?: string;
}) {
  const filtered = searchQuery
    ? candidates.filter((c) => c.pet.name.includes(searchQuery))
    : candidates;

  if (filtered.length === 0) {
    return <div className="emptyInline">没有匹配的精灵</div>;
  }

  return (
    <div className="candidateList">
      {filtered.map((candidate, index) => (
        <article className="candidateCard" key={`${candidate.pet.id}-${index}`}>
          <div className="rank">{index + 1}</div>
          <div className="petInfo">
            <span className="petName">{candidate.pet.name}</span>
            <span className="petMeta">
              {getEggWeightClassLabels(candidate.pet.eggWeightClasses)} · {formatHatchTime(candidate.pet.hatchSeconds)}
            </span>
          </div>
          <div className="ranges">
            <span>尺寸 {candidate.pet.sizeMinM}–{candidate.pet.sizeMaxM} m</span>
            <span>重量 {candidate.pet.weightMinKg}–{candidate.pet.weightMaxKg} kg</span>
          </div>
          <div className="score">
            <span className="scoreValue">{candidate.probabilityText}</span>
            <span className="scoreLabel">R差 {candidate.rDiff.toFixed(3)} · {candidate.score.toFixed(0)}分</span>
          </div>
        </article>
      ))}
    </div>
  );
}
