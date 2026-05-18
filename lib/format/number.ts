/**
 * lib/format/number.ts
 *
 * 数字 / 区间格式化工具，UI 直接调用。
 */

export function roundTo(n: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

export function clamp(n: number, min: number, max: number): number {
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

/** 把"0.35m"或"35cm"或"35"这种用户输入清洗为可识别数字 */
export function normalizeDecimalInput(raw: string): string {
  return raw.replace(/[^0-9.\-]/g, "").replace(/^(-?)\./, "$10.");
}

export function formatSizeRange(min: number, max: number): string {
  if (min === max) return `${roundTo(min, 2)} m`;
  return `${roundTo(min, 2)} – ${roundTo(max, 2)} m`;
}

export function formatWeightRange(min: number, max: number): string {
  if (min === max) return `${roundTo(min, 2)} kg`;
  return `${roundTo(min, 2)} – ${roundTo(max, 2)} kg`;
}

export function formatPercent(matchScore: number): string {
  return `${roundTo(matchScore, 1)}%`;
}
