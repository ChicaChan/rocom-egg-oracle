import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const BREEDING_URL =
  "https://raw.githubusercontent.com/jiluoQAQ/RocomUID/main/RocomUID/utils/map/breeding.json";
const PET_IMAGE_CDN_BASE = "https://jp.qxqx.cf/RocomUID/resource/rocomicon";
const MAX_IMAGE_SIZE = 1024 * 1024;
const PROJECT_ROOT = process.cwd();
const DATA_DIR = path.join(PROJECT_ROOT, "data");
const OUTPUT_FILE = path.join(DATA_DIR, "pets.json");
const PET_IMAGE_DIR = path.join(PROJECT_ROOT, "public", "pets");

const rawData = await fetchJsonWithRetry(BREEDING_URL);
const pets = rawData._fromCache ? normalizeCachedPets(rawData.pet_egg_conf) : convertRawRecords(rawData.pet_egg_conf);

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
const hatchOptions = [...new Set(pets.map((pet) => pet.hatchSeconds).filter(Boolean))].sort(
  (a, b) => a - b,
);

console.log(`Wrote ${pets.length} records to ${OUTPUT_FILE}`);
console.log(`Raw records: ${rawData.pet_egg_conf.length}`);
console.log(`Unique pet names: ${uniquePetNames}`);
console.log(`Hatch options: ${hatchOptions.join(", ")}`);
console.log(
  `Pet images: downloaded ${imageSyncResult.downloaded}, reused ${imageSyncResult.reused}, failed ${imageSyncResult.failed}`,
);
if (rawData._fromCache) {
  console.log("Data source unavailable, reused local cache");
}
console.log("Default scope: current random egg pool only");

function round(value, digits) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

async function fetchJsonWithRetry(url) {
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const nextResponse = await fetch(url, {
        headers: {
          "User-Agent": "rocom-egg-predictor-data-sync",
        },
      });

      if (nextResponse.ok || attempt === 3) {
        if (!nextResponse.ok) {
          throw new Error(
            `Failed to download breeding data: ${nextResponse.status} ${nextResponse.statusText}`,
          );
        }

        return await nextResponse.json();
      }

      lastError = new Error(
        `Unexpected response: ${nextResponse.status} ${nextResponse.statusText}`,
      );
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
  }

  console.warn("所有数据源不可用，回退到本地缓存数据");
  try {
    const cache = JSON.parse(await readFile(OUTPUT_FILE, "utf8"));
    return { pet_egg_conf: cache, _fromCache: true };
  } catch {
    throw lastError;
  }
}

function getEggWeightClass(weightKg) {
  if (weightKg < 1) {
    return "ultraLight";
  }
  if (weightKg < 1.8) {
    return "light";
  }
  if (weightKg < 4) {
    return "medium";
  }
  if (weightKg < 14) {
    return "heavy";
  }
  return "ultraHeavy";
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

function convertRawRecords(records) {
  if (!Array.isArray(records)) {
    throw new Error("Invalid breeding data: pet_egg_conf is missing.");
  }

  const sourceUpdatedAt = new Date().toISOString();
  const currentRandomPoolRecords = records.filter((record) => Array.isArray(record.random_eggs_group));

  return currentRandomPoolRecords.map((record) => {
    const weightMinKg = round(Number(record.weight_low) / 1000, 3);
    const weightMaxKg = round(Number(record.weight_high) / 1000, 3);

    return {
      id: String(record.id),
      sourceRecordId: Number(record._row_key ?? record.id),
      petId: Number(record.pet_id),
      name: String(record.name),
      imagePath: `/pets/${Number(record.pet_id)}.png`,
      sizeMinM: round(Number(record.height_low) / 100, 3),
      sizeMaxM: round(Number(record.height_high) / 100, 3),
      weightMinKg,
      weightMaxKg,
      hatchSeconds: Number(record.hatch_data || 0) || undefined,
      eggWeightClasses: getOverlappingEggWeightClasses(weightMinKg, weightMaxKg),
      isCurrentRandomPool: true,
      source: BREEDING_URL,
      sourceUpdatedAt,
    };
  });
}

function normalizeCachedPets(records) {
  if (!Array.isArray(records)) {
    throw new Error("Invalid cached pet data.");
  }

  return records.map((record) => ({
    ...record,
    imagePath: record.imagePath || `/pets/${Number(record.petId)}.png`,
  }));
}

async function syncPetImages(pets) {
  await mkdir(PET_IMAGE_DIR, { recursive: true });

  let downloaded = 0;
  let reused = 0;
  let failed = 0;

  for (const pet of pets) {
    const filePath = path.join(PET_IMAGE_DIR, `${pet.petId}.png`);

    if (await fileExists(filePath)) {
      reused += 1;
      continue;
    }

    try {
      const body = await fetchImageWithRetry(`${PET_IMAGE_CDN_BASE}/${encodeURIComponent(pet.name)}.png`);
      await writeFile(filePath, new Uint8Array(body));
      downloaded += 1;
    } catch (error) {
      failed += 1;
      console.warn(`图片下载失败: ${pet.name} (${pet.petId})`);
      console.warn(error instanceof Error ? error.message : String(error));
    }
  }

  return { downloaded, reused, failed };
}

async function fetchImageWithRetry(url) {
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "rocom-egg-predictor-image-sync",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.startsWith("image/")) {
        throw new Error(`Invalid image content type: ${contentType || "unknown"}`);
      }

      const contentLength = response.headers.get("content-length");
      if (contentLength && parseInt(contentLength, 10) > MAX_IMAGE_SIZE) {
        throw new Error(`Image too large: ${contentLength} bytes`);
      }

      const body = await response.arrayBuffer();
      if (body.byteLength > MAX_IMAGE_SIZE) {
        throw new Error(`Image too large: ${body.byteLength} bytes`);
      }

      return body;
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
