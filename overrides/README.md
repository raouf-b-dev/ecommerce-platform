# overrides

Sample Compose overlays.

| File | Use |
| :--- | :--- |
| [compose.override.example.yaml](compose.override.example.yaml) | Remap published host ports when defaults are busy. Copy to the **repo root** as `compose.override.yaml` (gitignored). Docker Compose only auto-merges that root filename. |
| [compose.hosted-api.yaml](compose.hosted-api.yaml) | API-tier only for the hybrid hosted demo. Pass explicitly: `docker compose -f compose.yaml -f overrides/compose.hosted-api.yaml up -d --wait`. See [docs/HOSTED-DEMO.md](../docs/HOSTED-DEMO.md). |

Building the seed image from a local API checkout is a maintainer workflow, not the happy path. Prefer GHCR pulls; see [docs/DESIGN.md](../docs/DESIGN.md).
