export type EggWeightClass = "ultraLight" | "light" | "medium" | "heavy" | "ultraHeavy";

export type PetEggRange = {
  id: string;
  sourceRecordId: number;
  petId: number;
  name: string;
  sizeMinM: number;
  sizeMaxM: number;
  weightMinKg: number;
  weightMaxKg: number;
  hatchSeconds?: number;
  eggWeightClasses: EggWeightClass[];
  isCurrentRandomPool: boolean;
  source: string;
  sourceUpdatedAt: string;
};

export type PredictInput = {
  sizeM: number;
  weightKg: number;
  topN?: number;
  hatchSeconds?: number | "all";
};

export type PredictCandidate = {
  pet: PetEggRange;
  score: number;
  rValue: number;
  rDiff: number;
  centerDistance: number;
  confidence: "exact" | "high" | "medium" | "low";
  confidenceText: string;
  probabilityText: string;
};

export type PredictionResult = {
  ok: boolean;
  errors: string[];
  input?: {
    sizeM: number;
    weightKg: number;
    rValue: number;
    eggWeightClass: EggWeightClass;
  };
  matches: PredictCandidate[];
  nearby: PredictCandidate[];
  stats: {
    totalRecords: number;
    filteredRecords: number;
    uniquePetNames: number;
  };
};
