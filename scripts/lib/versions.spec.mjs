import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { findNpmPinDrift, readNodeRuntimePin, readNpmPin, readVersions, writeVersions } from './versions.mjs';

test('readVersions rejects bad semver', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ecom-versions-'));
  fs.writeFileSync(path.join(dir, 'versions.json'), '{"api":"1","admin":"0.7.0","web":"0.6.0"}\n');
  assert.throws(() => readVersions(dir), /invalid or missing api/);
});

test('writeVersions round-trips', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ecom-versions-'));
  writeVersions(dir, { api: '1.2.3', admin: '4.5.6', web: '7.8.9' });
  assert.deepEqual(readVersions(dir), { api: '1.2.3', admin: '4.5.6', web: '7.8.9' });
});

test('readNpmPin reads devEngines.packageManager', () => {
  const pm = { name: 'npm', version: '12.2.1', onFail: 'error' };
  assert.deepEqual(readNpmPin({ devEngines: { packageManager: pm } }), { version: '12.2.1' });
  assert.match(readNpmPin({}).error, /devEngines\.packageManager/);
  assert.match(readNpmPin({ devEngines: { packageManager: { ...pm, version: '^12' } } }).error, /x\.y\.z/);
  assert.match(readNpmPin({ devEngines: { packageManager: { ...pm, onFail: 'warn' } } }).error, /onFail/);
});

test('findNpmPinDrift flags hard-coded npm versions that differ from the pin', () => {
  const files = {
    'ok.yml': 'run: npm install --global "npm@$version"\n',
    'same.md': 'Uses npm 12.2.1 via devEngines.',
    'drift.yml': 'run: npm install --global npm@12.1.0\n',
  };
  assert.deepEqual(findNpmPinDrift('12.2.1', files), [
    'npm: drift.yml pins npm 12.1.0 (devEngines.packageManager.version=12.2.1)',
  ]);
});

test('readNodeRuntimePin reads devEngines.runtime', () => {
  const rt = { name: 'node', version: '>=26.0.0', onFail: 'error' };
  assert.deepEqual(readNodeRuntimePin({ devEngines: { runtime: rt } }), { version: '>=26.0.0' });
  assert.match(readNodeRuntimePin({}).error, /devEngines\.runtime must be/);
  assert.match(readNodeRuntimePin({ devEngines: { runtime: { ...rt, name: 'bun' } } }).error, /devEngines\.runtime must be/);
  assert.match(readNodeRuntimePin({ devEngines: { runtime: { ...rt, onFail: 'warn' } } }).error, /onFail/);
});
