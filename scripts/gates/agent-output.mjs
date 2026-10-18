import { spawnSync } from 'node:child_process';
import { hasYamllint } from '../lib/run.mjs';

export const WIDE = 30;

const FAIL_LINE =
  /FAIL |^FAIL|AssertionError|error TS\d+|Error:|not ok|ELIFECYCLE|SyntaxError|TypeError|ReferenceError|Expected:|Received:|ascii-prose:|yamllint|compose/i;

export function failureExcerpt(text, max = 120) {
  const lines = String(text || '')
    .replaceAll('\r\n', '\n')
    .split('\n');
  const start = lines.findIndex((line) => FAIL_LINE.test(line));
  const slice = start >= 0 ? lines.slice(start) : lines.slice(-80);
  const body = slice.slice(0, max).join('\n').trim();
  const extra = slice.length > max ? `\n... ${slice.length - max} more lines` : '';
  return `${body}${extra}`.trim();
}

export function parseNameList(text) {
  return [
    ...new Set(
      String(text || '')
        .split(/\r?\n/)
        .map((file) => file.trim().replaceAll('\\', '/'))
        .filter(Boolean),
    ),
  ];
}

export function combineChanges(worktree, branch) {
  return [...new Set([...worktree, ...branch])];
}

export function runQuiet(command, cwd) {
  const result = spawnSync(command, {
    cwd,
    encoding: 'utf8',
    shell: true,
    maxBuffer: 32 * 1024 * 1024,
    env: process.env,
    windowsHide: true,
  });
  if (result.error) return { ok: false, text: result.error.message };
  return { ok: result.status === 0, text: `${result.stdout || ''}${result.stderr || ''}` };
}

export function listRepoChanges(cwd, baseNames) {
  const worktree = combineChanges(
    parseNameList(gitText(['diff', '--name-only', '--relative'], cwd)),
    combineChanges(
      parseNameList(gitText(['diff', '--name-only', '--cached', '--relative'], cwd)),
      parseNameList(gitText(['ls-files', '--others', '--exclude-standard'], cwd)),
    ),
  );
  let base = 'none';
  for (const name of baseNames) {
    const verified = spawnSync('git', ['rev-parse', '--verify', '--quiet', name], {
      cwd,
      encoding: 'utf8',
    });
    if (verified.status !== 0) continue;
    const mergeBase = spawnSync('git', ['merge-base', 'HEAD', name], { cwd, encoding: 'utf8' });
    if (mergeBase.status !== 0) continue;
    base = name;
    break;
  }
  const branch =
    base === 'none'
      ? []
      : parseNameList(gitText(['diff', '--name-only', '--relative', `${base}...HEAD`], cwd));
  return { files: combineChanges(worktree, branch), base, worktree: worktree.length, branch: branch.length };
}

export function isDoc(file) {
  if (
    file === 'AGENTS.md' ||
    file === 'CLAUDE.md' ||
    file === 'README.md' ||
    file === 'CONTRIBUTING.md' ||
    file === 'CHANGELOG.md' ||
    file === 'SECURITY.md' ||
    file === 'LICENSE' ||
    file === 'Makefile'
  ) {
    return true;
  }
  if (file.startsWith('docs/') || file.startsWith('.agents/')) return true;
  if (file.endsWith('.md')) return true;
  return false;
}

export function isComposeTouch(file) {
  return (
    file === 'compose.yaml' ||
    file === 'compose.yml' ||
    file === '.env.example' ||
    file === 'Makefile' ||
    file === 'versions.json' ||
    file.startsWith('scripts/') ||
    file.startsWith('config/') ||
    file.startsWith('overrides/')
  );
}

export function isYamlTouch(file) {
  return (
    file.endsWith('.yml') ||
    file.endsWith('.yaml') ||
    file === '.yamllint.yaml' ||
    file.startsWith('.github/') ||
    file.startsWith('config/') ||
    file.startsWith('overrides/')
  );
}

export function selectPlatformCommands(allFiles, existing) {
  const wide = existing.filter((file) => !isDoc(file)).length > WIDE;
  const commands = [];
  const toolingOnly =
    allFiles.length > 0 &&
    allFiles.every((file) => isDoc(file) || isYamlTouch(file) || file.startsWith('scripts/') || file === 'package.json' || file === 'package-lock.json');

  if (existing.length > 0) {
    commands.push(['ascii-prose', 'node scripts/gates/lint-ascii-prose.cjs']);
  }

  if (!wide && existing.some(isYamlTouch) && hasYamllint()) {
    commands.push([
      'yamllint',
      'yamllint -c .yamllint.yaml compose.yaml .github config overrides',
    ]);
  }

  if (!wide && existing.some(isComposeTouch)) {
    commands.push(['check-pins', 'node scripts/gates/check-pins.mjs']);
    commands.push(['check-compose', 'node scripts/gates/check-compose.mjs']);
    commands.push(['check-resolved', 'node scripts/gates/check-resolved.mjs']);
    commands.push(['compose config', 'node scripts/compose/compose-config.mjs']);
  }

  if (existing.some((file) => /^scripts\/.+\.spec\.mjs$/.test(file))) {
    commands.push(['script tests', 'npm run test:scripts']);
  }

  return { commands, wide, toolingOnly };
}

function gitText(args, cwd) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  return result.status === 0 ? result.stdout || '' : '';
}
