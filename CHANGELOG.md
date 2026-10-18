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
- Admin and storefront are pulled from GHCR; only the API seed job still builds from the pinned API git tag.
- `Makefile` shortcuts (`up`, `down`, `reset`, `logs`, `update`, `status`) with the same commands documented for PowerShell.
- CI workflows documented as planned; not shipped in this repository yet.
- Dependabot for GitHub Actions and the infrastructure images in `compose.yaml`.

### Changed

- Default `API_NODE_ENV` is `staging` so mock checkout works on API 0.11.x.
