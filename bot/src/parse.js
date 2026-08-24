// bot/src/parse.js — turn one free-typed line into schema fields.
//
// "2002 hyundai sonata LE, 84k miles, 4wd, $8,000"
//   → { year: 2002, make: 'Hyundai', model: 'Sonata', trim: 'LE',
//       mileage: 84000, drivetrain: '4WD', price: 8000, bodyStyle: 'car' }
//
// This is deliberately forgiving and deliberately dumb: it validates SHAPE, not
// truth. It will happily accept 4WD on a car that was never sold that way. That
// is why the bot echoes the parse back before anything else happens.

// Multi-word makes must be matched before the single-word fallback.
const MAKES = [
  'Alfa Romeo', 'Aston Martin', 'Land Rover', 'Mercedes-Benz', 'Mercedes',
  'Mini', 'Rolls-Royce', 'Acura', 'Audi', 'BMW', 'Buick', 'Cadillac',
  'Chevrolet', 'Chevy', 'Chrysler', 'Dodge', 'Fiat', 'Ford', 'Genesis', 'GMC',
  'Honda', 'Hyundai', 'Infiniti', 'Isuzu', 'Jaguar', 'Jeep', 'Kia', 'Lexus',
  'Lincoln', 'Mazda', 'Mercury', 'Mitsubishi', 'Nissan', 'Oldsmobile',
  'Plymouth', 'Pontiac', 'Porsche', 'Ram', 'Saab', 'Saturn', 'Scion', 'Subaru',
  'Suzuki', 'Tesla', 'Toyota', 'Volkswagen', 'VW', 'Volvo',
];

const MAKE_ALIASES = { chevy: 'Chevrolet', vw: 'Volkswagen', mercedes: 'Mercedes-Benz' };

// Only used when the text gives no explicit body-style word.
const MODEL_BODY = {
  truck: ['f-150', 'f150', 'f-250', 'f250', 'f-350', 'f350', 'silverado', 'sierra',
          'ram 1500', 'ram 2500', 'ram 3500', 'tacoma', 'tundra', 'ranger',
          'colorado', 'canyon', 'frontier', 'ridgeline', 'titan', 'dakota', 'avalanche'],
  suv: ['equinox', 'explorer', 'escape', 'tahoe', 'suburban', 'traverse', 'pilot',
        'cr-v', 'crv', 'rav4', 'highlander', '4runner', 'grand cherokee', 'cherokee',
        'wrangler', 'edge', 'enclave', 'acadia', 'terrain', 'rogue', 'murano',
        'santa fe', 'tucson', 'sorento', 'sportage', 'outback', 'forester', 'blazer'],
  van: ['odyssey', 'sienna', 'caravan', 'town & country', 'pacifica', 'transit',
        'express', 'savana', 'promaster'],
};

// Multi-word models that would otherwise split across model/trim.
const MODELS = [
  'Grand Cherokee', 'Grand Caravan', 'Grand Prix', 'Grand Am', 'Grand Marquis',
  'Santa Fe', 'Town & Country', 'Town and Country', 'Land Cruiser',
  'Range Rover', 'Model 3', 'Model S', 'Model X', 'Model Y', 'New Beetle',
  'Crown Victoria', 'Monte Carlo', 'Cruze Limited', 'Silverado 1500',
  'Silverado 2500', 'F-150', 'F-250', 'F-350', 'CR-V', 'HR-V', 'RAV4',
  '4Runner', 'MDX', 'RDX', 'TLX',
];

const BODY_WORDS = {
  truck: ['truck', 'pickup', 'pick-up', 'crew cab', 'supercrew', 'quad cab'],
  suv: ['suv', 'crossover', 'sport utility'],
  van: ['van', 'minivan', 'cargo van'],
  car: ['car', 'sedan', 'coupe', 'hatchback', 'wagon', 'convertible'],
};

const COLORS = [
  'black', 'white', 'silver', 'gray', 'grey', 'red', 'blue', 'green', 'gold',
  'beige', 'tan', 'brown', 'maroon', 'burgundy', 'orange', 'yellow', 'pearl',
  'charcoal', 'champagne', 'bronze', 'navy',
];

const titleCase = (s) =>
  s.replace(/\S+/g, (w) =>
    /^[A-Z0-9-]+$/.test(w) && w.length <= 4 ? w.toUpperCase()
    : w[0].toUpperCase() + w.slice(1).toLowerCase()
  );

