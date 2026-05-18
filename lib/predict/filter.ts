/**
 * lib/predict/filter.ts
 *
 * 一级硬过滤：精灵的蛋区间必须同时包含输入 size 和 weight。
 * 不命中区间的精灵进入「邻近参考」通道（由调用方处理）。
 */

import type { Pet } from "../data/schema";

export type PetTypeFilter = string | "all";

export type FilterInput = {
  sizeM: number;
  weightKg: number;
  /** 蛋组筛选（未来扩展），暂未启用 */
  eggGroup?: string | null;
  /** 类别筛选（猫咪类/自然类...），仅当 luodan 元数据可用时生效 */
  category?: string | null;
};

export function isStrictMatch(pet: Pet, input: FilterInput): boolean {
  return (
    input.sizeM >= pet.size.minM &&
    input.sizeM <= pet.size.maxM &&
    input.weightKg >= pet.weight.minKg &&
    input.weightKg <= pet.weight.maxKg
  );
}

export function filterByMetadata(pets: Pet[], input: FilterInput): Pet[] {
  return pets.filter((pet) => {
    if (input.eggGroup && input.eggGroup !== "all") {
      if (pet.eggGroup !== input.eggGroup) return false;
    }
    if (input.category && input.category !== "all") {
      if (pet.category !== input.category) return false;
    }
    return true;
  });
}

export function partitionByMatch(
  pets: Pet[],
  input: FilterInput,
): { matches: Pet[]; nearby: Pet[] } {
  const matches: Pet[] = [];
  const nearby: Pet[] = [];
  for (const pet of pets) {
    if (isStrictMatch(pet, input)) matches.push(pet);
    else nearby.push(pet);
  }
  return { matches, nearby };
}
