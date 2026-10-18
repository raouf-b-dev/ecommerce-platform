/**
 * Resolve whether a compose one-shot service exited successfully.
 * Docker `ps --format json` fields vary by engine version; ExitCode is the
 * stable signal when present.
 */
export function isOneShotSuccess(row) {
  if (!row || typeof row !== 'object') return false;
  if (row.ExitCode === 0 || row.ExitCode === '0') return true;
  const blob = `${row.State || ''} ${row.Status || ''}`;
  return /exited \(0\)/i.test(blob);
}

export function findServiceRow(rows, serviceName) {
  return rows.find(
    (row) => row.Service === serviceName || String(row.Name || '').includes(`-${serviceName}-`),
  );
}

/** Parse `docker compose ps --format json` (NDJSON lines or a JSON array). */
export function parseComposePsJson(stdout) {
  const text = String(stdout || '').trim();
  if (!text) return [];
  if (text.startsWith('[')) {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  }
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

export function isContainerUp(row) {
  if (!row) return false;
  return /running/i.test(String(row.State || '')) || /up /i.test(String(row.Status || ''));
}
