/**
 * scripts/data/migrate-legacy.ts
 *
 * 把旧版 data/pets.json（BWIKI 抓取的扁平 schema，322 条）迁移到 v2 schema。
 *
 * 使用：
 *   npx tsx scripts/data/migrate-legacy.ts <input.json> <output.json>
 *
 * 默认：data/pets.json → data/pets.json（原地迁移，会先备份到 .legacy.json）
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { PetSchema, PetsFileSchema, type Pet } from "../../lib/data/schema";

type LegacyPet = {
  id: string;
  petId: number;
  name: string;
  imagePath?: string;
  remoteImageUrl?: string;
  sizeMinM: number;
  sizeMaxM: number;
  weightMinKg: number;
  weightMaxKg: number;
  hatchSeconds?: number;
  isRideEgg?: boolean;
  source?: string;
  sourceUpdatedAt?: string;
};

function migrate(legacy: LegacyPet, now: string): Pet {
  const id =
    legacy.petId && Number.isFinite(legacy.petId)
      ? String(legacy.petId)
      : (legacy.id ?? legacy.name);

  return {
    id,
    petId: Number.isFinite(legacy.petId) ? legacy.petId : null,
    name: legacy.name,
    displayName: legacy.name,
    form: null,
    aliases: [],
    types: [],
    imagePath: legacy.imagePath ?? null,
    luodanImage: null,
    size: { minM: legacy.sizeMinM, maxM: legacy.sizeMaxM },
    weight: { minKg: legacy.weightMinKg, maxKg: legacy.weightMaxKg },
    eggGroup: null,
    eggGroupIds: [],
    luodanId: null,
    pinyin: null,
    category: null,
    hatchSeconds: legacy.hatchSeconds ?? null,
    role: null,
    isMount: legacy.isRideEgg ?? false,
    isShiny: false,
    sources: [
      {
        name: "legacy",
        url: legacy.source ?? "https://wiki.biligame.com/rocom/%E7%B2%BE%E7%81%B5%E5%9B%BE%E9%89%B4",
        fetchedAt: legacy.sourceUpdatedAt ?? now,
        confidence: "single",
      },
    ],
    dataQuality: "inferred",
    updatedAt: now,
  };
}

function main() {
  const [inputArg, outputArg] = process.argv.slice(2);
  const input = resolve(inputArg ?? "data/pets.json");
  const output = resolve(outputArg ?? "data/pets.json");

  if (!existsSync(input)) {
    console.error(`[migrate] input not found: ${input}`);
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(input, "utf8")) as LegacyPet[];
  if (!Array.isArray(raw)) {
    console.error("[migrate] expected array");
    process.exit(1);
  }

  const now = new Date().toISOString();
  const migrated: Pet[] = [];
  const errors: string[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < raw.length; i++) {
    const entry = raw[i];
    if (entry.sizeMinM == null || entry.weightMinKg == null) {
      errors.push(`[#${i}] ${entry.name}: missing range fields`);
      continue;
    }
    const next = migrate(entry, now);
    if (seenIds.has(next.id)) {
      next.id = `${next.id}-${i}`;
    }
    seenIds.add(next.id);
    const parsed = PetSchema.safeParse(next);
    if (!parsed.success) {
      errors.push(`[#${i}] ${entry.name}: ${parsed.error.message}`);
      continue;
    }
    migrated.push(parsed.data);
  }

  console.log(`[migrate] input rows: ${raw.length}`);
  console.log(`[migrate] migrated:   ${migrated.length}`);
  console.log(`[migrate] errors:     ${errors.length}`);
  errors.slice(0, 10).forEach((e) => console.log(`  ${e}`));
  if (errors.length > 10) console.log(`  ... and ${errors.length - 10} more`);

  PetsFileSchema.parse(migrated);

  if (input === output && existsSync(input)) {
    const backup = `${input}.legacy.json`;
    copyFileSync(input, backup);
    console.log(`[migrate] backup → ${backup}`);
  }

  writeFileSync(output, JSON.stringify(migrated, null, 2));
  console.log(`[migrate] wrote ${output}`);
}

main();
