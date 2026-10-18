#!/usr/bin/env node
/**
 * Run one command. A pass prints one line. A failure prints from the first
 * error, capped. Passing logs never enter the chat.
 *
 * node scripts/gates/agent-run.mjs -- npx vitest run src/foo.spec.ts --reporter=minimal
 */
import { failureExcerpt, runQuiet } from './agent-output.mjs';
import { REPO_ROOT } from '../lib/repo-root.mjs';

const root = REPO_ROOT;
const args = process.argv.slice(2);
const start = args[0] === '--' ? 1 : 0;
const command = args.slice(start).join(' ').trim();

if (!command) {
  process.stderr.write('usage: node scripts/gates/agent-run.mjs -- <command>\n');
  process.exit(2);
}

const result = runQuiet(command, root);
if (result.ok) {
  process.stdout.write(`ok: ${command}\n`);
  process.exit(0);
}

process.stderr.write(`fail: ${command}\n${failureExcerpt(result.text)}\n`);
process.exit(1);
