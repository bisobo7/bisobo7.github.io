// src/utils/photos.js
// One place that knows how vehicle photo files are named, so the card, the
// gallery and the OG/schema tags can't drift apart.
//
// `scripts/optimize-vehicle-photos.mjs` writes, for each photo:
//   <stem>-{400,800,1200}.webp        full frame  (detail gallery)
//   <stem>-card-{400,800,1200}.webp   3:2 crop    (inventory card)
//   <stem>-1200.jpg, <stem>-card-1200.jpg   JPEG fallback / social preview
//
// A `photos:` entry is therefore the STEM, with no extension:
//   photos:
//     - 2009-toyota-fj-cruiser-1
// An entry that does carry an extension is treated as a single literal file,
// so a one-off image dropped straight into the folder still works.

const DIR = '/images/vehicles';
const WIDTHS = [400, 800, 1200];

export const PLACEHOLDER = '/images/vehicle-placeholder.svg';

const isLiteralFile = (entry) => /\.[a-z0-9]{2,4}$/i.test(entry);

/**
 * @param {string|undefined} entry  a `photos:` entry (stem, or literal filename)
 * @param {'full'|'card'} variant
 * @returns {{src: string, srcset: string|null}}
 */
export function photoSources(entry, variant = 'full') {
  if (!entry) return { src: PLACEHOLDER, srcset: null };
  if (isLiteralFile(entry)) return { src: `${DIR}/${entry}`, srcset: null };

  const stem = variant === 'card' ? `${entry}-card` : entry;
  return {
    src: `${DIR}/${stem}-1200.jpg`,
    srcset: WIDTHS.map((w) => `${DIR}/${stem}-${w}.webp ${w}w`).join(', '),
  };
}

/** The single image used for OG tags and Vehicle schema. */
export function primaryPhoto(photos) {
  return photoSources(photos?.[0], 'full').src;
}
