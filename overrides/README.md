# overrides

Sample Compose overlays. Copy an example to the **repo root** as `compose.override.yaml` (gitignored). Docker Compose only auto-merges that root filename.

| File | Use |
| :--- | :--- |
| [compose.override.example.yaml](compose.override.example.yaml) | Remap published host ports when defaults are busy |

Building the seed image from a local API checkout is a maintainer workflow, not the happy path. Prefer GHCR pulls; see [docs/DESIGN.md](../docs/DESIGN.md).
