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

/**
 * Read the pinned npm version from package.json devEngines.packageManager.
 * Returns { version } or { error }.
 */
export function readNpmPin(pkg) {
  const pm = pkg?.devEngines?.packageManager;
  if (!pm || pm.name !== 'npm' || !SEMVER.test(String(pm.version || ''))) {
    return { error: 'npm: package.json devEngines.packageManager must be { name: "npm", version: "x.y.z" }' };
  }
  if (pm.onFail !== 'error') {
    return { error: `npm: devEngines.packageManager.onFail="${pm.onFail}" (want "error")` };
  }
  return { version: pm.version };
}

/**
 * Find npm versions hard-coded in workflow or doc text that drift from the pin.
 * Matches `npm@x.y.z` and `npm x.y.z` (word boundary, case-sensitive).
 * @param {string} pinned
 * @param {Record<string, string>} files name -> text
 * @returns {string[]} errors
 */
export function findNpmPinDrift(pinned, files) {
  const errors = [];
  const re = /\bnpm(?:@| )(\d+\.\d+\.\d+)\b/g;
  for (const [name, text] of Object.entries(files)) {
    for (const match of text.matchAll(re)) {
      if (match[1] !== pinned) {
        errors.push(`npm: ${name} pins npm ${match[1]} (devEngines.packageManager.version=${pinned})`);
      }
    }
  }
  return errors;
}

/**
 * Check devEngines.runtime against engines.node. npm 12 does not enforce root
 * engines.node (even with engine-strict), so devEngines.runtime is the guard.
 * @returns {string|null} error
 */
export function checkNodeRuntimePin(pkg) {
  const rt = pkg?.devEngines?.runtime;
  const engine = pkg?.engines?.node ?? '';
  if (!rt || rt.name !== 'node' || rt.onFail !== 'error') {
    return 'node: package.json devEngines.runtime must be { name: "node", version: <engines.node>, onFail: "error" }';
  }
  if (rt.version !== engine) {
    return `node: devEngines.runtime.version="${rt.version}" engines.node="${engine}" (want equal)`;
  }
  return null;
}
