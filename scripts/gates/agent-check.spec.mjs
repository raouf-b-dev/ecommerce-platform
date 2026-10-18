import assert from 'node:assert/strict';
import test from 'node:test';
import { isComposeTouch, isDoc, selectPlatformCommands } from './agent-output.mjs';

test('isDoc recognizes README', () => {
  assert.equal(isDoc('README.md'), true);
});

test('isComposeTouch recognizes compose and env example', () => {
  assert.equal(isComposeTouch('compose.yaml'), true);
  assert.equal(isComposeTouch('.env.example'), true);
});

test('docs-only plan still runs ascii', () => {
  const plan = selectPlatformCommands(['README.md'], ['README.md']);
  assert.ok(plan.commands.some(([label]) => label === 'ascii-prose'));
});

test('compose touch plan uses compose-config script (no shell &&)', () => {
  const plan = selectPlatformCommands(['compose.yaml'], ['compose.yaml']);
  const compose = plan.commands.find(([label]) => label === 'compose config');
  assert.ok(compose);
  assert.equal(compose[1], 'node scripts/compose/compose-config.mjs');
});

test('isComposeTouch recognizes config and overrides', () => {
  assert.equal(isComposeTouch('config/observability/prometheus.yml'), true);
  assert.equal(isComposeTouch('overrides/compose.override.example.yaml'), true);
});
