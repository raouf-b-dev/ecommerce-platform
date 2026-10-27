import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluate, parseSchedule } from './node-lts-watch.mjs';

const schedule = parseSchedule({
  'v0.12': { start: '2015-02-06', end: '2016-12-31' },
  v22: { lts: '2024-10-29', maintenance: '2025-10-21', end: '2027-04-30' },
  v24: { lts: '2025-10-28', maintenance: '2026-10-20', end: '2028-04-30' },
  v26: { lts: '2026-10-28', maintenance: '2027-10-20', end: '2029-04-30' },
  v27: { start: '2027-04-22', end: '2030-04-30' },
});
const all = (m) => ({ a: m, b: m, c: m, d: m });
const at = (day) => new Date(`${day}T00:00:00Z`);

test('parseSchedule rejects unexpected formats', () => {
  assert.throws(() => parseSchedule([]), /expected an object/);
  assert.throws(() => parseSchedule({ v26: { lts: '2026-10-28' } }), /no valid "end"/);
  assert.throws(() => parseSchedule({ v26: { end: '2029-04-30', lts: 'soon' } }), /not YYYY-MM-DD/);
  assert.throws(() => parseSchedule({ 'v0.10': { end: '2016-10-31' } }), /no release lines/);
});

test('current Active LTS everywhere is clean', () => {
  assert.deepEqual(evaluate({ schedule, majors: all('26'), today: at('2026-10-28') }), {
    failures: [],
    warnings: [],
  });
});

test('Maintenance LTS while a newer LTS is Active warns', () => {
  const { failures, warnings } = evaluate({ schedule, majors: all('24'), today: at('2026-10-28') });
  assert.deepEqual(failures, []);
  assert.equal(warnings.length, 4);
  assert.match(warnings[0], /Node 24 is in Maintenance LTS; Node 26 is Active LTS/);
});

test('end of life within 90 days warns, past end of life fails', () => {
  const soon = evaluate({ schedule, majors: all('22'), today: at('2027-03-01') });
  assert.match(soon.warnings[0], /end of life on 2027-04-30 \(60 days\)/);
  const past = evaluate({ schedule, majors: all('22'), today: at('2027-05-01') });
  assert.equal(past.failures.length, 4);
});

test('drift, missing .nvmrc and unknown majors are reported', () => {
  const { failures, warnings } = evaluate({
    schedule,
    majors: { a: '26', b: '24', c: null, d: '99' },
    today: at('2026-10-28'),
  });
  assert.deepEqual(failures, ['d: .nvmrc "99" is not a known Node major']);
  assert.ok(warnings.includes('c: no .nvmrc on master'));
  assert.ok(warnings.some((w) => w.startsWith('.nvmrc majors differ: a=26, b=24, c=none, d=99')));
});
