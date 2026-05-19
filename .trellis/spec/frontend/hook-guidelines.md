# Hook Guidelines

> Hook usage in `rocom-egg-oracle`.

---

## Project posture

This project deliberately avoids custom hooks for now — all state is local to a small number of client containers (`PredictorShell` is the primary one). Most "data" comes from the Server Component prop drilling pattern, not from client-side fetching.

## Allowed hook patterns

- `useState` for local form state (size, weight inputs)
- `useEffect` for URL ↔ state sync **with debounce** (200ms in `PredictorShell`)
- `useMemo` for memoizing `predictEgg()` results and for parsing URL params
- `useRouter`/`useSearchParams` from `next/navigation` for URL writes/reads
- `useTheme` from `next-themes` (client component only)
- `React.useId` to namespace `<svg>` gradient IDs (see `components/decor/EggIcon.tsx`)

## When to introduce a custom hook

Extract a `use...` hook only when:

1. The exact same `useState`+`useEffect` cluster is duplicated in 2+ components, AND
2. The shared logic includes a non-trivial event subscription / cleanup, OR returns a stable derived object

Otherwise, prefer in-line `useState`/`useMemo`. Premature hook abstraction has hurt readability in the past.

## Naming

- `use<Subject><Verb>` form: `useUrlSync`, `usePetFilter`.
- Co-locate in the file that uses them; promote to `lib/hooks/` only when reused.

## Forbidden patterns

- ❌ `useEffect` for URL writes without a debounce (causes router-replace storms during slider drags).
- ❌ Calling hooks from `components/ui/` primitives (keep primitives stateless wrappers around Radix).
- ❌ Client-side data fetching to the same machine (we ship static `data/pets.json` and Server Components).
- ❌ Storing derived data in `useState` — prefer `useMemo`.
