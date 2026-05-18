/**
 * scripts/data/download-images.ts
 *
 * 从灵蛋所 /assets/webp/friends/JL_*.webp 下载所有精灵立绘到 public/pets/luodan/。
 * - 按 luodan-metadata.json 的 image 字段批量下载
 * - 增量：本地已存在 + 体积 > 1KB 的不重抓
 * - 并发 4 + 200-400ms jitter
 * - 失败累加重试，单条 3 次
 *
 * 运行：
 *   npm run data:images
 */

import { mkdirSync, existsSync, statSync, writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import pRetry from "p-retry";
import type { LuodanMeta } from "./extract-luodan";

const ORIGIN = "https://luokewangguofudan.wiki";
const METADATA_PATH = resolve("scripts/.cache/luodan/luodan-metadata.json");
const OUT_DIR = resolve("public/pets/luodan");
const CONCURRENCY = 4;
const MIN_FILE_BYTES = 1024;

async function fetchBinary(url: string): Promise<ArrayBuffer> {
  return pRetry(
    async () => {
      const res = await fetch(url, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          accept: "image/webp,image/*;q=0.8,*/*;q=0.5",
        },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
      return res.arrayBuffer();
    },
    { retries: 3, minTimeout: 500, maxTimeout: 4_000 },
  );
}

type Job = { filename: string; url: string; localPath: string };

async function processJob(job: Job): Promise<"downloaded" | "cached" | "failed"> {
  if (existsSync(job.localPath)) {
    const stat = statSync(job.localPath);
    if (stat.size >= MIN_FILE_BYTES) return "cached";
  }
  try {
    const buf = await fetchBinary(job.url);
    if (buf.byteLength < MIN_FILE_BYTES) {
      throw new Error(`too small (${buf.byteLength} bytes)`);
    }
    writeFileSync(job.localPath, Buffer.from(buf));
    return "downloaded";
  } catch (e) {
    console.warn(`  ✗ ${job.filename}: ${(e as Error).message}`);
    return "failed";
  }
}

async function runPool<T>(items: T[], worker: (it: T) => Promise<unknown>) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length > 0) {
        const it = queue.shift()!;
        await worker(it);
        await new Promise((r) => setTimeout(r, 200 + Math.random() * 200));
      }
    }),
  );
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const metadata = JSON.parse(readFileSync(METADATA_PATH, "utf8")) as LuodanMeta[];

  const jobs: Job[] = [];
  for (const m of metadata) {
    if (!m.image) continue;
    jobs.push({
      filename: m.image,
      url: `${ORIGIN}/assets/webp/friends/${m.image}`,
      localPath: resolve(OUT_DIR, m.image),
    });
    if (m.shinyImage) {
      jobs.push({
        filename: m.shinyImage,
        url: `${ORIGIN}/assets/webp/friends/${m.shinyImage}`,
        localPath: resolve(OUT_DIR, m.shinyImage),
      });
    }
  }

  console.log(`[images] total jobs: ${jobs.length}`);
  let downloaded = 0;
  let cached = 0;
  let failed = 0;
  let idx = 0;

  await runPool(jobs, async (job) => {
    idx++;
    const r = await processJob(job);
    if (r === "downloaded") {
      downloaded++;
      if (idx % 20 === 0) console.log(`  [${idx}/${jobs.length}] ${downloaded} fetched`);
    } else if (r === "cached") cached++;
    else failed++;
  });

  console.log(`\n[images] downloaded: ${downloaded}  cached: ${cached}  failed: ${failed}`);
  console.log(`[images] wrote to ${OUT_DIR}`);
}

export async function runDownloadImages() {
  await main();
}

if (process.argv[1]?.endsWith("download-images.ts")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
