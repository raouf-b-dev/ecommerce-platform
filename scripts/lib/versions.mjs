import fs from 'node:fs';
import path from 'node:path';

export const ENV_KEYS = {
  api: 'ECOM_API_VERSION',
  admin: 'ECOM_ADMIN_VERSION',
  web: 'ECOM_WEB_VERSION',
};

export const APPS = ['api', 'admin', 'web'];

const SEMVER = /^\d+\.\d+\.\d+$/;

export function versionsPath(root) {
  return path.join(root, 'versions.json');
}

export function readVersions(root) {
  const raw = JSON.parse(fs.readFileSync(versionsPath(root), 'utf8'));
  for (const app of APPS) {
    if (!SEMVER.test(String(raw[app] || ''))) {
      throw new Error(`versions.json: invalid or missing ${app} (want x.y.z)`);
    }
  }
  return {
    api: raw.api,
    admin: raw.admin,
    web: raw.web,
  };
}

export function writeVersions(root, versions) {
  const next = {
    api: versions.api,
    admin: versions.admin,
    web: versions.web,
  };
  for (const app of APPS) {
    if (!SEMVER.test(next[app])) {
      throw new Error(`versions.json: invalid ${app}=${next[app]}`);
    }
  }
  fs.writeFileSync(versionsPath(root), `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  return next;
}

export function envKey(app) {
  return ENV_KEYS[app];
}
