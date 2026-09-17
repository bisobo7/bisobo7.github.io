// Reviewed against Michigan's published sources on 2026-09-17.
// Add a separately reviewed ruleset for later years; never extrapolate caps.
export const sources = {
  tax: 'https://www.michigan.gov/sos/-/media/Project/Websites/sos/01preston/Dealer_Manual_Chapter_8.pdf',
  trade: 'https://www.michigan.gov/taxes/rep-legal/rab/2022-revenue-administrative-bulletins/revenue-administrative-bulletin-2022-17',
  title: 'https://www.michigan.gov/sos/vehicle/titles',
  fees: 'https://www.michigan.gov/sos/-/media/Project/Websites/sos/01preston/Dealer_Manual_Chapter_7.pdf',
  docLimit: 'https://www.michigan.gov/difs/-/media/Project/Websites/difs/Bulletins/2025/Bulletin_2025-03-CF.pdf',
  registration: 'https://www.michigan.gov/sos/vehicle/license-plates/plates-and-tabs',
  registrationCalculator: 'https://dsvsesvc.sos.state.mi.us/TAP/_/',
};
export const michiganRules = [{
  version: 'MI-2026.09.17-v1', year: 2026,
  effectiveFrom: '2026-01-01', effectiveThrough: '2026-12-31', reviewed: '2026-09-17',
  taxPercent: 6, tradeCapCents: 1200000, titleCents: 1500,
  documentaryLimitCents: 28000, documentaryLimitPercent: 5,
  sources,
}];
export const currentRules = michiganRules[0];
