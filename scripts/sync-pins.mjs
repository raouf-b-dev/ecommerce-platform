#!/usr/bin/env node
/**
 * Apply versions.json to .env.example, README version matrix, and CHANGELOG pin sentence.
 * Source of truth: versions.json. Run after editing it, or use `npm run bump`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { APPS, envKey, readVersions } from './lib/versions.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const versions = readVersions(root);

function syncEnvExample() {
  const file = path.join(root, '.env.example');
  let text = fs.readFileSync(file, 'utf8');
  for (const app of APPS) {
    const key = envKey(app);
    const re = new RegExp(`^${key}=\\S+`, 'm');
    if (!re.test(text)) {
      throw new Error(`.env.example: missing ${key}`);
    }
    text = text.replace(re, `${key}=${versions[app]}`);
  }
  fs.writeFileSync(file, text, 'utf8');
}

function syncReadme() {
  const file = path.join(root, 'README.md');
  let text = fs.readFileSync(file, 'utf8');
  const rows = [
    ['API', 'ECOM_API_VERSION', versions.api],
    ['Admin dashboard', 'ECOM_ADMIN_VERSION', versions.admin],
    ['Storefront', 'ECOM_WEB_VERSION', versions.web],
  ];
  for (const [label, key, ver] of rows) {
    const re = new RegExp(
      `(\\|\\s*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\|\\s*\`${key}\`\\s*\\|\\s*)(\\d+\\.\\d+\\.\\d+)(\\s*\\|)`,
    );
    if (!re.test(text)) {
      throw new Error(`README.md: missing pinned cell for ${key}`);
    }
    text = text.replace(re, `$1${ver}$3`);
  }
  // Release column links: /tag/vX.Y.Z (best effort)
  text = text.replace(
    /(ecommerce-store-api\/releases\/tag\/v)\d+\.\d+\.\d+/,
    `$1${versions.api}`,
  );
  text = text.replace(
    /(ecommerce-admin-dashboard\/releases\/tag\/v)\d+\.\d+\.\d+/,
    `$1${versions.admin}`,
  );
  text = text.replace(
    /(ecommerce-store-web\/releases\/tag\/v)\d+\.\d+\.\d+/,
    `$1${versions.web}`,
  );
  fs.writeFileSync(file, text, 'utf8');
}

function syncChangelog() {
  const file = path.join(root, 'CHANGELOG.md');
  let text = fs.readFileSync(file, 'utf8');
  const sentence = `Pins ecommerce-store-api ${versions.api}, ecommerce-admin-dashboard ${versions.admin} and ecommerce-store-web ${versions.web}.`;
  const re =
    /Pins ecommerce-store-api \d+\.\d+\.\d+, ecommerce-admin-dashboard \d+\.\d+\.\d+ and ecommerce-store-web \d+\.\d+\.\d+\./;
  if (!re.test(text)) {
    throw new Error('CHANGELOG.md: missing pin sentence');
  }
  text = text.replace(re, sentence);
  fs.writeFileSync(file, text, 'utf8');
}

syncEnvExample();
syncReadme();
syncChangelog();
process.stdout.write(
  `sync-pins: ok api=${versions.api} admin=${versions.admin} web=${versions.web}\n`,
);
