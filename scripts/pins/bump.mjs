#!/usr/bin/env node
/**
 * Bump one app pin in versions.json and sync docs.
 *
 *   npm run bump -- api 0.12.0
 *   npm run bump -- admin 0.8.0
 *   npm run bump -- web 0.7.0
 */
import { spawnSync } from 'node:child_process';
import { APPS, readVersions, writeVersions } from '../lib/versions.mjs';
import { REPO_ROOT } from '../lib/repo-root.mjs';

const root = REPO_ROOT;
const [, , app, version] = process.argv;

if (!APPS.includes(app) || !version) {
  process.stderr.write(
    'usage: npm run bump -- <api|admin|web> <x.y.z>\n',
  );
  process.exit(2);
}

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  process.stderr.write(`bump: version must be x.y.z (got ${version})\n`);
  process.exit(2);
}

const current = readVersions(root);
const previous = current[app];
current[app] = version;
writeVersions(root, current);

const sync = spawnSync(process.execPath, ['scripts/pins/sync-pins.mjs'], {
  cwd: root,
  stdio: 'inherit',
  windowsHide: true,
});
if ((sync.status ?? 1) !== 0) {
  process.exit(sync.status ?? 1);
}

process.stdout.write(`bump: ${app} ${previous} -> ${version}\n`);
