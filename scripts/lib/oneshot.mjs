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
