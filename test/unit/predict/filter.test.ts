import { describe, it, expect } from "vitest";
import { isStrictMatch, partitionByMatch, filterByMetadata } from "@/lib/predict/filter";
import { PetsFileSchema } from "@/lib/data/schema";
import sample from "@/test/fixtures/pets.sample.json";

const pets = PetsFileSchema.parse(sample);
const dimo = pets.find((p) => p.name === "迪莫")!;
const knight = pets.find((p) => p.name === "圣剑骑士")!;

describe("isStrictMatch", () => {
  it("命中区间中心", () => {
    expect(isStrictMatch(dimo, { sizeM: 0.28, weightKg: 2.36 })).toBe(true);
  });

  it("命中区间边界", () => {
    expect(isStrictMatch(dimo, { sizeM: 0.23, weightKg: 1.93 })).toBe(true);
    expect(isStrictMatch(dimo, { sizeM: 0.32, weightKg: 2.8 })).toBe(true);
  });

  it("越界 size", () => {
    expect(isStrictMatch(dimo, { sizeM: 0.5, weightKg: 2.36 })).toBe(false);
  });

  it("越界 weight", () => {
    expect(isStrictMatch(dimo, { sizeM: 0.28, weightKg: 10 })).toBe(false);
  });

  it("圣剑骑士的大区间", () => {
    expect(isStrictMatch(knight, { sizeM: 2.7, weightKg: 900 })).toBe(true);
    expect(isStrictMatch(knight, { sizeM: 0.28, weightKg: 2.36 })).toBe(false);
  });
});

describe("partitionByMatch", () => {
  it("把命中与越界分两组", () => {
    const { matches, nearby } = partitionByMatch(pets, { sizeM: 0.28, weightKg: 2.36 });
    expect(matches.some((p) => p.name === "迪莫")).toBe(true);
    expect(matches.some((p) => p.name === "矿晶虫")).toBe(true);
    expect(nearby.some((p) => p.name === "圣剑骑士")).toBe(true);
    expect(matches.length + nearby.length).toBe(pets.length);
  });
});

describe("filterByMetadata", () => {
  it("eggGroup all 不过滤", () => {
    const out = filterByMetadata(pets, { sizeM: 0, weightKg: 0, eggGroup: "all" });
    expect(out.length).toBe(pets.length);
  });

  it("按 category 过滤", () => {
    const out = filterByMetadata(pets, { sizeM: 0, weightKg: 0, category: "鸟类精灵" });
    expect(out.every((p) => p.category === "鸟类精灵")).toBe(true);
    expect(out.some((p) => p.name === "草头鸭")).toBe(true);
  });
});
