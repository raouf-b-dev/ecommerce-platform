#!/usr/bin/env node
/**
 * Call POST /v1/admin/demo/reset for the hybrid hosted demo.
 * Used by .github/workflows/demo-reset.yml. Safe when unset: exit 0.
 *
 *   DEMO_API_BASE_URL=https://api.example.com DEMO_RESET_TOKEN=... node scripts/gates/demo-reset.mjs
 *   node scripts/gates/demo-reset.mjs --dry-run   # config check only (no HTTP)
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TOKEN_MIN = 32;
const PLACEHOLDER_ORIGIN = 'https://api.example.com';
const DISABLED_SENTINEL = 'disabled';

export function planDemoReset({
  baseUrl = process.env.DEMO_API_BASE_URL,
  token = process.env.DEMO_RESET_TOKEN,
} = {}) {
  const origin = String(baseUrl || '')
    .trim()
    .replace(/\/+$/, '');
  const resetToken = String(token || '').trim();

  if (!origin || origin.toLowerCase() === DISABLED_SENTINEL || !resetToken) {
    return {
      action: 'skip',
      reason: 'DEMO_API_BASE_URL or DEMO_RESET_TOKEN is not configured.',
    };
  }

  if (origin.toLowerCase() === PLACEHOLDER_ORIGIN) {
    return {
      action: 'skip',
      reason: 'DEMO_API_BASE_URL is still the example placeholder.',
    };
  }

  if (resetToken.length < TOKEN_MIN) {
    return {
      action: 'error',
      reason: `DEMO_RESET_TOKEN must be at least ${TOKEN_MIN} characters.`,
    };
  }

  if (!/^https:\/\//i.test(origin)) {
    return {
      action: 'error',
      reason: 'DEMO_API_BASE_URL must be an https origin.',
    };
  }

  return {
    action: 'post',
    url: `${origin}/v1/admin/demo/reset`,
  };
}

export function runDemoReset({
  baseUrl = process.env.DEMO_API_BASE_URL,
  token = process.env.DEMO_RESET_TOKEN,
  dryRun = false,
  curl = defaultCurl,
} = {}) {
  const plan = planDemoReset({ baseUrl, token });
  if (plan.action === 'skip') {
    return { code: 0, message: `Skipping: ${plan.reason}` };
  }
  if (plan.action === 'error') {
    return { code: 1, message: plan.reason };
  }
  if (dryRun) {
    return { code: 0, message: `demo-reset: dry-run OK would POST ${plan.url}` };
  }
  const result = curl(plan.url, String(token).trim());
  if (!result.ok) {
    return {
      code: result.code || 1,
      message: result.message || 'demo-reset: request failed',
    };
  }
  return { code: 0, message: 'Demo reset request completed.' };
}

function defaultCurl(url, token) {
  const result = spawnSync(
    'curl',
    [
      '--fail',
      '--silent',
      '--show-error',
      '-X',
      'POST',
      '-H',
      `X-Demo-Reset-Token: ${token}`,
      '-H',
      'Accept: application/json',
      url,
    ],
    { encoding: 'utf8', windowsHide: true },
  );
  if (result.error) {
    return { ok: false, code: 1, message: result.error.message };
  }
  if ((result.status ?? 1) !== 0) {
    const detail = `${result.stderr || ''}${result.stdout || ''}`.trim();
    return {
      ok: false,
      code: result.status ?? 1,
      message: detail || `demo-reset: curl exited ${result.status}`,
    };
  }
  return { ok: true };
}

const entry = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (entry === fileURLToPath(import.meta.url)) {
  const dryRun = process.argv.includes('--dry-run');
  const result = runDemoReset({ dryRun });
  process.stdout.write(`${result.message}\n`);
  process.exit(result.code);
}
