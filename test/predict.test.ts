import { describe, expect, it } from "vitest";
import { predictEgg, validatePredictionInput } from "../src/lib/predict";
import type { PetEggRange } from "../src/lib/types";

const pets: PetEggRange[] = [
  {
    id: "1",
    sourceRecordId: 1,
    petId: 1001,
    name: "火尾瓦特",
    sizeMinM: 0.28,
    sizeMaxM: 0.43,
    weightMinKg: 6.43,
    weightMaxKg: 9.4,
    hatchSeconds: 43200,
    eggWeightClasses: ["heavy"],
    isCurrentRandomPool: true,
    source: "test",
    sourceUpdatedAt: "2026-05-03T00:00:00.000Z",
  },
  {
    id: "2",
    sourceRecordId: 2,
    petId: 1002,
    name: "胆小鳗鱼",
    sizeMinM: 0.3,
    sizeMaxM: 0.44,
    weightMinKg: 6.08,
    weightMaxKg: 10.08,
    hatchSeconds: 43200,
    eggWeightClasses: ["heavy"],
    isCurrentRandomPool: true,
    source: "test",
    sourceUpdatedAt: "2026-05-03T00:00:00.000Z",
  },
  {
    id: "3",
    sourceRecordId: 3,
    petId: 1003,
    name: "电咩咩",
    sizeMinM: 0.23,
    sizeMaxM: 0.33,
    weightMinKg: 2.87,
    weightMaxKg: 3.64,
    hatchSeconds: 28800,
    eggWeightClasses: ["medium"],
    isCurrentRandomPool: true,
    source: "test",
    sourceUpdatedAt: "2026-05-03T00:00:00.000Z",
  },
];

describe("validatePredictionInput", () => {
  it("rejects non-positive input", () => {
    expect(validatePredictionInput({ sizeM: 0, weightKg: -1 })).toEqual([
      "请输入大于 0 的蛋尺寸，单位为 m。",
      "请输入大于 0 的蛋重量，单位为 kg。",
    ]);
  });
});

describe("predictEgg", () => {
  it("returns candidates only when size and weight both match", () => {
    const result = predictEgg(pets, { sizeM: 0.35, weightKg: 7.45 });

    expect(result.ok).toBe(true);
    expect(result.matches.map((candidate) => candidate.pet.name).sort()).toEqual([
      "火尾瓦特",
      "胆小鳗鱼",
    ].sort());
    expect(result.matches[0]?.rDiff).toBeLessThanOrEqual(result.matches[1]?.rDiff ?? Infinity);
    expect(result.matches.some((candidate) => candidate.pet.name === "电咩咩")).toBe(false);
  });

  it("treats range boundaries as matches", () => {
    const result = predictEgg(pets, { sizeM: 0.28, weightKg: 6.43 });

    expect(result.matches[0]?.pet.name).toBe("火尾瓦特");
  });

  it("excludes size-only matches from strict results", () => {
    const result = predictEgg(pets, { sizeM: 0.35, weightKg: 30 });

    expect(result.matches).toHaveLength(0);
    expect(result.nearby.length).toBeGreaterThan(0);
  });

  it("filters by hatch time", () => {
    const result = predictEgg(pets, {
      sizeM: 0.23,
      weightKg: 2.87,
      hatchSeconds: 28800,
    });

    expect(result.matches).toHaveLength(1);
    expect(result.matches[0]?.pet.name).toBe("电咩咩");
  });
});
