import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { readVersions, writeVersions } from './versions.mjs';

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
