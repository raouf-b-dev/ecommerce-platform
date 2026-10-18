#!/usr/bin/env node
/**
 * Ensure .env exists, then validate compose (optionally with a profile).
 * Usage: node scripts/compose-config.mjs [--profile name]
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureEnv } from './ensure-env.mjs';
import { runDocker } from './lib/run.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
ensureEnv(root);

const args = process.argv.slice(2);
const dockerArgs = ['compose'];
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--profile' && args[i + 1]) {
    dockerArgs.push('--profile', args[i + 1]);
    i += 1;
  }
}
dockerArgs.push('config', '--quiet');

const result = runDocker(dockerArgs, { cwd: root, stdio: 'inherit' });
process.exit(result.status);
