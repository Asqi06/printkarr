# PrintKarr Paper Studio

Implemented 9 October 2026. This direction follows the latest brief: remove the 3D experience and make printing, stationery and delivery easy to find.

The shared identity uses paper white, cobalt blue, lime and coral; self-hosted DM Sans; flat editorial artwork; clear borders; and small, optional CSS transitions. The homepage begins with the working upload form, followed by stationery/shop shortcuts, ordering steps, a live price estimate, delivery information, packs, wallet, genuine reviews when available, FAQs and a final print action. Account, checkout, public information, shop and operational screens use the same shared theme.

## Complete page overhaul

All rendered screen families now share the redesigned navigation, content layout, typography, forms, tables, cards, empty/error states and mobile behavior. The operations area has a cobalt sidebar, grouped navigation, a rebuilt daily dashboard, section links for settings, and coordinated pricing, order, catalogue, customer, referral, pack, notification, analytics, partner and delivery screens. Customer screens include a new illustrated greeting, balance cards, account/address forms and consistent order/payment layouts. Public information pages, guides, legal pages, sign-in and shopping use the same paper identity.

The route inventory contains 99 screens/states in [page-inventory.json](page-inventory.json), including populated and empty operational screens. [page-coverage.json](page-coverage.json) records 198 desktop/mobile renders; screenshots are in [pages/](pages/). Run `npm run preview:pages` for the local read-only review gallery at `http://127.0.0.1:3140/__design`. Figures and accounts are labelled sample fixtures. The interactive local order preview is at `http://127.0.0.1:3137` while its process is running.

The audit also fixed a shared checkout race: the focused shell had changed deferred payment scripts to async, allowing initialization before payment fields were parsed. The shell now retains each script's defer attribute. Dynamic upload-to-settings replacement retains its existing initialization event.

## Preserved features

Guest and signed-in PDF/image uploads, document previews, page ranges, mixed-colour and split printing, copies/sides, live pricing, shop selection, stationery baskets, delivery coverage and slots, wallet, packs, referrals, payments, order tracking and role-restricted operational flows remain connected to their existing handlers. The price estimate reuses the production print-plan and pricing modules. Model source files supplied by the user remain untouched; the obsolete 3D page code and generated GLB have been removed.

## Checklist

| Item | Status |
| --- | --- |
| Custom 404 | Branded page, actual HTTP 404, noindex, Home and print actions. |
| Titles | Distinct titles for all 19 indexable pages. Account and workflow views retain their own titles and noindex. |
| Descriptions | All 19 indexable pages have 150–160 characters; private shared shells also include a 160-character description. |
| Social preview | New 1200 × 630 branded PNG, OG/Twitter metadata, image dimensions and alt text. |
| Image alt | Descriptive homepage/art/product alt; decorative icons hidden from accessibility tree. Checked on public metadata and browser routes. |
| Internal links | Shared navigation/footer plus links between home, prices, service guide, kiosks, shops and contact. |
| XML sitemap | `/sitemap.xml` includes 19 canonical public URLs. Search Console submission deferred by user. |
| Robots | Public crawling allowed; account, admin, partner, rider, cart, order and private endpoints disallowed. Existing authentication remains the access control. |
| HTTPS | Live HTTP returned 301 to HTTPS; live HTTPS returned 200 with HSTS on 9 October 2026. Local app also upgrades all methods on the configured public hostname with 308. Caddy retains automatic TLS. |
| Contact spam | Honeypot, shared origin guard, five attempts per IP per 15 minutes, allowlisted/bounded fields and validation. In-memory rate limiter resets on process restart and is per instance; use a shared store if horizontally scaled. |
| Thank you | Successful storage redirects to `/contact/thank-you`; failed storage returns an error preserving input. One-use, short-lived confirmation cookie. |
| GA4 | Consent-gated integration and page_view, generate_lead and paid purchase event hooks prepared. Disabled while Measurement ID is blank. Activation and property configuration deferred by user. |
| Privacy | Existing document/account retention information preserved; essential storage, optional analytics, rejection and withdrawal controls added. |
| FAQs | Prices, process, delivery, mixed printing, combined baskets, cancellation/refunds, accounts and kiosk development. |
| Testimonials | Existing customer-submitted reviews only, including low ratings. Empty section omitted; delivered-customer badge follows existing order records. No generated reviews. |

## Validation

- `npm test`: 76 passing unit checks.
- `npm run test:checkout`: checkout, payment, ownership and replay checks.
- `npm run test:store`: catalogue, photos, cart, delivery, payment and refund checks.
- `npm run test:ux`: mixed/split printing and address/coverage checks.
- `npm run test:pages`: 99 screens/states at 1440 and 390 px; workspace menus and dense pages additionally at 320, 768 and 1024 px. No document overflow or page script errors.
- `npm run test:design`: 73 rendered views, navigation, landmarks, scripts and existing interaction checks.
- `npm run test:seo`: 19 sitemap URLs, unique titles, description lengths, canonicals, structured data and local assets.
- `npm run test:studio`: 1440, 768, 390 and 320 px layouts; 10 routes; actual guest/account uploads; live estimate; form validation, honeypot, rate limit and confirmation; no-JS upload; no 3D runtime.
- `npm run test:checklist`: failed contact writes, origin validation, safe fields/errors, 404, HTTPS POST redirect, disabled analytics, consent rejection/acceptance/withdrawal, query/title redaction, paid-only purchase events and receipt-refresh deduplication. Google endpoints are intercepted locally; no real analytics events are transmitted.

Browser checks use the existing bundled Playwright runtime and Microsoft Edge. Set `PLAYWRIGHT_MODULE` to another installed Playwright ES module entry point when running on a different machine. No production payment, printer or outgoing email is invoked by the previews.

## Later setup

The user explicitly deferred Google setup. When ready, supply the GA4 Measurement ID via `GA4_MEASUREMENT_ID`, check the property’s event settings/automatic enhanced measurement, and verify events in DebugView with consent. Submit `https://printkarr.in/sitemap.xml` through the verified Search Console property. These steps have not been performed. The application is not deployed by this change.

## Sources

Implementation follows [Google consent guidance](https://developers.google.com/tag-platform/security/guides/consent) and [GA4 recommended events](https://developers.google.com/analytics/devguides/collection/ga4/reference/events). The connected [public website](https://printkarr.in/) was checked for HTTPS response behavior; local screenshots show the new design.
