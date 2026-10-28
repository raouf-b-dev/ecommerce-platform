# docs

| Path | What it is |
| :--- | :--- |
| [DESIGN.md](DESIGN.md) | Why the stack is shaped this way (pins, seed image, no husky, Dependabot on master, layout). |
| [HOSTED-DEMO.md](HOSTED-DEMO.md) | Hybrid hosted demo: VM API-tier + Tunnel, Pages admin, Vercel storefront. |
| `checkout.gif` | Not recorded yet. When added, link it from the README Quick start section. |

## Repository layout (compose platform)

| Path | Role |
| :--- | :--- |
| `compose.yaml`, `.env.example`, `versions.json` | Product: stack contract and pins |
| `config/observability/` | Prometheus / Grafana files mounted by the observability profile |
| `overrides/` | Compose overlays (local `compose.override.yaml` sample; hosted API-tier file) |
| `scripts/compose|dx|gates|pins|lib/` | Maintainer DX by job; see [scripts/README.md](../scripts/README.md) |
| `.github/` | CI, Dependabot, and optional demo-reset workflow |

Local contributors use full Compose. Hosted operators follow [HOSTED-DEMO.md](HOSTED-DEMO.md). README Live demo placeholders are filled after the first deploy.

## Node.js version policy

`.nvmrc` is the single source of truth for the Node major (currently 26, Active LTS). CI (`.github/actions/setup-platform`) and `demo-reset.yml` read it via `node-version-file`; `package.json` `engines` mirrors it and `.npmrc` sets `engine-strict=true`. `npm run check:pins` fails if `.nvmrc` and `engines.node` drift.

Track the newest Active LTS in all four repos. The weekly `.github/workflows/node-lts-watch.yml` (`scripts/gates/node-lts-watch.mjs`) compares this repo's `.nvmrc` and the app repos' `.nvmrc` on `master` with the [Node.js release schedule](https://github.com/nodejs/Release). It fails when a major is past end of life, and opens or updates one `node-lts` issue when a major is in Maintenance LTS while a newer LTS is Active, is within 90 days of end of life, or the four majors differ.
