#!/usr/bin/env node
/**
 * First-comer bootstrap: ensure .env, print URLs, say what to run next.
 */
import { ensureEnv } from '../compose/ensure-env.mjs';
import { demoUrls, formatUrlLines, loadEnvFile } from '../lib/env-file.mjs';
import { REPO_ROOT } from '../lib/repo-root.mjs';
import { runDocker } from '../lib/run.mjs';

process.stdout.write('setup: ensuring .env\n');
ensureEnv(REPO_ROOT, { quiet: true });

const docker = runDocker(['version'], { cwd: REPO_ROOT });
if (!docker.ok) {
  process.stdout.write('setup: docker not detected yet; install Docker Desktop / Engine, then:\n');
  process.stdout.write('  npm run doctor\n  npm run d:up\n');
  process.exit(0);
}

const env = loadEnvFile(REPO_ROOT);
const urls = demoUrls(env);
process.stdout.write('setup: demo URLs (after the stack is up)\n');
process.stdout.write(`${formatUrlLines(urls).join('\n')}\n`);
process.stdout.write('\nnext: npm run d:up\n');
process.stdout.write('then: npm run d:smoke\n');
process.stdout.write('urls: npm run d:urls   open: npm run d:open\n');
