// src/pages/llms.txt.ts
// /llms.txt — a curated, machine-readable summary of the site for LLMs and AI
// search agents (spec: https://llmstxt.org).
//
// Generated from the same sources as the sitemap (business.js, the vehicles
// collection, towns.js) so it can never drift out of date. A stale llms.txt
// that advertises sold cars is worse than none at all.
//
// Structure required by the spec: H1, then an optional blockquote summary, then
// any non-heading markdown, then H2-delimited lists of `[name](url): notes`.
// A section named "Optional" is the conventional home for secondary links that
// an agent on a tight context budget can skip.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { business } from '../data/business.js';
import { towns } from '../data/towns.js';

const SITE = business.domain;

const money = (n: number) => `$${n.toLocaleString('en-US')}`;
const miles = (n: number) => `${n.toLocaleString('en-US')} miles`;

/** "Monday - Friday 9:00 AM - 7:00 PM; Saturday ...; Sunday closed" */
const hoursLine = business.hours
  .map((h) => (h.open ? `${h.days} ${h.open} - ${h.close}` : `${h.days} closed`))
  .join('; ');

function vehicleLine(v: Awaited<ReturnType<typeof getCollection<'vehicles'>>>[number]) {
  const d = v.data;
  const name = `${d.year} ${d.make} ${d.model}${d.trim ? ' ' + d.trim : ''}`;
  const notes = [
    d.price ? money(d.price) : 'call for price',
    miles(d.mileage),
    d.bodyStyle,
    [d.drivetrain, d.transmission].filter(Boolean).join(' '),
    d.exteriorColor,
    d.status !== 'available' ? d.status.toUpperCase() : null,
  ]
    .filter(Boolean)
    .join(' · ');
  return `- [${name}](${SITE}/inventory/${v.id}/): ${notes}`;
}

export const GET: APIRoute = async () => {
  const vehicles = await getCollection('vehicles');
  const forSale = vehicles.filter((v) => v.data.status !== 'sold');
  const sold = vehicles.filter((v) => v.data.status === 'sold');

  const sections: string[] = [];

  sections.push(`# ${business.name}

> Used-vehicle dealer and OEM parts sourcer in Saginaw, Michigan. Hand-inspected cars, trucks and SUVs on Dixie Hwy, plus used and color-matched parts located through a network of more than 1,000 partner salvage yards nationwide.

${business.name} buys, sells and trades used vehicles at ${business.address.street} in ${business.address.city}, ${business.address.state}. Alongside vehicle sales the business sources OEM and color-matched parts, performs paintless dent repair and windshield replacement, and arranges financing through lender partners.

- Address: ${business.address.street}, ${business.address.city}, ${business.address.state} ${business.address.zip}
- Phone: ${business.phone}
- Hours: ${hoursLine}
- Primary service area: ${business.address.city} and the surrounding Tri-Cities — ${towns.map((t) => t.name).join(', ')}
- Inventory below is generated from the live site; vehicles sell quickly, so call to confirm availability before travelling.`);

  sections.push(`## Vehicles for sale

${
  forSale.length
    ? forSale.map(vehicleLine).join('\n')
    : '- No vehicles are listed online right now. Call for current stock.'
}
- [Full inventory listing](${SITE}/inventory/): every vehicle currently on the lot, with filters by body style, make and price`);

  sections.push(`## Parts and services

- [Parts request](${SITE}/contact/#part-request): request a specific used, OEM or color-matched part; sourced from 1,000+ partner yards nationwide
- [Contact and directions](${SITE}/contact/): phone, hours, map and enquiry form
- [Map and directions](${business.mapsUrl}): Google Maps pin for the lot on Dixie Hwy`);

  sections.push(`## Service areas

${towns
  .map(
    (t) =>
      `- [${t.name}, MI](${SITE}/service-areas/${t.slug}/): ${t.distance} from the lot, ${t.driveTime} — ${t.route}`
  )
  .join('\n')}
- [All service areas](${SITE}/service-areas/): the towns we regularly sell and source parts for`);

  sections.push(`## About

- [About ${business.name}](${SITE}/about/): who runs the lot, how vehicles are inspected, and how the parts network operates
- [Home](${SITE}/): overview of vehicles, parts, dent repair, windshield replacement and financing`);

  const optional = [
    ...sold.map(vehicleLine),
    `- [Sitemap](${SITE}/sitemap.xml): every indexable URL on the site`,
  ];
  sections.push(`## Optional

${optional.join('\n')}`);

  return new Response(sections.join('\n\n') + '\n', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
