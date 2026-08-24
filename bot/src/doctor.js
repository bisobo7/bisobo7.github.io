// bot/src/doctor.js — isolate each moving part and report pass/fail.
//
//   npm run doctor
//   npm run doctor -- --clear-webhook   (removes a webhook blocking polling)
//
// Prints no secrets: tokens are reported by length only.
import { config } from './config.js';

const args = process.argv.slice(2);
const ok = (m) => console.log(`  ✓ ${m}`);
const bad = (m) => console.log(`  ✗ ${m}`);
const note = (m) => console.log(`    ${m}`);

async function timed(label, fn) {
  const started = Date.now();
  try {
    const result = await fn();
    return { result, ms: Date.now() - started };
  } catch (err) {
    const ms = Date.now() - started;
    const hint =
      /timeout|aborted|TimeoutError/i.test(err.message)
        ? 'Timed out — network blocked, or a proxy/VPN is intercepting.'
        : /getaddrinfo|ENOTFOUND|EAI_AGAIN/i.test(err.message)
        ? 'DNS failed — no internet, or the host is blocked on this network.'
        : err.message;
    bad(`${label} (${ms}ms)`);
    note(hint);
    return { error: err, ms };
  }
}

console.log(`\nNode ${process.version} · ${process.platform}\n`);

console.log('Config');
ok(`bot token: ${config.botToken.length} chars`);
ok(`github token: ${config.github.token.length} chars`);
ok(`owner ids: ${config.ownerIds.join(', ')}`);
ok(`target: ${config.github.owner}/${config.github.repo} @ ${config.github.branch}`);

console.log('\nTelegram');
const API = `https://api.telegram.org/bot${config.botToken}`;
const api = async (method, params = {}) => {
  const res = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(15000),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.description || `HTTP ${res.status}`);
  return json.result;
};

const me = await timed('getMe', () => api('getMe'));
if (me.result) {
  ok(`bot is @${me.result.username} (${me.ms}ms)`);
  if (!me.result.can_read_all_group_messages) {
    note('privacy mode is on — fine, this bot is used in a direct chat');
  }
}

if (me.result) {
  const hook = await timed('getWebhookInfo', () => api('getWebhookInfo'));
  if (hook.result) {
    if (hook.result.url) {
      bad(`a webhook is set: ${hook.result.url}`);
      note('THIS IS WHY POLLING RECEIVES NOTHING. Telegram delivers updates to');
      note('the webhook instead. Re-run with:  npm run doctor -- --clear-webhook');
      if (args.includes('--clear-webhook')) {
        const cleared = await timed('deleteWebhook', () => api('deleteWebhook'));
        if (cleared.result) ok('webhook deleted — polling will work now');
      }
    } else {
      ok('no webhook set (polling is clear to receive)');
    }
  }

  const pending = await timed('getUpdates', () => api('getUpdates', { timeout: 0, limit: 10 }));
  if (pending.result) {
    ok(`${pending.result.length} update(s) waiting`);
    for (const u of pending.result) {
      const from = u.message?.from || u.callback_query?.from;
      const allowed = config.ownerIds.includes(from?.id);
      const body = u.message?.text || (u.message?.photo ? '[photo]' : '[other]');
      console.log(
        `      from ${from?.id} (@${from?.username || '—'}) ${allowed ? 'ALLOWED' : '← NOT IN ALLOWLIST'}: ${body.slice(0, 40)}`
      );
    }
    if (!pending.result.length) {
      note('Send your bot a message, then run this again. If it still shows 0,');
      note('you are messaging a different bot than this token belongs to.');
    }
  }
}

console.log('\nGitHub');
const repo = await timed('repo access', async () => {
  const res = await fetch(
    `https://api.github.com/repos/${config.github.owner}/${config.github.repo}`,
    {
      headers: {
        Authorization: `Bearer ${config.github.token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'dixie-inventory-bot-doctor',
      },
      signal: AbortSignal.timeout(20000),
    }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${(await res.text()).slice(0, 160)}`);
  return res.json();
});
if (repo.result) {
  ok(`${repo.result.full_name} reachable (${repo.ms}ms)`);
  if (repo.result.permissions?.push) ok('write access confirmed');
  else {
    bad('token cannot WRITE to this repo');
    note('Needs Repository permissions → Contents: Read and write.');
  }
}

console.log('');
