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

`.nvmrc` is the single source of truth for the Node major (currently 26, Active LTS). CI (`.github/actions/setup-platform`) and `demo-reset.yml` read it via `node-version-file`. Locally, the Node guard is `package.json` `devEngines.runtime` (`{ "name": "node", "version": ">=26.0.0", "onFail": "error" }`): npm 12 does not enforce the root `engines.node`, even with `engine-strict=true` in `.npmrc`, so without `devEngines.runtime` Node 24 + npm 12 `npm ci` succeeds. `engines.node` stays as the declared requirement and must equal `devEngines.runtime.version`. `npm run check:pins` fails if `.nvmrc`, `engines.node` and `devEngines.runtime` drift.

npm is pinned separately, in `package.json` `devEngines.packageManager` (`{ "name": "npm", "version": "12.2.1", "onFail": "error" }`), because no Node release bundles npm 12 yet (Node 26 bundles npm 11). With any other npm, commands that load the project (`npm ci`, `npm install`, `npm run`, `npm config`, `npm pkg`) fail with `EBADDEVENGINES`; trivial commands such as `npm --version` or `npx --version` still run. Install the pin once with `npm install --global npm@<version>` (global installs are not checked). CI does the same after `actions/setup-node` in `setup-platform`, reading the version from `package.json`; `demo-reset.yml` and `node-lts-watch.yml` only run `node`, so they skip it. Every `setup-node` step sets `package-manager-cache: false`, because setup-node would otherwise auto-cache from `devEngines` by running the bundled npm, which fails.

Bumping the pins is manual: edit `devEngines.packageManager.version` (npm) or `.nvmrc`, `engines.node` and `devEngines.runtime.version` together (Node), then run `npm run check:pins`. Do not rely on Dependabot for `devEngines` (not verified to update it); `check:pins` is the drift guard (it also fails if a workflow or doc hard-codes a different npm version). When a Node LTS bundles npm 12 or newer, revisit: the npm pin and the install step may become unnecessary.

Track the newest Active LTS in all four repos. The weekly `.github/workflows/node-lts-watch.yml` (`scripts/gates/node-lts-watch.mjs`) compares this repo's `.nvmrc` and the app repos' `.nvmrc` on `master` with the [Node.js release schedule](https://github.com/nodejs/Release). It fails when a major is past end of life, and opens or updates one `node-lts` issue when a major is in Maintenance LTS while a newer LTS is Active, is within 90 days of end of life, or the four majors differ.
