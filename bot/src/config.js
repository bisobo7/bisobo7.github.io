// bot/src/config.js — environment loading and hard validation.
// Every misconfiguration that could publish to the live site is caught here,
// at startup, rather than halfway through a listing.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// We parse bot/.env ourselves rather than using node's --env-file. Two reasons:
//   1. Some Node versions' --env-file parser swallows the line FOLLOWING a
//      comment, which silently blanks exactly the variables that have an
//      explanatory comment above them. Brutal to diagnose.
//   2. --env-file resolves relative to the working directory, so `npm start`
//      only worked from inside bot/. This resolves relative to THIS file, so
//      the bot runs correctly from anywhere.
// Real environment variables still win, so hosting platforms can override.
function loadEnvFile() {
  const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env');
  let raw;
  try {
    raw = fs.readFileSync(envPath, 'utf-8');
  } catch {
    return { path: envPath, found: false };
  }

  for (let line of raw.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;

    const eq = line.indexOf('=');
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim().replace(/^export\s+/, '');
    let val = line.slice(eq + 1).trim();

    // Strip one matching pair of surrounding quotes, if present.
    const quote = val[0];
    if ((quote === '"' || quote === "'") && val.endsWith(quote) && val.length > 1) {
      val = val.slice(1, -1);
    } else {
      // Unquoted values may carry a trailing ` # comment`.
      val = val.replace(/\s+#.*$/, '').trim();
    }

    if (key && process.env[key] === undefined) process.env[key] = val;
  }
  return { path: envPath, found: true };
}

const envFile = loadEnvFile();

const REQUIRED = {
  TELEGRAM_BOT_TOKEN: 'Get one from @BotFather.',
  TELEGRAM_OWNER_IDS: 'Your numeric Telegram user ID. Message @userinfobot to get it.',
  GITHUB_TOKEN: 'Fine-grained PAT with Contents: Read and write, created as the repo owner.',
  GITHUB_OWNER: 'e.g. bisobo7',
  GITHUB_REPO: 'e.g. bisobo7.github.io',
};

const value = (name) => process.env[name]?.trim() || '';
const missing = Object.keys(REQUIRED).filter((name) => !value(name));

if (missing.length) {
  // Report EVERY missing variable at once. Reporting them one at a time is
  // misleading: if the file isn't loading, the first name printed looks like
  // the only problem when in fact nothing was read.
  const allMissing = missing.length === Object.keys(REQUIRED).length;
  console.error('\n  bot/.env is not usable.\n');

  if (allMissing) {
    console.error('  NOTHING was read from it — every variable is empty, which');
    console.error('  usually means the file itself is not being loaded:\n');
    console.error(`    Looked for: ${envFile.path}`);
    console.error(`    ${envFile.found ? 'The file EXISTS but no values were read from it.' : 'That file does NOT exist — copy .env.example to .env.'}\n`);
    console.error('    • Check you edited bot/.env and not bot/.env.example.');
    console.error('    • Each line should look like KEY=value, one per line.\n');
  } else {
    console.error('  Missing or empty:\n');
    for (const name of missing) console.error(`    ${name}\n      ${REQUIRED[name]}`);
    console.error('');
  }
  process.exit(1);
}

const ownerIds = value('TELEGRAM_OWNER_IDS')
  .split(',')
  .map((s) => Number(s.trim()))
  .filter((n) => Number.isInteger(n) && n > 0);

if (!ownerIds.length) {
  console.error(
    '\n  TELEGRAM_OWNER_IDS has a value but no valid numeric IDs in it.\n' +
    '  It should be a bare number like 123456789 — not a @username.\n' +
    '  Message @userinfobot to get yours.\n'
  );
  process.exit(1);
}

export const config = {
  botToken: value('TELEGRAM_BOT_TOKEN'),
  ownerIds,
  github: {
    token: value('GITHUB_TOKEN'),
    owner: value('GITHUB_OWNER'),
    repo: value('GITHUB_REPO'),
    branch: value('GITHUB_BRANCH') || 'main',
  },
  siteUrl: (value('SITE_URL') || 'https://dixieauto.land').replace(/\/$/, ''),

  // Where listings and their photos land in the repo.
  vehicleDir: 'src/content/vehicles',
  photoDir: 'public/images/vehicles',

  // Abandoned drafts expire so a half-finished car doesn't linger for days.
  draftTtlMs: 6 * 60 * 60 * 1000,
};

export const isOwner = (id) => config.ownerIds.includes(id);
