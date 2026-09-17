import { calculateEstimate, michiganToday, money, parseMoney, rulesFor } from '../utils/out-the-door.js';
const root = document.getElementById('otd-calculator');
if (root) {
  const el = id => document.getElementById(id);
  const form = el('estimate-inputs');
  const vehicles = JSON.parse(root.dataset.vehicles);
  const feeConfig = JSON.parse(root.dataset.fees);
  const requested = new URLSearchParams(location.search).get('vehicle');
  const entry = requested ? 'inventory' : 'manual';
  let current = null, started = false, viewed = false;
  let resultVisible = false;
  const track = (name) => {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', name, {
      entry_point: entry,
      estimate_status: current?.result.complete ? 'complete' : 'partial',
      rules_version: current?.result.rules.version || rulesFor(el('transaction-date').value)?.version || 'unavailable',
      page_location: location.origin + location.pathname,
      page_referrer: '',
    });
  };
  const start = () => { if (!started) { started = true; track('calculator_start'); } };
  const markViewed = () => { if (current && resultVisible && !viewed) { start(); viewed = true; track('calculator_estimate_view'); } };
  const selectedVehicle = () => vehicles.find(v => v.id === el('vehicle-choice').value && v.status === 'available');
  const row = (label, value, note = '') => {
    const div = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
    dt.textContent = label; dd.textContent = value;
    if (note) { const small = document.createElement('small'); small.textContent = note; dt.append(small); }
    div.append(dt, dd); return div;
  };
  function syncFields() {
    const selected = selectedVehicle();
    el('manual-fees').hidden = Boolean(selected);
    el('dixie-fee-notice').hidden = !selected;
    const feesCurrent = feeConfig.verifiedOn && feeConfig.effectiveFrom <= el('transaction-date').value && feeConfig.effectiveThrough >= el('transaction-date').value;
    const noDealerFees = feeConfig.charges.every(f => f.amountCents === 0);
    el('dixie-fee-notice').textContent = feesCurrent ? (noDealerFees ? 'Dixie charges no mandatory dealer fees. Dealer fees: $0.' : 'Dixie’s configured dealer charges appear in the worksheet. Final pricing requires confirmation.') : 'Dixie’s dealer fees need confirmation and are not yet included. Call Dixie to confirm the applicable charges.';
    el('quoted-fees').hidden = el('fee-status').value !== 'quoted';
    el('trade-fields').hidden = !el('has-trade').checked;
    el('payoff-field').hidden = el('payoff-status').value !== 'known';
    for (const id of ['taxable-fee', 'nontaxable-fee', 'fees-included']) el(id).disabled = Boolean(selected) || el('fee-status').value !== 'quoted';
    for (const id of ['trade-value', 'qualifying-trade', 'payoff-status']) el(id).disabled = !el('has-trade').checked;
    el('trade-payoff').disabled = !el('has-trade').checked || el('payoff-status').value !== 'known';
  }
  function readInput(showRequired) {
    let invalid = false;
    const read = (id, required = true) => {
      const field = el(id), value = field.value.trim();
      const amount = value === '' && !required ? 0 : parseMoney(value);
      const bad = amount === null || (id === 'selling-price' && amount === 0);
      const displayError = bad && (value !== '' || showRequired);
      el(id + '-error').textContent = displayError ? (id === 'selling-price' ? 'Enter a price above $0, using up to two decimal places.' : 'Enter a valid amount from $0 to $1,000,000, using up to two decimal places.') : '';
      field.setAttribute('aria-invalid', String(displayError));
      if (bad) invalid = true;
      return amount;
    };
    document.querySelectorAll('.otd-error').forEach(node => { node.textContent = ''; });
    form.querySelectorAll('[aria-invalid]').forEach(node => node.removeAttribute('aria-invalid'));
    const date = el('transaction-date').value;
    if (!rulesFor(date)) {
      el('transaction-date-error').textContent = 'No reviewed rules for this date. Contact Dixie for an estimate.';
      el('transaction-date').setAttribute('aria-invalid', 'true');
    }
    const vehicle = selectedVehicle();
    let fees;
    if (vehicle) {
      const configured = feeConfig.verifiedOn && date >= feeConfig.effectiveFrom && date <= feeConfig.effectiveThrough;
      fees = configured ? feeConfig.charges : [{ label: 'Dixie dealer fees', amountCents: null, taxable: null, mandatory: true, includedInPrice: false }];
    } else if (el('fee-status').value === 'quoted') {
      fees = [
        { label: 'Taxable dealer fees', amountCents: read('taxable-fee'), taxable: true },
        { label: 'Non-taxable dealer fees', amountCents: read('nontaxable-fee'), taxable: false },
      ].map(f => ({ ...f, includedInPrice: el('fees-included').checked, mandatory: true }));
    } else fees = [{ label: 'Dealer fees', amountCents: null, taxable: null, mandatory: true, includedInPrice: false }];
    const hasTrade = el('has-trade').checked;
    const input = {
      date, price: read('selling-price'), fees,
      registration: el('registration').value.trim() === '' ? null : read('registration'),
      plate: el('plate-situation').value,
      trade: hasTrade ? read('trade-value') : 0,
      qualifyingTrade: hasTrade && el('qualifying-trade').checked,
      payoff: !hasTrade || el('payoff-status').value === 'paid' ? 0 : el('payoff-status').value === 'known' ? read('trade-payoff') : null,
      cash: read('cash', false),
      vehicle: vehicle ? `${vehicle.name} (${vehicle.id}); availability unconfirmed` : '',
      feeVersion: vehicle ? feeConfig.version : 'customer-entered-unverified',
    };
    return { input, invalid };
  }
  function render(showRequired = false) {
    syncFields();
    const { input, invalid } = readInput(showRequired);
    const result = calculateEstimate(input);
    const unsupported = el('purchase-scope').value === 'unsupported';
    const valid = !invalid && !result.error && !unsupported;
    current = valid ? { input, result } : null;
    el('estimate-output').hidden = !valid;
    el('empty-estimate').hidden = valid;
    el('empty-estimate-prompt').textContent = el('selling-price').value ? 'Complete your purchase details to see the estimate.' : 'Start with the vehicle’s selling price.';
    el('estimate-error').hidden = valid || (!showRequired && !el('selling-price').value && !unsupported);
    el('estimate-error').textContent = unsupported ? 'This situation needs a personalized estimate. Please contact Dixie using the link in “Buying in a different situation?” or call us.' : result.error || 'Complete the required amounts to update your estimate.';
    el('estimate-badge').textContent = valid ? result.complete ? 'All costs entered' : 'Partial estimate' : 'Awaiting your details';
    el('result-heading').textContent = valid ? 'Your estimated cost.' : 'See the whole picture.';
    if (!valid) return false;
    el('result-vehicle').textContent = input.vehicle || 'Manual price · Michigan dealer purchase';
    el('result-label').textContent = result.label;
    el('result-total').textContent = money(result.total);
    el('purchase-lines').replaceChildren(...result.lines.map(l => row(l.label, l.value, l.note)));
    el('tax-explanation').textContent = `${money(result.taxable)} taxable amount × ${result.rules.taxPercent}%. ${result.deduction ? `${money(result.deduction)} eligible trade-in deduction applied to the tax calculation only.` : 'No trade-in tax deduction applied.'}`;
    el('unresolved-note').hidden = result.complete;
    el('unresolved-note').textContent = `Not yet included: ${result.unresolved.join('; ')}${result.unresolved.some(s => s.includes('fees')) ? ', plus tax on any unresolved taxable fees' : ''}. This is not a complete out-the-door total.`;
    el('funding-section').hidden = !el('has-trade').checked && input.cash === 0;
    el('funding-lines').replaceChildren(
      row('Less trade-in allowance', '−' + money(input.trade), 'Your estimate · not an appraisal'),
      row('Add trade-in loan payoff', input.payoff === null ? 'Unknown' : '+' + money(input.payoff)),
      row('Balance after trade-in & payoff', result.balance === null ? 'Incomplete' : money(result.balance)),
      row('Less cash contribution', '−' + money(input.cash)),
      row('Estimated amount to finance', result.finance === null ? 'Incomplete' : money(result.finance)),
    );
    el('funding-note').textContent = !result.fundingComplete ? `Funding totals require ${[...result.unresolved, ...(input.payoff === null ? ['trade-in loan payoff'] : [])].join(', ')}. Unknown amounts have not been treated as $0.` : result.excess > 0 ? `No additional financing required. Excess contribution or equity of ${money(result.excess)} needs dealer confirmation; this is not a guaranteed cash refund.` : 'Assumes the remaining costs are financed. This is not a financing offer.';
    el('result-assumptions').textContent = `Purchase date: ${input.date} · ${input.plate}. ${result.rules.year} rules · reviewed ${result.rules.reviewed} · ${result.rules.version}.`;
    el('call-support').textContent = selectedVehicle() ? 'Call Dixie to confirm this vehicle’s availability and registration or plate charges.' : 'Call Dixie to find a vehicle in your budget. Prices from other sellers need their confirmation.';
    markViewed();
    return true;
  }
  function chooseVehicle() {
    const vehicle = selectedVehicle();
    el('selling-price').value = vehicle?.price ? String(vehicle.price) : '';
    el('vehicle-notice').textContent = vehicle ? (vehicle.price ? 'Advertised price prefilled. Confirm pricing and availability with Dixie.' : 'Contact Dixie for this vehicle’s price, then enter it here.') : 'Choose a Dixie vehicle to prefill its advertised price. Availability requires confirmation.';
  }
  el('calculator-fields').disabled = false;
  el('transaction-date').value = michiganToday();
  if (requested) {
    const vehicle = vehicles.find(v => v.id === requested && v.status === 'available');
    if (vehicle) { el('vehicle-choice').value = vehicle.id; chooseVehicle(); }
    else el('vehicle-notice').textContent = 'That vehicle is unavailable or was not found. You can still enter a price manually or choose another Dixie vehicle.';
  }
  form.addEventListener('input', () => { start(); render(); });
  form.addEventListener('change', e => { if (e.target.id === 'vehicle-choice') chooseVehicle(); start(); render(); });
  form.addEventListener('submit', e => {
    e.preventDefault(); start();
    if (!render(true)) { form.querySelector('[aria-invalid="true"]')?.focus(); el('estimate-announcement').textContent = 'Please review your inputs. The estimate is incomplete.'; return; }
    el('estimate-announcement').textContent = `${current.result.label}: ${money(current.result.total)}.`;
    el('estimate-panel').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  });
  el('call-action').addEventListener('click', () => { track('calculator_call_click'); });
  el('print-estimate').addEventListener('click', () => { if (render(true)) window.print(); });
  el('reset-estimate').addEventListener('click', () => {
    form.reset(); el('transaction-date').value = michiganToday();
    el('trade-details').open = false;
    chooseVehicle(); render(); el('selling-price').focus();
  });
  // One estimate-view conversion per page session, only when the worksheet is visible.
  const observer = new IntersectionObserver(entries => { resultVisible = entries[0].isIntersecting; markViewed(); }, { threshold: 0.1 });
  observer.observe(el('estimate-panel'));
  render();
}
