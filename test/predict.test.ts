import { describe, expect, it } from "vitest";
import petsData from "../data/pets.json";
import { predictEgg, validatePredictionInput } from "../src/lib/predict";
import type { PetEggRange } from "../src/lib/types";

const pets: PetEggRange[] = [
  {
    id: "1",
    sourceRecordId: 1,
    petId: 1001,
    name: "火尾瓦特",
    imagePath: "/pets/1001.png",
    sizeMinM: 0.28,
    sizeMaxM: 0.43,
    weightMinKg: 6.43,
    weightMaxKg: 9.4,
    hatchSeconds: 43200,
    preciousEggType: 1,
    eggTypes: [1],
    eggTypeLabel: "首领/血脉蛋",
    isRideEgg: false,
    form: null,
    petBondName: null,
    closeLevel: null,
    eggWeightClasses: ["heavy"],
    hasRandomEggsGroup: false,
    source: "test",
    sourceUpdatedAt: "2026-05-03T00:00:00.000Z",
  },
  {
    id: "2",
    sourceRecordId: 2,
    petId: 1002,
    name: "胆小鳗鱼",
    imagePath: "/pets/1002.png",
    sizeMinM: 0.3,
    sizeMaxM: 0.44,
    weightMinKg: 6.08,
    weightMaxKg: 10.08,
    hatchSeconds: 43200,
    preciousEggType: 5,
    eggTypes: [5],
    eggTypeLabel: "同乘蛋",
    isRideEgg: true,
    form: "剧情形态",
    petBondName: 9001,
    closeLevel: 3,
    eggWeightClasses: ["heavy"],
    hasRandomEggsGroup: false,
    source: "test",
    sourceUpdatedAt: "2026-05-03T00:00:00.000Z",
  },
  {
    id: "3",
    sourceRecordId: 3,
    petId: 1003,
    name: "电咩咩",
    imagePath: "/pets/1003.png",
    sizeMinM: 0.23,
    sizeMaxM: 0.33,
    weightMinKg: 2.87,
    weightMaxKg: 3.64,
    hatchSeconds: 28800,
    preciousEggType: null,
    eggTypes: [null],
    eggTypeLabel: "随机蛋池",
    isRideEgg: false,
    form: null,
    petBondName: null,
    closeLevel: null,
    eggWeightClasses: ["medium"],
    hasRandomEggsGroup: true,
    source: "test",
    sourceUpdatedAt: "2026-05-03T00:00:00.000Z",
  },
];

const generatedPets = petsData as PetEggRange[];

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

  it("filters by egg type", () => {
    const result = predictEgg(pets, {
      sizeM: 0.35,
      weightKg: 7.45,
      eggType: 5,
    });

    expect(result.matches).toHaveLength(1);
    expect(result.matches[0]?.pet.name).toBe("胆小鳗鱼");
  });

  it("keeps hatch time as a secondary filter", () => {
    const result = predictEgg(pets, {
      sizeM: 0.23,
      weightKg: 2.87,
      eggType: null,
      hatchSeconds: 28800,
    });

    expect(result.matches).toHaveLength(1);
    expect(result.matches[0]?.pet.name).toBe("电咩咩");
  });

  it("marks ride eggs correctly", () => {
    const result = predictEgg(pets, {
      sizeM: 0.35,
      weightKg: 7.45,
      eggType: 5,
    });

    expect(result.matches[0]?.pet.isRideEgg).toBe(true);
    expect(result.matches[0]?.pet.eggTypeLabel).toBe("同乘蛋");
  });
});

describe("generated pet data", () => {
  it("uses current-catalog records as the primary generated type", () => {
    const allEggTypes = new Set(generatedPets.flatMap((pet) => pet.eggTypes));

    expect(allEggTypes).toEqual(new Set([null]));
  });

  it("does not mark generated data as ride eggs", () => {
    const rideEggs = generatedPets.filter((pet) => pet.isRideEgg);

    expect(rideEggs).toHaveLength(0);
  });

  it("marks generated data as official-release entries", () => {
    expect(generatedPets.length).toBeGreaterThan(0);
    expect(generatedPets.every((pet) => pet.hasRandomEggsGroup)).toBe(true);
    expect(generatedPets.every((pet) => pet.eggTypeLabel === "正式服精灵")).toBe(true);
  });
});
