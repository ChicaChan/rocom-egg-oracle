/**
 * lib/url/params.ts
 *
 * URL search params ↔ predictor state 解析层。
 *
 * 支持参数：
 *   ?size=0.35       蛋尺寸（米）
 *   ?weight=7.45     蛋重量（千克）
 *   ?top=10          展示数量（≤ 20）
 *
 * 非法值会被静默忽略并退化到默认值或 null。
 */

export type PredictorParams = {
  sizeM: number | null;
  weightKg: number | null;
  topN: number;
};

export const DEFAULT_TOP_N = 10;
const MAX_TOP_N = 20;
const MAX_SIZE_M = 10;
const MAX_WEIGHT_KG = 5_000;

function parseNumberSafe(raw: string | null, max: number): number | null {
  if (raw == null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(n, max);
}

function parseTopN(raw: string | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_TOP_N;
  return Math.min(Math.floor(n), MAX_TOP_N);
}

export function parseParams(search: URLSearchParams | string | undefined): PredictorParams {
  const sp =
    typeof search === "string"
      ? new URLSearchParams(search)
      : search instanceof URLSearchParams
        ? search
        : new URLSearchParams("");
  return {
    sizeM: parseNumberSafe(sp.get("size"), MAX_SIZE_M),
    weightKg: parseNumberSafe(sp.get("weight"), MAX_WEIGHT_KG),
    topN: parseTopN(sp.get("top")),
  };
}

export function serializeParams(params: Partial<PredictorParams>): string {
  const sp = new URLSearchParams();
  if (params.sizeM != null && Number.isFinite(params.sizeM)) {
    sp.set("size", String(roundTo(params.sizeM, 3)));
  }
  if (params.weightKg != null && Number.isFinite(params.weightKg)) {
    sp.set("weight", String(roundTo(params.weightKg, 3)));
  }
  if (params.topN != null && params.topN !== DEFAULT_TOP_N) {
    sp.set("top", String(params.topN));
  }
  return sp.toString();
}

function roundTo(n: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}
