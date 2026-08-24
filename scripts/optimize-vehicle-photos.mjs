#!/usr/bin/env node
/**
 * scripts/optimize-vehicle-photos.mjs
 *
 * Turns straight-off-the-phone JPEGs into the responsive image sets the site
 * serves. Phone photos are 4–6k px wide and 3–5 MB, and most carry an EXIF
 * "rotate me" flag that not every consumer honours (Facebook's scraper and
 * Google's image crawler among them) — so the pixels get baked upright here.
 *
 * Usage:
 *   node scripts/optimize-vehicle-photos.mjs <slug> [--focus=0.55] <photo…>
 *
 *   slug     the vehicle's markdown filename without .md
 *            (e.g. 2009-toyota-fj-cruiser) — becomes the image name stem
 *   photo…   source images, in gallery order. The first is the card/hero shot.
 *   --focus  where the subject sits vertically in a PORTRAIT source, 0–1, used
 *            when cropping the wide card thumbnail. 0.55 (a touch below centre)
 *            suits the usual "car with sky above it" phone shot.
 *
 * Example:
 *   node scripts/optimize-vehicle-photos.mjs 2009-toyota-fj-cruiser ~/Desktop/fj/*.jpg
 *
 * Emits, into public/images/vehicles/:
 *   <slug>-<n>-{400,800,1200}.webp       full frame, for the detail gallery
 *   <slug>-<n>-card-{400,800,1200}.webp  3:2 crop, for the inventory card
 *   <slug>-<n>-1200.jpg (+ -card-1200)   the one JPEG each, used as <picture>'s
 *                                        <img src> fallback and as the OG image
 * and prints the `photos:` block to paste into the vehicle's front-matter.
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const WIDTHS = [400, 800, 1200];
const FALLBACK_WIDTH = 1200; // the one .jpg per image, for <picture>'s <img src>
const CARD_RATIO = 3 / 2;
const OUT_DIR = 'public/images/vehicles';

const args = process.argv.slice(2);
const focusArg = args.find((a) => a.startsWith('--focus='));
const focus = focusArg ? Number(focusArg.split('=')[1]) : 0.55;
const [slug, ...sources] = args.filter((a) => !a.startsWith('--'));

if (!slug || sources.length === 0) {
  console.error('usage: node scripts/optimize-vehicle-photos.mjs <slug> [--focus=0.55] <photo…>');
  process.exit(1);
}

await mkdir(OUT_DIR, { recursive: true });

/**
 * Write one responsive set: WebP at every width the source can fill, plus a
 * single JPEG at FALLBACK_WIDTH. WebP has been safe in every shipping browser
 * since 2020, so a full parallel JPEG ladder would double the repo for nobody.
 */
async function emit(buffer, stem, sourceWidth) {
  for (const width of WIDTHS) {
    if (width > sourceWidth) continue; // never upscale
    await sharp(buffer)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 62, smartSubsample: true })
      .toFile(path.join(OUT_DIR, `${stem}-${width}.webp`));
  }
  await sharp(buffer)
    .resize({ width: Math.min(FALLBACK_WIDTH, sourceWidth), withoutEnlargement: true })
    .jpeg({ quality: 72, mozjpeg: true, progressive: true })
    .toFile(path.join(OUT_DIR, `${stem}-${FALLBACK_WIDTH}.jpg`));
}

const stems = [];

for (const [i, src] of sources.entries()) {
  const stem = `${slug}-${i + 1}`;
  stems.push(stem);

  // .rotate() with no argument applies the EXIF orientation and strips the tag,
  // so every downstream consumer sees upright pixels.
  const upright = await sharp(src).rotate().toBuffer();
  const { width: w, height: h } = await sharp(upright).metadata();

  await emit(upright, stem, w);

  // Card crop: a 3:2 window. Landscape sources crop from the centre; portrait
  // sources crop around `focus`, because the sky above the car is dead space.
  const cropH = Math.min(h, Math.round(w / CARD_RATIO));
  const cropW = Math.min(w, Math.round(cropH * CARD_RATIO));
  const top = Math.max(0, Math.min(h - cropH, Math.round(h * focus - cropH / 2)));
  const left = Math.round((w - cropW) / 2);
  const cropped = await sharp(upright)
    .extract({ left, top, width: cropW, height: cropH })
    .toBuffer();

  await emit(cropped, `${stem}-card`, cropW);

  console.log(`${path.basename(src)} → ${stem}  (${w}×${h}${h > w ? ' portrait' : ''})`);
}

console.log('\nPaste into the vehicle front-matter:\n');
console.log('photos:');
for (const stem of stems) console.log(`  - ${stem}`);
