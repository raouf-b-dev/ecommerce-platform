#!/usr/bin/env node
/**
 * Keep versions.json, .env.example, README matrix, and CHANGELOG pins in sync.
 *
 * Source of truth: versions.json
 * Apply with: npm run sync-pins   or   npm run bump -- <app> <x.y.z>
 */
import fs from 'node:fs';
import path from 'node:path';
import { APPS, envKey, readVersions } from '../lib/versions.mjs';
import { REPO_ROOT } from '../lib/repo-root.mjs';

const root = REPO_ROOT;
const versions = readVersions(root);
const SEMVER = String.raw`(\d+\.\d+\.\d+)`;

function readEnvExample() {
  const text = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
  const out = {};
  for (const app of APPS) {
    const key = envKey(app);
    const match = text.match(new RegExp(`^${key}=(\\S+)`, 'm'));
    if (!match) throw new Error(`.env.example missing ${key}`);
    out[app] = match[1];
  }
  return out;
}

function readReadmePins() {
  const text = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  const specs = [
    ['api', 'API', 'ECOM_API_VERSION'],
    ['admin', 'Admin dashboard', 'ECOM_ADMIN_VERSION'],
    ['web', 'Storefront', 'ECOM_WEB_VERSION'],
  ];
  const out = {};
  for (const [app, label, key] of specs) {
    const re = new RegExp(
      String.raw`\|\s*` +
        label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
        String.raw`\s*\|\s*` +
        '`' +
        key +
        '`' +
        String.raw`\s*\|\s*` +
        SEMVER +
        String.raw`\s*\|`,
    );
    const match = text.match(re);
    if (!match) {
      throw new Error(`README version matrix row for ${key} not found`);
    }
    out[app] = match[1];
  }
  return out;
}

function readChangelogPins() {
  const text = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
  const match = text.match(
    new RegExp(
      String.raw`Pins ecommerce-store-api ` +
        SEMVER +
        String.raw`, ecommerce-admin-dashboard ` +
        SEMVER +
        String.raw` and ecommerce-store-web ` +
        SEMVER,
    ),
  );
  if (!match) {
    throw new Error('CHANGELOG pin sentence not found');
  }
  return { api: match[1], admin: match[2], web: match[3] };
}

const env = readEnvExample();
const readme = readReadmePins();
const changelog = readChangelogPins();
const errors = [];

for (const app of APPS) {
  const want = versions[app];
  for (const [label, got] of [
    ['.env.example', env[app]],
    ['README', readme[app]],
    ['CHANGELOG', changelog[app]],
  ]) {
    if (got !== want) {
      errors.push(`${app}: versions.json=${want} ${label}=${got}`);
    }
  }
}

if (errors.length > 0) {
  process.stderr.write(
    `check-pins: mismatch\n${errors.join('\n')}\nfix: edit versions.json then npm run sync-pins\n`,
  );
  process.exit(1);
}

process.stdout.write(
  `check-pins: ok api=${versions.api} admin=${versions.admin} web=${versions.web}\n`,
);
