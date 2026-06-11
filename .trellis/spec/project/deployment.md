# Deployment

> How `rocom-egg-oracle` ships.

---

## Production target

- **Docker container** `rocom-egg-predictor` (built from project root `Dockerfile`).
- Container port `3000` → host port `3010` (configured in `docker-compose.yml`).
- Reverse-proxied through Nginx on `rocom.eu.cc` (Cloudflare in front).
- Host: a single Linux server (Ubuntu) shared with other small services.

## Build constraints

- `next.config.ts` sets `output: "standalone"` for a slim Docker image.
- `next/image` uses `unoptimized` because the standalone bundle does NOT include `sharp`.
- Container memory cap: `NODE_OPTIONS=--max-old-space-size=256` (modest single-tenant server).
- Sprite assets (`public/pets/luodan/*.webp`, ~25 MB) are baked into the image — no CDN yet.

## Local dev → production parity

| Command | Purpose | Production parity |
|---|---|---|
| `npm run dev` | Turbopack dev server on `:3000` | high (same Next 16) |
| `npm run build && npm start` | Standalone production build | identical to Docker except sprite caching |
| `docker compose up -d --build` | Full container recreate | matches production |
| `curl http://127.0.0.1:3010/api/health` | smoke test | should return `{"ok":true,...}` |

Always smoke-test `docker compose` locally before letting CI deploy on push.

## Release flow

1. Work on a feature branch from `main` (`refactor/foo`, `feat/foo`, `chore/foo`).
2. Open a PR; CI runs `npm run ci`.
3. Squash-or-rebase merge to `main`. CI redeploys automatically on push (when configured).
4. Tag releases manually with `vMAJOR.MINOR.PATCH` after notable shipments. There is no automated semver bump.

## Hot-reload limitations

- The data pipeline runs at build time. Updating `pets.json` requires either a new container image or a server-side `npm run data:update && npm run build && systemctl restart` for the systemd setup.
- The CI cron at `37 2 * * *` UTC auto-runs `data:update` and pushes diffs to `main`, which then triggers a rebuild.

## Rolling back

- `docker compose ps` shows the running image SHA.
- `docker image ls rocom-egg-predictor` lists prior tagged images.
- To roll back, `docker compose up -d --no-build` with the old image label, or revert the commit and let CI rebuild.

## Forbidden patterns

- ❌ Direct `docker exec ... vim` edits inside the running container.
- ❌ Long-running data updates inside the container (use the build-time pipeline).
- ❌ Mounting the dev workspace as `volumes:` against the production container.
- ❌ Hard-coding the public domain in code (use Next.js `metadataBase` env override if needed).
