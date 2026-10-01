# PrintKarr: SEO, local search and AI search audit

Audited 1 October 2026, Asia/Kolkata. Public site: https://printkarr.in. Codebase: `E:\prntkr`, Express with server-rendered HTML. Business: online document printing and local delivery, based in Vapi, with Daman delivery and selected-college coverage. Kiosk/partner pages describe a planned product.

## Outcome and deployment state

The live crawl found a sound indexing foundation, but inconsistent delivery promises, incomplete service answers, thin planning articles and large images. These gaps have been corrected in the code. A Daman delivery page and a public page of admin-configured printing prices have also been added. **At audit completion, these changes were local; production verification remains necessary after release.** Live evidence below describes the starting deployment; local verification describes the tested change.

No critical site-wide indexing blocker was observed. All 15 public destinations in the live crawl returned 200 with server-rendered content. The updated local sitemap contains 17 public destinations. Google Search Console, Analytics, Business Profile, Bing Webmaster Tools and a comprehensive backlink index were not available; Google's PageSpeed API returned quota-exceeded HTTP 429. Current rankings, index coverage, organic traffic, local-pack position, AI citation share and field Core Web Vitals remain unverified.

An aggregate 0–100 health score is withheld rather than substituting estimated field performance or account data. The readiness table and reproducible checks below describe what was actually established. Subjective content scores in the specialist baseline are editorial assessments, not Google measurements.

| Area | Live starting position | Local result / remaining dependency |
|---|---|---|
| Technical indexing | SSR, canonical tags, public sitemap, HTTPS and private-page noindex present | Known public URL variants redirect; public sign-in pages can be crawled to discover noindex; deployment recrawl needed |
| Service content | Delivery hours and planned kiosk status inconsistent; several incomplete articles | Service promises qualified, five guides expanded, clearer operator/process/policy information; genuine business proof still needed |
| On-page/local intent | Vapi hub present; Daman and public pricing missing | Dedicated Daman/pricing pages, stronger Vapi hub, relevant internal links and metadata |
| Structured data | Organization, WebSite, WebPage, breadcrumbs and some Service/BlogPosting data | Factual identity/service graph, actual review dates and article breadcrumbs; no invented branch or review data |
| Performance/images | Multi-megabyte instructional images and kiosk textures | Responsive WebP images, smaller textures and data-saving fallback; field performance unknown |
| AI search | Public HTML and discovery files accessible | Visible, attributable answers and matching llms.txt; actual citations/index eligibility require observation |
| Local authority | Phone/email/base locality present | GBP, real reviews, citations and partner references need verification by owner |

## Priority findings and fixes

| Priority | Finding and evidence | Work completed locally |
|---|---|---|
| High | Titles, Vapi H1 and other copy implied physical delivery 24/7, despite configured slots/cutoffs | Distinguish ordering any time from available delivery options; synchronize public copy, metadata, schema and llms.txt |
| High | Privacy/terms claimed encryption and deletion immediately after printing, unsupported by upload storage and janitor flow | Describe HTTPS, authorized handling and configured retention after terminal order states; distinguish print files from account/payment records |
| High | Nine full-size images/textures occupied 10.82 MB combined | Same-artwork WebP conversion reduces these resources to 1.40 MB, with responsive variants and intrinsic dimensions |
| High, owner dependency | No independently verified public business listing, operational photos or customer/campus proof established | Improve factual operator/about/contact information; do not manufacture reviews, offices, staff credentials or partnerships |
| Medium | Daman promised throughout site but no dedicated destination; price answers scattered | Add `/printing-in-daman` and `/printing-prices`; link from shared navigation/footer and related pages |
| Medium | Three journal posts had roughly 59–77 main-content words and unsupported kiosk economics/live-installation implications | Replace with useful proposed-pilot and comparison guidance; strengthen PDF/admit-card guides; add headings, sources, organization attribution and actual review dates |
| Medium | Known mixed-case/trailing-slash public URLs returned duplicate 200 pages | Add narrowly scoped GET/HEAD redirects to canonical public paths/origin; preserve queries and leave unknown routes/POSTs alone |
| Medium | How it works order button appeared around 2,071 px down a mobile page; step descriptions were 11 px | Add near-intro CTA and raise descriptions to 14 px; public pricing CTA also moved before cards after mobile QA |
| Medium | Robots exclusion of sign-in pages could prevent discovery of their noindex directive | Allow public customer sign-in and specifically `/admin/login`; retain private administration/customer/order/API restrictions and noindex |
| Low | Social preview used portrait kiosk art; structured identity lacked a suitable text logo | Add 1200×630 white/blue social image and text-only wordmark metadata; preserve the user's text-only site logo |
| Low | Pinned versioned vendors shared a short cache lifetime | Cache only exact-version vendor assets for a year; mutable assets and personalized HTML do not receive that policy |

