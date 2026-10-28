#!/usr/bin/env node
/**
 * Weekly Node.js LTS watchdog for the four ecommerce repos.
 * Used by .github/workflows/node-lts-watch.yml.
 *
 * Exit 1: schedule.json unreadable/unexpected, or a repo's .nvmrc major is past
 * end of life. Otherwise prints findings (Maintenance LTS while a newer LTS is
 * Active, end of life within 90 days, majors drift) and writes them as a
 * Markdown issue body to $NODE_LTS_REPORT when set.
 *
 *   node scripts/gates/node-lts-watch.mjs
 *   NODE_LTS_TODAY=2027-11-01 node scripts/gates/node-lts-watch.mjs   # simulate a date
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REPO_ROOT } from '../lib/repo-root.mjs';

const SCHEDULE_URL = 'https://raw.githubusercontent.com/nodejs/Release/main/schedule.json';
const APP_REPOS = ['ecommerce-store-api', 'ecommerce-admin-dashboard', 'ecommerce-store-web'];
const OWNER = 'raouf-b-dev';
const BRANCH = 'master';
const EOL_WARN_DAYS = 90;
const DAY_MS = 86_400_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Validate schedule.json and return { major: { lts?, maintenance?, end } } as Dates. */
export function parseSchedule(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('schedule.json: expected an object keyed by "vNN"');
  }
  const out = {};
  for (const [key, entry] of Object.entries(raw)) {
    const major = key.match(/^v(\d+)$/)?.[1];
    if (!major) continue; // skip v0.x lines
    if (!ISO_DATE.test(entry?.end ?? '')) {
      throw new Error(`schedule.json: ${key} has no valid "end" date`);
    }
    const dates = {};
    for (const field of ['lts', 'maintenance', 'end']) {
      if (entry[field] === undefined) continue;
      if (!ISO_DATE.test(entry[field])) {
        throw new Error(`schedule.json: ${key}.${field} is not YYYY-MM-DD`);
      }
      dates[field] = new Date(`${entry[field]}T00:00:00Z`);
    }
    out[major] = dates;
  }
  if (Object.keys(out).length === 0) throw new Error('schedule.json: no release lines found');
  return out;
}

const isActiveLts = (d, today) =>
  d.lts && d.lts <= today && (!d.maintenance || today < d.maintenance) && today < d.end;

/**
 * @param {{ schedule: ReturnType<typeof parseSchedule>, majors: Record<string, string | null>, today: Date }} input
 * @returns {{ failures: string[], warnings: string[] }}
 */
export function evaluate({ schedule, majors, today }) {
  const failures = [];
  const warnings = [];
  const activeLts = Object.keys(schedule)
    .filter((m) => isActiveLts(schedule[m], today))
    .map(Number);
  const newestActive = activeLts.length ? Math.max(...activeLts) : null;

  for (const [repo, major] of Object.entries(majors)) {
    if (major === null) {
      warnings.push(`${repo}: no .nvmrc on ${BRANCH}`);
      continue;
    }
    const d = schedule[major];
    if (!/^\d+$/.test(major) || !d) {
      failures.push(`${repo}: .nvmrc "${major}" is not a known Node major`);
      continue;
    }
    const daysLeft = Math.floor((d.end - today) / DAY_MS);
    if (daysLeft < 0) {
      failures.push(`${repo}: Node ${major} reached end of life on ${iso(d.end)}`);
      continue;
    }
    if (daysLeft <= EOL_WARN_DAYS) {
      warnings.push(`${repo}: Node ${major} reaches end of life on ${iso(d.end)} (${daysLeft} ${daysLeft === 1 ? 'day' : 'days'})`);
    }
    if (!d.lts || d.lts > today) {
      const hint = newestActive !== null ? ` (Node ${newestActive})` : '';
      warnings.push(`${repo}: Node ${major} is not an LTS line yet (Current); pin the Active LTS${hint}`);
    }
    if (d.maintenance && d.maintenance <= today && newestActive > Number(major)) {
      warnings.push(`${repo}: Node ${major} is in Maintenance LTS; Node ${newestActive} is Active LTS`);
    }
  }

  const distinct = [...new Set(Object.values(majors).filter((m) => m !== null))];
  if (distinct.length > 1) {
    const list = Object.entries(majors).map(([r, m]) => `${r}=${m ?? 'none'}`).join(', ');
    warnings.push(`.nvmrc majors differ: ${list}`);
  }
  return { failures, warnings };
}

const iso = (date) => date.toISOString().slice(0, 10);

async function fetchText(url) {
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET ${url}: HTTP ${res.status}`);
  return res.text();
}

async function main() {
  const rawSchedule = await fetchText(SCHEDULE_URL);
  if (rawSchedule === null) throw new Error(`GET ${SCHEDULE_URL}: HTTP 404`);
  const schedule = parseSchedule(JSON.parse(rawSchedule));

  const majors = {
    'ecommerce-platform': fs.readFileSync(path.join(REPO_ROOT, '.nvmrc'), 'utf8').trim(),
  };
  for (const repo of APP_REPOS) {
    const text = await fetchText(`https://raw.githubusercontent.com/${OWNER}/${repo}/${BRANCH}/.nvmrc`);
    majors[repo] = text === null ? null : text.trim().replace(/^v/, '').split('.')[0];
  }

  const today = new Date(`${process.env.NODE_LTS_TODAY || iso(new Date())}T00:00:00Z`);
  const { failures, warnings } = evaluate({ schedule, majors, today });

  process.stdout.write(`node-lts-watch: ${iso(today)} ${JSON.stringify(majors)}\n`);
  for (const line of failures) process.stdout.write(`FAIL ${line}\n`);
  for (const line of warnings) process.stdout.write(`WARN ${line}\n`);

  const findings = [...failures, ...warnings];
  if (process.env.NODE_LTS_REPORT && findings.length > 0) {
    const body = [
      `Node.js LTS watchdog findings (${iso(today)}, [schedule](${SCHEDULE_URL})):`,
      '',
      ...findings.map((line) => `- ${line}`),
      '',
      'Policy: docs/README.md "Node.js version policy". Bump `.nvmrc` in each repo.',
    ].join('\n');
    fs.writeFileSync(process.env.NODE_LTS_REPORT, `${body}\n`);
  }
  if (findings.length === 0) process.stdout.write('node-lts-watch: ok\n');
  return failures.length > 0 ? 1 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().then(
    (code) => process.exit(code),
    (error) => {
      process.stderr.write(`node-lts-watch: ${error.message}\n`);
      process.exit(1);
    },
  );
}
