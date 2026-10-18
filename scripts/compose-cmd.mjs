#!/usr/bin/env node
/**
 * Ensure .env exists, then run `docker compose` with the remaining argv.
 *
 *   node scripts/compose-cmd.mjs up -d --wait
 *   node scripts/compose-cmd.mjs --all-profiles down
 *
 * --all-profiles expands to --profile * without relying on the shell to quote *.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureEnv } from './ensure-env.mjs';
import { runDocker } from './lib/run.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
ensureEnv(root);

const raw = process.argv.slice(2);
if (raw.length === 0) {
  process.stderr.write(
    'usage: node scripts/compose-cmd.mjs [--all-profiles] <docker compose args...>\n',
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

const probe = runDocker(['version'], { cwd: root });
if (!probe.ok) {
  process.stderr.write(
    `docker is not available:\n${probe.stderr || probe.stdout || probe.error?.message || ''}\n`,
  );
  process.exit(1);
}

const result = runDocker(['compose', ...composeArgs], {
  cwd: root,
  stdio: 'inherit',
});
process.exit(result.status);
