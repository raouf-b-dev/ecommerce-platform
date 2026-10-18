# docs

| Path | What it is |
| :--- | :--- |
| [DESIGN.md](DESIGN.md) | Why the stack is shaped this way (pins, seed image, no husky, Dependabot on master, layout). |
| `checkout.gif` | Not recorded yet. When added, link it from the README Quick start section. |

## Repository layout (compose platform)

| Path | Role |
| :--- | :--- |
| `compose.yaml`, `.env.example`, `versions.json` | Product: stack contract and pins |
| `config/observability/` | Prometheus / Grafana files mounted by the observability profile |
| `overrides/` | Example Compose overlays (copy to root `compose.override.yaml`) |
| `scripts/compose|dx|gates|pins|lib/` | Maintainer DX by job; see [scripts/README.md](../scripts/README.md) |
| `.github/` | CI and Dependabot |

Hosted staging is tracked in the README "Try without cloning" section. Tag `v0.1.0` on `master` after a release merge when the demo is ready to share.
