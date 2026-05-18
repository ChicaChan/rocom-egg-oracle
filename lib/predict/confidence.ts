/**
 * lib/predict/confidence.ts
 *
 * 把归一化中心距离 → 玩家可读的"匹配度等级 + 中文文案"。
 *
 * 阈值依据：
 *   d=0   → 蛋恰好在区间中心，100% 匹配
 *   d≈0.5 → 半径一半处，仍然在区间内但偏边缘
 *   d=1   → 命中区间边缘
 *   d>1   → 越界（在 nearby 通道才会出现）
 */

export type ConfidenceLevel = "exact" | "high" | "medium" | "low" | "edge";

export type Confidence = {
  level: ConfidenceLevel;
  /** 玩家文案，如"极有可能" */
  label: string;
  /** UI 进度条配色键 */
  tone: "primary" | "success" | "warning" | "muted";
};

export function confidenceFromDistance(distance: number): Confidence {
  if (distance <= 0.05) {
    return { level: "exact", label: "极有可能", tone: "success" };
  }
  if (distance <= 0.3) {
    return { level: "high", label: "很可能", tone: "success" };
  }
  if (distance <= 0.6) {
    return { level: "medium", label: "可能", tone: "primary" };
  }
  if (distance <= 1.0) {
    return { level: "low", label: "边缘命中", tone: "warning" };
  }
  return { level: "edge", label: "越界参考", tone: "muted" };
}
