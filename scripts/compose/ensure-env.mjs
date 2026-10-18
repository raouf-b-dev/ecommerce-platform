#!/usr/bin/env node
/**
 * Ensure .env exists (copy from .env.example). Idempotent unless --force.
 *
 *   npm run env:init
 *   npm run env:init:force
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REPO_ROOT } from '../lib/repo-root.mjs';

export function ensureEnv(repoRoot = REPO_ROOT, { force = false, quiet = false } = {}) {
  const envPath = path.join(repoRoot, '.env');
  const examplePath = path.join(repoRoot, '.env.example');
  if (!fs.existsSync(examplePath)) {
    throw new Error('.env.example missing');
  }

  const exists = fs.existsSync(envPath);
  if (exists && !force) {
    if (!quiet) {
      process.stdout.write('env:init: .env already present (use --force to overwrite)\n');
    }
    return { created: false, overwritten: false };
  }

  fs.copyFileSync(examplePath, envPath);
  if (!quiet) {
    process.stdout.write(
      exists
        ? 'env:init: overwrote .env from .env.example\n'
        : 'env:init: created .env from .env.example\n',
    );
  }
  return { created: !exists, overwritten: exists };
}

const entry = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (entry === fileURLToPath(import.meta.url)) {
  const force = process.argv.includes('--force');
  try {
    ensureEnv(REPO_ROOT, { force });
  } catch (err) {
    process.stderr.write(`env:init: ${err.message || err}\n`);
    process.exit(1);
  }
}
