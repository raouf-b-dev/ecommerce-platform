# scripts

Maintainer DX for this compose platform. npm scripts in `package.json` are the public entrypoints; folders are by job.

| Folder | Job | Examples |
| :--- | :--- | :--- |
| `compose/` | Stack lifecycle helpers | `compose-cmd`, `ensure-env`, `ensure-secrets`, `compose-config` |
| `dx/` | First-comer and local UX | `setup`, `doctor`, `urls`, `pr` |
| `gates/` | Pre-PR and CI checks | `verify`, `check-*`, `smoke`, `agent-*`, ascii lint |
| `pins/` | Version pin maintenance | `bump`, `sync-pins` |
| `lib/` | Shared helpers and unit tests | `run`, `env-file`, `versions`, `oneshot` |

Do not invent a Node app tree here. The product stays at the repo root (`compose.yaml`, `.env.example`, `versions.json`).

## Cross-platform

Scripts are plain Node ESM. They spawn `docker` with an argv array (no shell), resolve paths with `node:path`, and avoid bash-only wrappers. That is the portable path on Windows, macOS, and Linux. `d:open` picks `cmd start` / `open` / `xdg-open` by platform. Prefer `npm run ...` over `make` on Windows PowerShell when Make is missing.
