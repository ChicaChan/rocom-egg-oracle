/**
 * lib/predict/index.ts
 *
 * predictEgg() facade — 把 filter/score/confidence 串起来，
 * 返回 UI 可直接渲染的 PredictionResult。
 */

import type { Pet } from "../data/schema";
import { filterByMetadata, partitionByMatch, type FilterInput } from "./filter";
import { rankPets, type ScoredPet, compareScored, scorePet } from "./score";
import { confidenceFromDistance, type Confidence } from "./confidence";

export type PredictInput = FilterInput & {
  topN?: number;
  /** 邻近参考数量（默认 5） */
  nearbyCount?: number;
};

export type Candidate = ScoredPet & { confidence: Confidence };

export type PredictionResult = {
  ok: boolean;
  errors: string[];
  input: { sizeM: number; weightKg: number; rValue: number };
  matches: Candidate[];
  nearby: Candidate[];
  stats: {
    totalRecords: number;
    filteredRecords: number;
    strictMatchCount: number;
  };
};

export function validatePredictionInput(input: PredictInput): string[] {
  const errors: string[] = [];
  if (!Number.isFinite(input.sizeM) || input.sizeM <= 0) {
    errors.push("请输入大于 0 的蛋尺寸（m）。");
  } else if (input.sizeM > 10) {
    errors.push("尺寸数值过大，请确认单位是否为 m。");
  }
  if (!Number.isFinite(input.weightKg) || input.weightKg <= 0) {
    errors.push("请输入大于 0 的蛋重量（kg）。");
  } else if (input.weightKg > 5000) {
    errors.push("重量数值过大，请确认单位是否为 kg。");
  }
  return errors;
}

function attachConfidence(s: ScoredPet): Candidate {
  return { ...s, confidence: confidenceFromDistance(s.distance) };
}

export function predictEgg(pets: Pet[], input: PredictInput): PredictionResult {
  const errors = validatePredictionInput(input);
  const r = input.weightKg / input.sizeM;
  if (errors.length > 0) {
    return {
      ok: false,
      errors,
      input: { sizeM: input.sizeM, weightKg: input.weightKg, rValue: r },
      matches: [],
      nearby: [],
      stats: { totalRecords: pets.length, filteredRecords: 0, strictMatchCount: 0 },
    };
  }
  const topN = input.topN ?? 10;
  const nearbyCount = input.nearbyCount ?? 5;
  const filtered = filterByMetadata(pets, input);
  const { matches, nearby } = partitionByMatch(filtered, input);

  const rankedMatches = rankPets(matches, input, topN).map(attachConfidence);

  /* 邻近参考：在 nearby 中按距离排序，距离 > 1 但仍取前 N 个 */
  const rankedNearby = nearby
    .map((p) => scorePet(p, input))
    .sort(compareScored)
    .slice(0, nearbyCount)
    .map(attachConfidence);

  return {
    ok: true,
    errors: [],
    input: { sizeM: input.sizeM, weightKg: input.weightKg, rValue: r },
    matches: rankedMatches,
    nearby: rankedNearby,
    stats: {
      totalRecords: pets.length,
      filteredRecords: filtered.length,
      strictMatchCount: matches.length,
    },
  };
}

export type { Pet, Candidate as PredictCandidate };
export { confidenceFromDistance } from "./confidence";
export { scorePet, rankPets } from "./score";
export { isStrictMatch } from "./filter";
