#!/usr/bin/env node
/**
 * HTTP probes against a running platform stack (API, admin, storefront)
 * and one-shot exit checks. Used by CI Smoke Test and `npm run smoke`.
 *
 * Expects the stack already up (`docker compose up -d --wait`).
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findServiceRow, isOneShotSuccess } from './lib/oneshot.mjs';
import { runDocker } from './lib/run.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvFile() {
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env missing; copy .env.example first');
  }
  const out = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    out[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return out;
}

function listComposeRows() {
  const result = runDocker(['compose', '--profile', '*', 'ps', '-a', '--format', 'json'], {
    cwd: root,
  });
  if (!result.ok) {
    throw new Error(`docker compose ps failed: ${result.stderr || result.stdout}`);
  }
  return (result.stdout || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function assertOneShotOk(name, rows) {
  const row = findServiceRow(rows, name);
  if (!row) throw new Error(`service ${name} not found in compose ps`);
  if (!isOneShotSuccess(row)) {
    throw new Error(
      `${name} not Exited (0): ExitCode=${row.ExitCode} State=${row.State} Status=${row.Status}`,
    );
  }
}

async function probe(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, redirect: 'follow' });
    return { ok: res.ok, status: res.status };
  } finally {
    clearTimeout(timer);
  }
}

function runCheckResolved() {
  const result = spawnSync(process.execPath, ['scripts/check-resolved.mjs'], {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
  });
  if ((result.status ?? 1) !== 0) {
    throw new Error((result.stderr || result.stdout || 'check-resolved failed').trim());
  }
}

async function main() {
  const started = Date.now();
  const results = [];

  process.stdout.write('smoke: check-resolved\n');
  runCheckResolved();
  results.push(['resolved-config', 'ok']);

  const env = loadEnvFile();
  const apiPort = env.API_PORT || '3000';
  const adminPort = env.ADMIN_PORT || '5174';
  const webPort = env.WEB_PORT || '3100';

  const probes = [
    { name: 'api-liveness', url: `http://127.0.0.1:${apiPort}/health/liveness` },
    { name: 'api-readiness', url: `http://127.0.0.1:${apiPort}/health/readiness` },
    { name: 'admin', url: `http://127.0.0.1:${adminPort}/` },
    { name: 'web-icon', url: `http://127.0.0.1:${webPort}/icon.svg` },
  ];

  process.stdout.write('smoke: probing HTTP endpoints\n');
  for (const p of probes) {
    const result = await probe(p.url);
    if (!result.ok) {
      process.stderr.write(`smoke: fail ${p.name} ${p.url} status=${result.status}\n`);
      process.exit(1);
    }
    process.stdout.write(`smoke: ok ${p.name} (${result.status})\n`);
    results.push([p.name, String(result.status)]);
  }

  process.stdout.write('smoke: checking one-shot services\n');
  const rows = listComposeRows();
  for (const name of ['jwt-keygen', 'migrate', 'seed']) {
    assertOneShotOk(name, rows);
    process.stdout.write(`smoke: ok ${name} Exited (0)\n`);
    results.push([name, 'exited(0)']);
  }

  const ms = Date.now() - started;
  process.stdout.write('\nsmoke summary\n');
  for (const [name, detail] of results) {
    process.stdout.write(`  ${name.padEnd(16)} ${detail}\n`);
  }
  process.stdout.write(`smoke: ok (${ms}ms)\n`);
}

main().catch((err) => {
  process.stderr.write(`smoke: ${err.message || err}\n`);
  process.exit(1);
});
