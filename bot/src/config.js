// bot/src/config.js — environment loading and hard validation.
// Every misconfiguration that could publish to the live site is caught here,
// at startup, rather than halfway through a listing.

function required(name, hint) {
  const v = process.env[name]?.trim();
  if (!v) {
    console.error(`\n  Missing ${name} in bot/.env\n  ${hint}\n`);
    process.exit(1);
  }
  return v;
}

const ownerIds = required(
  'TELEGRAM_OWNER_IDS',
  'Your numeric Telegram user ID. Message @userinfobot to get it.'
)
  .split(',')
  .map((s) => Number(s.trim()))
  .filter((n) => Number.isInteger(n) && n > 0);

if (!ownerIds.length) {
  console.error('\n  TELEGRAM_OWNER_IDS contained no valid numeric IDs.\n');
  process.exit(1);
}

export const config = {
  botToken: required('TELEGRAM_BOT_TOKEN', 'Get one from @BotFather.'),
  ownerIds,
  github: {
    token: required('GITHUB_TOKEN', 'Fine-grained PAT with Contents: Read and write.'),
    owner: required('GITHUB_OWNER', 'e.g. bisobo7'),
    repo: required('GITHUB_REPO', 'e.g. bisobo7.github.io'),
    branch: process.env.GITHUB_BRANCH?.trim() || 'main',
  },
  siteUrl: (process.env.SITE_URL?.trim() || 'https://dixieauto.land').replace(/\/$/, ''),

  // Where listings and their photos land in the repo.
  vehicleDir: 'src/content/vehicles',
  photoDir: 'public/images/vehicles',

  // Abandoned drafts expire so a half-finished car doesn't linger for days.
  draftTtlMs: 6 * 60 * 60 * 1000,
};

export const isOwner = (id) => config.ownerIds.includes(id);
