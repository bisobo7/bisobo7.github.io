# Michigan out-the-door calculator

Route: `/tools/michigan-out-the-door-calculator/`.

The page is static Astro HTML with a small vanilla JavaScript enhancement. No calculation inputs are stored, requested over the network, or added to URLs. The only supported prefill parameter is the existing public inventory identifier (`?vehicle=...`). The canonical URL omits all parameters. Clarity and Ahrefs are excluded on this page; Google Analytics receives a canonical page location and empty referrer.

## Maintenance

- `src/data/michigan-rules.js`: dated, reviewed state rules and official source URLs. The current version applies only to 2026. Add a reviewed ruleset for a new year; do not extrapolate the annual cap. Copy and the static example use the same values as the interactive model.
- `src/data/dixie-fees.js`: independently verified dealership charges, tax treatment, inclusion in advertised price, and effective dates. The owner confirmed no mandatory dealer fees on 2026-09-17; this is explicitly shown as $0 for selected Dixie vehicles. The configuration is valid from confirmation through 2026-12-31, with review required for other dates. `null` is unknown. An explicitly verified empty charge list means no additional dealer fees.
- `src/utils/out-the-door.js`: cent-based calculation and dealer-facing summary. DOM results and print use the same result.
- The calculator ends with a native “Call now” telephone link using `business.phoneHref`. It has no lead form or submission dependency. The site’s separate contact and vehicle-page forms retain their existing flow.

## Release status

- Michigan's official tax, trade-in, standard title, registration and documentary-fee references reviewed on 2026-09-17; linked from the page.
- **Confirmed by owner on 2026-09-17:** Dixie currently charges no mandatory dealer fees. No dealer charge is added; update the configuration if the policy changes. Registration remains separate.
- The owner requested a call action instead of an inquiry form. Web3Forms setup is not required for this calculator.
- Local implementation only; no commit, push or deployment performed.

## Validation

Run `npm test` and `ASTRO_TELEMETRY_DISABLED=1 npm run build`.
Calculation tests cover the specification's worked example, trade-in limits, negative equity, unknown fees/payoff, inclusive fees, excess contributions, cent rounding, invalid amounts, rule expiry and Michigan date boundaries. Inquiry transport tests use mocked responses, including network and HTTP/service failure; no real lead is created.

Browser-checked the production build at 1440px, 390px and 320px. No horizontal overflow was detected. Verified the worked example, unknown registration and payoff, vehicle-page prefill, unavailable inventory fallback, and expired rules. The in-app browser accepted the Print action but did not expose a native print preview; printed pagination still needs a normal-browser check. Keep the estimate and funding amounts visibly separate.

## Measurement

Existing Google Analytics events: `calculator_start`, `calculator_estimate_view`, `calculator_call_click`. Start and estimate-view fire at most once per page session, with an estimate-view recorded only when the result panel is visible. Recalculations are not conversions. Metadata is limited to entry point, complete/partial status and rules version. Do not add entered values, vehicle prices or contact details to telemetry.

Call clicks measure intent only; they do not prove that a call connected. Appointments and sales remain part of the dealership’s existing follow-up process. No analytics dashboard or live call verification is implied by the local implementation.
