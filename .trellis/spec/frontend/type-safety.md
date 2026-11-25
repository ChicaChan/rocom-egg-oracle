# Type Safety

> TypeScript + zod conventions for `rocom-egg-oracle`.

---

## TypeScript baseline

- `strict: true`, `noEmit: true` — `npm run lint` (`tsc --noEmit`) must pass before any commit.
- `target: ES2022`, `module: ESNext`, `moduleResolution: Bundler`.
- Path alias: `@/*` → `./` (configured in `tsconfig.json`).

## Single source of truth: zod schemas

All `Pet` and related shapes are defined ONCE in `lib/data/schema.ts` and inferred via `z.infer`:

```ts
export const PetSchema = z.object({ ... });
export type Pet = z.infer<typeof PetSchema>;
```

- Components / route handlers / scripts all import the inferred type from `lib/data/schema`, never re-declare.
- Schema parses run at the seam between **trusted disk** and **typed runtime** (loaders, scripts).

Example sites:

- Loader: `lib/data/pets.ts` calls `PetsFileSchema.parse(petsRaw)` once and memoizes.
- Pipeline: `scripts/data/build-pets.ts` does the final `PetsFileSchema.parse` before writing.
- Validator: `scripts/data/validate.ts` keeps the safety net in `npm run ci`.

## Type-only imports

- Use `import type { Pet } from "@/lib/data/schema"` when only the type is needed (Next.js treeshakes client code more aggressively this way).
- Mixed imports are fine when you need both the value and a derived type.

## Discriminated unions

Use string-tagged unions when behaviour branches on a state:

```ts
type Confidence = { level: "exact" | "high" | "medium" | "low" | "edge"; ... }
type DataQuality = "verified" | "single-source" | "user-reported" | "inferred";
```

Keep the `level` / `dataQuality` strings stable — UI maps them to badge variants.

## Forbidden patterns

- ❌ `any` — replace with `unknown` + a narrowing guard.
- ❌ `as Foo` casts on data crossing schema boundaries (use `safeParse` instead).
- ❌ Re-declaring `Pet`, `PredictionResult`, etc. in component files.
- ❌ Loose `string` where a literal union is appropriate (`form.kind`, `dataQuality`, `Confidence.level`).
- ❌ Setting `imagePath: string` — it must be `string | null` per schema.
