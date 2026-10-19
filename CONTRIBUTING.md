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
npm ci
npm run env:init
npm run setup
npm run pr
# or step by step:
npm run verify
npm run d:reset
npm run d:smoke
```

`npm run pr` runs `verify`, then `smoke` when the API container is already up; otherwise it prints the next commands.

Compose lifecycle shortcuts (same idea as the API `d:*` scripts): `d:up`, `d:down`, `d:reset`, `d:up:obs`, `d:logs` (filter: `npm run d:logs -- api`), `d:status`, `d:pull`, `d:update`, `d:urls`, `d:open`. They create `.env` from `.env.example` when missing. `npm run doctor` prints a `next:` line after its checks. Script sources live under `scripts/{compose,dx,gates,pins,lib}` (see [scripts/README.md](scripts/README.md)).

Then open the storefront and the admin dashboard (`npm run d:urls` / `d:open`, or URLs in the README) and confirm they show data from the API.

CI on every PR runs parallel jobs under one required check (`CI Status Check`):

- **Lint** - ASCII, yamllint, actionlint
- **Pin Sync** - `check:pins`
- **Compose Checks** - compose guardrails and `docker compose config`
- **Script Tests** - `test:scripts`
- **Smoke Test** - `docker compose up -d --wait`, HTTP probes, one-shot exit codes
- **CI Status Check** - aggregator (the only ruleset-required context)

### Version bumps

When you change an app pin, edit the source of truth and sync:

```bash
npm run bump -- api 0.12.0
# or: edit versions.json && npm run sync-pins
npm run check:pins
```

That updates `.env.example`, the README matrix, and the CHANGELOG pin sentence together. See [docs/DESIGN.md](docs/DESIGN.md).

### Hosted demo reset secrets

The optional [demo-reset](.github/workflows/demo-reset.yml) workflow calls the public API. Maintainers set repository Actions secrets `DEMO_API_BASE_URL` and `DEMO_RESET_TOKEN` (same token as on the VM). Forks without those secrets skip the job. See [docs/HOSTED-DEMO.md](docs/HOSTED-DEMO.md).

### Rules

- Keep every value in `.env.example` documented and safe for a local demo. Hosted placeholders stay non-secret (`https://api.example.com`, empty `DEMO_RESET_TOKEN`). Never commit real credentials or tunnel tokens.
- A required variable must fail loudly (`${VAR:?message}`), not fall back to a hidden default.
- Pin images by version. ASCII only in docs and config.
- Admin and storefront stay pull-only from GHCR (no `build:` / `dockerfile_inline` on those services).
- The hosted API-tier overlay must not publish Postgres or Redis on the host public interface.

### Maintainer merge

The `develop`/`master` ruleset requires an approving review from someone other than the last pusher, plus Code Owners. As a solo maintainer, add yourself as a bypass actor on that ruleset (pull request bypass) or use a second GitHub account for the approving review. Dependabot PRs target `master` on purpose so production stays patched even when `develop` is mid-feature; after merging Dependabot to `master`, fast-forward or merge `master` into `develop`.

## Issues and security

- Bugs in the compose setup: open an issue with the output of `docker compose ps -a`.
- Security: follow [SECURITY.md](SECURITY.md). Do not file a public issue with exploit detail.
