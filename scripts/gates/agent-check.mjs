#!/usr/bin/env node
/**
 * In-chat check. Scope is the worktree plus commits on this branch since
 * the integration base. A pass is one summary. A failure starts at the
 * first error. npm run verify stays in your terminal, before a PR.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  failureExcerpt,
  listRepoChanges,
  runQuiet,
  selectPlatformCommands,
} from './agent-output.mjs';
import { REPO_ROOT } from '../lib/repo-root.mjs';

const root = REPO_ROOT;
const bases = ['origin/develop', 'develop'];

if (isDirect()) main();

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const scope = listRepoChanges(root, bases);
  if (scope.files.length === 0) {
    finish(0, [
      'agent-check: skipped',
      'reason: no changes in the worktree or on this branch',
      `base: ${scope.base}`,
      'you run: npm run verify',
    ]);
  }

  const existing = scope.files.filter((file) => fs.existsSync(path.join(root, file)));
  const missing = scope.files.length - existing.length;
  const plan = selectPlatformCommands(scope.files, existing);
  const commands = [...plan.commands];

  if (scope.files.some((file) => /^scripts\/gates\/agent-/.test(file))) {
    commands.unshift(['agent-check tests', 'node --test scripts/gates/agent-check.spec.mjs']);
  }

  const lines = [
    'agent-check: plan',
    `changed: ${scope.files.length} file(s)${missing ? `, ${missing} deleted` : ''}`,
    `scope: worktree ${scope.worktree}, branch ${scope.branch} (base ${scope.base})`,
  ];
  if (plan.wide) {
    lines.push(`reason: wide diff; heavy checks not run`);
  }
  lines.push(commands.length === 0 ? 'ran: nothing (empty plan)' : `ran: ${labels(commands)}`);
  lines.push('skipped: full stack smoke, docker compose up');
  lines.push('you run: npm run verify');

  if (dryRun) {
    lines[0] = 'agent-check: dry-run';
    for (const [, command] of commands) lines.push(`$ ${command}`);
    finish(0, lines);
  }

  for (const [label, command] of commands) {
    const result = runQuiet(command, root);
    if (result.ok) continue;
    lines[0] = 'agent-check: fail';
    finish(1, [...lines, '', `## ${label}`, failureExcerpt(result.text)]);
  }

  lines[0] = plan.wide ? 'agent-check: skipped' : 'agent-check: ok';
  finish(0, lines);
}

function labels(commands) {
  return commands.map(([label]) => label).join(', ');
}

function finish(code, lines) {
  process.stdout.write(`${lines.filter(Boolean).join('\n')}\n`);
  process.exit(code);
}

function isDirect() {
  const entry = process.argv[1] ? path.resolve(process.argv[1]) : '';
  return entry === fileURLToPath(import.meta.url);
}
