# Security Policy

This repository wires published images of the ecommerce apps. It contains no application domain code, so most vulnerabilities belong in one of the app repositories, each with its own policy:

| Component | Policy |
| :-------- | :----- |
| API | [ecommerce-store-api SECURITY.md](https://github.com/raouf-b-dev/ecommerce-store-api/blob/master/SECURITY.md) |
| Admin dashboard | [ecommerce-admin-dashboard SECURITY.md](https://github.com/raouf-b-dev/ecommerce-admin-dashboard/blob/master/SECURITY.md) |
| Storefront | [ecommerce-store-web SECURITY.md](https://github.com/raouf-b-dev/ecommerce-store-web/blob/master/SECURITY.md) |

Issues specific to this repository (for example a compose setting that publishes a service it should not, a workflow that leaks secrets, or a committed credential) are in scope here.

## Local Compose (laptop demo)

The default `docker compose up` path is a **local evaluation demo**, not a production deployment:

- `.env.example` holds demo passwords and a demo metrics key. They are public by design for a machine you control.
- The API runs with demo data, mock payments, and Swagger enabled.
- The JWT signing key is generated on first start and stored only in the `jwt_keys` Docker volume.
- **Do not expose laptop Compose ports to the internet**, and do not reuse these demo values on a host that is reachable from the public internet.

## Hosted hybrid demo

Operators may run an API-tier-only overlay on a VM with Cloudflare Tunnel, while admin and storefront run on Cloudflare Pages and Vercel. See [docs/HOSTED-DEMO.md](docs/HOSTED-DEMO.md).

For that path:

- Infrastructure secrets (`POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `METRICS_API_KEY`, `DEMO_RESET_TOKEN`, tunnel token, JWT volume) are **distinct, private, and high-entropy**. They live on the VM and in GitHub Actions / Cloudflare configuration. They are never committed. Stage reset values in gitignored `.secrets` via `npm run env:init:secrets` (template: `.secrets.example`). The public API origin is a GitHub Actions *variable*; only `DEMO_RESET_TOKEN` is a repository secret. Keep `DEMO_API_BASE_URL=disabled` until the hosted API is live (no job runner until it is an https origin; the script skips without a token).
- Only the API (and intentional API docs such as Swagger when enabled) should be reachable through the tunnel. Postgres and Redis stay on the Compose network and must not be published on `0.0.0.0`.
- Labeled **hosted** demo UI accounts in the README (`viewer@` / `customer@`) are public credentials for click-through demos. Set `DEMO_READ_ONLY=true` so writable local operators are not seeded; the viewer role has `view_*` only (no `manage_*`). Optional private Super Admin via API `ADMIN_EMAIL` / `ADMIN_PASSWORD` stays off the README. A scheduled reset restores public demo accounts and catalog baselines; it is not a substitute for production hardening.

## Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

1. **Email**: [rbdz@hotmail.fr](mailto:rbdz@hotmail.fr)
2. **Subject**: `[SECURITY] ecommerce-platform: Brief description`
3. **Include**: description, steps to reproduce, potential impact, suggested fix (if any)

You can also use GitHub **Private vulnerability reporting** on the affected repository.

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 5 business days
- **Fix or mitigation**: Dependent on severity
