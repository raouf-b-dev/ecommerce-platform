# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

First release, planned as 0.1.0. Runs ecommerce-store-api 0.10.0, ecommerce-admin-dashboard 0.6.0 and ecommerce-store-web 0.5.0.

### Added

- `compose.yaml` that starts Postgres, Redis Stack, the API, the admin dashboard and the storefront with `docker compose up -d --wait`, ordered by health checks.
- One-shot services: `jwt-keygen` (demo signing key in a volume), `migrate` (API migrations) and `seed` (demo catalog, users and orders, idempotent).
- `observability` profile with Prometheus and Grafana, provisioned with the API dashboards for the pinned API version.
- `.env.example` with every variable documented and versions pinned. Missing variables stop Compose with an error.
- Interim builds from the tagged source for the admin dashboard and the storefront, used only while their images are not published, and for the API seed, which the API image does not ship.
- `Makefile` shortcuts (`up`, `down`, `reset`, `logs`, `update`, `status`) with the same commands documented for PowerShell.
- CI: compose validation, yamllint, actionlint, ASCII check, Markdown link check, and a smoke test that starts the stack and checks the API, storefront and admin.
- Dependabot for GitHub Actions and the infrastructure images in `compose.yaml`.
