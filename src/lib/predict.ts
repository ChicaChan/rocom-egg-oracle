import type {
  EggWeightClass,
  PetEggRange,
  PredictCandidate,
  PredictInput,
  PredictionResult,
} from "./types";

const EGG_WEIGHT_CLASS_LABELS: Record<EggWeightClass, string> = {
  ultraLight: "超轻蛋",
  light: "轻蛋",
  medium: "中等蛋",
  heavy: "重蛋",
  ultraHeavy: "超重蛋",
};

export function getEggWeightClass(weightKg: number): EggWeightClass {
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

export function getEggWeightClassLabel(type: EggWeightClass): string {
  return EGG_WEIGHT_CLASS_LABELS[type];
}

export function getEggWeightClassLabels(types: EggWeightClass[]): string {
  return types.map((type) => getEggWeightClassLabel(type)).join(" / ");
}

export function formatHatchTime(seconds?: number): string {
  if (!seconds) {
    return "未知";
  }
  if (seconds < 60) {
    return `${seconds} 秒`;
  }
  const hours = seconds / 3600;
  if (Number.isInteger(hours)) {
    return `${hours} 小时`;
  }
  const minutes = Math.round(seconds / 60);
  return `${minutes} 分钟`;
}

export function validatePredictionInput(input: PredictInput): string[] {
  const errors: string[] = [];

  if (!Number.isFinite(input.sizeM) || input.sizeM <= 0) {
    errors.push("请输入大于 0 的蛋尺寸，单位为 m。");
  }

  if (!Number.isFinite(input.weightKg) || input.weightKg <= 0) {
    errors.push("请输入大于 0 的蛋重量，单位为 kg。");
  }

  if (input.sizeM > 10) {
    errors.push("尺寸数值过大，请确认单位是否为 m。");
  }

  if (input.weightKg > 1000) {
    errors.push("重量数值过大，请确认单位是否为 kg。");
  }

  return errors;
}

export function predictEgg(
  pets: PetEggRange[],
  input: PredictInput,
): PredictionResult {
  const errors = validatePredictionInput(input);
  const uniquePetNames = new Set(pets.map((pet) => pet.name)).size;

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
      matches: [],
      nearby: [],
      stats: {
        totalRecords: pets.length,
        filteredRecords: 0,
        uniquePetNames,
      },
    };
  }

  const topN = input.topN ?? 12;
  const filtered = filterByOptions(pets, input);
  const userR = input.weightKg / input.sizeM;
  const eggWeightClass = getEggWeightClass(input.weightKg);
  const scored = filtered.map((pet) => scoreCandidate(pet, input, userR));
  const strictMatches = scored
    .filter(({ pet }) => isStrictMatch(pet, input))
    .sort(compareCandidates)
    .slice(0, topN);

  const nearby = scored
    .filter(({ pet }) => !isStrictMatch(pet, input))
    .sort(compareCandidates)
    .slice(0, 5);

  return {
    ok: true,
    errors: [],
    input: {
      sizeM: round(input.sizeM, 3),
      weightKg: round(input.weightKg, 3),
      rValue: round(userR, 3),
      eggWeightClass,
    },
    matches: strictMatches,
    nearby,
    stats: {
      totalRecords: pets.length,
      filteredRecords: filtered.length,
      uniquePetNames,
    },
  };
}

function filterByOptions(pets: PetEggRange[], input: PredictInput): PetEggRange[] {
  return pets.filter((pet) => {
    if (input.eggType !== undefined && input.eggType !== "all") {
      // 生成数据会把可筛选来源统一映射到 eggTypes，过滤时只认这个字段。
      if (input.eggType === null) {
        // 当前在册精灵筛选：只保留映射为 null 的主数据集合。
        if (!pet.eggTypes.includes(null)) {
          return false;
        }
      } else if (!pet.eggTypes.includes(input.eggType)) {
        return false;
      }
    }

    if (
      input.hatchSeconds &&
      input.hatchSeconds !== "all" &&
      pet.hatchSeconds !== input.hatchSeconds
    ) {
      return false;
    }

    if (
      input.eggWeightClass &&
      input.eggWeightClass !== "all" &&
      !pet.eggWeightClasses.includes(input.eggWeightClass)
    ) {
      return false;
    }

    return true;
  });
}

function isStrictMatch(pet: PetEggRange, input: PredictInput): boolean {
  return (
    input.sizeM >= pet.sizeMinM &&
    input.sizeM <= pet.sizeMaxM &&
    input.weightKg >= pet.weightMinKg &&
    input.weightKg <= pet.weightMaxKg
  );
}

function scoreCandidate(
  pet: PetEggRange,
  input: PredictInput,
  userR: number,
): PredictCandidate {
  const centerSize = (pet.sizeMinM + pet.sizeMaxM) / 2;
  const centerWeight = (pet.weightMinKg + pet.weightMaxKg) / 2;
  const rValue = centerWeight / centerSize;
  const rDiff = Math.abs(rValue - userR);
  const sizeDistance = normalizedDistance(input.sizeM, pet.sizeMinM, pet.sizeMaxM);
  const weightDistance = normalizedDistance(
    input.weightKg,
    pet.weightMinKg,
    pet.weightMaxKg,
  );
  const centerDistance = round(sizeDistance * 0.35 + weightDistance * 0.65, 6);
  const score = Math.max(0, 100 - centerDistance * 100);

  return {
    pet,
    score: round(score, 2),
    rValue: round(rValue, 3),
    rDiff: round(rDiff, 3),
    centerDistance,
    ...confidenceFromDiff(rDiff),
  };
}

function normalizedDistance(value: number, min: number, max: number): number {
  const center = (min + max) / 2;
  const halfRange = Math.max((max - min) / 2, 0.000001);
  return Math.abs(value - center) / halfRange;
}

function confidenceFromDiff(rDiff: number): Pick<
  PredictCandidate,
  "confidence" | "confidenceText" | "probabilityText"
> {
  if (rDiff === 0) {
    return {
      confidence: "exact",
      confidenceText: "精确",
      probabilityText: "最高",
    };
  }

  if (rDiff <= 0.1) {
    return {
      confidence: "high",
      confidenceText: "高",
      probabilityText: "高",
    };
  }

  if (rDiff <= 0.3) {
    return {
      confidence: "medium",
      confidenceText: "中",
      probabilityText: "中",
    };
  }

  return {
    confidence: "low",
    confidenceText: "低",
    probabilityText: "低",
  };
}

function compareCandidates(a: PredictCandidate, b: PredictCandidate): number {
  return a.rDiff - b.rDiff || b.score - a.score || a.pet.name.localeCompare(b.pet.name, "zh-Hans-CN");
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
