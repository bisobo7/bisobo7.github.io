// bot/src/index.js — command routing and the long-poll loop.
//
// Run with:  npm start      (which is: node --env-file=.env src/index.js)
import { config, isOwner } from './config.js';
import { telegram } from './telegram.js';
import { github } from './github.js';
import { parseNewCar } from './parse.js';
import {
  slugify, displayName, money, buildMarkdown, readFields, setField, EDITABLE,
} from './listings.js';
import {
  STEPS, startDraft, getDraft, clearDraft, rememberListing, recallListing,
} from './state.js';

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---------------------------------------------------------------- rendering

function fieldSummary(f) {
  const bits = [
    f.mileage != null ? `${f.mileage.toLocaleString('en-US')} mi` : null,
    f.drivetrain,
    f.transmission,
    f.exteriorColor,
  ].filter(Boolean);
  return `<b>${esc(displayName(f))}</b> — ${esc(money(f.price))}\n${esc(bits.join(' · '))}`;
}

function previewText(draft) {
  const f = draft.fields;
  const slug = slugify(f);
  const desc = draft.description?.trim();
  return [
    '<b>── PREVIEW ──</b>',
    fieldSummary(f),
    `${esc(f.bodyStyle)} · status: ${esc(f.status || 'available')}`,
    `<code>/inventory/${esc(slug)}/</code>`,
    `${draft.photos.length} photo${draft.photos.length === 1 ? '' : 's'}`,
    desc ? `\n<i>${esc(desc)}</i>` : '\n<i>(no description)</i>',
    '\n/add to publish · /edit &lt;field&gt; &lt;value&gt; · /reset',
  ].join('\n');
}

// ---------------------------------------------------- inventory: read + list

async function loadInventory() {
  const files = await github.listVehicleFiles();
  const rows = [];
  for (const file of files) {
    try {
      const md = await github.readFile(`${config.vehicleDir}/${file.name}`);
      rows.push({ slug: file.name.replace(/\.md$/, ''), path: `${config.vehicleDir}/${file.name}`, fields: readFields(md) });
    } catch (err) {
      console.error(`Skipping ${file.name}: ${err.message}`);
    }
  }
  rows.sort((a, b) => (b.fields.year || 0) - (a.fields.year || 0));
  return rows;
}

/**
 * Resolve "3" or "sonata" to a listing.
 * Numbers resolve against the list the owner was last SHOWN, never a fresh
 * query — otherwise adding a car between /inventory and /sold would silently
 * shift what number 3 means.
 */
function resolveTarget(userId, token, rows) {
  const asNumber = Number(token);
  if (Number.isInteger(asNumber) && asNumber > 0) {
    const shown = recallListing(userId);
    if (!shown.length) return { error: 'Run /inventory first so the numbers mean something.' };
    const hit = shown[asNumber - 1];
    if (!hit) return { error: `No #${asNumber} in the last /inventory list.` };
    const fresh = rows.find((r) => r.slug === hit.slug);
    return fresh ? { row: fresh } : { error: `${hit.slug} no longer exists.` };
  }

  const needle = token.toLowerCase().replace(/\s+/g, ' ').trim();
  const matches = rows.filter((r) => {
    const hay = `${r.slug} ${displayName(r.fields)}`.toLowerCase();
    return needle.split(' ').every((w) => hay.includes(w));
  });
  if (!matches.length) return { error: `Nothing matches “${esc(token)}”.` };
  if (matches.length > 1) {
    return {
      error:
        `“${esc(token)}” matches ${matches.length}:\n` +
        matches.map((m) => `• ${esc(displayName(m.fields))}`).join('\n') +
        '\nBe more specific, or use the /inventory number.',
    };
  }
  return { row: matches[0] };
}

// ------------------------------------------------------------- the commands

