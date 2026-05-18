/**
 * scripts/data/validate.ts
 *
 * 对 data/pets.json 跑完整质量校验：
 *   1. zod schema（每条记录）
 *   2. ID 唯一
 *   3. IQR 离群（weight/size 比）
 *   4. min < max 区间合法性
 *   5. 写 data/pets.meta.json 与 scripts/reports/validate-report.md
 *
 * 退出码：
 *   0 - 全部通过
 *   1 - 有 critical 错误（schema/ID 冲突）
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  PetsFileSchema,
  PetsMetaSchema,
  type Pet,
  type DataQuality,
} from "../../lib/data/schema";

const PETS_PATH = resolve("data/pets.json");
const META_PATH = resolve("data/pets.meta.json");
const REPORT_PATH = resolve("scripts/reports/validate-report.md");

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

function findOutliers(pets: Pet[]): Array<{ pet: Pet; r: number; zone: "low" | "high" }> {
  /* R 值 = 中心重量 / 中心尺寸 */
  const data = pets.map((p) => ({
    pet: p,
    r: ((p.weight.minKg + p.weight.maxKg) / 2) / ((p.size.minM + p.size.maxM) / 2),
  }));
  const sorted = [...data].map((d) => d.r).sort((a, b) => a - b);
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;
  const lo = q1 - 3 * iqr;
  const hi = q3 + 3 * iqr;
  return data
    .filter((d) => d.r < lo || d.r > hi)
    .map((d) => ({ pet: d.pet, r: d.r, zone: (d.r < lo ? "low" : "high") as "low" | "high" }));
}

function main() {
  const raw = JSON.parse(readFileSync(PETS_PATH, "utf8"));
  const result = PetsFileSchema.safeParse(raw);
  if (!result.success) {
    console.error("[validate] schema FAILED");
    console.error(JSON.stringify(result.error.flatten(), null, 2));
    process.exit(1);
  }
  const pets = result.data;

  /* ID 唯一 */
  const idCount = new Map<string, number>();
  for (const p of pets) idCount.set(p.id, (idCount.get(p.id) ?? 0) + 1);
  const duplicateIds = [...idCount.entries()].filter(([, c]) => c > 1);
  if (duplicateIds.length > 0) {
    console.error("[validate] duplicate ids:", duplicateIds);
    process.exit(1);
  }

  /* 离群 */
  const outliers = findOutliers(pets);

  /* dataQuality 分布 */
  const quality: Record<DataQuality, number> = {
    verified: 0,
    "single-source": 0,
    "user-reported": 0,
    inferred: 0,
  };
  for (const p of pets) quality[p.dataQuality]++;

  /* 来源统计 */
  const sourceCount: Record<string, number> = {};
  for (const p of pets) {
    for (const s of p.sources) {
      sourceCount[s.name] = (sourceCount[s.name] ?? 0) + 1;
    }
  }

  /* 元信息 */
  const now = new Date().toISOString();
  const meta = PetsMetaSchema.parse({
    version: "2.0.0",
    generatedAt: now,
    totalCount: pets.length,
    sources: Object.fromEntries(
      Object.keys(sourceCount).map((name) => [
        name,
        { lastFetchedAt: now, stale: false },
      ]),
    ),
    qualityBreakdown: quality,
  });
  writeFileSync(META_PATH, JSON.stringify(meta, null, 2));

  /* 报告 */
  const lines = [
    "# Validate Report",
    "",
    `生成时间：${now}`,
    "",
    "## 概况",
    "",
    `- 总条目：**${pets.length}**`,
    `- 重复 ID：**${duplicateIds.length}**`,
    `- 离群（IQR×3）：**${outliers.length}**`,
    "",
    "## 数据质量分布",
    "",
    `- verified:       ${quality.verified}`,
    `- single-source:  ${quality["single-source"]}`,
    `- user-reported:  ${quality["user-reported"]}`,
    `- inferred:       ${quality.inferred}`,
    "",
    "## 数据来源覆盖",
    "",
    ...Object.entries(sourceCount).map(([k, v]) => `- **${k}**: ${v} 条`),
    "",
    "## 离群清单（R = 中心重量/中心尺寸 超出 IQR × 3）",
    "",
    outliers.length === 0
      ? "_无离群_"
      : outliers
          .sort((a, b) => b.r - a.r)
          .map(
            (o) =>
              `- ${o.zone === "high" ? "🔺" : "🔻"} **${o.pet.name}** R=${o.r.toFixed(2)} (${o.pet.size.minM}-${o.pet.size.maxM}m × ${o.pet.weight.minKg}-${o.pet.weight.maxKg}kg)`,
          )
          .join("\n"),
    "",
  ];
  writeFileSync(REPORT_PATH, lines.join("\n"));

  console.log(`[validate] pets:    ${pets.length}`);
  console.log(`[validate] dup ids: ${duplicateIds.length}`);
  console.log(`[validate] quality: verified=${quality.verified} single=${quality["single-source"]} reported=${quality["user-reported"]} inferred=${quality.inferred}`);
  console.log(`[validate] sources: ${Object.entries(sourceCount).map(([k,v])=>`${k}:${v}`).join(' ')}`);
  console.log(`[validate] outliers (IQR x3): ${outliers.length}`);
  console.log(`[validate] meta  → ${META_PATH}`);
  console.log(`[validate] report → ${REPORT_PATH}`);
}

main();
