# PrintKarr local review — 6 October 2026

The local implementation puts **Upload & print** first. It reduces mobile navigation to four tasks, shows the two main delivery destinations directly, and preserves supported print settings and checkout rules. The earlier delivery change was already pushed as **10839db**, confirmed in origin/master. This expanded UI/SEO refinement remains local under the subsequent no-push/no-deploy instruction.

## Preview and screenshots

- Read-only pages: http://127.0.0.1:3134/ and http://127.0.0.1:3134/order/options
- Interactive in-memory preview: http://127.0.0.1:3135/
- Guest preview: visit http://127.0.0.1:3135/preview/role/guest, then http://127.0.0.1:3135/order?fresh=1
- Email verification uses clearly labeled simulated code 000000. Payments/printers/email are disconnected.
- Screenshot gallery: REVIEW.html. The screenshots folder includes before/after mobile home and order captures, desktop home/order, upload, local address, emergency, stationery, checkout and receipt.
- Preview stationery is demo inventory; screenshots do not establish production stock.

## Before → after

| Observed friction | Implemented change |
|---|---|
| Hero promoted upload, wallet, account and stationery together | One upload CTA with a short assignment/application use case. One passive B&W rate and delivery-extra note; exact price at checkout. |
| Six narrow mobile destinations | Four labeled tasks: Print, Stationery, Orders, My Account. Home remains through the logo and Wallet through header/account/payment context. |
| Moving slogans preceded useful service details | Removed homepage marquee; added a factual delivery explanation with ordinary links. |
| Delivery summary and change accordion repeated the selection | Main campus/address radios appear directly. Emergency campus and scheduled local alternatives are secondary and context-dependent. |
| Single/Double labels required interpretation | Single-sided/Both sides. Page range, mixed colour pages, copies, orientation, binding and instructions remain available. |
| Customer dashboard repeated new-print actions | One primary upload action; removed duplicate print cards/buttons and reduced wallet card height. |
| Small mobile stationery text and controls | Increased product text and Add button height; replaced five category buttons with one native Category dropdown. Header Print CTA is an ordinary link during shopping/cart tasks. |
| Future concepts could imply active availability | Homepage explicitly labels kiosk and print-shop network as future goals. No onboarding, nearest-shop routing, hardware or delivery backend was built. |
| Vapi copy lacked a specific college job | Home/Vapi titles/meta and existing Vapi guide now mention A4/assignment printing, mixed colour pages, LIT rules and deadline checks. One useful Hindi explanation is marked with lang=hi. |

The local homepage/focused print flow does not render an automatic wallet promotion. The retrieved live homepage still has the old prompt and hierarchy; publication is needed before visitors receive the local changes.

## Business facts checked against code

The canonical domain is **https://printkarr.in**, from lib/seo.js, matching the retrieved live site. No similarly named domain was assumed.

PDF, JPG and PNG are supported; the print interface is A4. Displayed rates use configured pricing. LIT Sarigam is the configured campus. Standard campus delivery uses the next enabled India-time window: first eligible delivery free, then ₹3. Emergency campus express is ₹25. Existing basket promotions remain unchanged; final server pricing controls the charge.

College delivery uses the campus destination and does not ask for customer location proof. Vapi/Daman address delivery requires a map point and uses admin-configured fees. Enabled scheduled routes retain radius/cutoff validation. Pickup and scheduled routes are shown only when configured; both are disabled in the default preview configuration. No Valsad coverage or blanket Bhilad service was added. Other destinations need confirmation.

Ordering at any time does not establish 24-hour printing/delivery. No deadline, kiosk address, inventory, review or scarcity was invented.

## Research and interpretation

