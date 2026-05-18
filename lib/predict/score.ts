/**
 * lib/predict/score.ts
 *
 * 二级排序：在硬命中集合内，按「归一化中心距离」从小到大排序。
 *
 * 设计：
 *   ds = |sizeM - centerSize| / halfRangeSize     ∈ [0, 1]（区间内）
 *   dw = |weightKg - centerWeight| / halfRangeWeight ∈ [0, 1]
 *   distance = sqrt(0.5·ds² + 0.5·dw²)
 *
 * 越靠区间中心，分数越高（matchScore = 100 × (1 - distance)）。
 *
 * 注意：我们放弃了 v1 的「R = weight/size」启发式排序——
 * 该指标无量纲、对同 R 的精灵无区分度，且非社区共识。
 */

import type { Pet } from "../data/schema";

export type ScoreInput = { sizeM: number; weightKg: number };

export type ScoredPet = {
  pet: Pet;
  /** 归一化中心距离 ∈ [0, ~1.41]，越小越靠中心 */
  distance: number;
  /** 单边尺寸距离 ∈ [0, 1] */
  sizeDistance: number;
  /** 单边重量距离 ∈ [0, 1] */
  weightDistance: number;
  /** 匹配度百分比 ∈ [0, 100]，越大越好 */
  matchScore: number;
  /** 仅作 Tooltip 辅助展示用，不参与排序 */
  rValue: number;
};

function normalizedDistance(value: number, min: number, max: number): number {
  const center = (min + max) / 2;
  const halfRange = Math.max((max - min) / 2, 1e-6);
  return Math.abs(value - center) / halfRange;
}

export function scorePet(pet: Pet, input: ScoreInput): ScoredPet {
  const ds = normalizedDistance(input.sizeM, pet.size.minM, pet.size.maxM);
  const dw = normalizedDistance(input.weightKg, pet.weight.minKg, pet.weight.maxKg);
  const distance = Math.sqrt(0.5 * ds * ds + 0.5 * dw * dw);
  const matchScore = Math.max(0, Math.min(100, (1 - distance) * 100));
  const centerS = (pet.size.minM + pet.size.maxM) / 2;
  const centerW = (pet.weight.minKg + pet.weight.maxKg) / 2;
  return {
    pet,
    distance,
    sizeDistance: ds,
    weightDistance: dw,
    matchScore,
    rValue: centerW / centerS,
  };
}

/** 平局规则：dataQuality 优先 → name */
function dataQualityRank(pet: Pet): number {
  switch (pet.dataQuality) {
    case "verified":
      return 0;
    case "single-source":
      return 1;
    case "user-reported":
      return 2;
    case "inferred":
      return 3;
  }
}

export function compareScored(a: ScoredPet, b: ScoredPet): number {
  if (a.distance !== b.distance) return a.distance - b.distance;
  const qa = dataQualityRank(a.pet);
  const qb = dataQualityRank(b.pet);
  if (qa !== qb) return qa - qb;
  return a.pet.name.localeCompare(b.pet.name, "zh-Hans-CN");
}

export function rankPets(pets: Pet[], input: ScoreInput, topN: number): ScoredPet[] {
  return pets
    .map((p) => scorePet(p, input))
    .sort(compareScored)
    .slice(0, topN);
}
