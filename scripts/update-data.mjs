import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const BREEDING_URL =
  "https://raw.githubusercontent.com/jiluoQAQ/RocomUID/main/RocomUID/utils/map/breeding.json";
const PROJECT_ROOT = process.cwd();
const DATA_DIR = path.join(PROJECT_ROOT, "data");
const OUTPUT_FILE = path.join(DATA_DIR, "pets.json");

const rawData = await fetchJsonWithRetry(BREEDING_URL);

if (!Array.isArray(rawData.pet_egg_conf)) {
  throw new Error("Invalid breeding data: pet_egg_conf is missing.");
}

const sourceUpdatedAt = new Date().toISOString();
const currentRandomPoolRecords = rawData.pet_egg_conf.filter((record) =>
  Array.isArray(record.random_eggs_group),
);

const pets = currentRandomPoolRecords.map((record) => {
  const weightMinKg = round(Number(record.weight_low) / 1000, 3);
  const weightMaxKg = round(Number(record.weight_high) / 1000, 3);

  return {
    id: String(record.id),
    sourceRecordId: Number(record._row_key ?? record.id),
    petId: Number(record.pet_id),
    name: String(record.name),
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

const uniquePetNames = new Set(pets.map((pet) => pet.name)).size;
const hatchOptions = [...new Set(pets.map((pet) => pet.hatchSeconds).filter(Boolean))].sort(
  (a, b) => a - b,
);

console.log(`Wrote ${pets.length} records to ${OUTPUT_FILE}`);
console.log(`Raw records: ${rawData.pet_egg_conf.length}`);
console.log(`Unique pet names: ${uniquePetNames}`);
console.log(`Hatch options: ${hatchOptions.join(", ")}`);
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

  throw lastError;
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
