import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildSecretsFile, ensureSecrets } from './ensure-secrets.mjs';

const TEMPLATE = `# comment
DEMO_API_BASE_URL=https://api.example.com
DEMO_RESET_TOKEN=
`;

test('buildSecretsFile fills DEMO_RESET_TOKEN when empty', () => {
  const body = buildSecretsFile(TEMPLATE);
  assert.match(body, /DEMO_API_BASE_URL=https:\/\/api\.example\.com/);
  const token = body.match(/^DEMO_RESET_TOKEN=(.+)$/m)[1];
  assert.ok(token.length >= 32);
  assert.notEqual(token.trim(), '');
});

test('ensureSecrets creates .secrets once and skips without --force', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'platform-secrets-'));
  fs.writeFileSync(path.join(dir, '.secrets.example'), TEMPLATE, 'utf8');

  const first = ensureSecrets(dir, { quiet: true });
  assert.equal(first.created, true);
  const token1 = fs
    .readFileSync(path.join(dir, '.secrets'), 'utf8')
    .match(/^DEMO_RESET_TOKEN=(.+)$/m)[1];

  const second = ensureSecrets(dir, { quiet: true });
  assert.equal(second.created, false);
  assert.equal(second.overwritten, false);
  const token2 = fs
    .readFileSync(path.join(dir, '.secrets'), 'utf8')
    .match(/^DEMO_RESET_TOKEN=(.+)$/m)[1];
  assert.equal(token1, token2);

  const third = ensureSecrets(dir, { force: true, quiet: true });
  assert.equal(third.overwritten, true);
  const token3 = fs
    .readFileSync(path.join(dir, '.secrets'), 'utf8')
    .match(/^DEMO_RESET_TOKEN=(.+)$/m)[1];
  assert.notEqual(token1, token3);
});

test('ensureSecrets reports missing keys without overwrite', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'platform-secrets-miss-'));
  fs.writeFileSync(path.join(dir, '.secrets.example'), TEMPLATE, 'utf8');
  fs.writeFileSync(path.join(dir, '.secrets'), 'DEMO_API_BASE_URL=https://api.example.com\n', 'utf8');

  const result = ensureSecrets(dir, { quiet: true });
  assert.deepEqual(result.missing, ['DEMO_RESET_TOKEN']);
});
