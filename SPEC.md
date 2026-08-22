# Dixie Auto Land — Website Redesign Spec & Plan

**Project:** Redesign and rebuild of dixieauto.land
**Business:** Dixie Auto Land — used vehicles & used/OEM parts specialist, 4285 Dixie Hwy, Saginaw, MI 48601
**Date:** August 2026
**Status:** Draft v1 for review

---

## 1. Project Goals

1. **Rank locally** for the service queries Dixie can actually win in the Saginaw–Bay City–Midland–Flint corridor (used parts, paintless dent repair, windshield replacement, used vehicles).
2. **Convert visitors** into three actions: a part request, a service appointment request, or a vehicle inquiry.
3. **Ship real inventory** — replace the "coming soon" section with simple, owner-editable vehicle listings where every vehicle gets its own indexable page.
4. **Keep the brand** — Dixie red, Montserrat, the custom animated SVG personality — while upgrading structure, trust signals, and performance.
5. **Stay cheap to run** — static hosting (GitHub Pages + existing CNAME), no monthly SaaS fees, content editable as plain files.

## 2. Current-State Audit

What exists today: a single-page static site (HTML + SCSS + vanilla JS, Express dev server) with anchor-link nav (About / Inventory / Services / Contact), a "coming soon" inventory section, four service cards, the 1,000-junkyard network section with an animated USA map, three testimonials, a contact form, and Microsoft Clarity analytics.

