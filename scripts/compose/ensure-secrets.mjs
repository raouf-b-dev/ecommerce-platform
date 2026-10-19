#!/usr/bin/env node
/**
 * Ensure .secrets exists from .secrets.example (GitHub Actions secret staging).
 * Generates DEMO_RESET_TOKEN when the template leaves it empty.
 *
 *   npm run env:init:secrets
 *   npm run env:init:secrets -- --force
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REPO_ROOT } from '../lib/repo-root.mjs';

const DEMO_RESET_TOKEN_MIN = 32;

export function ensureSecrets(repoRoot = REPO_ROOT, { force = false, quiet = false } = {}) {
  const examplePath = path.join(repoRoot, '.secrets.example');
  const secretsPath = path.join(repoRoot, '.secrets');

  if (!fs.existsSync(examplePath)) {
    throw new Error('.secrets.example missing');
  }

  const template = fs.readFileSync(examplePath, 'utf8');
  const templateKeys = kvKeys(template);
  if (templateKeys.length === 0) {
    throw new Error('.secrets.example has no KEY=value lines');
  }

  const exists = fs.existsSync(secretsPath);
  if (exists && !force) {
    if (!quiet) {
      process.stdout.write(
        'env:init:secrets: .secrets already present (use --force to overwrite)\n',
      );
    }
    const missing = templateKeys.filter(
      (key) => !Object.hasOwn(parseKv(fs.readFileSync(secretsPath, 'utf8')), key),
    );
    if (missing.length > 0) {
      process.stderr.write(
        `env:init:secrets: .secrets is missing keys: ${missing.join(', ')}. ` +
          'Copy them from .secrets.example by hand, or npm run env:init:secrets -- --force ' +
          '(regenerates DEMO_RESET_TOKEN; update GitHub Secrets afterwards).\n',
      );
    }
    return { created: false, overwritten: false, missing };
  }

  const body = buildSecretsFile(template);
  fs.writeFileSync(secretsPath, body, 'utf8');
  if (!quiet) {
    process.stdout.write(
      exists
        ? 'env:init:secrets: overwrote .secrets from .secrets.example\n'
        : 'env:init:secrets: created .secrets from .secrets.example\n',
    );
    process.stdout.write(
      'env:init:secrets: set GitHub Actions variable DEMO_API_BASE_URL and secret DEMO_RESET_TOKEN when the API is live.\n',
    );
    process.stdout.write(
      'env:init:secrets: set the same DEMO_RESET_TOKEN on the VM .env (see docs/HOSTED-DEMO.md).\n',
    );
  }
  return { created: !exists, overwritten: exists, missing: [] };
}

export function buildSecretsFile(template) {
  const lines = template.replaceAll('\r\n', '\n').split('\n');
  const out = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      return line;
    }
    const eq = trimmed.indexOf('=');
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (key === 'DEMO_RESET_TOKEN' && value.trim().length < DEMO_RESET_TOKEN_MIN) {
      return `DEMO_RESET_TOKEN=${crypto.randomBytes(48).toString('base64url')}`;
    }
    return line;
  });
  let text = out.join('\n');
  if (!text.endsWith('\n')) text += '\n';
  return text;
}

function parseKv(raw) {
  const out = {};
  for (const line of raw.replaceAll('\r\n', '\n').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const eq = trimmed.indexOf('=');
    out[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return out;
}

function kvKeys(raw) {
  return Object.keys(parseKv(raw));
}

const entry = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (entry === fileURLToPath(import.meta.url)) {
  const force = process.argv.includes('--force') || process.argv.includes('--overwrite');
  try {
    ensureSecrets(REPO_ROOT, { force });
  } catch (err) {
    process.stderr.write(`env:init:secrets: ${err.message || err}\n`);
    process.exit(1);
  }
}
