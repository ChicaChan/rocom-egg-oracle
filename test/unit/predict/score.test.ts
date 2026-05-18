import { describe, it, expect } from "vitest";
import { scorePet, compareScored, rankPets } from "@/lib/predict/score";
import { PetsFileSchema } from "@/lib/data/schema";
import sample from "@/test/fixtures/pets.sample.json";

const pets = PetsFileSchema.parse(sample);
const dimo = pets.find((p) => p.name === "迪莫")!;
const knight = pets.find((p) => p.name === "圣剑骑士")!;

describe("scorePet", () => {
  it("区间中心时 distance ≈ 0、matchScore 接近 100", () => {
    const centerS = (dimo.size.minM + dimo.size.maxM) / 2;
    const centerW = (dimo.weight.minKg + dimo.weight.maxKg) / 2;
    const s = scorePet(dimo, { sizeM: centerS, weightKg: centerW });
    expect(s.distance).toBeCloseTo(0, 6);
    expect(s.matchScore).toBeGreaterThan(99.9);
  });

  it("区间边界时 sizeDistance 或 weightDistance = 1", () => {
    const s = scorePet(dimo, { sizeM: dimo.size.maxM, weightKg: dimo.weight.maxKg });
    expect(s.sizeDistance).toBeCloseTo(1, 6);
    expect(s.weightDistance).toBeCloseTo(1, 6);
    expect(s.distance).toBeCloseTo(1, 6);
  });

  it("越界时 distance > 1", () => {
    const s = scorePet(dimo, { sizeM: 1.5, weightKg: 50 });
    expect(s.distance).toBeGreaterThan(1);
    expect(s.matchScore).toBe(0);
  });

  it("rValue 仅辅助展示", () => {
    const s = scorePet(knight, { sizeM: 2.7, weightKg: 900 });
    expect(s.rValue).toBeGreaterThan(100); // 重型精灵
  });
});

describe("compareScored", () => {
  it("距离小的排在前面", () => {
    const a = scorePet(dimo, { sizeM: 0.28, weightKg: 2.36 });
    const b = scorePet(dimo, { sizeM: 0.32, weightKg: 2.8 });
    expect(compareScored(a, b)).toBeLessThan(0);
  });
});

describe("rankPets", () => {
  it("topN 截断", () => {
    const ranked = rankPets(pets, { sizeM: 0.28, weightKg: 2.36 }, 2);
    expect(ranked).toHaveLength(2);
  });

  it("第一名是距离最小的", () => {
    const ranked = rankPets(pets, { sizeM: 0.28, weightKg: 2.36 }, 10);
    const top = ranked[0];
    for (const r of ranked) {
      expect(top.distance).toBeLessThanOrEqual(r.distance);
    }
  });
});
