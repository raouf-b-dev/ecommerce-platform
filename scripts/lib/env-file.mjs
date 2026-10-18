import fs from 'node:fs';
import path from 'node:path';

export function loadEnvFile(repoRoot) {
  const envPath = path.join(repoRoot, '.env');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env missing; run npm run setup or copy .env.example to .env');
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

export function demoUrls(env) {
  const apiPort = env.API_PORT || '3000';
  const adminPort = env.ADMIN_PORT || '5174';
  const webPort = env.WEB_PORT || '3100';
  return [
    { name: 'Storefront', url: `http://localhost:${webPort}` },
    { name: 'Admin', url: `http://localhost:${adminPort}` },
    { name: 'API', url: `http://localhost:${apiPort}` },
    { name: 'API docs', url: `http://localhost:${apiPort}/api/docs` },
    { name: 'API health', url: `http://localhost:${apiPort}/health` },
  ];
}

export function formatUrlLines(urls) {
  const width = Math.max(...urls.map((u) => u.name.length));
  return urls.map((u) => `  ${u.name.padEnd(width)}  ${u.url}`);
}
