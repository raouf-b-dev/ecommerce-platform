#!/usr/bin/env node
/**
 * Ensure .env exists, then run `docker compose` with the remaining argv.
 *
 *   node scripts/compose/compose-cmd.mjs up -d --wait
 *   node scripts/compose/compose-cmd.mjs --all-profiles down
 *
 * --all-profiles expands to --profile * without relying on the shell to quote *.
 */
import { ensureEnv } from './ensure-env.mjs';
import { REPO_ROOT } from '../lib/repo-root.mjs';
import { runDocker } from '../lib/run.mjs';

ensureEnv(REPO_ROOT, { quiet: true });

const raw = process.argv.slice(2);
if (raw.length === 0) {
  process.stderr.write(
    'usage: node scripts/compose/compose-cmd.mjs [--all-profiles] <docker compose args...>\n',
  );
  process.exit(2);
}

const composeArgs = [];
for (const arg of raw) {
  if (arg === '--all-profiles') {
    composeArgs.push('--profile', '*');
    continue;
  }
  composeArgs.push(arg);
}

const probe = runDocker(['version'], { cwd: REPO_ROOT });
if (!probe.ok) {
  process.stderr.write(
    `docker is not available:\n${probe.stderr || probe.stdout || probe.error?.message || ''}\n`,
  );
  process.exit(1);
}

const result = runDocker(['compose', ...composeArgs], {
  cwd: REPO_ROOT,
  stdio: 'inherit',
});
process.exit(result.status);
