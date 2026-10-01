# PrintKarr content, local SEO and search intent audit

Audit date: 1 October 2026 (Asia/Kolkata). Scope: public `https://printkarr.in`, current Express templates, SEO output, campaign settings and file-retention code. This is a pre-change baseline; the parent audit implements fixes separately. Findings describe observed evidence, not a promise of rankings.

## Evidence and limits

- The browser/search tool returned a cached earlier homepage design and could not consistently retrieve other paths. The parent agent's direct live HTTP crawl, `live-audit.json` captured at 09:04:56 UTC, verifies all 15 public destinations returned HTTP 200 and the current deployed homepage H1 is “Good prints. Zero fuss.” The deployed Vapi H1 still says “Printing in Vapi, delivered 24/7.” Baseline thin-article measurements match the live crawl. Prefer that crawl to search-tool cached renditions for deployment evidence.
- The skill's SSRF-safe `fetch_page.py` was attempted with both installed Python runtimes. Both lack `requests`; no dependencies were installed. The parent agent's live crawl supplies fresh deployment evidence. Site content, route definitions and schema were inspected directly in `lib/views_public.js`, `lib/seo.js`, `lib/views.js`, `lib/campus.js`, `lib/janitor.js` and `server.mjs`.
- No Search Console, GBP owner access, Analytics, paid keyword-volume data, geo-grid rankings or comprehensive backlink index was available. A web search did not establish a verified PrintKarr GBP/review listing. That is **unverified**, not evidence that none exists.
- Search discovery shows local print-shop/service pages and directories for broad Vapi printing queries. This is a qualitative sample, not a verified Google top-ten ranking capture, local-pack count or keyword-volume estimate.

## Verified public business facts

| Fact | Evidence | Appropriate use |
|---|---|---|
| Brand PrintKarr; site identifies PrintKarr Technologies Private Limited | Public footer/contact/terms templates | Organization identity, subject to owner's legal verification |
| Customer support +91 90167 03180 and team@printkarr.in | Contact links, SEO Organization, public footer | Visible phone/email and matching structured data |
| Based in Vapi, Gujarat | About/contact/SEO templates | Base locality, not a public street address |
| Delivery in Vapi and Daman | Home/About/local page and order-zone validation | Service areas with checkout confirmation |
| Selected colleges in Sarigam and Bhilad | Public copy and campus/order flow | Restricted coverage language; do not imply whole-city delivery |
| First Vapi kiosk is planned, no public pickup address announced | Home/local/contact copy | Clearly future service, not a map pin or open retail branch |
| Online upload, page/settings selection, checkout, account tracking | Live SSR views and route handlers | Current service process |
| Campus slots/cutoffs, configurable fees/rewards/wallet validity | `lib/campus.js` | Current availability and terms from runtime settings, not hard-coded promises |

Unverified: public storefront address, legal registration details, actual branch coordinates, support hours, third-party ratings, operational fleet/turnaround figures, named college partnerships, delivery testimonials and kiosk economics. The database's default `Chala, Vapi, Gujarat 396191` and `LIT Sarigam` configuration are seed data, not independent proof of a customer-accessible business location or a contracted college partnership.

## Priority issues