const handlers = {
  async start(chatId) {
    await telegram.send(chatId,
      ['<b>Dixie inventory bot</b>', '',
       '/newcar &lt;details&gt; — start a listing',
       '/inventory — what is live',
       '/sold &lt;n|name&gt; — mark sold',
       '/price &lt;n|name&gt; &lt;amount&gt; — change price',
       '/reset — drop the current draft', '',
       'Example:', '<code>/newcar 2015 Honda Civic EX, 98k miles, FWD, $9,500</code>'].join('\n'));
  },

  async newcar(chatId, userId, args) {
    if (getDraft(userId)) {
      return telegram.send(chatId, 'A draft is already open. /reset to discard it first.');
    }
    const { fields, missing, warnings, error } = parseNewCar(args);
    if (error) return telegram.send(chatId, error);

    if (missing?.length) {
      return telegram.send(chatId,
        `Couldn't find: <b>${missing.join(', ')}</b>\n` +
        'Try: <code>/newcar 2015 Honda Civic EX, 98k miles, FWD, $9,500</code>');
    }

    const draft = startDraft(userId, fields);
    const notes = warnings.length ? `\n\n⚠️ ${warnings.join(', ')} — /edit to change.` : '';
    await telegram.send(chatId,
      `Draft created:\n${fieldSummary(fields)}\n<i>${esc(fields.bodyStyle)}</i>${notes}` +
      '\n\nSend photos, then /next. (/next alone skips photos.)');
    void draft;
  },

  async next(chatId, userId) {
    const draft = getDraft(userId);
    if (!draft) return telegram.send(chatId, 'No draft open. Start with /newcar.');

    if (draft.step === STEPS.PHOTOS) {
      draft.step = STEPS.DESCRIPTION;
      const count = draft.photos.length;
      return telegram.send(chatId,
        (count ? `${count} photo${count === 1 ? '' : 's'} attached.` : '⚠️ No photos attached.') +
        '\nSend a description, or /skip.');
    }
    if (draft.step === STEPS.DESCRIPTION) {
      draft.step = STEPS.PREVIEW;
      return telegram.send(chatId, previewText(draft));
    }
    return telegram.send(chatId, previewText(draft));
  },

  async skip(chatId, userId) {
    const draft = getDraft(userId);
    if (!draft) return telegram.send(chatId, 'No draft open.');
    if (draft.step === STEPS.DESCRIPTION) {
      draft.description = '';
      draft.step = STEPS.PREVIEW;
      return telegram.send(chatId, previewText(draft));
    }
    return handlers.next(chatId, userId);
  },

  async edit(chatId, userId, args) {
    const draft = getDraft(userId);
    if (!draft) return telegram.send(chatId, 'No draft open. To change a live listing use /price.');

    const [rawKey, ...rest] = args.trim().split(/\s+/);
    const key = (rawKey || '').toLowerCase();
    const value = rest.join(' ').trim();
    if (!key || !value) {
      return telegram.send(chatId,
        `Usage: <code>/edit price 7500</code>\nFields: ${Object.keys(EDITABLE).join(', ')}`);
    }
    const coerce = EDITABLE[key];
    if (!coerce) return telegram.send(chatId, `Unknown field “${esc(key)}”.\nFields: ${Object.keys(EDITABLE).join(', ')}`);

    const { ok, value: coerced, key: realKey } = coerce(value);
    if (!ok) return telegram.send(chatId, `“${esc(value)}” isn't valid for ${esc(key)}.`);

    draft.fields[realKey || key] = coerced;
    draft.step = STEPS.PREVIEW;
    return telegram.send(chatId, previewText(draft));
  },

  async reset(chatId, userId) {
    const had = clearDraft(userId);
    return telegram.send(chatId, had ? 'Draft discarded.' : 'Nothing to discard.');
  },

  async add(chatId, userId) {
    const draft = getDraft(userId);
    if (!draft) return telegram.send(chatId, 'No draft open. Start with /newcar.');

    const f = draft.fields;
    const slug = slugify(f);
    const existing = await github.listVehicleFiles();
    if (existing.some((e) => e.name === `${slug}.md`)) {
      return telegram.send(chatId,
        `A listing already exists at <code>${esc(slug)}</code>.\n` +
        'Change the trim with /edit, or /price to update the existing one.');
    }

    await telegram.send(chatId, 'Uploading…');

    // Photos are only downloaded now — /reset before this point costs nothing.
    const files = [];
    draft.photoNames = [];
    for (const [i, photo] of draft.photos.entries()) {
      try {
        const { bytes, ext } = await telegram.download(photo.fileId);
        const name = `${slug}-${i + 1}.${ext === 'jpeg' ? 'jpg' : ext}`;
        files.push({ path: `${config.photoDir}/${name}`, content: bytes });
        draft.photoNames.push(name);
      } catch (err) {
        await telegram.send(chatId, `⚠️ Photo ${i + 1} failed (${esc(err.message)}) — continuing without it.`);
      }
    }

    files.push({ path: `${config.vehicleDir}/${slug}.md`, content: buildMarkdown(draft) });

    try {
      await github.commitFiles(`Add ${displayName(f)}`, files);
    } catch (err) {
      return telegram.send(chatId, `❌ Commit failed:\n<code>${esc(err.message)}</code>`);
    }

    clearDraft(userId);
    return telegram.send(chatId,
      `✅ Pushed — live in about 2 minutes.\n${config.siteUrl}/inventory/${esc(slug)}/`);
  },

  async inventory(chatId, userId, args) {
    const filter = (args || '').trim().toLowerCase();
    const rows = await loadInventory();
    if (!rows.length) return telegram.send(chatId, 'No listings in the repo yet.');

    const visible =
      filter === 'all' ? rows
      : filter === 'sold' ? rows.filter((r) => r.fields.status === 'sold')
      : rows.filter((r) => r.fields.status !== 'sold');

    if (!visible.length) return telegram.send(chatId, `Nothing matches “${esc(filter)}”.`);

    rememberListing(userId, visible.map((r) => ({ slug: r.slug })));

    const lines = visible.map((r, i) => {
      const f = r.fields;
      const flag = f.status === 'sold' ? ' · SOLD' : f.status === 'pending' ? ' · PENDING' : '';
      return `<b>${i + 1}.</b> ${esc(displayName(f))} — ${esc(money(f.price))}${flag}`;
    });
    const hidden = rows.length - visible.length;
    return telegram.send(chatId,
      lines.join('\n') +
      (hidden > 0 && filter !== 'all' ? `\n\n<i>${hidden} sold — /inventory all</i>` : '') +
      '\n\n/sold &lt;n&gt; · /price &lt;n&gt; &lt;amount&gt;');
  },

  async sold(chatId, userId, args) {
    const token = (args || '').trim();
    if (!token) return telegram.send(chatId, 'Usage: <code>/sold 3</code> or <code>/sold sonata</code>');

    const rows = await loadInventory();
    const { row, error } = resolveTarget(userId, token, rows);
    if (error) return telegram.send(chatId, error);
    if (row.fields.status === 'sold') {
      return telegram.send(chatId, `${esc(displayName(row.fields))} is already marked sold.`);
    }
    // Confirm by NAME — a stale index number is then harmless.
    return telegram.send(chatId,
      `Mark <b>${esc(displayName(row.fields))}</b> — ${esc(money(row.fields.price))} as sold?`,
      telegram.buttons([[['Yes, mark sold', `sold:${row.slug}`], ['Cancel', 'cancel']]]));
  },

  async price(chatId, userId, args) {
    const parts = (args || '').trim().split(/\s+/);
    const amount = parts.pop();
    const token = parts.join(' ');
    if (!token || !amount) {
      return telegram.send(chatId, 'Usage: <code>/price 3 7500</code> or <code>/price sonata 7500</code>');
    }
    const { ok, value } = EDITABLE.price(amount);
    if (!ok) return telegram.send(chatId, `“${esc(amount)}” isn't a valid price.`);

    const rows = await loadInventory();
    const { row, error } = resolveTarget(userId, token, rows);
    if (error) return telegram.send(chatId, error);

    return telegram.send(chatId,
      `<b>${esc(displayName(row.fields))}</b>\n${esc(money(row.fields.price))} → <b>${esc(money(value))}</b>?`,
      telegram.buttons([[['Yes, update', `price:${row.slug}:${value}`], ['Cancel', 'cancel']]]));
  },
};

