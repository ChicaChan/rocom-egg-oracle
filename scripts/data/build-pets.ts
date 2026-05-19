/**
 * scripts/data/build-pets.ts
 *
 * 从灵蛋所抓取产物合成主数据 data/pets.json。
 *
 * 输入：
 *   scripts/.cache/luodan/luodan-details.json   (31 条 verified 蛋区间)
 *   scripts/.cache/luodan/luodan-metadata.json  (358 条 worker.js 元数据 = 成体数据)
 *
 * 输出：
 *   data/pets.json                              (合成主数据)
 *
 * 策略：
 *   1. luodan-details 是「真实蛋阶段区间」的唯一权威来源 → dataQuality: verified
 *   2. luodan-metadata 中**未被 details 覆盖**的精灵，用 蛋/成体 比例系数估算蛋区间
 *      → dataQuality: inferred
 *   3. 比例系数从 details 反算（清洗后样本 n=20）：
 *      size.min  × 0.427    size.max  × 0.415
 *      weight.min × 0.353   weight.max × 0.400
 *   4. 估算时丢弃明显异常的成体数据（min > max 或 min ≤ 0）
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { PetsFileSchema, type Pet } from "../../lib/data/schema";
import type { LuodanDetailPet } from "./fetch-luodan-details";
import type { LuodanMeta } from "./extract-luodan";

const DETAILS_PATH = resolve("scripts/.cache/luodan/luodan-details.json");
const METADATA_PATH = resolve("scripts/.cache/luodan/luodan-metadata.json");
const PETS_PATH = resolve("data/pets.json");

/* 蛋/成体 比例系数（从 31 条 verified 数据反算，清洗后 n=20） */
const RATIO_SIZE_MIN = 0.427;
const RATIO_SIZE_MAX = 0.415;
const RATIO_WEIGHT_MIN = 0.353;
const RATIO_WEIGHT_MAX = 0.400;

/* worker.js 元数据缺失精灵的拼音手动映射（用于拼 image 文件名） */
const PINYIN_FALLBACK: Record<string, string> = {
  迪莫: "dimo",
  圣光迪莫: "shengguangdimo",
  学院呱呱: "xueyuanguagua",
};

function normalizeName(s: string): string {
  return s.replace(/\s+/g, "");
}

