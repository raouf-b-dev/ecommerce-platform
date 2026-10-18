# Design notes

Why this repository looks the way it does. Short decisions, not a novel.

## What this repo is

Configuration only. Three apps ship as versioned GHCR images. Postgres and Redis are pinned infrastructure. The goal is Saleor-platform / Supabase-docker energy: clone, copy `.env`, `docker compose up -d --wait`, demo works.

## Decisions

### Pull published images; do not build admin or web here

Frontends belong in their own repos with their own CI. Building them in Compose hid publish gaps and made first start slow. Guardrails: `check-compose` (source) and `check-resolved` (interpolated config).

### Seed is a separate image (`ecommerce-store-api-seed`)

The API production image stays lean. The platform one-shot seed job needs `ts-node` and `scripts/seed.ts`. Publishing a `seed` Dockerfile stage keeps the happy path a pull. `pull_policy: missing` builds from the API git tag only when that tag is absent from the *local* engine (see comment on the seed service). Prefer `docker compose pull` first.

### Storefront SSR uses `API_INTERNAL_BASE_URL=http://api:3000`

Browsers still call `http://localhost:${API_PORT}`. SSR uses Compose DNS. That removes the old socat `web-network` sidecar.

### `versions.json` is the pin source of truth

`.env.example`, the README matrix, and the CHANGELOG pin sentence are generated/checked from it (`npm run sync-pins`, `npm run bump -- <app> <x.y.z>`, `npm run check:pins`). Bumping three files by hand is how demos drift.

### Dependabot targets `master`

Production stays patched even when `develop` is mid-feature. After a Dependabot merge, sync `master` into `develop`.

### No Husky in this repo

Commit signing is enforced by GitHub rulesets. Forcing `npm install` on first-comers who only need Docker would hurt DX.

### Agent checks vs human verify

Same contract as the API/admin/web repos: `npm run check:agent` in chat (quiet, scoped); `npm run verify` in your terminal before a PR. Smoke and `docker compose up` stay out of the agent transcript unless you ask.

### `d:*` npm scripts mirror the API habit

The API uses `d:up:dev` / `d:down:dev` across many env files. This repo has one `.env`, so the names are shorter (`d:up`, `d:reset`, `d:up:obs`). They go through `scripts/compose-cmd.mjs` so `.env` is ensured and Windows avoids fragile shell-only wrappers. Makefile targets stay for people who prefer `make`.

### Required CI job names

The branch ruleset expects exactly `Validate`, `Smoke Test`, and `CI Status Check`. Rename them only if you update the ruleset in the same change.

## Out of scope (on purpose)

- Hosting a public staging URL (documented as future in the README)
- Shipping a checkout GIF until the stack is stable on the pinned tags
- Publishing application code or OpenAPI from this repository
