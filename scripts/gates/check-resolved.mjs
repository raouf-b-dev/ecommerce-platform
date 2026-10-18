#!/usr/bin/env node
/**
 * Assert the *resolved* compose config keeps admin/web pull-only.
 * Catches regressions that only appear after variable interpolation.
 */
import { ensureEnv } from '../compose/ensure-env.mjs';
import { REPO_ROOT } from '../lib/repo-root.mjs';
import { runDocker } from '../lib/run.mjs';

ensureEnv(REPO_ROOT, { quiet: true });

const result = runDocker(['compose', 'config', '--format', 'json'], { cwd: REPO_ROOT });
if (!result.ok) {
  process.stderr.write(`check-resolved: compose config failed\n${result.stderr || result.stdout}\n`);
  process.exit(1);
}

let config;
try {
  config = JSON.parse(result.stdout);
} catch (err) {
  process.stderr.write(`check-resolved: invalid JSON from compose config\n${err.message}\n`);
  process.exit(1);
}

const services = config.services || {};
const errors = [];

for (const name of ['admin', 'web']) {
  const svc = services[name];
  if (!svc) {
    errors.push(`missing service ${name}`);
    continue;
  }
  if (svc.build != null) {
    errors.push(`${name}: resolved config still has build`);
  }
  const image = String(svc.image || '');
  if (!image.startsWith('ghcr.io/raouf-b-dev/')) {
    errors.push(`${name}: unexpected image ${image}`);
  }
}

const web = services.web;
if (web) {
  // compose config may nest env as map or list depending on engine version
  const envMap = normalizeEnv(web.environment);
  if (envMap.API_INTERNAL_BASE_URL !== 'http://api:3000') {
    errors.push(
      `web: API_INTERNAL_BASE_URL must be http://api:3000 (got ${envMap.API_INTERNAL_BASE_URL || 'missing'})`,
    );
  }
}

if (services['web-network']) {
  errors.push('web-network must not appear in resolved config');
}

if (errors.length > 0) {
  process.stderr.write(`check-resolved: fail\n${errors.map((e) => `- ${e}`).join('\n')}\n`);
  process.exit(1);
}

process.stdout.write('check-resolved: ok\n');

function normalizeEnv(environment) {
  if (!environment) return {};
  if (Array.isArray(environment)) {
    const out = {};
    for (const entry of environment) {
      const eq = String(entry).indexOf('=');
      if (eq < 0) continue;
      out[entry.slice(0, eq)] = entry.slice(eq + 1);
    }
    return out;
  }
  if (typeof environment === 'object') {
    const out = {};
    for (const [key, value] of Object.entries(environment)) {
      out[key] = value == null ? '' : String(value);
    }
    return out;
  }
  return {};
}
