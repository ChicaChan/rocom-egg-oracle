import { execFile as execFileCallback } from "node:child_process";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

const PROJECT_ROOT = process.cwd();
const DATA_DIR = path.join(PROJECT_ROOT, "data");
const OUTPUT_FILE = path.join(DATA_DIR, "pets.json");
const PET_IMAGE_DIR = path.join(PROJECT_ROOT, "public", "pets");
const MAX_IMAGE_SIZE = 1024 * 1024;

const BWIKI_REFERER = "https://wiki.biligame.com/rocom/精灵图鉴";
const BWIKI_API_BASE = "https://wiki.biligame.com/rocom/api.php";
const BWIKI_PETBOOK_PAGE = "精灵图鉴";

const DEFAULT_HEADERS = [
  "-A",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  "-H",
  "Accept: application/json,text/plain,*/*",
  "-H",
  `Referer: ${BWIKI_REFERER}`,
];

const BWIKI_SOURCE_URL = "https://wiki.biligame.com/rocom/精灵图鉴";

const cachedPets = await readCachedPets();
let pets;

try {
  pets = await buildPetsFromBwiki();
} catch (error) {
  if (!cachedPets.length) {
    throw error;
  }
  console.warn(`BWIKI 数据抓取失败，回退到本地缓存: ${formatError(error)}`);
  pets = normalizeCachedPets(cachedPets);
}

const invalid = pets.filter(
  (pet) =>
    !pet.name ||
    pet.sizeMinM <= 0 ||
    pet.weightMinKg < 0 ||
    pet.sizeMinM > pet.sizeMaxM ||
    pet.weightMinKg > pet.weightMaxKg,
);

if (invalid.length > 0) {
  throw new Error(`Invalid converted pet ranges: ${invalid.length}`);
}

await mkdir(DATA_DIR, { recursive: true });
await writeFile(OUTPUT_FILE, `${JSON.stringify(pets, null, 2)}\n`, "utf8");
const imageSyncResult = await syncPetImages(pets);

const uniquePetNames = new Set(pets.map((pet) => pet.name)).size;

console.log(`Wrote ${pets.length} records to ${OUTPUT_FILE}`);
console.log(`Unique pet names: ${uniquePetNames}`);
console.log(`Pet images: downloaded ${imageSyncResult.downloaded}, reused ${imageSyncResult.reused}, failed ${imageSyncResult.failed}`);

async function buildPetsFromBwiki() {
  const petbookHtml = await fetchBwikiHtml(BWIKI_PETBOOK_PAGE);
  const entries = extractPetEntries(petbookHtml);
  const uniqueEntries = deduplicateByTitle(entries);
  const sourceUpdatedAt = new Date().toISOString();

  console.log(`Collected ${entries.length} raw rows and ${uniqueEntries.length} unique pet pages from BWIKI`);

  const pets = [];
  const concurrency = 8;

  for (let i = 0; i < uniqueEntries.length; i += concurrency) {
    const batch = uniqueEntries.slice(i, i + concurrency);
    const results = await Promise.allSettled(batch.map((entry) => buildPetRecord(entry, sourceUpdatedAt)));

    for (const result of results) {
      if (result.status === "fulfilled") {
        pets.push(result.value);
      } else {
        console.warn(`跳过精灵: ${formatError(result.reason)}`);
      }
    }
  }

  if (pets.length === 0) {
    throw new Error("未能从 BWIKI 构建任何精灵数据");
  }

  return pets.sort((a, b) => a.name.localeCompare(b.name, "zh-Hans-CN"));
}

async function buildPetRecord(entry, sourceUpdatedAt) {
  const detailHtml = await fetchBwikiHtml(entry.title);
  const physique = extractPhysique(detailHtml, entry.title);
  const remoteImageUrl = extractPrimaryImage(detailHtml) ?? entry.imageUrl ?? "";
  const petId = toPetId(entry.title);

  return {
    id: String(petId),
    sourceRecordId: petId,
    petId,
    name: entry.title,
    imagePath: `/pets/${petId}.png`,
    remoteImageUrl,
    sizeMinM: physique.sizeMinM,
    sizeMaxM: physique.sizeMaxM,
    weightMinKg: physique.weightMinKg,
    weightMaxKg: physique.weightMaxKg,
    hatchSeconds: undefined,
    preciousEggType: null,
    eggTypes: [null],
    eggTypeLabel: "正式服精灵",
    isRideEgg: false,
    form: null,
    petBondName: null,
    closeLevel: null,
    eggWeightClasses: getOverlappingEggWeightClasses(physique.weightMinKg, physique.weightMaxKg),
    hasRandomEggsGroup: true,
    source: BWIKI_SOURCE_URL,
    sourceUpdatedAt,
  };
}

