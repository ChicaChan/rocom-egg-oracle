# Directory Structure

> How code is organized in `rocom-egg-oracle` (Next.js 16 App Router).

---

## Top-level layout

```
rocom-egg-oracle/
├── app/                              Next.js App Router (routes only)
│   ├── layout.tsx                    ThemeProvider + Sonner Toaster
│   ├── page.tsx                      <50-line Server Component shell
│   ├── globals.css                   Tailwind v4 entry + design tokens
│   └── api/
│       ├── health/route.ts
│       └── pet-image/route.ts        Uses lib/data/pets loader
│
├── components/                       NO direct data/pets.json imports
│   ├── ui/                           shadcn/ui primitives (button/input/slider/card/badge/skeleton)
│   ├── layout/                       SiteHeader / ThemeProvider / ThemeToggle
│   ├── predictor/                    business components (PredictorShell, EggInputPanel, ...)
│   └── decor/                        HeroDecor, EggIcon (presentational only)
│
├── lib/                              pure-function business layer
│   ├── predict/                      hard filter + scoring + confidence
│   ├── data/                         server-only loader + zod schema
│   ├── url/                          URL ↔ state parsing
│   ├── format/                       number / pet display helpers
│   └── utils.ts                      shadcn cn() utility
│
├── data/
│   ├── pets.json                     main data, zod-validated
│   └── pets.meta.json                version / quality breakdown
│
├── scripts/data/                     data pipeline (tsx)
├── test/{unit,fixtures}/             vitest
├── public/pets/luodan/               local sprite cache (390 webp)
└── .github/, deploy/, Dockerfile     CI + deploy templates
```

## Composition rules

- `app/` only assembles routes; never holds business logic.
- `components/` does NOT `import "@/data/pets.json"` — data must come via props from Server Components or `lib/data/pets`.
- `lib/predict/` is pure-function, zero side-effects, easily unit-testable.
- `lib/data/pets.ts` carries `import "server-only"` to keep pets.json out of the client bundle.
- `scripts/data/` is build-time only (run via `tsx`), never bundled.

## Naming conventions

| Kind | Convention | Example |
|---|---|---|
| Server / Client components | PascalCase `.tsx` | `PredictorShell.tsx` |
| Pure libs | lowercase `.ts` | `filter.ts`, `params.ts` |
| Scripts | kebab-case `.ts` | `fetch-luodan-details.ts` |
| Spec files | kebab-case `.md` | `data-pipeline.md` |
| Data files | lowercase, `.json` | `pets.json`, `pets.meta.json` |

## Examples to mirror

- Server Component composing client pieces: `app/page.tsx`
- Pure-function business layer: `lib/predict/index.ts`
- shadcn primitive with cva variants: `components/ui/button.tsx`
- Compound business component: `components/predictor/CandidateCard.tsx`
