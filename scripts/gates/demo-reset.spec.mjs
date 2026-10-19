import assert from 'node:assert/strict';
import test from 'node:test';
import { planDemoReset, runDemoReset } from './demo-reset.mjs';

test('planDemoReset skips when env is unset', () => {
  const plan = planDemoReset({ baseUrl: '', token: '' });
  assert.equal(plan.action, 'skip');
});

test('planDemoReset skips disabled sentinel', () => {
  const plan = planDemoReset({
    baseUrl: 'disabled',
    token: 'x'.repeat(32),
  });
  assert.equal(plan.action, 'skip');
});

test('planDemoReset skips example placeholder origin', () => {
  const plan = planDemoReset({
    baseUrl: 'https://api.example.com',
    token: 'x'.repeat(32),
  });
  assert.equal(plan.action, 'skip');
});

test('planDemoReset rejects short token and non-https', () => {
  assert.equal(
    planDemoReset({ baseUrl: 'https://api.real.example', token: 'short' }).action,
    'error',
  );
  assert.equal(
    planDemoReset({ baseUrl: 'http://api.real.example', token: 'x'.repeat(32) }).action,
    'error',
  );
});

test('planDemoReset accepts a real https origin', () => {
  const plan = planDemoReset({
    baseUrl: 'https://api.real.example/',
    token: 'x'.repeat(32),
  });
  assert.equal(plan.action, 'post');
  assert.equal(plan.url, 'https://api.real.example/v1/admin/demo/reset');
});

test('runDemoReset dry-run does not call curl', () => {
  let called = false;
  const result = runDemoReset({
    baseUrl: 'https://api.real.example',
    token: 'x'.repeat(32),
    dryRun: true,
    curl: () => {
      called = true;
      return { ok: true };
    },
  });
  assert.equal(result.code, 0);
  assert.equal(called, false);
  assert.match(result.message, /dry-run OK/);
});

test('runDemoReset skip exits 0 without curl', () => {
  let called = false;
  const result = runDemoReset({
    baseUrl: '',
    token: '',
    curl: () => {
      called = true;
      return { ok: true };
    },
  });
  assert.equal(result.code, 0);
  assert.equal(called, false);
  assert.match(result.message, /^Skipping:/);
});
