#!/usr/bin/env node
/**
 * Guardrails on compose.yaml: admin/web must stay pull-only (no interim builds).
 * Walks the parsed YAML document only (comments are ignored).
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseDocument } from 'yaml';
import { REPO_ROOT } from '../lib/repo-root.mjs';

const text = fs.readFileSync(path.join(REPO_ROOT, 'compose.yaml'), 'utf8');
const doc = parseDocument(text);
const data = doc.toJS();
const services = data?.services;

if (!services || typeof services !== 'object') {
  process.stderr.write('check-compose: services block missing\n');
  process.exit(1);
}

const errors = [];

for (const name of ['admin', 'web']) {
  const svc = services[name];
  if (!svc) {
    errors.push(`missing service ${name}`);
    continue;
  }
  if (svc.build != null) {
    errors.push(`${name}: must not define build (pull from GHCR only)`);
  }
  const image = String(svc.image || '');
  if (!image.includes('ghcr.io/raouf-b-dev/')) {
    errors.push(`${name}: image must be on ghcr.io/raouf-b-dev`);
  }
}

const seed = services.seed;
if (!seed) {
  errors.push('missing service seed');
} else {
  const image = String(seed.image || '');
  if (!image.includes('ecommerce-store-api-seed')) {
    errors.push('seed: image must be ghcr.io/.../ecommerce-store-api-seed');
  }
  if (hasDockerfileInline(seed)) {
    errors.push('seed: must not use dockerfile_inline');
  }
}

if (services['web-network'] != null) {
  errors.push('web-network must not exist; web uses API_INTERNAL_BASE_URL=http://api:3000');
}

for (const [name, svc] of Object.entries(services)) {
  if (hasDockerfileInline(svc)) {
    errors.push(`${name}: must not use dockerfile_inline`);
  }
}

const serialized = JSON.stringify(services);
if (serialized.includes('ADMIN_SOURCE')) {
  errors.push('services must not reference ADMIN_SOURCE');
}
if (serialized.includes('WEB_SOURCE')) {
  errors.push('services must not reference WEB_SOURCE');
}

if (errors.length > 0) {
  const unique = [...new Set(errors)];
  process.stderr.write(`check-compose: fail\n${unique.map((e) => `- ${e}`).join('\n')}\n`);
  process.exit(1);
}

process.stdout.write('check-compose: ok\n');

function hasDockerfileInline(svc) {
  if (!svc || typeof svc !== 'object') return false;
  if (svc.build && typeof svc.build === 'object' && 'dockerfile_inline' in svc.build) {
    return true;
  }
  return JSON.stringify(svc).includes('"dockerfile_inline"');
}
