#!/usr/bin/env node
/**
 * First-comer bootstrap: ensure .env, print URLs, say what to run next.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureEnv } from './ensure-env.mjs';
import { demoUrls, formatUrlLines, loadEnvFile } from './lib/env-file.mjs';
import { runDocker } from './lib/run.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

process.stdout.write('setup: ensuring .env\n');
ensureEnv(root);

const docker = runDocker(['version'], { cwd: root });
if (!docker.ok) {
  process.stdout.write('setup: docker not detected yet; install Docker Desktop / Engine, then:\n');
  process.stdout.write('  npm run doctor\n  npm run d:up\n');
  process.exit(0);
}

const env = loadEnvFile(root);
const urls = demoUrls(env);
process.stdout.write('setup: demo URLs (after the stack is up)\n');
process.stdout.write(`${formatUrlLines(urls).join('\n')}\n`);
process.stdout.write('\nnext: npm run d:up\n');
process.stdout.write('then: npm run d:smoke\n');
process.stdout.write('urls: npm run d:urls   open: npm run d:open\n');
