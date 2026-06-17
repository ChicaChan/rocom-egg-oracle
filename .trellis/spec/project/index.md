# Project Specs

> Project-specific guidelines layered on top of `frontend/` and `guides/`.

| File | Use |
|---|---|
| [data-pipeline.md](./data-pipeline.md) | Sources, pipeline stages, inference math, validation gates |
| [algorithm.md](./algorithm.md) | Hard filter + normalized distance + confidence labels + tie-breakers |
| [commit-conventions.md](./commit-conventions.md) | Conventional commit `type` / `scope` allow-list |
| [deployment.md](./deployment.md) | Docker container, port mapping, release & rollback flow |

These are read by sub-agents alongside `frontend/*.md` whenever a task touches data, algorithm, build, or release work.

When unsure where to put a new rule:

- Frontend code conventions → `frontend/*.md`
- Cross-cutting thinking / debugging heuristics → `guides/*.md` (trellis-prefilled)
- Project-specific decisions (data sources, algorithm contract, deployment) → this directory
