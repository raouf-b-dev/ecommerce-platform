# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `.nvmrc` (Node 26, Active LTS) as the single source of truth for the Node major, plus `.npmrc` with `engine-strict=true`.
- Weekly `.github/workflows/node-lts-watch.yml` (`scripts/gates/node-lts-watch.mjs`): fails on an end-of-life `.nvmrc` major in any of the four repos and opens or updates one `node-lts` issue for Maintenance LTS, end of life within 90 days, or drift. Policy in `docs/README.md`.
- npm 12.2.1 pinned in `package.json` `devEngines.packageManager` (`onFail: error`); `setup-platform` installs it after `actions/setup-node`; `npm run check:pins` fails if a workflow or doc hard-codes a different npm version.
- Hosted `DEMO_READ_ONLY` and `DEMO_*` seed account env pass-through in `.env.example` and `overrides/compose.hosted-api.yaml`; HOSTED-DEMO / SECURITY / README split local writable credentials from hosted viewer-only public admin (storefront: register; private Super Admin via API `ADMIN_EMAIL` / `ADMIN_PASSWORD`, off the README).

### Changed

- Node 24 -> Node 26: `setup-platform` and `demo-reset.yml` use `node-version-file: .nvmrc` (with `cache: npm`); `engines` is `node >=26.0.0`, `npm >=11.6.0`; `npm run check:pins` also checks `.nvmrc` against `engines.node`.
- `setup-platform` and `demo-reset.yml` drop `cache: npm`, and all three `setup-node` steps (including `node-lts-watch.yml`) set `package-manager-cache: false`: setup-node otherwise auto-enables the npm cache from `devEngines.packageManager` and queries it with the bundled npm 11, which devEngines rejects.

## [0.2.0] - 2026-10-19

Hybrid hosted-demo support, demo-reset Action, and CI hardening. Pins ecommerce-store-api 0.12.0, ecommerce-admin-dashboard 0.7.0 and ecommerce-store-web 0.6.0.

### Added

- `docs/HOSTED-DEMO.md` operator guide for the hybrid hosted demo: API + Postgres + Redis Stack on a VM behind Cloudflare Tunnel; admin on Cloudflare Pages; storefront on Vercel.
- `overrides/compose.hosted-api.yaml` API-tier overlay (no admin/web on the VM; Postgres/Redis compose-internal).
- API host publish bound to `127.0.0.1` in `compose.yaml` (local + Tunnel-friendly; not `0.0.0.0`).
- `.github/workflows/demo-reset.yml` scheduled / manual reset via `scripts/gates/demo-reset.mjs`; job skipped (no runner) while variable `DEMO_API_BASE_URL` is `disabled` or not an https origin; script no-ops without `DEMO_RESET_TOKEN`.
- `.github/actionlint.yaml` listing known repository Variables for actionlint.
- CI `dependency-review` on pull requests (same idea as ecommerce-store-api; wired into `CI Status Check`).
- `.secrets.example` plus `npm run env:init:secrets` to stage gitignored `.secrets` (generates `DEMO_RESET_TOKEN`) before uploading to GitHub.
- README Live demo placeholders and hosted env placeholders in `.env.example` (`PUBLIC_BASE_URL`, `CORS_ALLOWED_ORIGINS`, `AUTH_COOKIE_SAMESITE`, `DEMO_RESET_*`).

### Changed

- `SECURITY.md` distinguishes local Compose (public demo passwords; do not expose laptop ports) from hosted (private infrastructure secrets; tunnel to API only).
- Pin ecommerce-store-api to 0.12.0 (hosted reset + SameSite cookie support).
- Platform version `0.2.0`.

### Upgrade notes

- Refresh pins: copy new `.env.example` keys if needed, then `npm run d:update` (or `docker compose pull` and `up -d --wait`).
- Local full Compose is unchanged for contributors. Optional hosted API-tier: [docs/HOSTED-DEMO.md](docs/HOSTED-DEMO.md).
- Keep GitHub Actions variable `DEMO_API_BASE_URL=disabled` until the hosted API is live; then set it to the https origin and add secret `DEMO_RESET_TOKEN` (stage with `npm run env:init:secrets`).

## [0.1.0] - 2026-10-18

First tagged compose platform release. Pins ecommerce-store-api 0.11.3, ecommerce-admin-dashboard 0.7.0 and ecommerce-store-web 0.6.0.

### Added

- `compose.yaml` that starts Postgres, Redis Stack, the API, the admin dashboard and the storefront with `docker compose up -d --wait`, ordered by health checks.
- One-shot services: `jwt-keygen` (demo signing key in a volume), `migrate` (API migrations) and `seed` (demo catalog, users and orders, idempotent).
- `observability` profile with Prometheus and Grafana, provisioned with the API dashboards for the pinned API version.
- `.env.example` with every variable documented and versions pinned. Missing variables stop Compose with an error.
- Admin, storefront, and seed prefer GHCR pulls; seed falls back to building the API Dockerfile `seed` stage from the pinned tag when the seed image is missing.
- Lightweight npm gates: `setup`, `env:init` / `env:init:force`, `verify`, `check:agent`, `smoke`, `doctor`, `pr`, `check:pins`, `check:compose`, `check:resolved` (Makefile mirrors).
- Compose shortcuts: `npm run d:up`, `d:down`, `d:reset`, `d:up:obs`, `d:logs` (service filter via `npm run d:logs -- api`), `d:status`, `d:update`, `d:urls`, `d:open`, and related (via `scripts/compose/compose-cmd.mjs`).
- `versions.json` as the pin source of truth with `sync-pins` / `bump`.
- CI workflow with parallel jobs (Lint, Pin Sync, Compose Checks, Script Tests, Smoke Test) under a required `CI Status Check` aggregator; optional observability smoke on `workflow_dispatch`; shared `setup-platform` action.
- `Makefile` shortcuts (`setup`, `up`, `down`, `reset`, `logs`, `update`, `status`, `urls`, `open`, `verify`, `doctor`, `smoke`, `pr`, `bump`, `sync-pins`) with the same commands documented for PowerShell.
- Dependabot for GitHub Actions, infrastructure images in `compose.yaml`, and npm (PRs target `master`).
- `docs/DESIGN.md`, `config/observability/`, and `overrides/` for first-comer and contributor DX.
- Scripts laid out by job: `scripts/{compose,dx,gates,pins,lib}` (see `scripts/README.md`).

### Changed

- Default `API_NODE_ENV` is `staging` so mock checkout works on API 0.11.x.
- Storefront uses `API_INTERNAL_BASE_URL=http://api:3000`; removed the `web-network` socat sidecar.
- CI Validate monolith split into parallel jobs; branch ruleset requires only `CI Status Check`.