function slugify(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[^a-z0-9一-鿿-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function main() {
  if (!existsSync(DETAILS_PATH)) {
    console.error(`[build-pets] missing ${DETAILS_PATH}. run data:fetch-details first.`);
    process.exit(1);
  }
  if (!existsSync(METADATA_PATH)) {
    console.error(`[build-pets] missing ${METADATA_PATH}. run data:fetch first.`);
    process.exit(1);
  }

  const details = JSON.parse(readFileSync(DETAILS_PATH, "utf8")) as LuodanDetailPet[];
  const metadata = JSON.parse(readFileSync(METADATA_PATH, "utf8")) as LuodanMeta[];

  /* 元数据按 name / displayKey 索引 */
  const metaByName = new Map<string, LuodanMeta>();
  for (const m of metadata) {
    metaByName.set(normalizeName(m.name), m);
    if (m.displayKey && m.displayKey !== m.name) {
      metaByName.set(normalizeName(m.displayKey), m);
    }
  }

  const now = new Date().toISOString();
  const matchedFromMeta: string[] = [];
  const unmatchedFromMeta: string[] = [];

  /* ── 第一阶段：用详情页构建 verified pets ── */
  const verifiedPets: Pet[] = details.map((d) => {
    const meta = metaByName.get(normalizeName(d.name));
    if (meta) matchedFromMeta.push(d.name);
    else unmatchedFromMeta.push(d.name);

    const pinyin = meta?.pinyin ?? PINYIN_FALLBACK[d.name] ?? null;
    let imageFile: string | null = meta?.image ?? null;
    if (!imageFile && pinyin) {
      const guess = `JL_${pinyin}.webp`;
      if (existsSync(resolve("public/pets/luodan", guess))) {
        imageFile = guess;
      }
    }

    const id = pinyin
      ? `${pinyin}${d.formLabel ? "-" + slugify(d.formLabel) : ""}${d.isMount ? "-mount" : ""}`
      : `${slugify(d.name)}${d.formLabel ? "-" + slugify(d.formLabel) : ""}${d.isMount ? "-mount" : ""}`;

    return {
      id,
      petId: meta?.id ?? null,
      name: d.name,
      displayName: d.formLabel ? `${d.name}·${d.formLabel}` : d.name,
      form: d.formLabel ? { kind: "regional", label: d.formLabel } : null,
      aliases: meta && meta.displayKey !== d.name ? [meta.displayKey] : [],
      types: d.rawTypes,
      imagePath: imageFile ? `/pets/luodan/${imageFile}` : null,
      luodanImage: imageFile,
      size: d.size,
      weight: d.weight,
      eggGroup: null,
      eggGroupIds: meta?.eggGroups ?? [],
      luodanId: meta?.id ?? null,
      pinyin,
      category: meta?.classisName ?? null,
      hatchSeconds: null,
      role: null,
      isMount: d.isMount,
      isShiny: meta?.shiny ?? false,
      sources: [
        {
          name: "luodan",
          url: `https://luokewangguofudan.wiki${d.sourcePaths[0]}`,
          fetchedAt: now,
          confidence: "verified",
        },
      ],
      dataQuality: "verified",
      updatedAt: now,
    } satisfies Pet;
  });

  /* ── 第二阶段：对 worker.js 元数据中未被 verified 覆盖的精灵，估算蛋区间 ── */
  const verifiedNames = new Set(verifiedPets.map((p) => normalizeName(p.name)));
  let estimatedCount = 0;
  let skippedInvalid = 0;
  const estimatedPets: Pet[] = [];

  for (const m of metadata) {
    if (verifiedNames.has(normalizeName(m.name))) continue;
    /* 同一只精灵的所有形态都会在 verified 里出现；这里如果 verified 已有同名（基础形态）就跳过整族 */

    const adultS = m.adultHeightCm;
    const adultW = m.adultWeightG;
    /* 排除异常成体数据 */
    if (
      !adultS || !adultW ||
      adultS.min <= 0 || adultS.max <= 0 || adultS.min > adultS.max ||
      adultW.min <= 0 || adultW.max <= 0 || adultW.min > adultW.max ||
      adultW.max / adultW.min > 100   /* 跨度过大，视为脏数据 */
    ) {
      skippedInvalid++;
      continue;
    }

    /* 应用换算系数（成体单位 cm→m / g→kg） */
    const sizeMinM = round3(adultS.min / 100 * RATIO_SIZE_MIN);
    const sizeMaxM = round3(adultS.max / 100 * RATIO_SIZE_MAX);
    const weightMinKg = round3(adultW.min / 1000 * RATIO_WEIGHT_MIN);
    const weightMaxKg = round3(adultW.max / 1000 * RATIO_WEIGHT_MAX);

    /* 估算后仍需保证 min <= max（系数 max < min 时校正） */
    const safeSize = sizeMinM <= sizeMaxM
      ? { minM: sizeMinM, maxM: sizeMaxM }
      : { minM: sizeMaxM, maxM: sizeMinM };
    const safeWeight = weightMinKg <= weightMaxKg
      ? { minKg: weightMinKg, maxKg: weightMaxKg }
      : { minKg: weightMaxKg, maxKg: weightMinKg };

    if (safeSize.minM <= 0 || safeWeight.minKg <= 0) {
      skippedInvalid++;
      continue;
    }

    const imageFile = m.image;
    const imageExists = imageFile && existsSync(resolve("public/pets/luodan", imageFile));

    estimatedPets.push({
      id: `${m.pinyin}${m.shiny ? "-shiny" : ""}`,
      petId: m.id,
      name: m.name,
      displayName: m.displayKey || m.name,
      form: m.shiny ? { kind: "shiny", label: "异色" } : null,
      aliases: m.displayKey && m.displayKey !== m.name ? [m.displayKey] : [],
      types: [],
      imagePath: imageExists ? `/pets/luodan/${imageFile}` : null,
      luodanImage: imageFile,
      size: safeSize,
      weight: safeWeight,
      eggGroup: null,
      eggGroupIds: m.eggGroups,
      luodanId: m.id,
      pinyin: m.pinyin,
      category: m.classisName,
      hatchSeconds: null,
      role: null,
      isMount: false,
      isShiny: m.shiny,
      sources: [
        {
          name: "luodan",
          url: `https://luokewangguofudan.wiki/pet-recommendations/${m.pinyin}`,
          fetchedAt: now,
          confidence: "single",
        },
      ],
      dataQuality: "inferred",
      updatedAt: now,
    } satisfies Pet);
    estimatedCount++;
  }

  /* 合并 + 去重（id 冲突时 verified 胜出） */
  const merged = new Map<string, Pet>();
  for (const p of estimatedPets) merged.set(p.id, p);
  for (const p of verifiedPets) merged.set(p.id, p);
  const allPets = [...merged.values()];

  /* 校验 + 写回 */
  const parsed = PetsFileSchema.parse(allPets);
  writeFileSync(PETS_PATH, JSON.stringify(parsed, null, 2));

  console.log(`[build-pets] verified (from details):  ${verifiedPets.length}`);
  console.log(`[build-pets] inferred (from metadata): ${estimatedCount}`);
  console.log(`[build-pets] skipped invalid metadata: ${skippedInvalid}`);
  console.log(`[build-pets] metadata matched (verified): ${matchedFromMeta.length}`);
  if (unmatchedFromMeta.length > 0) {
    console.log(`[build-pets] verified pets without worker.js meta:`);
    unmatchedFromMeta.forEach((n) => console.log(`  - ${n}`));
  }
  console.log(`[build-pets] wrote ${PETS_PATH} (${parsed.length} pets total)`);
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

main();
