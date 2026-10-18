# ecommerce-platform

Docker Compose stack only. It pulls versioned images for the API, admin dashboard, and storefront (plus Postgres and Redis). No application source lives here.

## Checks

`npm run verify` is the pre-PR command in your terminal (pins, compose guardrails, ASCII, yamllint, `docker compose config`). Do not run it in this chat.

In this chat, run once before you stop:

```sh
npm run check:agent
```

A pass is one summary (`agent-check: ok`). A failure is the error block only. `agent-check: skipped` is not a pass. Quiet one-off commands:

```sh
node scripts/gates/agent-run.mjs -- <command>
```

Do not paste green smoke or verify logs into the chat. Do not run `docker compose up` or `npm run smoke` in the chat unless the user asked for a live stack check.

## Never

1. Write em or en dashes, curly quotes, or the ellipsis character in docs or config. Use ASCII (`-`, `'`, `"`, `...`).
2. Reintroduce `ADMIN_SOURCE`, `WEB_SOURCE`, or `dockerfile_inline` for admin/web. Those images come from GHCR.
3. Drift versions: edit `versions.json`, then `npm run sync-pins` (or `npm run bump -- <api|admin|web> <x.y.z>`). `npm run check:pins` must pass.
4. Commit `.env` or real secrets. Demo defaults in `.env.example` stay non-secret.
5. Run without explicit user approval: `git push`, tagging a release, or anything that changes production hosting.

## Load only when

| When you are | Load |
| :--- | :--- |
| Changing compose services or ports | [compose.yaml](compose.yaml), [.env.example](.env.example), README architecture |
| Changing observability mounts | [config/observability/](config/observability/), `compose.yaml` configs |
| Local Compose overlays | [overrides/](overrides/) (copy example to root `compose.override.yaml`) |
| Script / DX changes | [scripts/README.md](scripts/README.md) |
| Bumping app versions | `.env.example`, README version matrix, `CHANGELOG.md`, then `npm run check:pins` |
| Changing CI | [.github/workflows/ci.yml](.github/workflows/ci.yml) (job names must stay `Validate`, `Smoke Test`, `CI Status Check`) |
