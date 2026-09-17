# Michigan out-the-door calculator

Route: `/tools/michigan-out-the-door-calculator/`.

The page is static Astro HTML with a small vanilla JavaScript enhancement. No calculation inputs are stored, requested over the network, or added to URLs. The only supported prefill parameter is the existing public inventory identifier (`?vehicle=...`). The canonical URL omits all parameters. Clarity and Ahrefs are excluded on this page; Google Analytics receives a canonical page location and empty referrer.

## Maintenance

- `src/data/michigan-rules.js`: dated, reviewed state rules and official source URLs. The current version applies only to 2026. Add a reviewed ruleset for a new year; do not extrapolate the annual cap. Copy and the static example use the same values as the interactive model.
- `src/data/dixie-fees.js`: independently verified dealership charges, tax treatment, inclusion in advertised price, and effective dates. The owner confirmed no mandatory dealer fees on 2026-09-17; this is explicitly shown as $0 for selected Dixie vehicles. The configuration is valid from confirmation through 2026-12-31, with review required for other dates. `null` is unknown. An explicitly verified empty charge list means no additional dealer fees.
- `src/utils/out-the-door.js`: cent-based calculation and dealer-facing summary. DOM results and print use the same result; the inquiry is regenerated from this model before submission.
- `src/components/InquiryForm.astro`: existing Web3Forms flow, with optional quote mode (required email, optional phone and note). Only a successful HTTP response with `success: true` produces an accepted message. Failures retain input. No live message was sent during implementation.

## Release status

- Michigan's official tax, trade-in, standard title, registration and documentary-fee references reviewed on 2026-09-17; linked from the page.
- **Confirmed by owner on 2026-09-17:** Dixie currently charges no mandatory dealer fees. No dealer charge is added; update the configuration if the policy changes. Registration remains separate.
- **Needs delivery configuration:** `business.web3formsKey` is still the existing placeholder. The form shows an unavailable notice and phone fallback rather than attempting delivery.
- **Needs owner-authorized end-to-end verification:** after configuring the key, submit a clearly identified test quote and confirm that the intended inbox actually receives the selected vehicle, amounts, unresolved charges, assumptions and rules version. API acceptance alone does not verify delivery.
- Local implementation only; no commit, push or deployment performed.

## Validation

Run `npm test` and `ASTRO_TELEMETRY_DISABLED=1 npm run build`.
Calculation tests cover the specification's worked example, trade-in limits, negative equity, unknown fees/payoff, inclusive fees, excess contributions, cent rounding, invalid amounts, rule expiry and Michigan date boundaries. Inquiry transport tests use mocked responses, including network and HTTP/service failure; no real lead is created.

Browser-checked the production build at 1440px, 390px and 320px. No horizontal overflow was detected. Verified the worked example, unknown registration and payoff, quote summary and required/optional fields, vehicle-page prefill, unavailable inventory fallback, and expired rules. The in-app browser accepted the Print action but did not expose a native print preview; printed pagination still needs a normal-browser check. Keep the estimate and funding amounts visibly separate.

## Measurement

Existing Google Analytics events: `calculator_start`, `calculator_estimate_view`, `calculator_quote_click`, `calculator_inquiry_accepted`, `calculator_inventory_click`. Start and estimate-view fire at most once per page session, with an estimate-view recorded only when the result panel is visible. Recalculations are not conversions. Metadata is limited to entry point, complete/partial status and rules version. The accepted inquiry event follows explicit service acceptance; clicks are separate. Do not add entered values, vehicle prices, contact details or calculation summaries to telemetry.

Use sessions with an accepted calculator inquiry divided by sessions with an estimate view for the primary metric. Appointment and sale quality remain part of the dealership's existing follow-up process. No analytics dashboard or delivery verification is implied by the local implementation.