Policy edits correct factual service descriptions; they do not certify the completeness or legal compliance of the policies. Business identity, refund terms and retention settings should be reviewed by the owner against actual operations.

## Technical SEO and source review

The live site exposed meaningful headings, service text, links and JSON-LD in initial HTML; the 3D canvas is decorative rather than a crawling prerequisite. Direct HTTP evidence takes precedence over the search tool's cached older homepage rendition. HTTP and www probes resolved to HTTPS. Sampled customer/admin sign-in and order pages emitted noindex; a customer route redirected to sign-in. Unknown articles and sampled retired Shopify URLs returned genuine 404/noindex responses.

The shared SEO module remains the single source of public metadata, schema, sitemap and crawler files. New routes reuse the existing templates and pricing database. Canonical redirects use the configured fixed public origin rather than reflecting arbitrary request hosts; unrelated preview hosts retain local navigation. Sitemap entries exclude private routes and list only genuine article modification dates, rather than giving every render a new date. Internal links reach every public destination through the homepage/shared navigation or journal.

The application already uses Helmet, compression and authentication/authorization boundaries. This was a public SEO and source review, not a penetration test. No authentication, payment, production database or print action was performed. No new dependency was added. English is the current language; hreflang would add no value without genuine alternate-language versions.

Canonical and indexing recommendations follow [Google's canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) and [noindex guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing): a crawler must be allowed to retrieve a page to discover its noindex directive. Robots restrictions are not access controls.

## Local content and search-intent map

These are intent hypotheses for content planning, not measured keyword volume or ranking estimates.

| Destination | Visitor question / intended topic |
|---|---|
| `/` | What is PrintKarr, where does it deliver, and how do I start an online print order? |
| `/printing-in-vapi` | Document printing with delivery in Vapi: settings, fees, slots, campus eligibility and help with deadlines |
| `/printing-in-daman` | Delivery to a Daman address from the Vapi-based service; address/PIN selection, fees, timing and absence of an announced Daman pickup branch |
| `/printing-prices` | Current B&W/colour/student printing rates, printed pages versus sheets, copies and separate delivery costs |
| `/blogs/prepare-documents-for-printing-vapi` | Preparing a PDF, margins, selected pages and avoiding preventable print errors |
| `/blogs/admit-card-printing-checklist` | Checking the issuing authority's instructions and preparing an exam document before a deadline |
| Other three journal guides | Campus delivery versus a proposed kiosk; kiosk responsibilities; choosing online printing versus a walk-in Xerox shop |
| `/franchise`, `/xerox` | Qualified proposed partnership enquiries, operational responsibilities and equipment compatibility |

The Daman page explains destination-specific checkout and service constraints rather than swapping a city name into the Vapi page. Sarigam/Bhilad remain **selected-college coverage subject to confirmation**. Seed database addresses and college names were not promoted as independently verified storefronts or contracted partnerships. Publish further campus/neighbourhood pages only when actual coverage, useful unique details and business evidence support them.

Articles now answer complete practical questions with section headings and sources. Their increased length is an outcome of useful answers, not a ranking quota. [Google's helpful-content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) explicitly rejects a preferred word count. Genuine original delivery examples, document photos with personal data removed, and verified partner information remain the largest content opportunity.

## Schema and AI search / GEO

The output includes Organization and WebSite entities, appropriate WebPage subtypes, Service records on service destinations, BlogPosting records and visible breadcrumb relationships. Organization describes the existing legal-name claim, Vapi base locality, phone/email, actual service areas and text wordmark. Articles carry organization authorship linked to About and the real 1 October 2026 review date. No historical publication date was fabricated. Social sharing metadata uses an actual 1200×630 image.

No LocalBusiness street address, geographic coordinates, operating hours, AggregateRating, fake customer reviews, FAQPage or HowTo rich-result promises were added. A planned kiosk is not an operating branch. Further Organization `sameAs` links require verified brand-owned profiles. This approach follows [Organization](https://developers.google.com/search/docs/appearance/structured-data/organization), [Article](https://developers.google.com/search/docs/appearance/structured-data/article) and [LocalBusiness](https://developers.google.com/search/docs/appearance/structured-data/local-business) guidance. Structural assertions are automated; deployed markup should also be inspected with Google's tools after release.

Live robots.txt, sitemap.xml and llms.txt returned 200. Wildcard robots policy allows public search/AI crawlers; it does not establish whether a hosting firewall permits each real crawler IP. The optional llms.txt has been synchronized with visible service facts, current ordering flow, wallet limitations and planned kiosk status. No AI-only doorway pages or extra invented schema were introduced.

[Google's AI search guidance](https://developers.google.com/search/docs/appearance/ai-features) applies ordinary indexing and snippet eligibility and requires no special AI text file or schema. [OpenAI's bot documentation](https://developers.openai.com/api/docs/bots) distinguishes OAI-SearchBot search crawling from GPTBot training crawling. Public crawler access and readable answers support discovery; they do not guarantee citations. Actual crawler logs, indexed pages and useful referral/order traffic are the appropriate next evidence.

## Performance and mobile verification

Nine full-size resources were reduced by **87.0% in asset bytes** while retaining their artwork, dimensions and transparency where present. Responsive images, async decoding and explicit dimensions reduce unnecessary transfer and protect layout. Model materials request WebP textures successfully. The existing reduced-motion/lazy renderer remains; Save-Data or a slow connection hint uses a loaded static image without requesting Three.js/model/textures. The campus renderer still has observed initialization long tasks and needs real-device monitoring.

| Same local observer, fresh contexts | Before | After | Transfer reduction |
|---|---:|---:|---:|
| How it works, mobile and desktop | 3,730,508 B | 330,169 B | 91.1% |
| For campuses, mobile | 5,686,557 B | 1,930,965 B | 66.0% |
| Home, desktop | 3,127,003 B | 518,300 B | 83.4% |

These are unthrottled **local initial subresource transfer** measurements, excluding HTML and later scroll-triggered loads. They are not deployed speed gains or field CWV results. Mobile homepage initial transfer was essentially unchanged because its distant cutout was not initially fetched; Vapi transfer increased modestly with additional useful content/styles. Live lab LCP ranged 0.756–1.740 seconds, with low observed CLS, but the short observation window cannot establish field percentiles. INP was not measured, and no Lighthouse score or verified CrUX data was obtained. Full methodology and measurements are in [performance-visual-findings.md](performance-visual-findings.md).

Verification completed:

- `npm test`: 44 passing application tests.
- `npm run test:seo`: 17 sitemap destinations plus 50 rendered page fixtures; canonical, headings, index directives, JSON-LD, dates, assets, links, configured pricing and redirect-boundary checks pass.
- Read-only Edge review: 17 public pages at 320, 390, 760, 1024 and 1440 px — 85 layouts, one H1 each, no horizontal overflow or JavaScript exceptions. Primary service CTAs remain visible near the introduction.
- Normal 3D kiosk rendering and Save-Data/3G static branches verified. Representative mobile/desktop layouts and the social image inspected visually.
- Syntax checks and `git diff --check` pass. `graphify update .` completed; existing unrelated SQL-parser/archived-source warnings remain.

## Evidence and reproducibility

| File | Purpose |
|---|---|
| `live-audit.json` | Live 15-page crawl, titles, descriptions, headings, canonicals, links and text |
| `live-http-probes.json` | Redirect, sign-in, private route, unknown article and retired Shopify URL responses |
| `content-local-findings.md` | Original content/local/SXO assessment and business-fact boundaries |
| `geo-authority-findings.md` | Public entity/crawler evidence and AI search limitations |
| `performance-visual-findings.md` | Detailed before/after lab methodology and findings |
| `live-browser-observations.json`, `local-before-browser-observations.json`, `local-after-browser-observations.json` | Browser measurement evidence |
| `pagespeed-source.json` | Actual PageSpeed API quota error |
| `local-after-checks.json`, `screenshots/` | Responsive page and model verification |
| `image-optimization.json`, `optimize-images.py` | Image sizes and reusable encoder |

Run the repeatable checks from the project root:

```powershell
npm test
npm run test:seo
node docs/seo/performance-observe.mjs https://printkarr.in live
```

The browser observer uses the already available Edge and puppeteer-core environment; it is a diagnostic tool, not a field-performance certification. Raw HTML and reusable specialist summaries are stored in ignored `.seo-cache/`. Production deployment, owner-account verification and the next measurement cycle are detailed in [ACTION-PLAN.md](ACTION-PLAN.md).
