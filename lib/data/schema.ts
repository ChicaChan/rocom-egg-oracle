import { z } from "zod";

/* ──────────────────────────────────────────────────────────
   Pet schema — Rocom Egg Oracle 新数据模型 v2
   单一真相源：所有数据生产、消费、UI 都从这里推导类型。
   设计原则：
   - 删除一切运行时为 null 的占位字段（form/petBondName/closeLevel/...）
   - 所有数据都带 sources[]，便于追溯和未来交叉验证
   - 区间用嵌套对象，避免 sizeMinM/sizeMaxM 的扁平结构
   ─────────────────────────────────────────────────────── */

export const PetTypeSchema = z.enum([
  "光", "暗", "草", "火", "水", "地", "电",
  "风", "冰", "毒", "武", "虫", "机械", "恶", "龙", "鬼",
  "普通",
]);
export type PetType = z.infer<typeof PetTypeSchema>;

export const FormKindSchema = z.enum([
  "base",       // 基础形态
  "evolution",  // 进化形态
  "regional",   // 地区/形态变化
  "mega",       // 超进化/究极
  "shiny",      // 异色
  "event",      // 活动限定
]);
export type FormKind = z.infer<typeof FormKindSchema>;

export const FormSchema = z
  .object({
    kind: FormKindSchema,
    label: z.string().optional(),
  })
  .nullable();

export const RangeSchema = z
  .object({
    min: z.number().positive(),
    max: z.number().positive(),
  })
  .refine((r) => r.max >= r.min, { message: "max must be >= min" });

export const SizeRangeSchema = z
  .object({
    minM: z.number().positive(),
    maxM: z.number().positive(),
  })
  .refine((r) => r.maxM >= r.minM, { message: "size: max >= min" });

export const WeightRangeSchema = z
  .object({
    minKg: z.number().positive(),
    maxKg: z.number().positive(),
  })
  .refine((r) => r.maxKg >= r.minKg, { message: "weight: max >= min" });

export const SourceConfidenceSchema = z.enum(["verified", "single", "reported"]);
export type SourceConfidence = z.infer<typeof SourceConfidenceSchema>;

export const SourceSchema = z.object({
  name: z.enum(["luodan", "bwiki", "legacy", "community"]),
  url: z.string().url().optional(),
  fetchedAt: z.string().datetime().optional(),
  confidence: SourceConfidenceSchema,
});
export type Source = z.infer<typeof SourceSchema>;

export const DataQualitySchema = z.enum([
  "verified",        // 多源一致
  "single-source",   // 仅一处来源
  "user-reported",   // 玩家上报覆盖
  "inferred",        // 推断/迁移自旧数据
]);
export type DataQuality = z.infer<typeof DataQualitySchema>;

export const PetSchema = z.object({
  /** 来源稳定 slug（优先灵蛋所 pinyin，回退 hash(name)） */
  id: z.string().min(1),
  /** 游戏内编号（若能映射到），无则 null */
  petId: z.number().int().positive().nullable(),
  /** 主形态中文名 */
  name: z.string().min(1),
  /** 展示名："皮皮(异色)" / "迪莫" */
  displayName: z.string().min(1),
  /** 形态信息（基础/异色/地区形态/进化） */
  form: FormSchema,
  /** 别名（搜索用） */
  aliases: z.array(z.string()).default([]),
  /** 属性 */
  types: z.array(PetTypeSchema).default([]),
  /** 立绘相对路径（/pets/xxx.png）或 null */
  imagePath: z.string().nullable(),
  /** 灵蛋所托管的 webp 立绘文件名（如 "JL_dimo.webp"），仅元数据交叉用 */
  luodanImage: z.string().nullable().default(null),
  /** 尺寸区间（m）— 蛋孵化时的范围 */
  size: SizeRangeSchema,
  /** 重量区间（kg）— 蛋孵化时的范围 */
  weight: WeightRangeSchema,
  /** 蛋组（若未知则 null） */
  eggGroup: z.string().nullable().default(null),
  /** 灵蛋所 eggGroup 编号集合（待映射成中文名） */
  eggGroupIds: z.array(z.number().int()).default([]),
  /** 灵蛋所内部 ID（来自 worker.js extract） */
  luodanId: z.number().int().positive().nullable().default(null),
  /** 拼音（用作 URL slug 与搜索关键词） */
  pinyin: z.string().nullable().default(null),
  /** 分类（如「猫咪类精灵」「自然类精灵」） */
  category: z.string().nullable().default(null),
  /** 孵化时间（秒），未知则 null */
  hatchSeconds: z.number().int().positive().nullable().default(null),
  /** 角色定位（输出/坦克/辅助/...），未知则 null */
  role: z.string().nullable().default(null),
  /** 是否同乘精灵 */
  isMount: z.boolean().default(false),
  /** 是否异色 */
  isShiny: z.boolean().default(false),
  /** 数据来源列表（多源） */
  sources: z.array(SourceSchema).min(1),
  /** 数据质量综合评级 */
  dataQuality: DataQualitySchema,
  /** ISO 时间戳 */
  updatedAt: z.string().datetime(),
});
export type Pet = z.infer<typeof PetSchema>;

export const PetsFileSchema = z.array(PetSchema);
export type PetsFile = z.infer<typeof PetsFileSchema>;

export const PetsMetaSchema = z.object({
  version: z.string(),
  generatedAt: z.string().datetime(),
  totalCount: z.number().int().nonnegative(),
  sources: z.record(
    z.string(),
    z.object({
      lastFetchedAt: z.string().datetime().optional(),
      lastHash: z.string().optional(),
      stale: z.boolean().default(false),
    }),
  ),
  qualityBreakdown: z.object({
    verified: z.number().int().nonnegative(),
    "single-source": z.number().int().nonnegative(),
    "user-reported": z.number().int().nonnegative(),
    inferred: z.number().int().nonnegative(),
  }),
});
export type PetsMeta = z.infer<typeof PetsMetaSchema>;