// -------------------------------------------------- confirmation callbacks

async function applyEdit(chatId, messageId, slug, key, value, verb) {
  const path = `${config.vehicleDir}/${slug}.md`;
  try {
    const md = await github.readFile(path);
    const updated = setField(md, key, value);
    if (updated === md) {
      return telegram.editText(chatId, messageId, 'Nothing changed — it already had that value.');
    }
    await github.commitFiles(`${verb} ${slug}`, [{ path, content: updated }]);
    await telegram.editText(chatId, messageId,
      `✅ ${verb} — live in about 2 minutes.\n${config.siteUrl}/inventory/${esc(slug)}/`);
  } catch (err) {
    await telegram.editText(chatId, messageId, `❌ Failed:\n<code>${esc(err.message)}</code>`);
  }
}

async function onCallback(cb) {
  const chatId = cb.message.chat.id;
  const messageId = cb.message.message_id;
  await telegram.answerCallback(cb.id);

  if (cb.data === 'cancel') {
    return telegram.editText(chatId, messageId, 'Cancelled.');
  }
  const [action, slug, extra] = cb.data.split(':');
  if (action === 'sold') {
    return applyEdit(chatId, messageId, slug, 'status', 'sold', 'Marked sold');
  }
  if (action === 'price') {
    return applyEdit(chatId, messageId, slug, 'price', Number(extra), 'Price updated');
  }
}

// ------------------------------------------------------------ message routing

