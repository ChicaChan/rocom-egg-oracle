/**
 * lib/format/pet.ts
 *
 * 精灵展示相关的字符串工具。
 */

import type { Pet } from "../data/schema";

export function petDisplayName(pet: Pet): string {
  if (pet.displayName && pet.displayName !== pet.name) {
    return pet.displayName;
  }
  return pet.name;
}

const QUALITY_LABEL: Record<Pet["dataQuality"], string> = {
  verified: "灵蛋所详情页",
  "single-source": "单源",
  "user-reported": "玩家上报",
  inferred: "成体 × 0.42 估算",
};

export function dataQualityLabel(pet: Pet): string {
  return QUALITY_LABEL[pet.dataQuality];
}

/**
 * 优先使用本地已缓存的 PNG（/pets/<petId>.png）；
 * 若本地不存在，可降级到 luodanImage 路径（外链 webp，但 MVP 阶段先不实现外链）。
 */
export function petImageUrl(pet: Pet): string | null {
  if (pet.imagePath) return pet.imagePath;
  if (pet.luodanImage) return null; // MVP 阶段不直接走外链
  return null;
}
