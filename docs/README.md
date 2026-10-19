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
