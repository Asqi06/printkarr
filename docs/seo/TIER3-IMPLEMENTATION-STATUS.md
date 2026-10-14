# Tier-3 improvements: implementation sequence

14 October 2026. Changes are local; no production deployment or Google account changes were made.

## Completed in the first release

1. Aligned Organization/Service descriptions with the existing shared fee policy: ₹5 school/college delivery per checkout; other available local delivery has no additional charge. Kept existing coverage checks and fee calculations.
2. Replaced ambiguous homepage upload/hero copy with PDF/photo and B&W/colour printout wording. Updated Vapi/Daman headings and search titles without creating duplicate locality pages or promising physical photocopy services.
3. Added server-rendered 50/100-page examples using the existing pricing function, including configured rates and active offers. Printing examples are separate from binding/delivery. Kept bulk details expandable and preserved the explanation that front-back printing does not halve billed pages.
4. Clarified school/college versus home/hostel/office delivery labels and front-back settings. Retained native institution selection, locality fallback, GPS, landmarks and current cutoff logic.
5. Made direct UPI/card payment and optional wallet offers explicit wherever the gateway is available. Added brief help for bringing WhatsApp documents into the existing upload flow.
6. Added `.com`/`www.printkarr.com` to existing canonical-host redirects and OAuth base-origin handling. Public-page redirects are permanent, private checkout links use the existing temporary redirect behavior, and printer-agent API requests retain their original host.
7. Added consent-gated `print_upload_start`, `print_options_view` and `begin_checkout` analytics events alongside existing confirmed purchases. They contain no document or customer payload. Updated analytics consent/privacy wording. Analytics stays disabled without a configured GA4 ID and opt-in.

## Verification

- SEO/design checks: 73 page renders, 19 sitemap destinations, metadata, schema fees, configured-price examples and canonical aliases passed.
- Direct checkout routes and browser checks passed: institution/address route switching, current totals, mobile/desktop wallet payment, confirmation receipt, privacy and replay protection.
- Delivery service and native picker checks passed: coverage, cutoffs, institution fee, disabled hidden fields, saved institutions and unavailable windows.
- Browser checks at 320/390/1440 pixels passed: no horizontal overflow, calculator, unchanged front-back billing and actual homepage upload. At 390 pixels without JavaScript, price examples and the native upload button remain available.
- Analytics self-check passed: no collection without consent/configuration, screen deduplication, invalid/auxiliary submit exclusions, withdrawal and no customer payload.
- Graph refreshed with `graphify update .`. Graphify reports existing extraction limitations for one SQL file and a separate legacy TSX workspace.

Browser screenshots: `output/tier3/`. Checkout browser verification used a temporary copy with a fresh screenshot directory because Windows refused to overwrite an existing test image. Native Edge emitted its own ViewTransition opt-in warning on homepage navigation; the focused homepage check excluded that exact browser warning and asserted no other page errors.

## Next: live prerequisites

1. **Verify hosting and storage before deployment.** Confirm the actual production host and `/api/ready` storage backend, backups of orders and uploaded files, and current checkout totals. The deployment guide flags ephemeral-storage data loss; the newer README also supports Atlas/GridFS or persistent disk. Do not infer the live backend from local configuration. Public readiness fetches were blocked by this environment; no live storage verification was completed.
2. **Connect domain aliases at hosting/DNS.** Local `.com` redirects are ready. DNS, TLS certificates and actual deep-link redirects still need verification. Browser fetches were unavailable; sandbox DNS failures do not establish domain ownership or global availability.
3. **Verify Google account setup.** No Maps listing link was supplied. Locate any existing profile before creating a duplicate; otherwise set up a qualifying service-area profile with verified business location, genuine operating hours and supported areas. Online ordering availability is not a promise of 24/7 delivery. This needs owner account access and actual business details.
4. **Verify Search Console and analytics.** Submit the canonical sitemap, inspect key pages and confirm GA4 configuration/consented event collection after release. Measure organic paid orders and checkout conversion from a real baseline.
5. **Collect genuine review evidence.** Add the verified Google review link once a profile exists. Request honest reviews after completed deliveries, without incentives or suggested keywords. No external customer messages were sent.

## Then: evidence-led improvements

- Observe 5–10 local customers ordering on their own Android phones, including WhatsApp-sourced files and denied GPS permission.
- Use upload attempts, options-screen views, checkout starts and paid receipts to find friction. `print_options_view` includes resumed drafts; it is not an exact upload-success metric. Consent also limits funnel coverage.
- Pilot fluent-reviewed Hindi/Gujarati help and expand translation only where observation supports it.
- Improve measured performance or preview problems and one distinct service guide before adding locality pages.
- Build the WhatsApp inbound-media bridge only if document acquisition remains a recurring abandonment cause. Provider setup, private expiring links, upload validation and retention remain prerequisites.

The bot, broad localization, new locality pages, invented schema/review claims and external-account writes are not part of this first release.
