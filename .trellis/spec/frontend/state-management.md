# State Management

> What state lives where in `rocom-egg-oracle`.

---

## Storage hierarchy

| State | Source | Component |
|---|---|---|
| Pet database (read-only) | `data/pets.json` via Server Component | passed as `pets` prop to `<PredictorShell>` |
| Pet metadata (versions, quality) | `data/pets.meta.json` via Server Component | shown in `<DataFreshness>` |
| Egg size + weight inputs | React `useState` | `PredictorShell` |
| Prediction result | `useMemo(predictEgg(...))` | derived, no separate state |
| URL params | `next/navigation` `useSearchParams` + `useRouter.replace` | hydrated into local state at mount |
| Theme | `next-themes` (cookie/localStorage) | `ThemeProvider` at root |
| Toast feedback | `sonner` `toast.success / .error` | imperative API |

There is intentionally no global state store (no Zustand, no Redux). All shareable state is encoded in the URL or in `data/`.

## URL ↔ state contract

The URL is the single source of shareable state for the predictor:

```
/?size=0.28&weight=2.36&top=10
```

- Parsing: `parseParams()` in `lib/url/params.ts` clamps and validates.
- Writing: `serializeParams()` round-trips with the same module — see `test/unit/url/params.test.ts`.
- Writes are debounced 200ms in `PredictorShell` to avoid router storms during slider drags.
- Default `topN` is omitted from the URL to keep it clean (DEFAULT_TOP_N = 10).
- Out-of-range values are silently clamped, not rejected, so an old shared URL never throws.

## Server state

There is no server state in the conventional sense — `pets.json` is generated at build time and shipped with the bundle. The data pipeline (`npm run data:update`) is a build-time concern, not a runtime API.

The `/api/pet-image` route serves redirects to `/pets/luodan/JL_*.webp` using `lib/data/pets`. It's the only runtime data access, and even that is read-only.

## Forbidden patterns

- ❌ Lifting `sizeM` / `weightKg` higher than `PredictorShell` — that boundary is the client component.
- ❌ Persisting predictor state in `localStorage` — share via URL instead.
- ❌ Adding a global store before there are 3+ unrelated state owners.
- ❌ Synchronizing the same value to URL **and** localStorage — pick one (URL wins).
