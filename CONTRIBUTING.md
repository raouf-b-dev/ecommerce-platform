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
docker compose config --quiet
docker compose --profile '*' down -v
docker compose up -d --wait
```

Then open the storefront and the admin dashboard (URLs in the README) and confirm they show data from the API. CI runs the same checks plus YAML, workflow, ASCII and link linting.

### Rules

- Keep every value in `.env.example` documented and safe for a local demo. Never commit real credentials.
- A required variable must fail loudly (`${VAR:?message}`), not fall back to a hidden default.
- Pin images by version. Bumping an app version means updating `.env.example`, the README version matrix and `CHANGELOG.md` together.
- ASCII only in docs and config.

## Issues and security

- Bugs in the compose setup: open an issue with the output of `docker compose ps -a`.
- Security: follow [SECURITY.md](SECURITY.md). Do not file a public issue with exploit detail.
