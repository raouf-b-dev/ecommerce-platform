#!/usr/bin/env node
/**
 * Ensure .env exists, then validate compose (optionally with a profile).
 * Usage: node scripts/compose/compose-config.mjs [--profile name]
 */
import { ensureEnv } from './ensure-env.mjs';
import { REPO_ROOT } from '../lib/repo-root.mjs';
import { runDocker } from '../lib/run.mjs';

ensureEnv(REPO_ROOT, { quiet: true });

const args = process.argv.slice(2);
const dockerArgs = ['compose'];
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--profile' && args[i + 1]) {
    dockerArgs.push('--profile', args[i + 1]);
    i += 1;
  }
}
dockerArgs.push('config', '--quiet');

const result = runDocker(dockerArgs, { cwd: REPO_ROOT, stdio: 'inherit' });
process.exit(result.status);
