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
 * Read the Node guard from package.json devEngines.runtime. npm 12 does not
 * enforce root engines.node (even with engine-strict), so this is the guard.
 * Returns { version } or { error }.
 */
export function readNodeRuntimePin(pkg) {
  const rt = pkg?.devEngines?.runtime;
  if (!rt || rt.name !== 'node' || typeof rt.version !== 'string' || rt.version === '') {
    return { error: 'node: package.json devEngines.runtime must be { name: "node", version: ">=N.0.0" }' };
  }
  if (rt.onFail !== 'error') {
    return { error: `node: devEngines.runtime.onFail="${rt.onFail}" (want "error")` };
  }
  return { version: rt.version };
}

/**
 * Check the Node pins agree: .nvmrc is a bare major N, engines.node is
 * ">=N.0.0", and devEngines.runtime.version equals engines.node.
 * @param {string} nvmrc trimmed .nvmrc contents
 * @param {object} pkg parsed package.json
 * @returns {string | null} error, or null when in sync
 */
export function checkNodePins(nvmrc, pkg) {
  if (!/^\d+$/.test(nvmrc)) return `.nvmrc must be a bare Node major, got "${nvmrc}"`;
  const engine = pkg.engines?.node;
  if (typeof engine !== 'string') return `node: package.json engines.node is missing (want ">=${nvmrc}.0.0")`;
  const match = engine.match(/^>=(\d+)\.0\.0$/);
  if (!match || match[1] !== nvmrc) {
    return `node: .nvmrc=${nvmrc} package.json engines.node="${engine}" (want ">=${nvmrc}.0.0")`;
  }
  const runtime = readNodeRuntimePin(pkg);
  if (runtime.error) return runtime.error;
  if (runtime.version !== engine) {
    return `node: devEngines.runtime.version="${runtime.version}" engines.node="${engine}" (want equal, ">=${nvmrc}.0.0")`;
  }
  return null;
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
