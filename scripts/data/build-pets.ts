/**
 * scripts/data/build-pets.ts
 *
 * 从灵蛋所抓取产物合成主数据 data/pets.json。
 *
 * 输入：
 *   scripts/.cache/luodan/luodan-details.json   (31 条 verified 蛋区间)
 *   scripts/.cache/luodan/luodan-metadata.json  (358 条 worker.js 元数据)
 *
 * 输出：
 *   data/pets.json                              (合成主数据)
 *
 * 设计原则：
 *   - 详情页是「真实蛋阶段区间」的唯一权威来源 → dataQuality: verified
 *   - 元数据按 name 匹配后补 pinyin / category / eggGroups / image
 *   - 不再使用旧 BWIKI 成体数据（已知语义错位）
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { PetsFileSchema, type Pet } from "../../lib/data/schema";
import type { LuodanDetailPet } from "./fetch-luodan-details";
import type { LuodanMeta } from "./extract-luodan";

const DETAILS_PATH = resolve("scripts/.cache/luodan/luodan-details.json");
const METADATA_PATH = resolve("scripts/.cache/luodan/luodan-metadata.json");
const PETS_PATH = resolve("data/pets.json");

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

  const pets: Pet[] = details.map((d) => {
    const meta = metaByName.get(normalizeName(d.name));
    if (meta) matchedFromMeta.push(d.name);
    else unmatchedFromMeta.push(d.name);

    const id = meta
      ? `${meta.pinyin}${d.formLabel ? "-" + slugify(d.formLabel) : ""}${d.isMount ? "-mount" : ""}`
      : `${slugify(d.name)}${d.formLabel ? "-" + slugify(d.formLabel) : ""}${d.isMount ? "-mount" : ""}`;

    const sources: Pet["sources"] = [
      {
        name: "luodan",
        url: `https://luokewangguofudan.wiki${d.sourcePaths[0]}`,
        fetchedAt: now,
        confidence: "verified",
      },
    ];

    return {
      id,
      petId: meta?.id ?? null,
      name: d.name,
      displayName: d.formLabel ? `${d.name}·${d.formLabel}` : d.name,
      form: d.formLabel
        ? { kind: "regional", label: d.formLabel }
        : null,
      aliases: meta && meta.displayKey !== d.name ? [meta.displayKey] : [],
      types: d.rawTypes,
      imagePath:
        meta?.image && existsSync(resolve("public/pets", String(meta.id) + ".png"))
          ? `/pets/${meta.id}.png`
          : null,
      luodanImage: meta?.image ?? null,
      size: d.size,
      weight: d.weight,
      eggGroup: null,
      eggGroupIds: meta?.eggGroups ?? [],
      luodanId: meta?.id ?? null,
      pinyin: meta?.pinyin ?? null,
      category: meta?.classisName ?? null,
      hatchSeconds: null,
      role: null,
      isMount: d.isMount,
      isShiny: meta?.shiny ?? false,
      sources,
      dataQuality: "verified",
      updatedAt: now,
    } satisfies Pet;
  });

  /* 校验 + 写回 */
  const parsed = PetsFileSchema.parse(pets);
  writeFileSync(PETS_PATH, JSON.stringify(parsed, null, 2));

  console.log(`[build-pets] details:          ${details.length}`);
  console.log(`[build-pets] metadata matched: ${matchedFromMeta.length}`);
  console.log(`[build-pets] metadata unmatched (name only):`);
  unmatchedFromMeta.forEach((n) => console.log(`  - ${n}`));
  console.log(`[build-pets] wrote ${PETS_PATH} (${parsed.length} pets)`);
}

main();
