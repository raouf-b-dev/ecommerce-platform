#!/usr/bin/env node
/**
 * Print demo URLs from .env (ports). With --open, also open them in the browser.
 *
 *   npm run d:urls
 *   npm run d:open
 */
import { ensureEnv } from '../compose/ensure-env.mjs';
import { demoUrls, formatUrlLines, loadEnvFile } from '../lib/env-file.mjs';
import { REPO_ROOT } from '../lib/repo-root.mjs';
import { runArgv } from '../lib/run.mjs';

ensureEnv(REPO_ROOT, { quiet: true });

const shouldOpen = process.argv.includes('--open');
const env = loadEnvFile(REPO_ROOT);
const urls = demoUrls(env);

process.stdout.write('demo URLs\n');
process.stdout.write(`${formatUrlLines(urls).join('\n')}\n`);

if (!shouldOpen) {
  process.exit(0);
}

for (const entry of urls) {
  const opened = openUrl(entry.url);
  if (!opened.ok) {
    process.stderr.write(`could not open ${entry.url}: ${opened.stderr || opened.error}\n`);
  }
}

function openUrl(url) {
  if (process.platform === 'win32') {
    return runArgv('cmd', ['/c', 'start', '', url], { cwd: REPO_ROOT });
  }
  if (process.platform === 'darwin') {
    return runArgv('open', [url], { cwd: REPO_ROOT });
  }
  return runArgv('xdg-open', [url], { cwd: REPO_ROOT });
}
