# Data Pipeline

> How pet data is sourced, transformed, and validated.

---

## Sources (in priority order)

1. **灵蛋所 `/egg-size/{18-009,20-278,25-195,27-155,28-236}`** — 5 prerendered detail pages, each Top-10 candidate table containing real hatch-stage size/weight ranges. After dedup: **31 verified pets**.
2. **灵蛋所 worker.js chunk** — 358 pet metadata records (pinyin, category, eggGroups, image webp filename, shiny). The bundled height/weight is **adult-stage**, NOT hatch-stage, and is only used to estimate ranges for pets not covered by source #1.
3. **Local sprite cache** — `/assets/webp/friends/JL_*.webp` downloaded to `public/pets/luodan/` (390 files, ~25 MB).

What we DO NOT use:

- ❌ BWIKI's `/rocom/精灵图鉴` adult body measurements (the previous data source). They are adult-stage and were semantically incompatible with the in-game egg panel.
- ❌ `/api/pet-recommendations` — that endpoint is keyed on `q/style/role` (a search box), not on size/weight; results are constant Top 36 regardless of input.

## Pipeline stages (`scripts/data/*`)

```
extract-luodan       (worker.js → 358 metadata records)
        ↓
fetch-luodan-details (5 detail pages → 31 verified hatch ranges)
        ↓
build-pets           (verified + inferred ratio-based estimate → pets.json)
        ↓
validate             (zod + IQR×3 outliers + id uniqueness + reports)
```

`npm run data:update` runs all four. Each step has its own subcommand (`data:fetch`, `data:enrich`, `data:validate`).

## Inference rules

For pets in worker.js but not in detail pages, infer the hatch-stage range from adult measurements:

| Field | Coefficient | σ (n=20) |
|---|---|---|
| `size.minM`  | adult.minH (cm/100) × **0.427** | 0.007 |
| `size.maxM`  | adult.maxH (cm/100) × **0.415** | 0.004 |
| `weight.minKg` | adult.minW (g/1000) × **0.353** | 0.011 |
| `weight.maxKg` | adult.maxW (g/1000) × **0.400** | 0.056 |

These match the community's "egg ≈ adult / 2.5" rule. Inferred records carry `dataQuality: "inferred"`; verified records carry `dataQuality: "verified"`.

Sanity guards for inference (skip the record if any apply):

- `min ≤ 0` or `max ≤ 0`
- `min > max`
- `weight.max / weight.min > 100` (the worker.js bundle has some bad records like 焰火 21–30700 g)

## Schema invariants

- Defined in `lib/data/schema.ts`. **No re-declaration** of the Pet shape elsewhere.
- `id` is unique. For verified pets it derives from `pinyin + form + isMount`; for inferred from `pinyin + shiny`.
- `imagePath`: `string | null`. When the local webp is missing, the UI falls back to `EggIcon`.
- `sources[]` always non-empty; the `confidence` field on each source is the cross-source provenance signal.
- `dataQuality` is a four-level union; the UI maps it to `✓ 已验证` / `~ 估算` badges.

## Validation gates

`npm run data:validate` (also runs inside `npm run ci`) checks:

- zod `PetsFileSchema.parse(...)` passes for every record
- no duplicate `id`
- IQR×3 outlier scan on `R = weight_mid / size_mid` — outliers go to `scripts/reports/validate-report.md` but do not fail (some heavy pets like 圣剑骑士 are legitimately R>200)
- writes `data/pets.meta.json` with `generatedAt`, `qualityBreakdown`, source coverage

## CI auto-sync

`.github/workflows/ci.yml` cron at `37 2 * * *` runs `data:update` and pushes any diff. Manual local updates should follow the same script — do not hand-edit `pets.json`.

## Player corrections

Future inbound data corrections (via `.github/ISSUE_TEMPLATE/data-correction.md`) should always replace `dataQuality: "inferred"` rows first, never overwrite a `verified` row without an attached game screenshot.

## Forbidden patterns

- ❌ Editing `data/pets.json` by hand.
- ❌ Re-introducing BWIKI's HTML scraper without a written justification — the previous one mixed adult and hatch semantics.
- ❌ Bypassing zod parse on the build/loader side ("fast path").
- ❌ Promoting inferred rows to verified without updating `sources[]` and providing the supporting source URL.
