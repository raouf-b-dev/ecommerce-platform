#!/usr/bin/env node
/**
 * Pre-PR helper: run verify, then smoke if the stack looks up, else print next steps.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findServiceRow, isContainerUp, parseComposePsJson } from './lib/oneshot.mjs';
import { runDocker } from './lib/run.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function runNpm(script) {
  const npmCli = process.env.npm_execpath;
  if (!npmCli) {
    process.stderr.write('scripts/pr.mjs must be run via `npm run pr`\n');
    process.exit(1);
  }
  const result = spawnSync(process.execPath, [npmCli, 'run', script], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
    windowsHide: true,
  });
  return result.status ?? 1;
}

process.stdout.write('pr: verify\n');
const verifyCode = runNpm('verify');
if (verifyCode !== 0) {
  process.exit(verifyCode);
}

const ps = runDocker(['compose', '--profile', '*', 'ps', '-a', '--format', 'json'], {
  cwd: root,
});
let rows = [];
if (ps.ok) {
  try {
    rows = parseComposePsJson(ps.stdout);
  } catch {
    rows = [];
  }
}
const apiUp = isContainerUp(findServiceRow(rows, 'api'));

if (!apiUp) {
  process.stdout.write('\npr: verify ok; stack is not up\n');
  process.stdout.write('next: npm run d:reset\n');
  process.stdout.write('then: npm run d:smoke\n');
  process.exit(0);
}

process.stdout.write('\npr: stack looks up; running smoke\n');
const smokeCode = runNpm('smoke');
if (smokeCode !== 0) {
  process.exit(smokeCode);
}

process.stdout.write('\npr: ok - ready to open the PR\n');
