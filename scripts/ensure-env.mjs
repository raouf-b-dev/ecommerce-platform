#!/usr/bin/env node
/**
 * Ensure .env exists (copy from .env.example when missing). Idempotent.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function ensureEnv(repoRoot = root) {
  const envPath = path.join(repoRoot, '.env');
  const examplePath = path.join(repoRoot, '.env.example');
  if (!fs.existsSync(envPath)) {
    fs.copyFileSync(examplePath, envPath);
    process.stdout.write('created .env from .env.example\n');
  }
}

const entry = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (entry === fileURLToPath(import.meta.url)) {
  ensureEnv();
}