### What's working
- Strong, distinctive brand: Dixie red (#c8102e), Montserrat, custom animated SVGs (dent repair, windshield, financing, parts icons, network map).
- Clean SCSS architecture (variables, breakpoints, components/layout/pages partials) worth carrying forward.
- Clear differentiator in the copy: the 1,000+ junkyard nationwide sourcing network. Nobody else in the Saginaw SERPs tells this story.
- Clarity already installed (`r0qm9v26i3`).

### Issues to fix (audit findings)
| # | Issue | Why it matters |
|---|-------|----------------|
| A1 | Single page with `#anchor` nav — no crawlable URLs per service | Google can only rank the site for one query cluster. Service pages are the whole local-SEO game. |
| A2 | Zero structured data (no LocalBusiness/AutoDealer schema, no NAP markup) | Missing map-pack and rich-result eligibility. |
| A3 | Testimonials use randomuser.me stock photos and apparently invented names | Trust/legal risk and an E-E-A-T negative. Replace with real Google reviews or remove. |
| A4 | Footer Facebook link points to `facebook.com/OnTheWayRentals` (a different business); other social links are `#` | Broken trust signals; confuses entity association. |
| A5 | Phone listed is (586) 237-8440 — a Detroit-area (586) number for a Saginaw (989) business, and identical for Sales & Service | Verify this is right. NAP consistency across site, GBP, and citations is a top-3 local ranking factor. |
| A6 | Address line reads "Michigan, MI 48601" | Sloppy NAP; fix to "Saginaw, MI 48601". |
| A7 | `favicon.ico` is 0 bytes | Broken fallback favicon. |
| A8 | Contact form has no backend, no validation, no spam protection | Leads silently go nowhere. |
| A9 | No sitemap.xml, robots.txt, canonical tags, or Open Graph tags | Basic technical SEO absent. |
| A10 | Generic meta description; title "Premium Automotive Excellence" contains zero keywords or geography | Title tags are prime ranking real estate. |
| A11 | 2.9 MB `dixie-outside.png` hero-adjacent image | Core Web Vitals (LCP) penalty, especially on mobile. |
| A12 | No Google Business Profile linkage, no reviews surface, no directions/hours schema | The map pack drives most "near me" conversions. |

## 3. Competitive & SERP Landscape (researched Aug 2026)

**Used vehicles ("used cars saginaw mi"):** dominated by franchise and national players — Burt Watson, Wilson Lincoln, LaFontaine, RightWay, Byrider — plus Yelp/YellowPages directories. *Verdict: hard head-term. Win instead on long-tail ("used trucks under $15k saginaw", model-specific inventory pages) and on the map pack.*

**Paintless dent repair ("paintless dent repair saginaw mi"):** thin SERP — Garber Collision's PDR page, CD Dents (a Midland shop with a Saginaw landing page), and directories. *Verdict: winnable within months with one strong dedicated page + reviews + photos.*

**Windshield replacement:** Safelite plus lead-gen aggregators (Glass.net, AutoGlassOnly, Car Glass Wizards). *Verdict: aggregators are beatable on local relevance; a real local shop with reviews and transparent pricing stands out.*

**Used auto parts ("used auto parts saginaw"):** almost entirely directories (usedpart.us, YellowPages, Hollander) and junk-car buyers — weak, template-grade pages. *Verdict: Dixie's best opportunity. A genuine "we source from 1,000+ yards nationwide, delivered to Saginaw" page with a part-request form can own this cluster, including gold long-tails like "color matched bumper", "used transmission saginaw", "OEM door panel [make]".*

**Dixie's current visibility:** ranks only for its own brand name.

### Strategic positioning
Lead with **parts sourcing + repair services** (winnable now, high margin, unique story), let **inventory** build long-tail equity over time, and treat the **map pack (Google Business Profile)** as a co-equal channel to the website.

## 4. Recommended Tech Stack

**Astro 5 (static output) + SCSS + GitHub Pages.**

| Choice | Rationale |
|--------|-----------|
| Astro, static output | Multi-page by design, components with zero client-side JS by default → near-perfect Core Web Vitals. Ships plain HTML that Google loves. |
| Content collections (JSON/Markdown) | Vehicles, services, towns, and testimonials become typed data files the owner can edit without touching layout code. |
| SCSS carried over | Existing `scss/` partials port almost directly; keep the design language. |
| GitHub Pages + existing CNAME (`dixieauto.land`) | Zero hosting cost; deploy via GitHub Action on push. |
| Astro integrations | `@astrojs/sitemap` (sitemap.xml), `astro-compress`/Sharp (responsive images), no framework runtime needed. |
| Forms: Web3Forms or Formspree free tier + honeypot | Static-friendly lead capture with email delivery; upgrade path to a small worker later. |

Vanilla JS stays for the nav toggle, scroll animations, and map tooltips — ported as small module scripts. The Express server goes away (Astro dev server replaces it); keep `server/` only if the team wants a local proxy for form testing.

*Alternatives considered:* plain HTML (no templating → 15+ pages of duplicated header/footer drift), Next.js (SSR complexity and hosting cost buy nothing until there's live DMS-fed inventory). Astro is the SEO-per-effort optimum; if live inventory feeds arrive later, Astro supports server islands/adapters without a rewrite.

## 5. Site Architecture & URL Map

```
/                                   Home
/inventory/                         All vehicles (filterable list)
/inventory/[year-make-model-slug]/  Vehicle detail page (one per car)
/services/                          Services hub
/services/used-auto-parts/          OEM & color-matched used parts  ← flagship
/services/paintless-dent-repair/    PDR
/services/windshield-replacement/   Auto glass
/services/financing/                Financing
/request-a-part/                    Part request form (conversion page)
/service-areas/                     Service area hub
/service-areas/saginaw-mi/          (canonical home turf page)
/service-areas/bay-city-mi/
/service-areas/midland-mi/
/service-areas/flint-mi/
/service-areas/bridgeport-mi/       (Dixie Hwy corridor; optional: Birch Run, Frankenmuth)
/about/                             Story, team, the network
/reviews/                           Real reviews (Google embed or curated)
/contact/                           NAP, hours, map, form
/privacy/  /terms/                  Currently dead links in footer — make real
404 page                            Branded, links to inventory & part request
```

Rules: trailing-slash URLs, one `<h1>` per page, breadcrumbs on everything below top level, every service page links to its sibling services + relevant town pages + `/request-a-part/`, every town page links back to all four services (tight internal-link mesh).

## 6. Page Specs (SEO-critical pages)

Title tag pattern: `{Primary Keyword} | Dixie Auto Land - Saginaw, MI` (≤ 60 chars where possible). Every page: unique meta description (140–160 chars) with a call to action, canonical tag, OG/Twitter tags, breadcrumb + page-type schema.

### 6.1 Home `/`
- **Title:** `Used Cars & Auto Parts in Saginaw, MI | Dixie Auto Land`
- **H1:** "Saginaw's Used Vehicle & Parts Specialists"
- Sections: hero (real dealership photo, compressed, two CTAs: *Browse Inventory* / *Request a Part*) → trust strip (Google rating, years, network size) → featured inventory (6 cards) → four service teasers → network story w/ animated USA map → real reviews carousel → NAP + embedded map + hours → final CTA.
- **Schema:** `AutoDealer` (also plausibly `AutoPartsStore` as additionalType) with full NAP, geo, openingHours, `sameAs` (real socials only), plus `WebSite`.

### 6.2 Used Auto Parts `/services/used-auto-parts/` — flagship
- **Title:** `Used OEM Auto Parts in Saginaw, MI - 1,000+ Yard Network | Dixie Auto Land`
- **H1:** "Used & OEM Auto Parts, Sourced from 1,000+ Yards Nationwide"
- Content blocks: how sourcing works (3-step visual), color-matching explainer (unique content nobody in the SERP has), popular part categories (engines, transmissions, body panels, mirrors, wheels — each a keyword-bearing subsection), makes served, warranty/inspection promise, FAQ (schema-marked), part-request form CTA.
- **Target queries:** used auto parts saginaw · used transmission/engine saginaw mi · color matched bumper/fender · OEM parts junkyard michigan.
- **Schema:** `AutoPartsStore` + `FAQPage`.

### 6.3 Paintless Dent Repair `/services/paintless-dent-repair/`
- **Title:** `Paintless Dent Repair in Saginaw, MI | Dixie Auto Land`
- Content: what PDR is & when it works, before/after gallery (real photos — mandatory), hail damage section (Michigan-relevant, seasonal traffic spikes), price-range transparency, vs-body-shop comparison, FAQ.
- **Schema:** `AutoRepair` + `FAQPage`. *SERP is thin — this page can rank in months.*

### 6.4 Windshield Replacement `/services/windshield-replacement/`
- **Title:** `Windshield Replacement in Saginaw, MI | Dixie Auto Land`
- Content: replacement vs repair (chip/crack decision guide), OEM vs aftermarket glass, insurance handling, same-day/turnaround expectations, FAQ. Angle vs Safelite/aggregators: local, talk-to-a-human, used-OEM glass option = cheaper.
- **Schema:** `AutoRepair`/`AutoGlass` + `FAQPage`.

### 6.5 Financing `/services/financing/`
- **Title:** `Used Car Financing in Saginaw, MI - All Credit Welcome | Dixie Auto Land`
- Content: how it works, what to bring, credit-range honesty, pre-qualification CTA (form), FAQ. No fake APR promises.

### 6.6 Inventory list & vehicle pages
- **List `/inventory/`:** `Used Cars for Sale in Saginaw, MI | Dixie Auto Land`; client-side filter (make, body, price band) over statically rendered cards — cards render without JS so crawlers see everything.
- **Vehicle detail `/inventory/2018-ford-f150-xlt/`:**
  - **Title:** `{Year} {Make} {Model} {Trim} for Sale - Saginaw, MI | Dixie Auto Land`
  - Photo gallery, spec table, price, mileage, condition notes, Carfax link slot, inquiry form pre-filled with the vehicle, cross-links ("more trucks", "similar price").
  - **Schema:** `Vehicle` + `Offer` (price, availability) — eligible for vehicle rich results.
  - Sold vehicles: keep page live 30 days with "Sold — see similar" (retains link equity), then 301 to `/inventory/`.

### 6.7 Service-area pages `/service-areas/{town}-mi/`
The #1 abuse risk in local SEO is doorway pages. These must be **genuinely differentiated**, not find-and-replace towns:
- **Title:** `Used Cars & Auto Parts near {Town}, MI | Dixie Auto Land`
- Required unique content per page: real driving directions/distance from that town ("15 min down I-75 from Bay City"), which services that town's customers most use, town-specific delivery/pickup notes for parts, at least one review from a customer in that town when available, unique intro copy (≥ 300 words, human-written per town).
- **Schema:** `AutoDealer` with `areaServed`.
- Launch with 4–5 towns max; add more only as content quality allows.

### 6.8 Request a Part `/request-a-part/` (conversion page)
Form fields: name, phone, email, year/make/model, part needed, color/paint code (optional photo upload), zip. Sets expectation: "we search 1,000+ yards and call you back within X hours." This page is the ad/GBP landing target for all parts intent.

## 7. Inventory Data Model

One file per vehicle in `src/content/vehicles/` (Markdown with frontmatter — owner edits a text file, commits, site rebuilds):

```yaml
# src/content/vehicles/2018-ford-f150-xlt.md
year: 2018
make: Ford
model: F-150
trim: XLT
price: 21995            # omit → "Call for price"
mileage: 84200
bodyStyle: truck        # car | truck | suv | van
transmission: automatic
drivetrain: 4WD
exteriorColor: Magnetic Gray
vin: ""                 # optional but enables better schema
status: available       # available | pending | sold
featured: true
photos: [f150-1.jpg, f150-2.jpg, ...]
carfaxUrl: ""
highlights: [ "One owner", "New tires 2026" ]
---
Free-text condition notes / description (becomes page body).
```

Astro content collection enforces the schema at build time (typo in a field = build error, not a broken page). Same pattern for `services/`, `towns/`, and `testimonials/` collections.

## 8. Technical SEO Plan

1. **Schema:** sitewide `AutoDealer` LocalBusiness entity (JSON-LD in layout); per-page `AutoPartsStore` / `AutoRepair` / `Vehicle` / `FAQPage` / `BreadcrumbList` as specced above. Single source of truth for NAP in one data file, injected everywhere.
2. **NAP:** fix address formatting; **confirm the (586) number or replace with a local (989) line** — then use it identically on site, GBP, and citations. A local area code also lifts call-through rate.
3. **Google Business Profile (off-site, do first):** claim/verify GBP as "Used car dealer" + secondary categories "Used auto parts store", "Auto dent removal service", "Auto glass shop"; real photos; link to site; enable messaging; start a review-request habit (SMS link after every sale/job). GBP + reviews will likely produce leads before the new site even ships.
4. **Performance budget:** LCP < 2.0s mobile, CLS < 0.05, total JS < 50KB. Convert `dixie-outside.png` (2.9MB) to AVIF/WebP responsive set (~80–150KB), self-host Montserrat with `font-display: swap` (2 weights, not 5), inline critical CSS (Astro default), lazy-load below-fold images and the map.
5. **Indexing plumbing:** sitemap.xml (auto), robots.txt, canonicals, 301s from old `#anchor` URLs' patterns (n/a — but map any legacy inbound links to new pages), Search Console + Bing Webmaster verified at launch, GA4 alongside existing Clarity.
6. **Content integrity:** remove fabricated testimonials/stock photos; only real, attributable reviews (first name + town), ideally synced from Google. Fix/remove dead social links; add real profiles to `sameAs`.
7. **Domain note:** `.land` TLD is fine for rankings (TLD is not a ranking factor); brand consistency and citations matter more. Optional: buy `dixieautoland.com` as a 301 for citation/typo protection if available.

## 9. Design System

Evolve, don't replace. Tokens carry over from `_variables.scss`:

- **Color:** primary `#c8102e` (Dixie red) + darkened `#9e0c24` for gradients; charcoal `#1a1a1a` / `#333`; light `#f9f9f9`; keep accent `#f8b500` for highlights/ratings stars. Add semantic tokens (`--color-cta`, `--color-surface`) and verify AA contrast (red on white passes; never red-on-charcoal body text).
- **Type:** Montserrat, self-hosted, weights 400/600/700 only. Fluid type scale (clamp-based). Sentence-case headings.
- **Components:** header w/ sticky CTA ("Request a Part" + phone), hero, trust strip, service card (keeps animated SVG icons), vehicle card, spec table, review card, FAQ accordion (`<details>` — no JS), breadcrumbs, town card, forms with inline validation, footer with full NAP + hours.
- **SVG personality stays:** existing animated icons (parts, dent, windshield, financing, USA network map) are the brand's signature — port them, but load the USA map lazily and give every animation a `prefers-reduced-motion` fallback.
- **Photography:** the single biggest visual upgrade is *real photos* — the lot, the counter, the team, before/afters. Stock/placeholder imagery is a conversion killer for a local dealer; schedule a half-day photo shoot as a project dependency.

## 10. Build Plan

**Phase 0 — Foundations (week 1):** confirm NAP/phone; claim & optimize GBP; photo shoot; gather 5–10 real reviews; register Search Console/GA4; buy defensive domain (optional).

**Phase 1 — Rebuild core (weeks 1–3):** Astro scaffold, port SCSS + components, layouts (header/footer/schema), Home, Contact, About, 404, forms wired to Web3Forms, deploy pipeline to GitHub Pages with CNAME. *Launchable milestone: current site's content, multi-page, fast, schema'd.*

**Phase 2 — Service pages (weeks 3–5):** the four service pages + `/request-a-part/`, each with real photos, FAQs, schema. Ship used-auto-parts first (biggest opportunity).

**Phase 3 — Inventory (weeks 5–6):** content collection, list + detail pages, Vehicle schema, owner how-to doc ("add a car in 5 minutes").

**Phase 4 — Service areas + reviews (weeks 6–8):** 4–5 town pages with genuinely unique content; `/reviews/`; internal-link mesh pass; privacy/terms.

**Phase 5 — Ongoing (monthly):** review velocity, GBP posts, 1 content piece/month targeting a long-tail parts query ("how color-matched used bumpers work", "used transmission buying guide"), monitor Search Console → expand what's working.

## 11. Measurement

- **Leads (primary):** form submissions by type (part request / service / vehicle inquiry), tel: click tracking, GBP calls & direction requests.
- **SEO:** Search Console impressions/clicks per page cluster; map-pack positions for the 4 service queries + "used cars saginaw"; review count/rating.
- **UX:** Clarity session recordings (already installed), CWV field data.
- Targets (6 months): top-3 map pack for PDR + used parts in Saginaw; 50+ Google reviews; ≥ 40 organic leads/month.

## 12. Open Questions for the Owner

1. Is (586) 237-8440 the permanent number, or should a local (989) line front sales/service?
2. Real social profiles — which exist? (Footer FB link currently points to a rental company.)
3. Warranty terms on parts and vehicles — needed for honest page copy and schema.
4. Who takes the photos, and when can we schedule the shoot?
5. Typical inventory size (5 cars? 40?) — affects whether filters ship in Phase 3 or later.
6. Is `dixieautoland.com` worth acquiring defensively?

---

*Prepared as the working spec for the dixieauto.land rebuild. Sections 6–8 are the SEO contract: page URLs, titles, and schema types should not drift from this doc without updating it.*
