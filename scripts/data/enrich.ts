/**
 * scripts/data/enrich.ts
 *
 * 用灵蛋所 worker.js 提取的元数据，按 name 匹配增强现有 pets.json。
 *
 * 增强字段（绝不覆盖 size/weight）：
 *   - luodanId / pinyin / category / luodanImage / eggGroupIds / isShiny
 *   - sources[] 追加一条 luodan 记录（confidence: "single"）
 *   - dataQuality 若原为 "inferred" 且匹配上 → 升级为 "single-source"
 *
 * 输出：
 *   - 覆盖 data/pets.json
 *   - scripts/reports/enrich-report.md（匹配率、未匹配列表、灵蛋所多出的精灵）
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  PetsFileSchema,
  type Pet,
} from "../../lib/data/schema";
import type { LuodanMeta } from "./extract-luodan";

const PETS_PATH = resolve("data/pets.json");
const LUODAN_PATH = resolve("scripts/.cache/luodan/luodan-metadata.json");
const REPORT_PATH = resolve("scripts/reports/enrich-report.md");

function normalizeName(s: string): string {
  return s.replace(/\s+/g, "").replace(/\?同乘$/, "");
}

function main() {
  const pets = PetsFileSchema.parse(JSON.parse(readFileSync(PETS_PATH, "utf8")));
  const luodan = JSON.parse(readFileSync(LUODAN_PATH, "utf8")) as LuodanMeta[];

  /* 灵蛋所索引：按 name 与 displayKey 双键 */
  const byName = new Map<string, LuodanMeta>();
  for (const m of luodan) {
    byName.set(normalizeName(m.name), m);
    if (m.displayKey && m.displayKey !== m.name) {
      byName.set(normalizeName(m.displayKey), m);
    }
  }

  const matched: string[] = [];
  const unmatched: string[] = [];
  const now = new Date().toISOString();

  const enriched: Pet[] = pets.map((pet) => {
    const key = normalizeName(pet.name);
    const meta = byName.get(key);
    if (!meta) {
      unmatched.push(pet.name);
      return pet;
    }
    matched.push(pet.name);

    const hasLuodanSource = pet.sources.some((s) => s.name === "luodan");
    const nextSources = hasLuodanSource
      ? pet.sources
      : [
          ...pet.sources,
          {
            name: "luodan" as const,
            url: `https://luokewangguofudan.wiki/pet-recommendations/${meta.pinyin}`,
            fetchedAt: now,
            confidence: "single" as const,
          },
        ];

    /* dataQuality 升级：inferred → single-source */
    const nextQuality = pet.dataQuality === "inferred" ? "single-source" : pet.dataQuality;

    return {
      ...pet,
      luodanId: meta.id,
      pinyin: meta.pinyin,
      category: meta.classisName || null,
      luodanImage: meta.image ?? null,
      eggGroupIds: meta.eggGroups,
      isShiny: meta.shiny,
      sources: nextSources,
      dataQuality: nextQuality,
      updatedAt: now,
    };
  });

  /* 灵蛋所多出但 pets.json 没有的精灵 */
  const petNames = new Set(pets.map((p) => normalizeName(p.name)));
  const onlyInLuodan = luodan
    .filter((m) => !petNames.has(normalizeName(m.name)))
    .map((m) => `${m.name} (id=${m.id}, pinyin=${m.pinyin}${m.shiny ? ", shiny" : ""})`);

  /* 校验 + 写回 */
  PetsFileSchema.parse(enriched);
  writeFileSync(PETS_PATH, JSON.stringify(enriched, null, 2));

  /* 报告 */
  const report = [
    "# Enrich Report",
    "",
    `生成时间：${now}`,
    "",
    "## 概况",
    "",
    `- 现有 pets.json 条目：**${pets.length}**`,
    `- 灵蛋所 worker.js 提取：**${luodan.length}**`,
    `- 匹配成功：**${matched.length}** (${((matched.length / pets.length) * 100).toFixed(1)}%)`,
    `- 未匹配（pets.json 有但灵蛋所无）：**${unmatched.length}**`,
    `- 灵蛋所多出（待后期补充蛋区间）：**${onlyInLuodan.length}**`,
    "",
    "## 未匹配的现有精灵",
    "",
    unmatched.length === 0
      ? "_全部匹配成功 ✨_"
      : unmatched.map((n) => `- ${n}`).join("\n"),
    "",
    "## 灵蛋所独有的精灵（仅元数据，缺蛋区间）",
    "",
    onlyInLuodan.length === 0
      ? "_无_"
      : onlyInLuodan.slice(0, 100).map((n) => `- ${n}`).join("\n") +
        (onlyInLuodan.length > 100 ? `\n\n_…还有 ${onlyInLuodan.length - 100} 条未列出_` : ""),
    "",
  ].join("\n");
  writeFileSync(REPORT_PATH, report);

  console.log(`[enrich] matched: ${matched.length}/${pets.length}`);
  console.log(`[enrich] unmatched (in pets.json only): ${unmatched.length}`);
  console.log(`[enrich] luodan-only (待补蛋区间): ${onlyInLuodan.length}`);
  console.log(`[enrich] report → ${REPORT_PATH}`);
}

main();
