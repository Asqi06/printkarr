# PrintKarr SEO action plan

Prepared 1 October 2026. Application fixes are complete and tested; **production verification remains necessary after release**. Priorities reflect this audit's evidence, not an assurance of rank or traffic.

## Critical

No observed critical site-wide indexing blocker. Do not create artificial emergencies from an audit score. If Search Console later shows a manual action, security issue or widespread accidental noindex, investigate that verified finding first.

## High: release and verify the work

**Developer, next release — about 30–60 minutes plus hosting build time.** Review and deploy the tested SEO changes. Include the new WebP assets/textures, wordmark/social image and new public routes. Existing wallet/account navigation, Google customer sign-in and separate admin sign-in are preserved.

After release, verify these URLs return 200 with their intended public canonical and initial HTML:

- https://printkarr.in/
- https://printkarr.in/printing-in-vapi
- https://printkarr.in/printing-in-daman
- https://printkarr.in/printing-prices
- https://printkarr.in/blogs
- https://printkarr.in/robots.txt
- https://printkarr.in/sitemap.xml — 17 public destinations
- https://printkarr.in/llms.txt

Check `/ABOUT`, `/about/` and `/index.html` redirect correctly; unknown URLs remain genuine 404s. Verify customer/admin sign-in remain noindex and private pages require their normal authorization. Confirm price figures match current production admin configuration. Run the browser observer against production to establish actual post-release transfer/LCP observations, and inspect representative markup with Google's Rich Results Test and Schema Markup Validator.

**Owner, before/with release — about 30 minutes.** Confirm public operator name, support phone/email, Vapi/Daman coverage, selected-college eligibility and actual file-retention/refund policies. Do not publish database seed addresses or college names as verified commercial relationships. Clarify genuine support hours separately from online order availability. Any policy review should reflect actual operations and applicable legal requirements; code checks do not replace that review.

## High: connect search and local business evidence

**Owner, first week — about 1–2 hours; third-party verification can take longer.** Verify the domain in [Google Search Console](https://search.google.com/search-console). Use the actual provider's DNS verification process and existing account; avoid duplicate properties when already verified. Submit `https://printkarr.in/sitemap.xml`. Inspect the homepage, Vapi, Daman, prices and important guides. Compare Google's selected canonical to the declared URL and check crawling/indexing reasons before changing code again. Sitemap submission and indexing requests do not guarantee inclusion.

Keep unrelated retired Shopify product/collection URLs as 404. Check recrawl/index removal in Search Console; don't redirect every obsolete product to the printing homepage. Search caches can show old content after the deployment changes.

**Owner, first week — about 1–2 hours plus verification.** Establish whether an existing eligible [Google Business Profile](https://www.google.com/business/) is verified; claim/correct it rather than creating duplicates. Use the real business name, actual phone, site URL, genuine operating hours and the most precise available printing category. If customers cannot visit a staffed operating address, follow service-area rules and hide that address. List only actual served areas. Do not list an unopened kiosk as an operating store or add keywords to the business name.

[Google explains local results through relevance, distance and prominence](https://support.google.com/business/answer/7091); website code cannot change the business's physical distance to the searcher. [Profile representation](https://support.google.com/business/answer/3038177) and [service-area guidance](https://support.google.com/business/answer/9157481) determine appropriate address/coverage information. No profile or listing was created during this audit.

## Medium: earn local trust and keep information accurate

**Owner, first month — about 2–4 hours initially.** Verify brand-owned social/business profiles and legitimate Bing Places/local listings. Use consistent name, phone, URL and eligible address information. Add only confirmed owned identity URLs to Organization `sameAs`; the founder's personal LinkedIn mention is not automatically an organization profile. Choose useful local listings rather than mass directory submissions or purchased links.

**Owner, ongoing operations.** Invite genuine customers to give honest reviews without incentives or positive-only filtering. Publish consented feedback and original photos of real print jobs with personal information removed. Create short Vapi/Daman delivery case studies using documented dates, process details and accurate outcomes. Ask actual campus/hostel/business partners whether they can reference the service on their own legitimate sites. No review outreach or external messages were sent by this audit.

**Owner + developer, when coverage is documented.** Add named campus/area information only with real eligibility, slots, location instructions and unique useful answers. Avoid dozens of city-swapped pages. Sarigam/Bhilad coverage currently remains limited to selected colleges and must be confirmed. A real live kiosk can justify an address/directions page and accurate local-business data later; a planned kiosk cannot.

**Content maintenance.** Review the five guides when processes change, not on an arbitrary date-refresh schedule. Keep visible copy, schema, prices, cutoffs, wallet validity and llms.txt consistent. Current rates are admin-driven; do not hard-code new marketing offers that can diverge from eligibility. Keep future-kiosk economics as planning considerations unless the owner can supply documented quotes/agreements.

## Medium: measure before expanding

**Owner/developer, after deployment and again after 28 days.** Record an initial Search Console baseline, then compare equivalent periods and annotate the release date. Small initial samples may require longer observation.

| Measure | Source | Decision it informs |
|---|---|---|
| Index/canonical status of 17 public destinations | Search Console inspection/indexing reports | Whether discovery or eligibility is the actual problem |
| Vapi/Daman + document-print query impressions/clicks/CTR | Search Console, page/query filters | Whether titles and service answers match actual demand |
| Completed orders and useful enquiries from organic visits | Existing privacy-appropriate analytics/order reporting | Whether search visitors can complete the service flow |
| Eligible business-profile calls/site clicks/reviews | Verified GBP dashboard | Local discovery and genuine trust growth |
| Field LCP, INP and CLS | Search Console CWV/CrUX/PageSpeed when available | Real mobile performance; lab measurements alone are insufficient |
| Genuine search/AI crawler requests and referral visits | Hosting logs and analytics | Actual discovery/referral evidence, not spoofed user agents |

PageSpeed returned HTTP 429 during this audit. Recheck once the quota/account issue permits it; don't convert missing data into a passing score. Campus 3D initialization deserves a real-device interaction check even after the image and slow-connection improvements. If long tasks impair actual visitors, consider a user-triggered model preview using the existing static image first.

For exploratory AI visibility checks, record the exact prompt, date, tool, returned citations and cited URL; variation between runs is expected. [Google's AI-feature guidance](https://developers.google.com/search/docs/appearance/ai-features) requires ordinary search eligibility and no special AI text file/schema. The updated llms.txt is an optional factual directory, not a citation switch. Measure useful referred visits and orders.

## Low: only when evidence supports it

- Add genuine translated pages and hreflang if customer demand and ongoing translation maintenance justify them.
- Consider Bing IndexNow after deployment and ownership setup if frequent public content changes make it useful; don't generate a key without a real publishing workflow.
- Replace remaining marketing artwork with documented operational photos when available; keep personal documents private.
- Consider additional vendor/image cache tuning only with safe versioned URLs and measured transfer needs. Don't cache personalized pages indiscriminately.

No paid tool, purchased link, invented rating, fabricated local address or AI-only landing-page network is required to complete this plan. Current rank, full backlinks, keyword volume and field CWV remain account/data-dependent. See [FULL-AUDIT-REPORT.md](FULL-AUDIT-REPORT.md) for the implemented changes, validation and evidence files.
