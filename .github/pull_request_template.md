**Summary**
What changed and why, in a few sentences.

**Linked issue**
Closes #

**Tests run**

- [ ] `npm run verify`
- [ ] `docker compose config --quiet`
- [ ] `docker compose up -d --wait` on a clean state (`docker compose --profile '*' down -v` first)
- [ ] `npm run smoke`
- [ ] API health, storefront and admin load
- Other:

**CI (required)**

- [ ] CI Status Check (covers Lint, Pin Sync, Compose Checks, Script Tests, Smoke Test)

**Versions**

- [ ] No version change.
- [ ] Version matrix changed: `.env.example`, the README version matrix and `CHANGELOG.md` agree (`npm run check:pins`).

**Docs touched**
List the docs updated (`README.md`, `CHANGELOG.md`, `AGENTS.md`), or "none".

**Breaking change**
None, or what breaks for existing installs (renamed variables, volume changes) and what users must do.