[Google global accessibility guidance](https://design.google/library/designing-global-accessibility-part-iii) supports readable contrast, larger targets and icons paired with text. Applied to labeled navigation and mobile controls, this does not imply one Indian click pattern.

[Google Research on perceived tappability](https://research.google/blog/using-deep-learning-to-improve-usability-on-mobile-devices/) supports making the next action visually recognizable and quieter information distinct from actions.

[Microsoft Research's Indian emergent-user study](https://www.microsoft.com/en-us/research/uploads/prod/2022/05/compass22-34-taps.pdf) describes varied skills and constraints in a limited interview cohort. It does not establish uniform literacy, language or interface behavior among tier-three-city customers. Lower simultaneous choice and familiar labels are hypotheses to validate with actual PrintKarr customers.

[Blinkit's official Print Store](https://blinkit.com/print) foregrounds file upload and explains settings, prices and inputs. [Printo's document page](https://printo.in/categories/document-printing) separates document choices and related stationery. These are structural examples; their delivery speed, prices, coverage and guarantees were not copied.

Customer validation should ask first-time users to upload an assignment with two colour pages, choose their real destination and explain the fee/window before payment. Observe wrong destinations, backtracking, time to finish and abandonment. No measured conversion improvement is claimed.

## SEO/GEO and the former domain owner

Reused server-rendered pages, canonicals, Organization/WebSite/Service schema, crawlable links, sitemap, robots and llms.txt. Updated titles/meta, visible Vapi answers and schema/service facts. Keyword choices are intent-based local phrases, not measured volume/rank data. No duplicate city pages, invented business address or review markup was added.

Public web retrieval on 6 October returned the current PrintKarr homepage titled “Online Printing in Vapi & Daman.” The focused search “site:printkarr.in stickers labels” returned no results in this tool. This does not disprove the user's Google symptom or establish personalized Google rankings. Ownership 10–20 days ago is user-reported. The exact obsolete Google query/result URL is still needed for targeted diagnosis.

No old URL was invented or blanket-redirected. The current server already returns 404 plus X-Robots-Tag noindex for unmatched pages. Retired irrelevant URLs should retain a retirement response; 301 applies only to an identified equivalent destination.

Direct live HTTP probes failed from this runtime. The web tool could retrieve the homepage, but not robots/sitemap/llms. Local discovery checks passed; live discovery responses and Google's rendered/indexed versions are not independently verified here. No authenticated Search Console, Business Profile, analytics or ranking data was available. No external account changes were made.

[Google's AI-search guidance](https://developers.google.com/search/docs/appearance/ai-features) supports normal search foundations and helpful content. No special AI schema is required. Maintained llms.txt is supplemental factual documentation, not a Google ranking mechanism or citation guarantee. Existing general robots rules allow public content and protect account/order/API paths; training/search crawler preferences were not changed.

After publication, verify the printkarr.in Domain property in Search Console, submit https://printkarr.in/sitemap.xml, inspect home/Vapi/Daman/price pages and request indexing for changed pages. Obtain specific obsolete URLs and inspect their current HTTP/index status before choosing a redirect or retirement response. [Google's recrawl documentation](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl) explains that updates are not instant or guaranteed. No fixed replacement date, top ranking or every-query recommendation is promised.

## Validation and limits

- npm test: **67 tests passed**.
- npm run test:design: **56 page renders** plus scripts, navigation, auth, assets and reduced-motion checks passed.
- npm run test:seo: **17 public sitemap URLs**, metadata, canonicals, JSON-LD and private-page exclusions passed.
- npm run test:checkout, npm run test:ux and npm run test:store passed: current handlers, mixed-page accounting, location validation, eligibility, inventory and payment/refund replay.
- node scripts/delivery-check.mjs passed after replacing obsolete VM submission stubs with existing current preview-backed checks.
- node scripts/delivery-ui-check.mjs passed: relevant route groups, disabled hidden-address submission fields and emergency availability when standard slots are disabled.
- Browser checks at **320, 390 and 1440px** found no horizontal overflow on representative home/order pages. At 320px, the hero upload button ended around y=438; Continue was about 57px high.
- Browser catalogue checks at 390 and 1440px passed category + search + sorting together, returning one matching notebook with no horizontal overflow.
- Actual guest upload opened focused settings; local delivery showed address/map at the contact stage; emergency campus showed ₹25 with no location inputs.
- Authenticated colour ×2 sample showed ₹10 printing and free eligible first campus delivery, then completed an explicitly simulated wallet checkout to a receipt. No production order/payment/email/printer was touched.
- Graphify AST update succeeded after a transient Windows file lock. An unrelated SQL-parser dependency and syntax warning in the separate grok workspace remain outside scope.
- No full accessibility certification, physical printing test, field-performance measurement or customer conversion experiment is claimed.
- Existing unrelated dirty work in the shared checkout was preserved. No broad commit of other tasks' files was made.
