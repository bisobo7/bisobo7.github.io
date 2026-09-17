// Independent of state rules. null means unknown, never a free/$0 fee.
// The owner confirmed on 2026-09-17 that Dixie currently charges no mandatory
// dealer fees. Review again at year-end or immediately if that policy changes.
export const dixieFees = {
  version: 'dixie-2026.09.17-no-fees-v1', verifiedOn: '2026-09-17',
  effectiveFrom: '2026-09-17', effectiveThrough: '2026-12-31',
  charges: [{ label: 'Dixie dealer fees', amountCents: 0, taxable: false,
    includedInPrice: false, mandatory: true }],
};