1. **High — service promises disagree with the delivery workflow.** `lib/seo.js` titles/descriptions, `llms.txt`, Vapi H1/body, About, How it works and two guides claim “24/7 delivery.” Slot/cutoff selection and explicit delivery confirmation indicate that online ordering hours and physical delivery promises must be distinguished. Use “Order online any time; available delivery options and timing are shown or confirmed for your address.” Keep actual promised slot guarantees subject to configured eligibility.
2. **High — privacy copy overstates implementation.** Terms/privacy say uploads are encrypted and deleted after print. Multer stores files under `data/uploads`; no application-level at-rest encryption was identified. `lib/janitor.js` sweeps terminal DELIVERED/REFUNDED/CANCELLED orders after configured retention, default 15 minutes; the sweep runs periodically. Describe actual access controls and retention accurately. Do not claim immediate deletion or at-rest encryption without validating deployment storage. Account, transaction and order records have a different lifecycle from print files.
3. **High — sparse business evidence.** A founder name appears on About, and contact/policy links are useful, but no independently verified GBP, real delivery photographs, genuine consented testimonials, operational case studies or documented service standards were established. Code cannot manufacture these. AI-generated hero imagery is marketing art, not proof of operational experience.
4. **Medium — local conversion content is incomplete.** `/printing-in-vapi` has a sensible service-page structure and links, but visitors still need delivery-mode differences, deadline guidance, fees/current prices, page-versus-sheet billing, campus eligibility and the wallet terms. It is the appropriate local hub to improve first.
5. **Medium — Daman is repeatedly promised but lacks its own useful public service destination.** A dedicated Daman delivery page can answer address/coverage and timing questions. Do not publish city-swapped pages for every neighbourhood. Sarigam/Bhilad should remain a clearly restricted campus section until real campus-specific information is available.
6. **Medium — journal has incomplete articles and unsupported claims.** The three kiosk pieces contain approximately 59–77 main-content words each, make prospective workflows sound live, and one gives rental/electricity/internet/commission numbers without context or sources. Expand into practical planned-pilot guidance using verified facts, or consolidate/noindex incomplete content. The PDF/admit-card guides are more useful but need headings, concrete examples, editorial attribution and genuine modification dates.
7. **Medium — pricing answers are discoverable only as a home section or inside an ordering flow.** A public `/printing-prices` or `/pricing` page could render actual admin-configured printing rates, explain billing and delivery, show enabled wallet offers and link directly into checkout. This should reuse existing pricing/campaign calculations. It needs no separate pricing engine or standalone calculator.
8. **Medium — partner pages need stronger qualification and proof.** `/franchise` is appropriate for partnership intent, but kiosk investment/capacity and universal printer support claims need owner verification. Explain proposed setup, servicing, consumables, responsibilities and enquiry process. Label pilot availability. Do not describe predicted returns or commission as established economics without source data.

## Baseline content measurements

Main content only, approximate rendered-text word counts before this audit's edits. These are diagnostic observations, **not minimum ranking thresholds**. Google explicitly says it has no preferred word count.

| Page | Approximate words | Main gap |
|---|---:|---|
| Home | 593 | Delivery wording and first-hand proof |
| Printing in Vapi | 334 | Local logistics, exact current pricing, trust |
| How it works | 187 | Slot/fee/payment expectations |
| About | 149 | Verified company/founder experience and real work |
| Contact | 82 | Delivery help categories and support availability |
| Franchise | 213 | Pilot qualification and operational conditions |
| Print-shop partnership | 86 | Compatibility/support claims and process |
| PDF preparation guide | 199 | Headings, examples, editorial metadata |
| Admit-card checklist | 196 | Headings, sourcing, deadline language |
| Three kiosk posts | 59–77 | Substantial answer missing, claims unsupported |

Human audit rubric, not Google scores: **content quality 58/100**, **E-E-A-T 46/100** (experience 8/25, expertise 13/25, authority 6/25, trust 19/25), **AI citation readiness 57/100**. Useful process/local facts and server-rendered content earn credit; claim inconsistency, scant verified experience and incomplete articles reduce readiness. External authority cannot be fully assessed from this sample.

Local readiness is **partial**: city/service title + H1, consistent phone/email, contact mechanism and Organization/Service schema are present. GBP, citations, reviews, actual opening hours and verified operating-address evidence are unknown. A numerical local-pack score would imply knowledge this audit does not have.

## Vapi service-page improvement brief

Keep `/printing-in-vapi` as the primary Vapi service hub. Suggested H1: **Document printing and delivery in Vapi**. Answer first: “PrintKarr lets you order black-and-white and colour document prints online in Vapi. Upload your PDF, choose pages and settings, and review printing and delivery charges before payment. Order online any time; availability and delivery timing depend on your address and selected option.”

