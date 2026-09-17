import { michiganRules } from '../data/michigan-rules.js';
const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const money = (cents) => currencyFormatter.format(cents / 100);
export function michiganToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Detroit', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (type) => parts.find(p => p.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function parseMoney(value) {
  const raw = String(value).trim();
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(raw)) return null;
  const [whole, fraction = ''] = raw.replaceAll(',', '').split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(cents) && cents <= 100000000 ? cents : null;
}
const valid = (n) => Number.isSafeInteger(n) && n >= 0 && n <= 100000000;
export function rulesFor(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) return null;
  return michiganRules.find(r => date >= r.effectiveFrom && date <= r.effectiveThrough) || null;
}
// All money enters and leaves this function as integer cents. This is the only
// calculation model used by the worksheet, printout, example and inquiry.
export function calculateEstimate(input) {
  const rules = rulesFor(input.date);
  if (!rules) return { error: 'Rules for this transaction date need review. Please contact Dixie for a personalized estimate.' };
  if (!valid(input.price) || input.price === 0) return { error: 'Enter a vehicle selling price greater than $0.' };
  if (!valid(input.trade) || !valid(input.cash) || (input.payoff !== null && !valid(input.payoff)) || (input.registration !== null && !valid(input.registration))) return { error: 'Check the entered amounts. Use positive dollar amounts with no more than two decimal places.' };
  if (input.fees.some(f => f.amountCents !== null && !valid(f.amountCents))) return { error: 'Check the dealer fee amounts.' };
  const unresolved = [];
  let added = 0, taxableFees = 0;
  const feeLines = input.fees.filter(f => f.mandatory || f.selected).map(f => {
    if (f.amountCents === null || typeof f.taxable !== 'boolean') {
      unresolved.push(f.label);
      return { label: f.label, value: 'Not yet included', note: 'Dealer confirmation needed' };
    }
    if (!f.includedInPrice) {
      added += f.amountCents;
      if (f.taxable) taxableFees += f.amountCents;
    }
    return { label: f.label, value: money(f.amountCents), note: f.amountCents === 0 ? 'No dealer charge' : f.includedInPrice ? 'Already in vehicle price · not added again' : f.taxable ? 'Taxable dealer charge' : 'Non-taxable dealer charge' };
  });
  const taxableSubtotal = input.price + taxableFees;
  const deduction = input.qualifyingTrade ? Math.min(input.trade, rules.tradeCapCents, taxableSubtotal) : 0;
  const taxable = taxableSubtotal - deduction;
  const tax = Math.floor((taxable * rules.taxPercent + 50) / 100);
  const taxIncomplete = unresolved.length > 0;
  if (input.registration === null) unresolved.push('Registration and plate charges');
  const total = input.price + added + tax + rules.titleCents + (input.registration ?? 0);
  const complete = unresolved.length === 0;
  const label = complete ? 'Estimated out-the-door purchase total' : unresolved.length === 1 && input.registration === null ? 'Estimated subtotal before registration and plate charges' : 'Estimated subtotal before unresolved fees';
  const fundingComplete = complete && input.payoff !== null;
  const balance = fundingComplete ? total - input.trade + input.payoff : null;
  const finance = fundingComplete ? Math.max(0, balance - input.cash) : null;
  const excess = fundingComplete ? Math.max(0, input.cash - balance) : null;
  const lines = [
    { label: 'Vehicle selling price', value: money(input.price), note: 'Your estimate · dealer confirmation needed' },
    ...feeLines,
    { label: `Michigan sales tax (${rules.taxPercent}%)`, value: money(tax), note: taxIncomplete ? 'On known taxable charges only' : 'Estimated state sales tax' },
    { label: 'Standard Michigan title', value: money(rules.titleCents), note: 'Government charge' },
    { label: 'Registration and plates', value: input.registration === null ? 'Not yet included' : money(input.registration), note: input.registration === null ? 'Amount needed' : 'Your entered government charges' },
  ];
  return { rules, complete, label, lines, unresolved, tax, taxable, deduction, total, balance, finance, excess, fundingComplete };
}
export const disclaimer = 'This is an estimate, not a purchase agreement or financing offer. Final pricing depends on the confirmed vehicle price, applicable fees, registration details, and any agreed trade-in. Insurance, financing interest, and unselected optional products are not included.';
export function estimateSummary(input, result) {
  if (result.error) return result.error;
  return [
    'CUSTOMER-ENTERED ESTIMATE — dealer verification required',
    `Vehicle: ${input.vehicle || 'Manual / another dealer'}`,
    `Transaction date: ${input.date} | Registration: ${input.plate}`,
    ...result.lines.map(l => `${l.label}: ${l.value} (${l.note})`),
    `Eligible trade-in tax deduction: ${money(result.deduction)}`,
    `Taxable amount after deduction: ${money(result.taxable)}`,
    `${result.label}: ${money(result.total)}`,
    `Trade-in allowance: ${money(input.trade)} (user estimate, not an appraisal)`,
    `Qualifying single motor-vehicle trade-in: ${input.qualifyingTrade ? 'Yes, subject to confirmation' : 'No'}`,
    `Trade-in payoff: ${input.payoff === null ? 'Unknown' : money(input.payoff)}`,
    `Cash contribution: ${money(input.cash)}`,
    `Balance after trade-in and payoff: ${result.balance === null ? 'Incomplete' : money(result.balance)}`,
    `Estimated amount to finance: ${result.finance === null ? 'Incomplete' : money(result.finance)}`,
    ...(result.excess ? [`Excess contribution / equity: ${money(result.excess)} — confirm with dealer; not a guaranteed refund`] : []),
    `Unresolved: ${result.unresolved.join('; ') || 'None entered; all values subject to dealer confirmation'}`,
    `Rules: ${result.rules.version} | Reviewed: ${result.rules.reviewed} | Dealer fees: ${input.feeVersion}`,
    'Assumptions: ordinary used-car purchase from a Michigan dealer, titled and registered in Michigan; standard title; no optional products.',
    disclaimer,
  ].join('\n');
}
