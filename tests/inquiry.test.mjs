import test from 'node:test';
import assert from 'node:assert/strict';
import { submitInquiry } from '../src/utils/inquiry.js';
test('only HTTP success plus explicit service acceptance succeeds', async () => {
  for (const response of [{ ok: false, json: async () => ({ success: true }) }, { ok: true, json: async () => ({ success: false }) }, { ok: true, json: async () => ({ success: 'true' }) }, { ok: true, json: async () => { throw Error('Not JSON'); } }]) {
    await assert.rejects(submitInquiry('https://example.invalid', new FormData(), async () => response));
  }
  await submitInquiry('https://example.invalid', new FormData(), async () => ({ ok: true, json: async () => ({ success: true }) }));
});
test('failed request retains body for retry and sends no financial URL parameters', async () => {
  const body = new FormData(); body.set('calculation_summary', 'Customer-entered test estimate');
  const fetcher = async (url, options) => { assert.equal(url, 'https://api.web3forms.com/submit'); assert.equal(options.method, 'POST'); assert.equal(options.body, body); assert.ok(options.signal); throw new Error('Network failure'); };
  await assert.rejects(submitInquiry('https://api.web3forms.com/submit', body, fetcher));
  assert.equal(body.get('calculation_summary'), 'Customer-entered test estimate');
});
