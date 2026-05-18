/**
 * scripts/data/update-data.ts
 *
 * 数据管道 orchestrator：
 *   extract-luodan         (worker.js → 358 条元数据)
 *   fetch-luodan-details   (5 个详情页 → 31 条 verified 蛋区间)
 *   build-pets             (合成 data/pets.json，dataQuality=verified)
 *   validate               (zod + IQR 离群 + 报告)
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { runExtractLuodan } from "./extract-luodan";
import { runFetchLuodanDetails } from "./fetch-luodan-details";

async function runStep(name: string, fn: () => Promise<void>) {
  console.log(`\n━━━━━━ ${name} ━━━━━━`);
  const start = Date.now();
  await fn();
  console.log(`  ✓ ${name} (${((Date.now() - start) / 1000).toFixed(1)}s)`);
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const skipFetch = args.has("--skip-fetch");

  await runStep("extract-luodan (metadata)", async () => {
    if (skipFetch && existsSync(resolve("scripts/.cache/luodan/luodan-metadata.json"))) {
      console.log("  (--skip-fetch) 使用缓存");
      return;
    }
    await runExtractLuodan();
  });

  await runStep("fetch-luodan-details (verified ranges)", async () => {
    if (skipFetch && existsSync(resolve("scripts/.cache/luodan/luodan-details.json"))) {
      console.log("  (--skip-fetch) 使用缓存");
      return;
    }
    await runFetchLuodanDetails();
  });

  await runStep("build-pets", async () => {
    await import("./build-pets");
  });

  await runStep("validate", async () => {
    await import("./validate");
  });

  console.log("\n✨ data pipeline complete");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
