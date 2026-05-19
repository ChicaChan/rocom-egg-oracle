# Commit Conventions

> Conventional Commits, tuned for `rocom-egg-oracle`.

---

## Format

```
<type>(<scope>): <subject>

<body — what & why, plain prose>

<optional second paragraph — how, only when non-obvious>
```

- Subject ≤ 72 chars, lowercase, no trailing period.
- Bodies are wrapped to ~80 cols.
- Reference Issues / PRs by `#NNN` in the body, not the subject.

## Allowed `type`

| type | use |
|---|---|
| `feat` | New user-facing feature or capability |
| `fix` | Bug fix |
| `perf` | Performance improvement that doesn't change behavior |
| `refactor` | Code restructure without behavior change |
| `data` | Pure data updates (`pets.json`, sprite assets, reports) |
| `docs` | README, CONTRIBUTING, spec, FAQ copy |
| `test` | Test-only changes |
| `chore` | Scaffolding, dependencies, CI config |
| `ci` | GitHub Actions / build pipeline |
| `style` | Whitespace, formatting (rare in this repo) |

## Allowed `scope`

| scope | covers |
|---|---|
| `predict` | `lib/predict/*` (filter / score / confidence) |
| `data` | `data/*`, `lib/data/*`, `scripts/data/*` |
| `ui` | `components/*`, `app/*.tsx`, `app/globals.css` |
| `assets` | sprite downloads, SVG icons under `components/decor/` |
| `scaffold` | repo-wide tooling (Tailwind, shadcn install, tsconfig) |
| `deploy` | Dockerfile, docker-compose, deploy templates |
| `release` | tag-cutting, README rewrites for release |

Combine when a change spans two scopes: `feat(predict,data)`. Keep it to two — use `chore` if it's broader.

## Body content

- **First sentence**: what changed in plain English.
- **Why**: the constraint, bug, or motivation. Tie back to user-visible behavior or a spec invariant.
- Include a short verification block at the end (`Verification: lint / test / build green`) so reviewers can grep for it.

## Example skeletons

```
feat(predict,data): hatch-stage data + pure-function algorithm core

This unifies phase 2 ... and lands the data-semantics fix that drove
phase 1.5 ... Verification: data:update green, lint green, test green,
build green.
```

```
fix(ui): clamp slider max so heavy-pet sliders don't overflow

The shared <Slider> previously trusted Pet.weight.maxKg as-is; 圣剑骑士
(1100 kg) made the slider's track scale obnoxious. Now we clamp at
WEIGHT_MAX (50 kg) — users typing larger values still flow through
the numeric input. Verification: vitest 46/46, build green.
```

## Forbidden patterns

- ❌ `chore: 自动同步最新孵蛋数据` — that was the legacy CI message; new auto-sync uses `chore(data): auto-sync from luodan`.
- ❌ Commit messages without a body for non-trivial changes.
- ❌ Mixing `feat` and `data` updates in the same commit when they're separable. Split.
- ❌ Cite GitHub Actions / hooks bypassing in the body (it's a red flag in code review).

## Suggested workflow

The `/ccg:commit` skill produces compliant subjects by default. When writing by hand, the heredoc pattern keeps the body intact:

```bash
git commit -m "$(cat <<'EOF'
feat(predict): bump confidence thresholds

...
EOF
)"
```
