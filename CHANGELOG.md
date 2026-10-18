# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Tracks the path to 0.1.0. Pins ecommerce-store-api 0.11.1, ecommerce-admin-dashboard 0.7.0 and ecommerce-store-web 0.6.0.

### Added

- `compose.yaml` that starts Postgres, Redis Stack, the API, the admin dashboard and the storefront with `docker compose up -d --wait`, ordered by health checks.
- One-shot services: `jwt-keygen` (demo signing key in a volume), `migrate` (API migrations) and `seed` (demo catalog, users and orders, idempotent).
- `observability` profile with Prometheus and Grafana, provisioned with the API dashboards for the pinned API version.
- `.env.example` with every variable documented and versions pinned. Missing variables stop Compose with an error.
- Admin, storefront, and seed prefer GHCR pulls; seed falls back to building the API Dockerfile `seed` stage from the pinned tag when the seed image is missing.
- Lightweight npm gates: `setup`, `env:init` / `env:init:force`, `verify`, `check:agent`, `smoke`, `doctor`, `pr`, `check:pins`, `check:compose`, `check:resolved` (Makefile mirrors).
- Compose shortcuts: `npm run d:up`, `d:down`, `d:reset`, `d:up:obs`, `d:logs` (service filter via `npm run d:logs -- api`), `d:status`, `d:update`, `d:urls`, `d:open`, and related (via `scripts/compose/compose-cmd.mjs`).
- `versions.json` as the pin source of truth with `sync-pins` / `bump`.
- CI workflow with required jobs Validate, Smoke Test, and CI Status Check; optional observability smoke on `workflow_dispatch`; shared `setup-platform` action.
- `Makefile` shortcuts (`setup`, `up`, `down`, `reset`, `logs`, `update`, `status`, `urls`, `open`, `verify`, `doctor`, `smoke`, `pr`, `bump`, `sync-pins`) with the same commands documented for PowerShell.
- Dependabot for GitHub Actions, infrastructure images in `compose.yaml`, and npm (PRs target `master`).
- `docs/DESIGN.md`, `config/observability/`, and `overrides/` for first-comer and contributor DX.
- Scripts laid out by job: `scripts/{compose,dx,gates,pins,lib}` (see `scripts/README.md`).

### Changed

- Default `API_NODE_ENV` is `staging` so mock checkout works on API 0.11.x.
- Storefront uses `API_INTERNAL_BASE_URL=http://api:3000`; removed the `web-network` socat sidecar.
