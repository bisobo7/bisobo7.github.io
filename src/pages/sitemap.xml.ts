// src/pages/sitemap.xml.ts
// Hand-rolled sitemap so the site has ONE canonical /sitemap.xml (the address
// Search Console, Bing and most crawlers try first) instead of the
// sitemap-index.xml / sitemap-0.xml pair @astrojs/sitemap emits.
//
// Nothing here needs maintaining as the site grows:
//   - static pages are discovered by globbing src/pages
//   - vehicle pages come from the content collection
//   - service-area pages come from src/data/towns.js
// Add a page, it shows up. Dynamic routes ([slug]), 404 and this file are skipped.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { towns } from '../data/towns.js';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const SITE = 'https://dixieauto.land';

type Entry = {
  path: string;
  lastmod: string;
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: string;
};

const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const buildDate = isoDay(new Date());

/** Source-file mtime, so lastmod reflects real edits rather than every deploy. */
function mtime(relativeToThisFile: string): string {
  try {
    const abs = fileURLToPath(new URL(relativeToThisFile, import.meta.url));
    return isoDay(new Date(fs.statSync(abs).mtime));
  } catch {
    return buildDate;
  }
}

/** './inventory/index.astro' -> '/inventory/'   './about.astro' -> '/about/' */
function routeFor(key: string): string | null {
  let p = key.replace(/^\.\//, '').replace(/\.astro$/, '');
  if (p.includes('[')) return null; // dynamic route, handled explicitly below
  if (p === '404') return null;
  p = p.replace(/(^|\/)index$/, '');
  return p === '' ? '/' : `/${p}/`;
}

function priorityFor(path: string): string {
  if (path === '/') return '1.0';
  if (path === '/inventory/') return '0.9';
  if (path === '/contact/' || path === '/service-areas/') return '0.8';
  return '0.7';
}

function changefreqFor(path: string): Entry['changefreq'] {
  if (path === '/' || path === '/inventory/') return 'daily';
  return 'monthly';
}

export const GET: APIRoute = async () => {
  const entries: Entry[] = [];

  // --- static pages ---
  const pageFiles = import.meta.glob('./**/*.astro');
  for (const key of Object.keys(pageFiles)) {
    const path = routeFor(key);
    if (!path) continue;
    entries.push({
      path,
      lastmod: mtime(key),
      changefreq: changefreqFor(path),
      priority: priorityFor(path),
    });
  }

  // --- one page per vehicle ---
  const vehicles = await getCollection('vehicles');
  for (const v of vehicles) {
    entries.push({
      path: `/inventory/${v.id}/`,
      // sold cars keep their page (and its link equity) but stop being a priority
      lastmod: buildDate,
      changefreq: 'weekly',
      priority: v.data.status === 'sold' ? '0.3' : '0.8',
    });
  }

  // --- one page per service area ---
  for (const t of towns) {
    entries.push({
      path: `/service-areas/${t.slug}/`,
      lastmod: mtime('../data/towns.js'),
      changefreq: 'monthly',
      priority: '0.6',
    });
  }

  entries.sort((a, b) => Number(b.priority) - Number(a.priority) || a.path.localeCompare(b.path));

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) => `  <url>
    <loc>${SITE}${e.path}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