Add concise sections using existing facts:

- **Your price before payment:** actual configured A4 B&W/colour rates, distinction between selected printed pages and physical sheets, copies, double-sided selection and separate delivery/other fees. Link to public pricing.
- **Delivery options:** local address delivery versus selected-campus batch slots; express is paid when available. Avoid “all Vapi addresses accepted” unless actual coverage validates it.
- **Night order, morning delivery:** order before the cutoff shown for a participating campus and select an available morning slot. Only show amounts/times when read from admin configuration. Explain eligibility instead of a blanket deadline guarantee.
- **What to upload:** PDF is recommended; image formats accepted by the actual uploader can be listed after checking validation. Check page numbers, covers, blank pages, margins and institution instructions.
- **Account and wallet:** Google sign-in for saved orders/wallet; guest ordering remains available; bonus credit is non-withdrawable and may expire under displayed terms.
- **Is there a walk-in shop or kiosk?** First kiosk is planned; no public pickup address announced. A clear answer is more useful than an invented map.
- **Useful nearby coverage:** Daman service page; restricted Sarigam/Bhilad campus information; no invented college list.
- **Help with a deadline:** call support before paying if the available timing does not meet it. Show exact phone and email consistently.

## Daman service-page outline

Suggested URL: `/printing-in-daman`. H1: **Online document printing with delivery in Daman**. Title should emphasize document printing, not an unsupported Daman walk-in branch.

1. **Direct answer and order CTA:** PrintKarr is based in Vapi and offers document print delivery in Daman. Order online; enter the Daman address/location and review availability, charges and timing before paying.
2. **Choosing delivery for a Daman address:** enter a full address, correct PIN and map location when required; use the Daman order area rather than a Vapi/campus area. If checkout cannot accept the destination, confirm with support before payment. Do not publish fabricated neighbourhood boundaries or travel times.
3. **Printing choices:** B&W/colour, copies, selected PDF pages, sides and accepted paper sizes from real settings. Link to configured prices and PDF preparation guide.
4. **Delivery fee and timing:** distinguish Daman address delivery from the campus batch programme; eligible college slots are not automatically available to every Daman address. No guaranteed cross-city duration, free-delivery claim or “24/7 delivery” wording without operational verification.
5. **Preparing documents:** resumes/forms/office paperwork/admit cards use the authority's print requirements. Explicitly avoid official-document validity or exam-admission guarantees.
6. **Place and track an order:** upload → settings → available delivery option → total/payment → order tracking. Account/wallet links accessible, WhatsApp optional support.
7. **Local FAQs:** Is there a PrintKarr walk-in shop in Daman? Can a Vapi campus slot deliver to my Daman home? How is the Daman fee calculated? What if I have an urgent deadline? Answers should state what is known and direct uncertainty to checkout/support.
8. **Related destinations:** Vapi delivery hub, pricing, preparation guide and contact; add contextual incoming links from homepage coverage and Vapi page.

This outline differs by Daman address selection, cross-service eligibility and absence of a Daman branch. More durable differentiation should come from real order examples, consented local photos, accepted area/PIN coverage and first-hand delivery FAQs once the owner supplies them. Do not imply that merely changing a city name produces sufficient local value.

## Search-intent sample and user stories