async function onMessage(msg) {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;
  const draft = getDraft(userId);

  // Photos: accumulate file_ids, and debounce the reply so a six-photo album
  // gets one acknowledgement instead of six.
  if (msg.photo?.length) {
    if (!draft || draft.step !== STEPS.PHOTOS) {
      return telegram.send(chatId, 'Start a listing with /newcar before sending photos.');
    }
    const best = msg.photo[msg.photo.length - 1]; // largest available size
    if (!draft.photos.some((p) => p.uniqueId === best.file_unique_id)) {
      draft.photos.push({ fileId: best.file_id, uniqueId: best.file_unique_id });
    }
    clearTimeout(draft.pendingNotice);
    draft.pendingNotice = setTimeout(() => {
      const n = draft.photos.length;
      telegram.send(chatId, `${n} photo${n === 1 ? '' : 's'} attached. Send more, or /next.`)
        .catch((e) => console.error(e.message));
    }, 1500);
    return;
  }

  if (msg.document?.mime_type?.startsWith('image/')) {
    if (!draft || draft.step !== STEPS.PHOTOS) {
      return telegram.send(chatId, 'Start a listing with /newcar before sending photos.');
    }
    draft.photos.push({ fileId: msg.document.file_id, uniqueId: msg.document.file_unique_id });
    return telegram.send(chatId, `${draft.photos.length} photos attached (full resolution). /next when done.`);
  }

  const text = (msg.text || '').trim();
  if (!text) return;

  const match = text.match(/^\/([a-z_]+)(?:@\w+)?\s*([\s\S]*)$/i);
  if (match) {
    const command = match[1].toLowerCase();
    const args = match[2] || '';
    const handler =
      handlers[command] ||
      (command === 'help' ? handlers.start : null);
    if (!handler) return telegram.send(chatId, `Unknown command /${esc(command)}. /help for the list.`);
    return handler(chatId, userId, args);
  }

  // Bare text is the description when we're waiting for one.
  if (draft?.step === STEPS.DESCRIPTION) {
    draft.description = text;
    draft.step = STEPS.PREVIEW;
    return telegram.send(chatId, previewText(draft));
  }
  if (draft?.step === STEPS.PHOTOS) {
    return telegram.send(chatId, 'Send photos, or /next to continue.');
  }
  return telegram.send(chatId, 'Not sure what to do with that. /help for commands.');
}

// ------------------------------------------------------------------- runtime

async function main() {
  // Announce each check BEFORE running it, so a hang shows which step wedged
  // instead of just printing nothing at all.
  process.stdout.write('Telegram… ');
  const me = await telegram.call('getMe');
  console.log(`@${me.username}`);

  // A webhook silently starves getUpdates: the bot runs, but never sees a
  // single message. Worth detecting rather than leaving the user guessing.
  const hook = await telegram.call('getWebhookInfo');
  if (hook?.url) {
    console.error(`\n  A webhook is registered for this bot:\n    ${hook.url}`);
    console.error('  While that exists, polling receives NOTHING.');
    console.error('  Clear it with:  npm run doctor -- --clear-webhook\n');
    process.exit(1);
  }

  process.stdout.write('GitHub… ');
  const repo = await github.checkAccess();
  console.log(`${repo.full_name} (${config.github.branch}) — write access confirmed`);

  console.log(`Owners: ${config.ownerIds.join(', ')}`);
  console.log('Listening. Ctrl-C to stop.\n');

  let offset;
  for (;;) {
    const updates = await telegram.getUpdates(offset);
    for (const update of updates) {
      offset = update.update_id + 1;
      const from = update.message?.from || update.callback_query?.from;
      const text = update.message?.text || (update.message?.photo ? '[photo]' : '');
      console.log(`← ${from?.id} (@${from?.username || '—'}): ${text.slice(0, 60)}`);

      // The allowlist. Everything above this line is untrusted input.
      if (!from || !isOwner(from.id)) {
        if (update.message) {
          console.warn(
            `  IGNORED — ${from?.id} is not in TELEGRAM_OWNER_IDS ` +
            `(allowed: ${config.ownerIds.join(', ')}).\n` +
            '  If that is you, put that number in bot/.env and restart.'
          );
          await telegram.send(update.message.chat.id, 'This bot is private.').catch(() => {});
        }
        continue;
      }

      try {
        if (update.message) await onMessage(update.message);
        else if (update.callback_query) await onCallback(update.callback_query);
      } catch (err) {
        console.error('Handler error:', err);
        const chatId = update.message?.chat.id || update.callback_query?.message.chat.id;
        if (chatId) {
          await telegram.send(chatId, `❌ <code>${esc(err.message)}</code>`).catch(() => {});
        }
      }
    }
  }
}

main().catch((err) => {
  console.error('\nFatal:', err.message, '\n');
  process.exit(1);
});
