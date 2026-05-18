/**
 * scripts/data/update-data.ts
 *
 * 数据管道 orchestrator：
 *   extract-luodan  →  enrich  →  validate
 *
 * 用法：
 *   npm run data:update              # 完整管道
 *   npm run data:update -- --skip-fetch   # 跳过抓取（用缓存）
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";

async function runStep(name: string, fn: () => Promise<void>) {
  console.log(`\n━━━━━━ ${name} ━━━━━━`);
  const start = Date.now();
  await fn();
  console.log(`  ✓ ${name} (${((Date.now() - start) / 1000).toFixed(1)}s)`);
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const skipFetch = args.has("--skip-fetch");

  await runStep("extract-luodan", async () => {
    if (skipFetch && existsSync(resolve("scripts/.cache/luodan/luodan-metadata.json"))) {
      console.log("  (--skip-fetch) 使用缓存");
      return;
    }
    await import("./extract-luodan");
  });

  await runStep("enrich", async () => {
    await import("./enrich");
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
