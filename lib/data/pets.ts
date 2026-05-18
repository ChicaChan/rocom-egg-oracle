/**
 * lib/data/pets.ts
 *
 * Server-only 数据加载器。Next.js server component / route handler 中使用。
 * 严禁在 client component 中 import — 会把整个 pets.json 打进客户端 bundle。
 */

import "server-only";
import petsRaw from "@/data/pets.json";
import metaRaw from "@/data/pets.meta.json";
import { PetsFileSchema, PetsMetaSchema, type Pet, type PetsMeta } from "./schema";

let cachedPets: Pet[] | null = null;
let cachedMeta: PetsMeta | null = null;

export function getPets(): Pet[] {
  if (cachedPets) return cachedPets;
  const parsed = PetsFileSchema.parse(petsRaw);
  cachedPets = parsed;
  return parsed;
}

export function getPetsMeta(): PetsMeta {
  if (cachedMeta) return cachedMeta;
  const parsed = PetsMetaSchema.parse(metaRaw);
  cachedMeta = parsed;
  return parsed;
}

export function findPetByName(name: string): Pet | undefined {
  return getPets().find((p) => p.name === name);
}

export function findPetByPinyin(pinyin: string): Pet | undefined {
  return getPets().find((p) => p.pinyin === pinyin);
}

export function findPetById(id: string): Pet | undefined {
  return getPets().find((p) => p.id === id);
}
