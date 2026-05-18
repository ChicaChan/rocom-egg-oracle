/**
 * scripts/data/extract-luodan.ts
 *
 * 从灵蛋所前端 chunk（assets/worker-entry-*.js）逆向出 358 条精灵元数据。
 *
 * ⚠️ 重要：worker.js 中的 height/weight 是「精灵成体尺寸」，
 *         不是「蛋孵化时的区间」。本提取流程只取元数据，
 *         不取 height/weight，保持 size/weight 来自现有 BWIKI 数据源。
 *
 * 用法：
 *   npx tsx scripts/data/extract-luodan.ts [--cache scripts/.cache/luodan]
 */

import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import pRetry from "p-retry";

const LUODAN_ORIGIN = "https://luokewangguofudan.wiki";
const CACHE_DIR = resolve("scripts/.cache/luodan");
const OUTPUT = resolve("scripts/.cache/luodan/luodan-metadata.json");

export type LuodanMeta = {
  id: number;
  name: string;
  displayKey: string;
  pinyin: string;
  classisId: number;
  classisName: string;
  image: string | null;
  shinyImage: string | null;
  eggGroups: number[];
  shiny: boolean;
  /** 成体尺寸/重量 — 仅用于参考与排错，不进主数据 */
  adultHeightCm: { min: number; max: number };
  adultWeightG: { min: number; max: number };
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
    { retries: 3, minTimeout: 500, maxTimeout: 4_000 },
  );
}

async function discoverWorkerChunk(): Promise<{ url: string; html: string }> {
  const html = await fetchText(LUODAN_ORIGIN + "/");
  const m = html.match(/\/assets\/worker-entry-[A-Za-z0-9_-]+\.js/);
  if (!m) throw new Error("worker-entry chunk URL not found in homepage");
  return { url: LUODAN_ORIGIN + m[0], html };
}

/** 用花括号匹配抽取每一个含 heightLow 的对象字面量 */
function extractObjects(src: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (true) {
    const idx = src.indexOf("heightLow:", i);
    if (idx < 0) break;
    // 向前找最近的未配对 '{'
    let start = -1;
    let depth = 0;
    for (let j = idx; j >= Math.max(0, idx - 2_000); j--) {
      const c = src[j];
      if (c === "}") depth++;
      else if (c === "{") {
        if (depth === 0) {
          start = j;
          break;
        }
        depth--;
      }
    }
    if (start < 0) {
      i = idx + 1;
      continue;
    }
    // 向后找匹配 '}'
    let end = -1;
    depth = 0;
    for (let j = start; j < Math.min(src.length, start + 2_000); j++) {
      const c = src[j];
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) {
          end = j + 1;
          break;
        }
      }
    }
    if (end < 0) {
      i = idx + 1;
      continue;
    }
    out.push(src.slice(start, end));
    i = end;
  }
  // 去重
  return Array.from(new Set(out));
}

function readField(blob: string, key: string): string | null {
  const re = new RegExp(`${key}:(\`[^\`]*\`|-?\\d+|null|!0|!1|\\[[^\\]]*\\])`);
  const m = blob.match(re);
  return m ? m[1] : null;
}

function decode(raw: string | null): unknown {
  if (raw == null) return null;
  if (raw.startsWith("`") && raw.endsWith("`")) return raw.slice(1, -1);
  if (raw === "null") return null;
  if (raw === "!0") return true;
  if (raw === "!1") return false;
  if (raw.startsWith("[") && raw.endsWith("]")) {
    const inner = raw.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map((s) => Number(s.trim())).filter((n) => Number.isFinite(n));
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function parseRecord(blob: string): LuodanMeta | null {
  const id = decode(readField(blob, "id"));
  const name = decode(readField(blob, "name"));
  const displayKey = decode(readField(blob, "displayKey"));
  const pinyin = decode(readField(blob, "pinyin"));
  const classisId = decode(readField(blob, "classisId"));
  const classisName = decode(readField(blob, "classisName"));
  const image = decode(readField(blob, "image"));
  const shinyImage = decode(readField(blob, "shinyImage"));
  const eggGroups = decode(readField(blob, "eggGroups"));
  const shiny = decode(readField(blob, "shiny"));
  const heightLow = decode(readField(blob, "heightLow"));
  const heightHigh = decode(readField(blob, "heightHigh"));
  const weightLow = decode(readField(blob, "weightLow"));
  const weightHigh = decode(readField(blob, "weightHigh"));

  if (
    typeof id !== "number" ||
    typeof name !== "string" ||
    typeof pinyin !== "string" ||
    typeof heightLow !== "number" ||
    typeof heightHigh !== "number"
  ) {
    return null;
  }
  return {
    id,
    name,
    displayKey: typeof displayKey === "string" ? displayKey : name,
    pinyin,
    classisId: typeof classisId === "number" ? classisId : 0,
    classisName: typeof classisName === "string" ? classisName : "",
    image: typeof image === "string" ? image : null,
    shinyImage: typeof shinyImage === "string" ? shinyImage : null,
    eggGroups: Array.isArray(eggGroups) ? (eggGroups as number[]) : [],
    shiny: shiny === true,
    adultHeightCm: { min: heightLow, max: heightHigh as number },
    adultWeightG: {
      min: typeof weightLow === "number" ? weightLow : 0,
      max: typeof weightHigh === "number" ? weightHigh : 0,
    },
  };
}

async function main() {
  mkdirSync(CACHE_DIR, { recursive: true });

  const { url, html } = await discoverWorkerChunk();
  console.log(`[luodan] worker chunk: ${url}`);

  const chunkPath = resolve(CACHE_DIR, "worker.js");
  // 简易增量：若已缓存且大小看起来合理，仍每次重抓覆盖（chunk URL 含 hash，变了说明数据更新了）
  const js = await fetchText(url);
  writeFileSync(chunkPath, js);
  writeFileSync(resolve(CACHE_DIR, "index.html"), html);
  console.log(`[luodan] cached ${js.length} bytes`);

  const blobs = extractObjects(js);
  console.log(`[luodan] candidate blobs: ${blobs.length}`);

  const records: LuodanMeta[] = [];
  const errors: string[] = [];
  for (const blob of blobs) {
    const r = parseRecord(blob);
    if (r) records.push(r);
    else errors.push(blob.slice(0, 80));
  }

  console.log(`[luodan] parsed records: ${records.length}`);
  console.log(`[luodan] errors:         ${errors.length}`);
  errors.slice(0, 3).forEach((e) => console.log("  ", e));

  writeFileSync(OUTPUT, JSON.stringify(records, null, 2));
  console.log(`[luodan] wrote ${OUTPUT}`);
}

export async function runExtractLuodan() {
  await main();
}

if (process.argv[1]?.endsWith("extract-luodan.ts")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
