# Hosted demo (hybrid)

Operator guide for a free-tier hybrid demo: the API tier runs on a small VM behind Cloudflare Tunnel; the admin dashboard and storefront are separate static/SSR hosts. Local full Compose (`docker compose up`) stays the contributor path and is unchanged.

Placeholder origins in this doc are examples only. Replace them with your real hosts after the first deploy. Never commit real tokens or passwords.

## Architecture

| Tier | Where it runs | What it is |
| :--- | :------------ | :--------- |
| Data + API | VM (Oracle Always Free Ampere or a small paid VPS) | Postgres, Redis Stack, jwt-keygen, migrate, seed, API |
| Edge | Cloudflare Tunnel (`cloudflared` on the VM) | Public `https://api.example.com` -> loopback API only |
| Admin UI | Cloudflare Pages | Operator dashboard; browser calls the public API |
| Storefront | Vercel | Shopper UI; browser (and SSR) call the public API |

In words: the VM owns persistence and the NestJS API. Cloudflare DNS for `api` is a CNAME to the tunnel. Pages and Vercel never talk to Postgres or Redis; they only call the HTTPS API origin. Observability (Prometheus/Grafana) stays opt-in and off by default on the hosted VM.

### Why Redis Stack stays on the VM

Carts use RedisJSON (and related Redis Stack modules). A plain Redis or a generic managed Redis without those modules will not work. Keep Redis Stack beside the API on the same Compose network.

## Choose a host

**Preferred: Oracle Cloud Always Free Ampere (aarch64).** Newer API images are multi-arch (`linux/arm64` and `linux/amd64`), so the pinned GHCR tags run natively on Ampere. Sketch:

