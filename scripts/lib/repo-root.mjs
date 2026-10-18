import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Repo root (parent of `scripts/`). Stable for any script under `scripts/**`. */
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
