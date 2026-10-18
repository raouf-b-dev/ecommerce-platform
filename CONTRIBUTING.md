# Contributing

This repository only wires published releases of the three ecommerce apps together with Docker Compose. It holds no application source. Changes to the API, the admin dashboard or the storefront belong in their own repositories:

| Repository | Role |
| :--------- | :--- |
| [ecommerce-store-api](https://github.com/raouf-b-dev/ecommerce-store-api) | Backend API |
| [ecommerce-admin-dashboard](https://github.com/raouf-b-dev/ecommerce-admin-dashboard) | Operator dashboard |
| [ecommerce-store-web](https://github.com/raouf-b-dev/ecommerce-store-web) | Customer storefront |

## How we accept changes

1. Fork this repository.
2. Create a branch from `develop` (`feature/...`, `fix/...`, or `docs/...`).
3. Open a pull request into `develop`. `master` only receives release merges from `develop`.
4. Commits must be signed. Unsigned commits are rejected by the repository rulesets.

## Before you open a PR

```bash
cp .env.example .env
npm ci
npm run verify
npm run d:reset
npm run d:smoke
```

Compose lifecycle shortcuts (same idea as the API `d:*` scripts): `d:up`, `d:down`, `d:reset`, `d:up:obs`, `d:logs`, `d:status`, `d:pull`, `d:update`. They create `.env` from `.env.example` when missing.

Then open the storefront and the admin dashboard (URLs in the README) and confirm they show data from the API.

CI on every PR runs three required checks (exact names for the branch ruleset):

- **Validate** - ASCII, yamllint, actionlint, pin sync, compose guardrails, `docker compose config`
- **Smoke Test** - `docker compose up -d --wait`, HTTP probes, one-shot exit codes
- **CI Status Check** - aggregator over Validate and Smoke Test

### Version bumps

When you change an app pin, edit the source of truth and sync:

```bash
npm run bump -- api 0.12.0
# or: edit versions.json && npm run sync-pins
npm run check:pins
```

That updates `.env.example`, the README matrix, and the CHANGELOG pin sentence together. See [docs/DESIGN.md](docs/DESIGN.md).

### Rules

- Keep every value in `.env.example` documented and safe for a local demo. Never commit real credentials.
- A required variable must fail loudly (`${VAR:?message}`), not fall back to a hidden default.
- Pin images by version. ASCII only in docs and config.
- Admin and storefront stay pull-only from GHCR (no `build:` / `dockerfile_inline` on those services).

### Maintainer merge

The `develop`/`master` ruleset requires an approving review from someone other than the last pusher, plus Code Owners. As a solo maintainer, add yourself as a bypass actor on that ruleset (pull request bypass) or use a second GitHub account for the approving review. Dependabot PRs target `master` on purpose so production stays patched even when `develop` is mid-feature; after merging Dependabot to `master`, fast-forward or merge `master` into `develop`.

## Issues and security

- Bugs in the compose setup: open an issue with the output of `docker compose ps -a`.
- Security: follow [SECURITY.md](SECURITY.md). Do not file a public issue with exploit detail.
