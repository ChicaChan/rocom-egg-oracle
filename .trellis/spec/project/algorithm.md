# Algorithm

> Prediction algorithm contract — keep it stable; UI and tests depend on it.

---

## Two-stage prediction

### Stage 1 — hard filter (`lib/predict/filter.ts`)

A pet's hatch ranges must contain BOTH the input size and weight:

```
size.minM   ≤ input.sizeM   ≤ size.maxM
weight.minKg ≤ input.weightKg ≤ weight.maxKg
```

If either condition fails, the pet moves to the **nearby reference** channel (capped at 5 entries, shown in a collapsible panel; it does not influence the Top-N ranking).

### Stage 2 — normalized-center distance (`lib/predict/score.ts`)

For every hard-matched pet:

```
ds = |sizeM   - centerSize|   / halfRangeSize     ∈ [0, 1]
dw = |weightKg - centerWeight| / halfRangeWeight  ∈ [0, 1]
distance = √(0.5·ds² + 0.5·dw²)                   ∈ [0, ~1.41]
matchScore = (1 - distance) × 100                 ∈ [0, 100]
```

Smaller distance → higher rank. The `R = weight / size` value is kept only as a tooltip cue on the rank-1 card; it is NOT part of the comparator.

### Tie-breakers

When two candidates have equal `distance`:

1. `dataQuality`: `verified > single-source > user-reported > inferred`
2. `pet.name.localeCompare(other.name, "zh-Hans-CN")`

This guarantees verified pets float to the top of any matched cluster — important UX once inferred data joined the dataset.

## Confidence labels (`lib/predict/confidence.ts`)

Map `distance → { level, label, tone }` for UI:

| distance | level | label | tone |
|---|---|---|---|
| ≤ 0.05 | `exact`  | 极有可能 | success |
| ≤ 0.30 | `high`   | 很可能   | success |
| ≤ 0.60 | `medium` | 可能     | primary |
| ≤ 1.00 | `low`    | 边缘命中 | warning |
| > 1.00 | `edge`   | 越界参考 | muted   |

`edge` only appears in the nearby reference channel.

## Input validation (`validatePredictionInput`)

Rejects with a localized error message if:

- `sizeM` or `weightKg` is not finite, ≤ 0, NaN, or Infinity
- `sizeM > 10` or `weightKg > 5_000` (likely a unit mix-up)

## Comparison with 灵蛋所

灵蛋所 uses an internal probability model that weighs interval area and a prior; we use normalized-center distance because it's transparent, easy to test, and avoids inventing a probabilistic claim we can't justify.

**Empirically the Top-10 set matches** for shared queries; only the order differs (灵蛋所's #1 may be our #2). Document this in FAQ — never silently mimic 灵蛋所's exact ordering.

## API surface (`lib/predict/index.ts`)

`predictEgg(pets, { sizeM, weightKg, topN?, nearbyCount? })` returns:

```ts
{
  ok: boolean;
  errors: string[];
  input: { sizeM, weightKg, rValue };
  matches: Candidate[];       // length ≤ topN, after hard filter + ranking + confidence
  nearby: Candidate[];        // length ≤ nearbyCount, only when hard filter empty or for context
  stats: { totalRecords, filteredRecords, strictMatchCount };
}
```

Defaults: `topN = 10`, `nearbyCount = 5`. UI never overrides these unless the user explicitly changes `?top=` in the URL.

## Forbidden patterns

- ❌ Reintroducing the v1 `R = weight / size` ordering. R is dimensionless density, not a community-recognized comparator.
- ❌ Soft-matching outside the hard filter (e.g., gaussian tolerance). 灵蛋所 itself switched away from that — keep it strict.
- ❌ Throwing inside `predictEgg` on bad input. Always return `{ ok: false, errors }` for the UI to render.
- ❌ Touching the confidence thresholds without updating `test/unit/predict/confidence.test.ts`.

## Required tests

Any change to `lib/predict/*` must keep `test/unit/predict/*.test.ts` green and update / add cases. Coverage target ≥ 90% line.
