#!/usr/bin/env node
/**
 * Pre-PR gate with live phase banners. Streams each step to the terminal.
 * Keep npm run check:agent for in-chat checks.
 */
import { spawnSync } from 'node:child_process';
import { hasCommand, hasYamllint, runArgv } from '../lib/run.mjs';
import { REPO_ROOT } from '../lib/repo-root.mjs';

function resolveNpmCli() {
  const npmExecPath = process.env.npm_execpath;
  if (!npmExecPath) {
    process.stderr.write(
      'scripts/gates/verify.mjs must be run via `npm run verify` (npm_execpath is unset).\n',
    );
    process.exit(1);
  }
  return npmExecPath;
}

const npmCli = resolveNpmCli();

/** @typedef {{ label: string, kind: 'npm' | 'node' | 'exec', argv: string[], when?: () => boolean }} Phase */

/** @type {Phase[]} */
const phases = [
  { label: 'ensure-env', kind: 'node', argv: ['scripts/compose/ensure-env.mjs'] },
  { label: 'check-pins', kind: 'node', argv: ['scripts/gates/check-pins.mjs'] },
  { label: 'check-compose', kind: 'node', argv: ['scripts/gates/check-compose.mjs'] },
  { label: 'check-resolved', kind: 'node', argv: ['scripts/gates/check-resolved.mjs'] },
  { label: 'lint:ascii', kind: 'npm', argv: ['run', 'lint:ascii'] },
  { label: 'test:scripts', kind: 'npm', argv: ['run', 'test:scripts'] },
  {
    label: 'yamllint',
    kind: 'exec',
    argv: ['yamllint', '-c', '.yamllint.yaml', 'compose.yaml', '.github', 'config', 'overrides'],
    when: hasYamllint,
  },
  {
    label: 'actionlint',
    kind: 'exec',
    argv: ['actionlint'],
    when: () => hasCommand('actionlint'),
  },
  { label: 'compose config', kind: 'node', argv: ['scripts/compose/compose-config.mjs'] },
  {
    label: 'compose config observability',
    kind: 'node',
    argv: ['scripts/compose/compose-config.mjs', '--profile', 'observability'],
  },
];

for (const phase of phases) {
  process.stdout.write(`==> ${phase.label}\n`);
  if (phase.when && !phase.when()) {
    process.stdout.write(`==> ${phase.label} not on PATH; CI installs it. Continuing.\n`);
    continue;
  }

  let code;
  if (phase.kind === 'npm') {
    const result = spawnSync(process.execPath, [npmCli, ...phase.argv], {
      cwd: REPO_ROOT,
      stdio: 'inherit',
      env: process.env,
      windowsHide: true,
    });
    code = result.status ?? 1;
  } else if (phase.kind === 'node') {
    const result = spawnSync(process.execPath, phase.argv, {
      cwd: REPO_ROOT,
      stdio: 'inherit',
      env: process.env,
      windowsHide: true,
    });
    code = result.status ?? 1;
  } else {
    const [command, ...args] = phase.argv;
    const result = runArgv(command, args, { cwd: REPO_ROOT, stdio: 'inherit' });
    code = result.status;
  }

  if (code !== 0) {
    process.stdout.write(`==> verify failed at ${phase.label}\n`);
    process.exit(code);
  }
}

process.stdout.write('==> verify ok\n');
