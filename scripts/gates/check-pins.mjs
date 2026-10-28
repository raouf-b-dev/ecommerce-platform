#!/usr/bin/env node
/**
 * Keep versions.json, .env.example, README matrix, and CHANGELOG pins in sync,
 * package.json engines.node in step with the .nvmrc Node major, and any npm
 * version hard-coded in workflows or docs in step with devEngines.packageManager.
 *
 * Source of truth: versions.json
 * Apply with: npm run sync-pins   or   npm run bump -- <app> <x.y.z>
 */
import fs from 'node:fs';
import path from 'node:path';
import { APPS, envKey, findNpmPinDrift, readNpmPin, readVersions } from '../lib/versions.mjs';
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

function readReadmeReleaseLinks() {
  const text = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  const specs = [
    ['api', 'ecommerce-store-api'],
    ['admin', 'ecommerce-admin-dashboard'],
    ['web', 'ecommerce-store-web'],
  ];
  const out = {};
  for (const [app, repo] of specs) {
    const re = new RegExp(
      String.raw`\[v` +
        SEMVER +
        String.raw`\]\(https://github\.com/raouf-b-dev/` +
        repo +
        String.raw`/releases/tag/v` +
        SEMVER +
        String.raw`\)`,
    );
    const match = text.match(re);
    if (!match) {
      throw new Error(`README release link for ${repo} not found`);
    }
    if (match[1] !== match[2]) {
      throw new Error(
        `README release link for ${repo}: label v${match[1]} != href v${match[2]}`,
      );
    }
    out[app] = match[1];
  }
  return out;
}

function checkNodePin() {
  const nvmrc = fs.readFileSync(path.join(root, '.nvmrc'), 'utf8').trim();
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const engine = pkg.engines?.node ?? '';
  const match = engine.match(/^>=(\d+)\.0\.0$/);
  if (!/^\d+$/.test(nvmrc)) return `.nvmrc must be a bare Node major, got "${nvmrc}"`;
  if (!match || match[1] !== nvmrc) {
    return `node: .nvmrc=${nvmrc} package.json engines.node="${engine}" (want ">=${nvmrc}.0.0")`;
  }
  return null;
}

function npmPinFiles() {
  const files = {};
  const add = (rel) => {
    const abs = path.join(root, rel);
    if (fs.existsSync(abs)) files[rel] = fs.readFileSync(abs, 'utf8');
  };
  for (const dir of ['.github/workflows', '.github/actions/setup-platform']) {
    const abs = path.join(root, dir);
    if (!fs.existsSync(abs)) continue;
    for (const name of fs.readdirSync(abs).sort()) {
      if (/\.ya?ml$/.test(name)) add(`${dir}/${name}`);
    }
  }
  for (const rel of ['README.md', 'docs/README.md', 'CONTRIBUTING.md']) add(rel);
  return files;
}

function checkNpmPin() {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const pin = readNpmPin(pkg);
  if (pin.error) return { errors: [pin.error] };
  return { version: pin.version, errors: findNpmPinDrift(pin.version, npmPinFiles()) };
}

const env = readEnvExample();
const readme = readReadmePins();
const readmeReleases = readReadmeReleaseLinks();
const changelog = readChangelogPins();
const errors = [];
const nodeError = checkNodePin();
if (nodeError) errors.push(nodeError);
const npmPin = checkNpmPin();
errors.push(...npmPin.errors);

for (const app of APPS) {
  const want = versions[app];
  for (const [label, got] of [
    ['.env.example', env[app]],
    ['README', readme[app]],
    ['README release link', readmeReleases[app]],
    ['CHANGELOG', changelog[app]],
  ]) {
    if (got !== want) {
      errors.push(`${app}: versions.json=${want} ${label}=${got}`);
    }
  }
}

if (errors.length > 0) {
  process.stderr.write(
    `check-pins: mismatch\n${errors.join('\n')}\nfix: edit versions.json then npm run sync-pins (Node: align .nvmrc and engines.node; npm: devEngines.packageManager.version is the only npm pin)\n`,
  );
  process.exit(1);
}

process.stdout.write(
  `check-pins: ok node=${fs.readFileSync(path.join(root, ".nvmrc"), "utf8").trim()} npm=${npmPin.version} api=${versions.api} admin=${versions.admin} web=${versions.web}\n`,
);