Discovery query: `"printing" "Vapi" "shop"`. Sample pages: [Murlidhar Jumbo Xerox](https://murlidhar-jumbo-xerox.grexa.site/), [Real Graphics](https://myvapi.com/biz/775), [Let's Print](https://www.bharatibiz.com/en/lets-print-a-digital-printing-press-087589-18975), [MyVapi printer directory](https://myvapi.com/vapi/advertisement-services/printers), [Akshar Art store](https://mydukaan.io/akshar13). Classification: two local listing pages, one local business service page, one directory, one local product/store page. Search returned other printing specialties too; broad “printing” intent is ambiguous. These are search-discovery sources, not ranking endorsements or verified competitor business details.

The existing Vapi service page is directionally aligned for **document printing with delivery**, but cannot substitute for an actual nearby walk-in listing. Emphasize the precise service rather than targeting flex banners, offset printing or 3D printing the business does not offer.

| User story inferred from sample | Evidence signal | Concrete answer needed |
|---|---|---|
| I need documents printed near me and want to know whether I can visit | Addresses/hours/directions on local listing pages | Explain delivery service and lack of public kiosk pickup |
| I need a small B&W/colour print job and want a clear total | Xerox/copy service lists and quote/store patterns | Configured prices, selected pages/copies and separate delivery fee |
| I have a deadline and need confidence in timing | Opening-hour and contact information in local results | Available slots and explicit confirmation before urgent payment |
| I need a specific print finish/service and want to avoid a wrong provider | Binding/flex/letterhead specialty signals | Clearly list actual document options and unsupported services |

Code-page SXO readiness assessment: **64/100**, separate from technical SEO health (page type 13/15, topic coverage 10/15, action clarity 12/15, schema 10/15, media 7/15, authority 4/15, freshness 8/10). This is a subjective content assessment with limited SERP access, not a measured probability of ranking. Priority: accurate service promise → pricing/slot clarity → genuine local proof.

## Local and AI owner actions

1. Confirm an eligible service-area GBP or existing listing. If customers do not visit a staffed operating address, hide that address and list actual service areas. Use the real business name and a precise printing-service category available in GBP; never add Vapi keywords to the name unless they are part of the real brand.
2. Confirm legal/business identity, business phone/email, actual support hours and any publicly usable address. Keep one consistent identity across site and profiles. Do not publish seed addresses or a planned kiosk as an operating branch.
3. Claim or correct legitimate Bing Places and relevant Indian/local business listings such as MyVapi where useful. Verify each entry and avoid mass low-quality directory submissions or purchased links. No listings were created in this audit.
4. Ask actual customers for honest reviews without payment, gating or positive-only filtering. Show genuine excerpts only with permission and attribution; do not invent aggregateRating schema. No automatic review outreach was sent.
5. Publish original photos of completed document jobs without personal data and short consented Vapi/Daman delivery case studies. Use actual counts and dates only when documented. These help visitors and source attribution more than generic stock art.
6. Seek earned mentions from actual campus/hostel/business partners and local community outlets. A real partnership information page or case study is appropriate; buying a ranking link is not.
7. Track local query/page impressions, clicks, leads and paid orders in Search Console and analytics. Monitor branded and service/location questions across AI tools as exploratory evidence, recording prompt/date/source. AI citation inclusion is not guaranteed by llms.txt or schema.

## Primary guidance used

- [Google helpful, reliable content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content): original useful answers, accurate authorship and no preferred word count.
- [Google Search Essentials](https://developers.google.com/search/docs/essentials): descriptive prominent words, crawlable links and people-first value.
- [Google spam policies](https://developers.google.com/search/docs/essentials/spam-policies): avoid city-swapped doorway pages, keyword stuffing and scaled pages without value.
- [Google AI features](https://developers.google.com/search/docs/appearance/ai-features): foundational search eligibility remains relevant; no special AI schema requirement or guaranteed inclusion.
- [GBP service-business overview](https://support.google.com/business/answer/10514743): distinguish service-area businesses from customer-facing premises.
- [GBP service-area guidance](https://support.google.com/business/answer/9157481): accurate actual coverage and hiding an address customers cannot visit.
- [GBP representation guidelines](https://support.google.com/business/answer/3038177): real-world identity, operating locations and service-area eligibility.

The skills' suggested word-count floors, statistical ranking percentages, mandatory map pins and review-frequency thresholds were not treated as Google requirements. Recommendations above use observed business facts and primary documentation.
