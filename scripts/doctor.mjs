#!/usr/bin/env node
/**
 * Local environment doctor for the compose stack.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runDocker } from './lib/run.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lines = [];
let failed = false;

function check(label, ok, detail) {
  lines.push(`${ok ? 'ok' : 'fail'}: ${label}${detail ? ` (${detail})` : ''}`);
  if (!ok) failed = true;
}

const docker = runDocker(['version', '--format', '{{.Server.Version}}'], { cwd: root });
check('docker engine', docker.ok, (docker.stdout || '').trim() || docker.stderr.trim());

const compose = runDocker(['compose', 'version'], { cwd: root });
check(
  'docker compose plugin',
  compose.ok,
  (compose.stdout || '').trim().split(/\r?\n/)[0] || compose.stderr.trim(),
);

const envExists = fs.existsSync(path.join(root, '.env'));
check('.env present', envExists, envExists ? 'found' : 'copy .env.example to .env');

if (process.platform === 'win32') {
  lines.push(
    'note: on some Windows hosts Hyper-V reserves 3000-3199; check with: netsh interface ipv4 show excludedportrange protocol=tcp',
  );
}

lines.push('tip: first start pulls GHCR images and may build the seed image once');
process.stdout.write(`${lines.join('\n')}\n`);
process.exit(failed ? 1 : 0);
