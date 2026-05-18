/**
 * scripts/data/fetch-luodan-details.ts
 *
 * 从灵蛋所的 5 个预生成详情页 (/egg-size/SS-WWW) 抓取**真实的蛋孵化阶段
 * size/weight 区间**——这是当前唯一权威来源。
 *
 * 详情页 URL 列表（sitemap.xml 公开）：
 *   /egg-size/18-009  (0.18m × 0.09kg)
 *   /egg-size/20-278  (0.20m × 2.78kg)
 *   /egg-size/25-195  (0.25m × 1.95kg)
 *   /egg-size/27-155  (0.27m × 1.55kg)
 *   /egg-size/28-236  (0.28m × 2.36kg)
 *
 * 每页表格头：排名 | 精灵名 | 属性 | 尺寸区间 | 重量区间 | 概率
 *
 * 输出：scripts/.cache/luodan/luodan-details.json
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import * as cheerio from "cheerio";
import pRetry from "p-retry";

const ORIGIN = "https://luokewangguofudan.wiki";
const DETAIL_PATHS = [
  "/egg-size/18-009",
  "/egg-size/20-278",
  "/egg-size/25-195",
  "/egg-size/27-155",
  "/egg-size/28-236",
];
const CACHE_DIR = resolve("scripts/.cache/luodan");
const OUTPUT = resolve(CACHE_DIR, "luodan-details.json");

export type LuodanDetailPet = {
  name: string;
  rawTypes: string[];
  size: { minM: number; maxM: number };
  weight: { minKg: number; maxKg: number };
  isMount: boolean;
  formLabel: string | null;
  sourcePaths: string[];
};

async function fetchText(url: string): Promise<string> {
  return pRetry(
    async () => {
      const res = await fetch(url, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
      return res.text();
    },
    { retries: 3, minTimeout: 800, maxTimeout: 4_000 },
  );
}

/* 解析一行表格 → LuodanDetailPet */
function parseRow(
  cells: string[],
  sourcePath: string,
): LuodanDetailPet | null {
  if (cells.length < 6 || !/^\d+$/.test(cells[0])) return null;
  const [, rawName, rawTypes, sizeStr, weightStr] = cells;
  const sm = sizeStr.match(/([\d.]+)-([\d.]+)\s*米/);
  const wm = weightStr.match(/([\d.]+)-([\d.]+)\s*千克/);
  if (!sm || !wm) return null;
  /* 名字处理："牵线木偶?同乘" → name=牵线木偶, isMount=true */
  let name = rawName.replace(/\s+/g, "");
  let isMount = false;
  let formLabel: string | null = null;
  if (name.endsWith("?同乘")) {
    isMount = true;
    name = name.slice(0, -3);
  }
  /* 形态后缀：明确列出已知的精灵形态名，避免误切其他含「形态」的精灵名 */
  const FORM_SUFFIXES = [
    "本来的样子",
    "紧实的样子",
    "彩玉球形态",
    "短毛球形态",
    "海神球形态",
    "象牙球形态",
  ];
  for (const suffix of FORM_SUFFIXES) {
    if (name.endsWith(suffix) && name.length > suffix.length) {
      formLabel = suffix;
      name = name.slice(0, -suffix.length);
      break;
    }
  }
  return {
    name,
    rawTypes: rawTypes.split(/[,，、]/).map((s) => s.trim()).filter(Boolean),
    size: { minM: Number(sm[1]), maxM: Number(sm[2]) },
    weight: { minKg: Number(wm[1]), maxKg: Number(wm[2]) },
    isMount,
    formLabel,
    sourcePaths: [sourcePath],
  };
}

function dedupe(rows: LuodanDetailPet[]): LuodanDetailPet[] {
  const map = new Map<string, LuodanDetailPet>();
  for (const r of rows) {
    /* 去重 key: name + form + isMount，因为不同形态/同乘是独立条目 */
    const key = `${r.name}|${r.formLabel ?? ""}|${r.isMount}`;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, r);
    } else {
      /* 合并 sourcePaths 用于追溯 */
      prev.sourcePaths.push(...r.sourcePaths);
      /* 区间不一致时记录冲突（实际上之前测试已确认 0 冲突） */
      if (
        prev.size.minM !== r.size.minM ||
        prev.size.maxM !== r.size.maxM ||
        prev.weight.minKg !== r.weight.minKg ||
        prev.weight.maxKg !== r.weight.maxKg
      ) {
        console.warn(`[fetch-details] ⚠ 区间冲突 ${key}: ${JSON.stringify(prev)} vs ${JSON.stringify(r)}`);
      }
    }
  }
  return [...map.values()];
}

async function main() {
  mkdirSync(CACHE_DIR, { recursive: true });
  const allRows: LuodanDetailPet[] = [];
  for (const path of DETAIL_PATHS) {
    const url = ORIGIN + path;
    const html = await fetchText(url);
    writeFileSync(resolve(CACHE_DIR, `detail-${path.replaceAll("/", "_")}.html`), html);
    const $ = cheerio.load(html);
    /* 找到第一个含"尺寸区间"表头的 table */
    const tables = $("table").toArray();
    const targetEl = tables.find((el) => $(el).find("th").text().includes("尺寸区间"));
    if (!targetEl) {
      console.warn(`[fetch-details] ${path} no 尺寸区间 table`);
      continue;
    }
    const trs = $(targetEl).find("tr").toArray();
    let pageCount = 0;
    for (const tr of trs) {
      const cells = $(tr)
        .find("td,th")
        .toArray()
        .map((c) => $(c).text().trim());
      const row = parseRow(cells, path);
      if (row) {
        allRows.push(row);
        pageCount++;
      }
    }
    console.log(`[fetch-details] ${path}: ${pageCount} 行`);
    /* 礼貌延迟 */
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));
  }

  const deduped = dedupe(allRows);
  console.log(`\n[fetch-details] total rows: ${allRows.length}`);
  console.log(`[fetch-details] unique pets: ${deduped.length}`);

  writeFileSync(OUTPUT, JSON.stringify(deduped, null, 2));
  console.log(`[fetch-details] wrote ${OUTPUT}`);
}

export async function runFetchLuodanDetails() {
  await main();
}

if (process.argv[1]?.endsWith("fetch-luodan-details.ts")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
