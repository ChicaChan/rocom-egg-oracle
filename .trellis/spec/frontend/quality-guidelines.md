# Quality Guidelines

> What CI enforces and what authors should self-check.

---

## CI invariants (`npm run ci`)

`npm run ci` runs four steps and ALL must be green before a commit lands:

1. `npm run data:validate` — zod schema, IQR×3 outlier check, ID uniqueness, source coverage
2. `npm run lint` — `tsc --noEmit` with strict mode
3. `npm run test` — `vitest run` (46+ cases across predict/url/format)
4. `npm run build` — `next build` (Turbopack, standalone output)

If any one fails, fix the root cause — never bypass.

## Test layout

- Unit tests live under `test/unit/<area>/*.test.ts`
- Fixtures (small, hand-curated) live under `test/fixtures/`
- Algorithm coverage target: ≥ 90% line for `lib/predict/*`
- Schema tests parse fixtures through `PetsFileSchema.parse(...)` to catch schema drift

## Accessibility

- All interactive controls must have an `aria-label` or visible text label.
- Decorative SVG/emoji wrapped in `<div aria-hidden>` or `aria-hidden` on the element.
- `prefers-reduced-motion`: every keyframe-driven animation goes through `motion-safe:`; transforms also need `motion-reduce:transform-none`.
- Color contrast: don't rely on color alone (we use ✓/~ glyphs + text + variant badge for the verified/inferred signal).

## Performance budget

- Homepage HTML ≤ 80 KB (currently ~54 KB with hero decor + FAQ).
- Pet sprites ≤ 80 KB each (existing webp ~40-80 KB).
- Avoid pushing `pets.json` into the client bundle — keep `lib/data/pets.ts` server-only.
- `next/image` runs `unoptimized` in production because the standalone Docker image doesn't ship `sharp`.

## Linting / formatting

- TypeScript strict serves as the lint backbone (no ESLint config currently — `tsc` covers most of what matters).
- Tailwind: rely on `cn(...)` + cva for consistency; no manual class concatenation.
- Imports: top-of-file convention is `react/next` → `radix/lib` → `@/lib/...` → `@/components/...` → local. tsc doesn't enforce this; reviewers do.

## Forbidden patterns

- ❌ Skipping `npm run ci` "because the change is small".
- ❌ Adding new runtime dependencies without a body paragraph justifying.
- ❌ Disabling rules (`@ts-ignore`, `@ts-expect-error`) without a referenced ticket.
- ❌ Inline `style={{ ... }}` for anything that could be a Tailwind class.
- ❌ Failing tests left to "come back later".
