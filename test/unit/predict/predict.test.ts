import { describe, it, expect } from "vitest";
import { predictEgg, validatePredictionInput } from "@/lib/predict";
import { PetsFileSchema } from "@/lib/data/schema";
import sample from "@/test/fixtures/pets.sample.json";

const pets = PetsFileSchema.parse(sample);

describe("validatePredictionInput", () => {
  it("拒绝 0/负数", () => {
    expect(validatePredictionInput({ sizeM: 0, weightKg: 1 })).not.toEqual([]);
    expect(validatePredictionInput({ sizeM: -1, weightKg: 1 })).not.toEqual([]);
    expect(validatePredictionInput({ sizeM: 1, weightKg: 0 })).not.toEqual([]);
  });

  it("拒绝 NaN/Infinity", () => {
    expect(validatePredictionInput({ sizeM: NaN, weightKg: 1 })).not.toEqual([]);
    expect(validatePredictionInput({ sizeM: 1, weightKg: Infinity })).not.toEqual([]);
  });

  it("过大的尺寸/重量给警示", () => {
    expect(validatePredictionInput({ sizeM: 50, weightKg: 1 })).not.toEqual([]);
    expect(validatePredictionInput({ sizeM: 1, weightKg: 10_000 })).not.toEqual([]);
  });

  it("合法输入返回空", () => {
    expect(validatePredictionInput({ sizeM: 0.28, weightKg: 2.36 })).toEqual([]);
  });
});

describe("predictEgg", () => {
  it("非法输入返回 ok=false", () => {
    const r = predictEgg(pets, { sizeM: -1, weightKg: 1 });
    expect(r.ok).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("0.28×2.36 命中 4 个小型精灵（不含圣剑骑士）", () => {
    const r = predictEgg(pets, { sizeM: 0.28, weightKg: 2.36 });
    expect(r.ok).toBe(true);
    expect(r.stats.strictMatchCount).toBe(4);
    const names = r.matches.map((m) => m.pet.name);
    expect(names).toContain("迪莫");
    expect(names).toContain("矿晶虫");
    expect(names).toContain("草头鸭");
    expect(names).toContain("小夜");
    expect(names).not.toContain("圣剑骑士");
  });

  it("没人命中时 strictMatchCount = 0 但 nearby 有结果", () => {
    const r = predictEgg(pets, { sizeM: 5, weightKg: 5000 });
    expect(r.stats.strictMatchCount).toBe(0);
    expect(r.matches).toHaveLength(0);
    expect(r.nearby.length).toBeGreaterThan(0);
  });

  it("topN 截断", () => {
    const r = predictEgg(pets, { sizeM: 0.28, weightKg: 2.36, topN: 2 });
    expect(r.matches.length).toBeLessThanOrEqual(2);
  });

  it("置信度 attached", () => {
    const r = predictEgg(pets, { sizeM: 0.28, weightKg: 2.36 });
    expect(r.matches.every((m) => m.confidence?.level)).toBe(true);
  });
});
