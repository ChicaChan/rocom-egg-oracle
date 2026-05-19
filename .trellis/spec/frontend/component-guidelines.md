# Component Guidelines

> Patterns enforced across `components/` in this project.

---

## Server vs Client

- Default to **Server Components**. Convert to client only when one of:
  - `useState` / `useEffect` / event handlers
  - DOM APIs (`navigator.clipboard`, `localStorage`)
  - Browser-only libraries (next-themes, sonner, Radix interactive primitives)
- Client components must start with `"use client";` as the first non-comment line.
- The page shell (`app/page.tsx`) stays a Server Component; data flows into client containers via props.

Example: `app/page.tsx` is a Server Component that calls `getPets()` then renders `<PredictorShell pets={...} totalCount={...} />` — `PredictorShell` is the client boundary.

## shadcn/ui primitives

- New primitives go under `components/ui/`, follow the [shadcn](https://ui.shadcn.com/) `new-york` style.
- Use `cva` for variants and `cn(...)` (from `lib/utils.ts`) to merge class names.
- Expose a `data-slot` attribute so authors can target sub-parts via CSS.
- Keep primitives generic; do NOT embed business knowledge (no pet logic in Button/Slider/Card).

Example: `components/ui/button.tsx` exposes `variant`/`size` cva variants and `asChild`.

## Business components (`components/predictor/`)

- Compose primitives + business types from `lib/predict`.
- Hero rank (1st) gets a distinct visual variant. `CandidateCard` shows this with `variant: "hero" | "medium" | "standard"` driven by rank.
- Footer of every candidate card MUST show a quality signal (`✓ 已验证` for `verified`, `~ 估算` for `inferred`). Never present inferred data as authoritative.

## Props conventions

- Object props with explicit `type Props = { ... }` instead of inline anonymous types.
- Optional UI hints (`className`, `size`, `variant`) default to sensible values.
- Do not pass full `Pet` objects into `components/ui/` primitives — keep that knowledge in `components/predictor/`.

## Motion safety

- All animations must be gated with Tailwind `motion-safe:` so users with `prefers-reduced-motion` see the static version.
- Transforms (`hover:-translate-y-0.5`) pair with `motion-reduce:transform-none`.
- Keep keyframes in `app/globals.css` under `@layer utilities` (see `float`, `glow-pulse`).

## Image policy

- All pet sprites live under `public/pets/luodan/` and are referenced through `Pet.imagePath`.
- Use `next/image` with `unoptimized` because the Docker standalone image does not bundle sharp.
- Fallback to `<EggIcon type={pet.types[0]} shiny={pet.isShiny} mount={pet.isMount} />` when `imagePath` is null.

## Forbidden patterns

- ❌ `import data from "@/data/pets.json"` inside `components/` — load via Server Component + props or `lib/data/pets`.
- ❌ Re-deriving `Pet` shape inside a component — import the type from `lib/data/schema`.
- ❌ Emoji-only fallbacks for missing artwork (use EggIcon) — keeps the visual language consistent.
- ❌ Bypassing `cn(...)` to concatenate Tailwind class strings manually.
- ❌ Using ARIA-decoration without `aria-hidden` (HeroDecor / EggIcon decorative usages).