// Trim levels are a mix of badge codes and words: XLT, EX, LT stay uppercase,
// "big horn" and "limited" read better title-cased.
const trimCase = (s) =>
  s.split(/\s+/)
    .map((w) => {
      if (/^[A-Z][a-z]+$/.test(w)) return w;        // "Big", "Horn" — typed as words
      if (w.length <= 3) return w.toUpperCase();    // xlt, lt, sle — badge codes
      return w[0].toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ');

export function parseNewCar(input) {
  const raw = (input || '').trim();
  if (!raw) return { error: 'Nothing to parse. Try: /newcar 2015 Honda Civic EX, 98k miles, FWD, $9,500' };

  let text = raw;
  const found = {};
  const warnings = [];

  // --- price: $8,000 / $8000 / 8500 dollars / "asking 9500" ---
  const priceMatch =
    text.match(/\$\s*([\d,]+(?:\.\d{2})?)\s*k\b/i) ||
    text.match(/\$\s*([\d,]+(?:\.\d{2})?)/) ||
    text.match(/\b(?:asking|price[d]?(?:\s+at)?)\s+\$?([\d,]+)/i);
  if (priceMatch) {
    let n = Number(priceMatch[1].replace(/,/g, ''));
    if (/k\b/i.test(priceMatch[0]) && n < 1000) n *= 1000;
    if (n > 0) found.price = Math.round(n);
    text = text.replace(priceMatch[0], ' ');
  }

  // --- mileage: 84k miles / 84,000 mi / 112000 miles ---
  const mileMatch =
    text.match(/\b([\d,.]+)\s*k\s*(?:miles?|mi\b)/i) ||
    text.match(/\b([\d,]+)\s*(?:miles?|mi\b)/i) ||
    text.match(/\b([\d,.]+)\s*k\b/i);
  if (mileMatch) {
    let n = Number(mileMatch[1].replace(/,/g, ''));
    if (/k\b/i.test(mileMatch[0])) n *= 1000;
    if (n > 0) found.mileage = Math.round(n);
    text = text.replace(mileMatch[0], ' ');
  }

  // --- drivetrain ---
  const dt = text.match(/\b(4wd|4x4|awd|fwd|rwd|2wd)\b/i);
  if (dt) {
    const v = dt[1].toLowerCase();
    found.drivetrain = v === '4x4' ? '4WD' : v === '2wd' ? 'FWD' : v.toUpperCase();
    text = text.replace(dt[0], ' ');
  }

  // --- transmission ---
  const tr = text.match(/\b(automatic|auto|manual|stick|5-speed|6-speed)\b/i);
  if (tr) {
    found.transmission = /manual|stick|speed/i.test(tr[1]) ? 'manual' : 'automatic';
    text = text.replace(tr[0], ' ');
  }

  // --- exterior color ---
  // Colours are usually their own comma segment ("magnetic gray"), so match the
  // whole segment first; a bare colour word elsewhere is the fallback.
  const colorRe = new RegExp(`^([a-z]+\\s+)?(${COLORS.join('|')})$`, 'i');
  const segment = text.split(',').map((s) => s.trim()).find((s) => colorRe.test(s));
  if (segment) {
    found.exteriorColor = titleCase(segment);
    text = text.replace(segment, ' ');
  } else {
    const col = text.match(new RegExp(`\\b(${COLORS.join('|')})\\b`, 'i'));
    if (col) {
      found.exteriorColor = titleCase(col[1]);
      text = text.replace(col[0], ' ');
    }
  }

  // --- body style, explicit words win over the model lookup ---
  for (const [body, words] of Object.entries(BODY_WORDS)) {
    const hit = words.find((w) => new RegExp(`\\b${w}\\b`, 'i').test(text));
    if (hit) {
      found.bodyStyle = body;
      text = text.replace(new RegExp(`\\b${hit}\\b`, 'i'), ' ');
      break;
    }
  }

  // --- year: 1950..next year ---
  const nextYear = new Date().getFullYear() + 1;
  const yearMatch = [...text.matchAll(/\b(19[5-9]\d|20[0-4]\d)\b/g)]
    .map((m) => Number(m[1]))
    .find((y) => y >= 1950 && y <= nextYear);
  if (yearMatch) {
    found.year = yearMatch;
    text = text.replace(String(yearMatch), ' ');
  }

  // --- make, then whatever is left is model + trim ---
  const makeRe = new RegExp(`\\b(${MAKES.join('|').replace(/[-]/g, '\\-')})\\b`, 'i');
  const makeMatch = text.match(makeRe);
  if (makeMatch) {
    const key = makeMatch[1].toLowerCase();
    found.make = MAKE_ALIASES[key] || titleCase(makeMatch[1]);
    text = text.replace(makeMatch[0], ' ');
  }

  let leftover = text.replace(/[,;]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (leftover) {
    const modelRe = new RegExp(
      `\\b(${MODELS.map((m) => m.replace(/[-.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
      'i'
    );
    const modelMatch = leftover.match(modelRe);
    if (modelMatch) {
      found.model = titleCase(modelMatch[1]);
      leftover = leftover.replace(modelMatch[0], ' ').replace(/\s+/g, ' ').trim();
      if (leftover) found.trim = trimCase(leftover);
    } else {
      const words = leftover.split(' ');
      found.model = titleCase(words[0]);
      if (words.length > 1) found.trim = trimCase(words.slice(1).join(' '));
    }
  }

  // --- infer body style from the model only if nothing said otherwise ---
  if (!found.bodyStyle && found.model) {
    const hay = `${found.make || ''} ${found.model} ${found.trim || ''}`.toLowerCase();
    for (const [body, models] of Object.entries(MODEL_BODY)) {
      if (models.some((m) => hay.includes(m))) { found.bodyStyle = body; break; }
    }
  }

  // --- defaults and gaps ---
  if (!found.bodyStyle) {
    found.bodyStyle = 'car';
    warnings.push('body style guessed as <b>car</b>');
  }
  if (!found.transmission) found.transmission = 'automatic';

  const missing = [];
  if (!found.year) missing.push('year');
  if (!found.make) missing.push('make');
  if (!found.model) missing.push('model');
  if (found.mileage == null) missing.push('mileage');

  return { fields: found, missing, warnings };
}
