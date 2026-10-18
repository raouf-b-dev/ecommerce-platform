#!/usr/bin/env node
/**
 * Local environment doctor for the compose stack.
 */
import fs from 'node:fs';
import path from 'node:path';
import { demoUrls, formatUrlLines, loadEnvFile } from '../lib/env-file.mjs';
import { findServiceRow, isContainerUp, parseComposePsJson } from '../lib/oneshot.mjs';
import { REPO_ROOT } from '../lib/repo-root.mjs';
import { runDocker } from '../lib/run.mjs';

const lines = [];
let failed = false;

function check(label, ok, detail) {
  lines.push(`${ok ? 'ok' : 'fail'}: ${label}${detail ? ` (${detail})` : ''}`);
  if (!ok) failed = true;
}

const docker = runDocker(['version', '--format', '{{.Server.Version}}'], { cwd: REPO_ROOT });
check('docker engine', docker.ok, (docker.stdout || '').trim() || docker.stderr.trim());

const compose = runDocker(['compose', 'version'], { cwd: REPO_ROOT });
check(
  'docker compose plugin',
  compose.ok,
  (compose.stdout || '').trim().split(/\r?\n/)[0] || compose.stderr.trim(),
);

const envExists = fs.existsSync(path.join(REPO_ROOT, '.env'));
check('.env present', envExists, envExists ? 'found' : 'run: npm run setup');

if (process.platform === 'win32') {
  lines.push(
    'note: on some Windows hosts Hyper-V reserves 3000-3199; check with: netsh interface ipv4 show excludedportrange protocol=tcp',
  );
}

lines.push('tip: first start pulls GHCR images and may build the seed image once');

let apiUp = false;
if (docker.ok && envExists) {
  const ps = runDocker(['compose', '--profile', '*', 'ps', '-a', '--format', 'json'], {
    cwd: REPO_ROOT,
  });
  if (ps.ok) {
    let rows = [];
    try {
      rows = parseComposePsJson(ps.stdout);
    } catch {
      rows = [];
    }
    const api = findServiceRow(rows, 'api');
    apiUp = isContainerUp(api);
    lines.push(
      `${apiUp ? 'ok' : 'note'}: api container (${apiUp ? 'running' : 'not running'})`,
    );
  }
}

if (!failed && envExists) {
  try {
    const urls = demoUrls(loadEnvFile(REPO_ROOT));
    lines.push('urls:');
    lines.push(...formatUrlLines(urls));
  } catch {
    // ignore; .env may be incomplete
  }
}

if (failed) {
  lines.push('next: fix the failures above, then npm run setup');
} else if (!apiUp) {
  lines.push('next: npm run d:up');
} else {
  lines.push('next: npm run d:smoke');
}

process.stdout.write(`${lines.join('\n')}\n`);
process.exit(failed ? 1 : 0);