1. Create an Always Free Ampere A1 instance (Ubuntu), open only SSH in the security list (no public 3000/5432/6379).
2. Install Docker Engine + Compose plugin (Docker's apt repository for Ubuntu).
3. Clone this repo, configure `.env`, start the API-tier overlay (below).
4. Install `cloudflared` as a system service with a tunnel token from the Cloudflare Zero Trust dashboard.

**Fallback: any small amd64 VPS** (Hetzner, DigitalOcean, etc.) if Oracle quota or ARM quirks get in the way. Same Compose overlay and tunnel pattern.

## Bootstrap the API tier

```sh
git clone https://github.com/raouf-b-dev/ecommerce-platform.git
cd ecommerce-platform
cp .env.example .env
```

On a public host, replace the laptop demo defaults before `up`:

- Strong unique `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, and `METRICS_API_KEY` (do not reuse `.env.example` demo strings).
- Hosted keys (see [.env.example](../.env.example)): `PUBLIC_BASE_URL`, `CORS_ALLOWED_ORIGINS`, `AUTH_COOKIE_SAMESITE`, `DEMO_RESET_ENABLED`, `DEMO_RESET_TOKEN`.
- Suggested hosted values (placeholders):

```env
PUBLIC_BASE_URL=https://api.example.com
CORS_ALLOWED_ORIGINS=https://admin.example.com,https://shop.example.com
AUTH_COOKIE_SAMESITE=none
DEMO_RESET_ENABLED=true
DEMO_RESET_TOKEN=          # generate >= 32 chars on the host; never commit
API_NODE_ENV=staging
PAYMENT_MOCK_AUTO_COMPLETE=true
```

Generate a reset token on the host, for example `openssl rand -base64 48`, and store the same value in GitHub Actions secrets (below). Real values live on the VM and in Actions / Cloudflare only.

Start **API-tier only** (no admin/web containers; UIs are on Pages/Vercel):

```sh
docker compose -f compose.yaml -f overrides/compose.hosted-api.yaml pull
docker compose -f compose.yaml -f overrides/compose.hosted-api.yaml up -d --wait
```

The overlay:

- Runs `postgres`, `redis`, `jwt-keygen`, `migrate`, `seed`, and `api`.
- Leaves `admin` and `web` stopped (profile-gated).
- Publishes the API on loopback only (`127.0.0.1`), for the tunnel.
- Does not publish Postgres or Redis on the host interface.
- Leaves the `observability` profile off unless you opt in.

## Cloudflare Tunnel

1. In Cloudflare Zero Trust, create a tunnel and a public hostname `api.example.com` -> `http://127.0.0.1:3000` (or your `API_PORT`).
2. Install the connector on the VM (`cloudflared` service). Put the tunnel **token** in the host environment or service unit; never commit it.
3. DNS: `api` CNAME to the tunnel target Cloudflare provides.

Browsers reach only the API (and intentional Swagger at `/api/docs` when enabled). They do not reach Postgres, Redis, or Compose-internal networks.

## API env checklist (hosted)

| Variable | Hosted intent |
| :------- | :------------ |
| `PUBLIC_BASE_URL` | `https://api.example.com` (no path; https required with SameSite=none) |
| `CORS_ALLOWED_ORIGINS` | Exact admin + shop origins, comma-separated; no `*` |
| `AUTH_COOKIE_SAMESITE` | `none` so Pages/Vercel can send the refresh cookie |
| `DEMO_RESET_ENABLED` | `true` on the VM when you want scheduled reset |
| `DEMO_RESET_TOKEN` | High-entropy secret, at least 32 characters |
| `SWAGGER_ENABLED` | Still `true` in this Compose stack for the public demo docs |

Match names exactly with the API image (see the API repo `.env.example` and `docs/infrastructure/HOSTED-DEMO.md`).

## Deploy the UIs

Until each app README has a dedicated hosted section, use this shape:

**Admin (Cloudflare Pages)** - build the [ecommerce-admin-dashboard](https://github.com/raouf-b-dev/ecommerce-admin-dashboard) production bundle with the public API origin, for example `VITE_API_BASE_URL=https://api.example.com`. Deploy the static output to Pages on `https://admin.example.com`. That origin must appear in `CORS_ALLOWED_ORIGINS`.

**Storefront (Vercel)** - build [ecommerce-store-web](https://github.com/raouf-b-dev/ecommerce-store-web) with `NEXT_PUBLIC_API_BASE_URL=https://api.example.com` and `NEXT_PUBLIC_STOREFRONT_ORIGIN=https://shop.example.com` (plus any image-host allowlist the web README documents). Deploy to Vercel on `https://shop.example.com`. That origin must appear in `CORS_ALLOWED_ORIGINS`.

Prefer linking to each repo's README hosted section once those sections exist.

## Demo reset (GitHub Action)

Workflow: [`.github/workflows/demo-reset.yml`](../.github/workflows/demo-reset.yml).

- Triggers: every 6 hours UTC, plus `workflow_dispatch`.
- Permissions: `contents: read` only.
- Calls `POST /v1/admin/demo/reset` with header `X-Demo-Reset-Token`.
- If either secret is missing, the job exits 0 with a notice (forks and clones without secrets stay green).

Repository secrets (Settings -> Secrets and variables -> Actions):

| Secret | Example value |
| :----- | :------------ |
| `DEMO_API_BASE_URL` | `https://api.example.com` (no trailing path required) |
| `DEMO_RESET_TOKEN` | Same token as on the VM (`DEMO_RESET_TOKEN`) |

Do not put the token in workflow YAML or logs. GitHub masks secret values in logs; the workflow still avoids echoing them.

Reset restores labeled demo UI accounts and catalog baselines; it does not delete arbitrary shopper accounts or orders. See the API hosted-demo doc for behavior and limits.

## Smoke after deploy

```sh
curl -fsS https://api.example.com/health/readiness
# Open https://api.example.com/api/docs in a browser
```

Then open `https://shop.example.com` and `https://admin.example.com`, sign in with the public demo accounts from the README, and run a mock checkout.

## Cost expectations

| Piece | Typical cost |
| :---- | :----------- |
| Oracle Always Free Ampere | $0 within Always Free limits (quota and region caveats apply) |
| Cloudflare Tunnel + DNS | $0 on free Cloudflare plans for this pattern |
| Cloudflare Pages | $0 within free allowances |
| Vercel hobby | $0 within hobby limits (bandwidth/build caps apply) |
| Paid VPS fallback | A few USD/month for a small instance |

Free tiers can change; watch egress, build minutes, and Oracle reclaim policies. If you outgrow free tiers, keep the same hybrid shape and move the VM or UI hosts independently.

## Upgrade path

- Bump pins in this repo (`versions.json` / `npm run bump`) and `docker compose ... pull` on the VM.
- Redeploy admin/web when their pins or env change.
- Local contributors keep using full Compose without the hosted overlay.