async function fetchBwikiHtml(page) {
  const url = new URL(BWIKI_API_BASE);
  url.searchParams.set("action", "parse");
  url.searchParams.set("page", page);
  url.searchParams.set("prop", "text");
  url.searchParams.set("format", "json");

  const payload = await curlJson(url.toString());
  const html = payload?.parse?.text?.["*"];

  if (typeof html !== "string" || !html.includes("mw-parser-output")) {
    throw new Error(`BWIKI 页面解析失败: ${page}`);
  }

  return html;
}

async function curlJson(url) {
  const { stdout } = await execFile("curl", ["-L", "--silent", ...DEFAULT_HEADERS, url], {
    cwd: PROJECT_ROOT,
    maxBuffer: 32 * 1024 * 1024,
  });

  let payload;
  try {
    payload = JSON.parse(stdout);
  } catch {
    throw new Error(`返回内容不是 JSON: ${url}`);
  }

  if (payload?.error) {
    throw new Error(payload.error.info || payload.error.code || "BWIKI API error");
  }

  return payload;
}

function extractPetEntries(html) {
  const cards = [...html.matchAll(/NO\.\d+[\s\S]*?<a [^>]*href="\/rocom\/[^"]+" title="[^"]+"[^>]*>[\s\S]*?<img [^>]*src="[^"]+"[^>]*>/g)];
  const entries = [];

  for (const cardMatch of cards) {
    const card = cardMatch[0];
    const titleMatch = card.match(/<a [^>]*href="\/rocom\/[^"]+" title="([^"]+)"[^>]*>/);
    if (!titleMatch) {
      continue;
    }

    const title = decodeHtml(titleMatch[1]).trim();
    if (!title || shouldSkipPet(title)) {
      continue;
    }

    const imageMatch = card.match(/<img [^>]*src="([^"]+)"[^>]*>/);
    const imageUrl = imageMatch ? decodeHtml(imageMatch[1]) : "";

    entries.push({ title, imageUrl });
  }

  return entries;
}

function deduplicateByTitle(entries) {
  const map = new Map();
  for (const entry of entries) {
    if (!map.has(entry.title)) {
      map.set(entry.title, entry);
    }
  }
  return [...map.values()];
}

function shouldSkipPet(title) {
  return title.includes("（") || title.includes("(");
}

function extractPhysique(html, title) {
  const match = html.match(
    /图标 宠物 体质 身高\.png[\s\S]*?<p>([\d.]+)~([\d.]+)<\/p><p class="font-runeregular">M<\/p>[\s\S]*?图标 宠物 体质 体重\.png[\s\S]*?<p>([\d.]+)~([\d.]+)<\/p><p class="font-runeregular">KG<\/p>/,
  );

  if (!match) {
    throw new Error(`未找到体质区间: ${title}`);
  }

  return {
    sizeMinM: round(Number(match[1]), 3),
    sizeMaxM: round(Number(match[2]), 3),
    weightMinKg: round(Number(match[3]), 3),
    weightMaxKg: round(Number(match[4]), 3),
  };
}

function extractPrimaryImage(html) {
  const match = html.match(/页面 宠物 立绘 [^"]+ 1\.png" src="([^"]+)"/);
  return match ? decodeHtml(match[1]) : null;
}

function decodeHtml(value) {
  return value
    .replaceAll("&#58;", ":")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function toPetId(name) {
  let hash = 2166136261;
  for (const char of name) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return Number(`9${String(hash >>> 0).padStart(9, "0")}`.slice(0, 10));
}

function round(value, digits) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function getOverlappingEggWeightClasses(minKg, maxKg) {
  const classes = [
    ["ultraLight", 0, 1],
    ["light", 1, 1.8],
    ["medium", 1.8, 4],
    ["heavy", 4, 14],
    ["ultraHeavy", 14, Number.POSITIVE_INFINITY],
  ];

  return classes
    .filter(([, min, max]) => minKg < max && maxKg >= min)
    .map(([name]) => name);
}

async function readCachedPets() {
  try {
    return JSON.parse(await readFile(OUTPUT_FILE, "utf8"));
  } catch {
    return [];
  }
}

function normalizeCachedPets(records) {
  if (!Array.isArray(records)) {
    throw new Error("Invalid cached pet data.");
  }

  return records.map((record) => {
    const petId = Number(record.petId);
    return {
      ...record,
      petId,
      sourceRecordId: Number(record.sourceRecordId ?? petId),
      imagePath: typeof record.imagePath === "string" ? record.imagePath : `/pets/${petId}.png`,
      remoteImageUrl: typeof record.remoteImageUrl === "string" ? record.remoteImageUrl : "",
      preciousEggType: null,
      eggTypes: Array.isArray(record.eggTypes) && record.eggTypes.length > 0 ? record.eggTypes : [null],
      eggTypeLabel: typeof record.eggTypeLabel === "string" ? record.eggTypeLabel : "正式服精灵",
      isRideEgg: false,
      form: null,
      petBondName: null,
      closeLevel: null,
      eggWeightClasses:
        Array.isArray(record.eggWeightClasses)
          ? record.eggWeightClasses
          : getOverlappingEggWeightClasses(Number(record.weightMinKg), Number(record.weightMaxKg)),
      hasRandomEggsGroup: true,
      source: typeof record.source === "string" ? record.source : BWIKI_SOURCE_URL,
      sourceUpdatedAt: typeof record.sourceUpdatedAt === "string" ? record.sourceUpdatedAt : new Date().toISOString(),
    };
  });
}

async function syncPetImages(pets) {
  await mkdir(PET_IMAGE_DIR, { recursive: true });

  let downloaded = 0;
  let reused = 0;
  let failed = 0;

  const missing = [];
  for (const pet of pets) {
    const filePath = path.join(PET_IMAGE_DIR, `${pet.petId}.png`);
    if (await fileExists(filePath)) {
      reused += 1;
    } else {
      missing.push(pet);
    }
  }

  if (missing.length > 0) {
    console.log(`Downloading ${missing.length} missing pet images...`);
    const concurrency = 5;
    for (let i = 0; i < missing.length; i += concurrency) {
      const batch = missing.slice(i, i + concurrency);
      const results = await Promise.allSettled(
        batch.map(async (pet) => {
          if (!pet.remoteImageUrl) {
            throw new Error("missing remote image url");
          }
          const body = await fetchImageWithRetry(pet.remoteImageUrl);
          const filePath = path.join(PET_IMAGE_DIR, `${pet.petId}.png`);
          await writeFile(filePath, new Uint8Array(body));
        }),
      );

      for (const result of results) {
        if (result.status === "fulfilled") {
          downloaded += 1;
        } else {
          failed += 1;
          const pet = batch[results.indexOf(result)];
          console.warn(`图片下载失败: ${pet.name} (${pet.petId})`);
        }
      }
    }
  }

  return { downloaded, reused, failed };
}

async function fetchImageWithRetry(url) {
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const { stdout } = await execFile("curl", [
        "-L",
        "--silent",
        "--fail",
        "--max-time",
        "8",
        ...DEFAULT_HEADERS,
        url,
      ], {
        cwd: PROJECT_ROOT,
        encoding: "buffer",
        maxBuffer: MAX_IMAGE_SIZE * 2,
      });

      if (stdout.byteLength > MAX_IMAGE_SIZE) {
        throw new Error(`Image too large: ${stdout.byteLength} bytes`);
      }

      return stdout.buffer.slice(stdout.byteOffset, stdout.byteOffset + stdout.byteLength);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }

  throw lastError;
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function formatError(error) {
  return error instanceof Error ? error.message : String(error);
}
