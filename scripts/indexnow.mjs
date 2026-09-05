// scripts/indexnow.mjs
// Pings IndexNow (Bing, Yandex, Seznam, Naver — NOT Google, which ignores it)
// after a deploy, so a car the Telegram bot just published gets crawled in
// minutes instead of whenever the crawler next wanders by.
//
//   node scripts/indexnow.mjs <changed files…>   submit the URLs those files affect
//   node scripts/indexnow.mjs --all              submit every URL in the sitemap
//   node scripts/indexnow.mjs --dry-run …        print what it would submit, send nothing
//
// The key is public by design: engines fetch https://dixieauto.land/<KEY>.txt and
// check it contains the same string, which is how they know the submitter owns
// the host. Nothing here is a secret, so there is nothing to configure in GitHub.
//
// The list of URLs that actually exist comes from the LIVE sitemap rather than
// from a build, so this runs after the Pages deploy is finished — a URL is only
// submitted once it is really there to be crawled.
const SITE = 'https://dixieauto.land';
const KEY = '51800d05bd9719cabe5ab9ca2b7531ab';
const ENDPOINT = 'https://api.indexnow.org/indexnow';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const all = args.includes('--all');
const changed = args.filter((a) => !a.startsWith('--'));

/** Every URL the site currently publishes, straight from /sitemap.xml. */
async function liveUrls() {
  const res = await fetch(`${SITE}/sitemap.xml`, { headers: { 'User-Agent': 'dixieauto.land indexnow' } });
  if (!res.ok) throw new Error(`sitemap fetch failed: ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

/**
 * Which URLs a changed file affects. Returns paths (or a prefix match via '*')
 * that are then intersected with the live sitemap, so a typo or a deleted page
 * can never be submitted.
 */
function urlsFor(file) {
  // A vehicle's own page, plus the two pages that list it.
  const vehicle = file.match(/^src\/content\/vehicles\/(.+)\.md$/);
  if (vehicle) return [`/inventory/${vehicle[1]}/`, '/inventory/', '/'];

  // A photo for one car — same three pages. The bot commits these alongside the
  // markdown, and they follow the -1.jpg / -1-card-800.webp naming from
  // scripts/optimize-vehicle-photos.mjs.
  const photo = file.match(/^public\/images\/vehicles\/(.+?)-\d+(?:-card)?(?:-\d+)?\.(?:jpg|webp|png)$/);
  if (photo) return [`/inventory/${photo[1]}/`, '/inventory/', '/'];

  // Templates and data that fan out over a whole section.
  if (file === 'src/pages/inventory/[slug].astro') return ['/inventory/*'];
  if (file === 'src/pages/service-areas/[slug].astro' || file === 'src/data/towns.js') return ['/service-areas/*'];

  // A plain page maps to its own route: src/pages/about.astro -> /about/
  const page = file.match(/^src\/pages\/(.+)\.astro$/);
  if (page && !page[1].includes('[')) return [`/${page[1].replace(/(^|\/)index$/, '')}/`.replace('//', '/')];

  // Not part of the built site.
  if (/^(bot|legacy-v1|scripts|node_modules)\//.test(file)) return [];
  if (/^[^/]+\.md$/.test(file)) return [];

  // Layout, component, style, business.js, config, public asset: assume site-wide.
  return ['*'];
}

function selectUrls(sitemap) {
  if (all) return sitemap;
  const wanted = new Set(changed.flatMap(urlsFor));
  if (wanted.has('*')) return sitemap;
  return sitemap.filter((url) => {
    const path = url.slice(SITE.length);
    return [...wanted].some((w) => (w.endsWith('*') ? path.startsWith(w.slice(0, -1)) : path === w));
  });
}

const sitemap = await liveUrls();
const urlList = selectUrls(sitemap);

if (urlList.length === 0) {
  console.log('IndexNow: nothing to submit for these changes.');
  process.exit(0);
}

console.log(`IndexNow: ${urlList.length} URL(s)\n${urlList.map((u) => `  ${u}`).join('\n')}`);

if (dryRun) process.exit(0);

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(SITE).host, key: KEY, urlList }),
});

// 200 accepted, 202 accepted but key still being verified. Anything else is a
// warning, never a failed deploy — the site is already live at this point.
console.log(`IndexNow: ${res.status} ${res.statusText}`);
if (!res.ok) console.log(await res.text());
