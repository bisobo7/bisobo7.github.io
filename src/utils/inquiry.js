// Service acceptance is necessary for success; it is not proof of inbox delivery.
export async function submitInquiry(action, body, fetcher = fetch) {
  const response = await fetcher(action, {
    method: 'POST', body, headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  const data = await response.json();
  if (!response.ok || data.success !== true) throw new Error('Inquiry was not accepted');
}
