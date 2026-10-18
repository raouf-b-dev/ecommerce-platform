import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { demoUrls, formatUrlLines, loadEnvFile } from './lib/env-file.mjs';

test('loadEnvFile reads ports and skips comments', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'platform-env-'));
  fs.writeFileSync(
    path.join(dir, '.env'),
    '# comment\nAPI_PORT=3001\nWEB_PORT=3101\nADMIN_PORT=5175\n',
    'utf8',
  );
  const env = loadEnvFile(dir);
  assert.equal(env.API_PORT, '3001');
  assert.deepEqual(
    demoUrls(env).map((u) => u.url),
    [
      'http://localhost:3101',
      'http://localhost:5175',
      'http://localhost:3001',
      'http://localhost:3001/api/docs',
      'http://localhost:3001/health',
    ],
  );
  assert.match(formatUrlLines(demoUrls(env)).join('\n'), /Storefront/);
});
