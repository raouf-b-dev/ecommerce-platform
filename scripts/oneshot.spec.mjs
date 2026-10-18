import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findServiceRow,
  isContainerUp,
  isOneShotSuccess,
  parseComposePsJson,
} from './lib/oneshot.mjs';

test('isOneShotSuccess accepts ExitCode 0', () => {
  assert.equal(isOneShotSuccess({ ExitCode: 0 }), true);
  assert.equal(isOneShotSuccess({ ExitCode: '0' }), true);
});

test('isOneShotSuccess accepts Status Exited (0)', () => {
  assert.equal(isOneShotSuccess({ Status: 'Exited (0) 2 minutes ago' }), true);
});

test('isOneShotSuccess rejects non-zero', () => {
  assert.equal(isOneShotSuccess({ ExitCode: 1, Status: 'Exited (1)' }), false);
  assert.equal(isOneShotSuccess({ State: 'running' }), false);
});

test('findServiceRow matches Service or Name', () => {
  const rows = [
    { Service: 'api', Name: 'ecommerce-platform-api-1' },
    { Service: 'seed', Name: 'ecommerce-platform-seed-1', ExitCode: 0 },
  ];
  assert.equal(findServiceRow(rows, 'seed')?.Service, 'seed');
  assert.equal(findServiceRow(rows, 'missing'), undefined);
});

test('parseComposePsJson accepts NDJSON and arrays', () => {
  const ndjson = '{"Service":"api"}\n{"Service":"web"}\n';
  assert.deepEqual(parseComposePsJson(ndjson).map((r) => r.Service), ['api', 'web']);
  assert.deepEqual(parseComposePsJson('[{"Service":"api"}]').map((r) => r.Service), ['api']);
  assert.deepEqual(parseComposePsJson(''), []);
});

test('isContainerUp detects running/up', () => {
  assert.equal(isContainerUp({ State: 'running' }), true);
  assert.equal(isContainerUp({ Status: 'Up 2 minutes' }), true);
  assert.equal(isContainerUp({ State: 'exited', Status: 'Exited (0)' }), false);
});
