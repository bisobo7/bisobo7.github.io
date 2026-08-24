// bot/src/listings.js — slugs, front-matter generation, and surgical edits.
//
// Reads are deliberately loose (regex for a few fields, not a YAML parser) and
// writes to EXISTING files replace exactly one line. That means a price change
// never reformats the file or drops the owner's comments.

export function slugify(fields) {
  return [fields.year, fields.make, fields.model, fields.trim]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function displayName(fields) {
  return [fields.year, fields.make, fields.model, fields.trim].filter(Boolean).join(' ');
}

export const money = (n) =>
  typeof n === 'number' ? `$${n.toLocaleString('en-US')}` : 'Call for price';

const yamlString = (s) => `'${String(s).replace(/'/g, "''")}'`;

/** Build a brand-new listing file from a completed draft. */
export function buildMarkdown(draft) {
  const f = draft.fields;
  const lines = ['---'];
  lines.push(`year: ${f.year}`);
  lines.push(`make: ${yamlString(f.make)}`);
  lines.push(`model: ${yamlString(f.model)}`);
  if (f.trim) lines.push(`trim: ${yamlString(f.trim)}`);
  if (typeof f.price === 'number') lines.push(`price: ${f.price}`);
  lines.push(`mileage: ${f.mileage}`);
  lines.push(`bodyStyle: ${f.bodyStyle}`);
  lines.push(`transmission: ${f.transmission}`);
  if (f.drivetrain) lines.push(`drivetrain: ${f.drivetrain}`);
  if (f.exteriorColor) lines.push(`exteriorColor: ${yamlString(f.exteriorColor)}`);
  if (f.vin) lines.push(`vin: ${yamlString(f.vin)}`);
  lines.push(`status: ${f.status || 'available'}`);
  lines.push(`featured: ${f.featured ? 'true' : 'false'}`);
  if (draft.photoNames?.length) {
    lines.push('photos:');
    for (const name of draft.photoNames) lines.push(`  - ${yamlString(name)}`);
  } else {
    lines.push('photos: []');
  }
  lines.push('highlights: []');
  lines.push('---');
  lines.push('');
  lines.push(draft.description?.trim() || '');
  lines.push('');
  return lines.join('\n');
}

/** Loose read of the handful of fields the bot needs to list and edit. */
export function readFields(md) {
  const fm = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const body = fm ? fm[1] : md;
  const get = (key) => {
    const m = body.match(new RegExp(`^${key}:\\s*(.+?)\\s*$`, 'm'));
    if (!m) return undefined;
    return m[1].replace(/^['"]|['"]$/g, '');
  };
  const num = (key) => {
    const v = get(key);
    const n = Number(v);
    return v != null && Number.isFinite(n) ? n : undefined;
  };
  return {
    year: num('year'),
    make: get('make'),
    model: get('model'),
    trim: get('trim') || '',
    price: num('price'),
    mileage: num('mileage'),
    bodyStyle: get('bodyStyle'),
    drivetrain: get('drivetrain'),
    status: get('status') || 'available',
  };
}

/**
 * Replace exactly one front-matter line, leaving every other byte untouched.
 * Appends the key just before the closing --- if it isn't present yet.
 */
export function setField(md, key, rawValue) {
  const value = typeof rawValue === 'number' ? String(rawValue) : yamlString(rawValue);
  const fm = md.match(/^(---\r?\n)([\s\S]*?)(\r?\n---)/);
  if (!fm) throw new Error('Listing has no front-matter block.');

  const [, open, inner, close] = fm;
  const line = new RegExp(`^${key}:.*$`, 'm');
  const updated = line.test(inner)
    ? inner.replace(line, `${key}: ${value}`)
    : `${inner}\n${key}: ${value}`;

  return md.replace(fm[0], `${open}${updated}${close}`);
}

/** Delete a front-matter key entirely (used when clearing an optional field). */
export function clearField(md, key) {
  return md.replace(new RegExp(`^${key}:.*\\r?\\n`, 'm'), '');
}

/** Fields the owner is allowed to change via /edit, with their coercions. */
export const EDITABLE = {
  year: (v) => ({ ok: /^\d{4}$/.test(v), value: Number(v) }),
  make: (v) => ({ ok: !!v, value: v }),
  model: (v) => ({ ok: !!v, value: v }),
  trim: (v) => ({ ok: true, value: v }),
  price: (v) => {
    const n = Number(String(v).replace(/[$,]/g, ''));
    return { ok: Number.isFinite(n) && n > 0, value: Math.round(n) };
  },
  mileage: (v) => {
    let s = String(v).replace(/[,\s]|miles?|mi\b/gi, '');
    let n = Number(s.replace(/k$/i, ''));
    if (/k$/i.test(s)) n *= 1000;
    return { ok: Number.isFinite(n) && n >= 0, value: Math.round(n) };
  },
  bodystyle: (v) => ({
    ok: ['car', 'truck', 'suv', 'van'].includes(v.toLowerCase()),
    value: v.toLowerCase(), key: 'bodyStyle',
  }),
  transmission: (v) => ({
    ok: ['automatic', 'manual'].includes(v.toLowerCase()),
    value: v.toLowerCase(),
  }),
  drivetrain: (v) => ({
    ok: ['FWD', 'RWD', 'AWD', '4WD'].includes(v.toUpperCase()),
    value: v.toUpperCase(),
  }),
  color: (v) => ({ ok: !!v, value: v, key: 'exteriorColor' }),
  vin: (v) => ({ ok: !!v, value: v }),
  status: (v) => ({
    ok: ['available', 'pending', 'sold'].includes(v.toLowerCase()),
    value: v.toLowerCase(),
  }),
};
