import { spawnSync } from 'node:child_process';

/**
 * Spawn without shell (avoids Windows DEP0190). Pass argv as an array.
 */
export function runArgv(command, args = [], options = {}) {
  const { stdio, ...rest } = options;
  const opts = {
    windowsHide: true,
    shell: false,
    maxBuffer: 32 * 1024 * 1024,
    ...rest,
  };
  if (stdio) {
    opts.stdio = stdio;
  } else {
    opts.encoding = 'utf8';
  }
  const result = spawnSync(command, args, opts);
  if (result.error) {
    return { ok: false, status: 1, stdout: '', stderr: result.error.message, error: result.error };
  }
  return {
    ok: result.status === 0,
    status: result.status ?? 1,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    error: null,
  };
}

export function runDocker(args, options = {}) {
  return runArgv('docker', args, options);
}

export function hasCommand(name) {
  const probe = process.platform === 'win32' ? 'where' : 'which';
  return runArgv(probe, [name]).ok;
}

export function hasYamllint() {
  return hasCommand('yamllint');
}
