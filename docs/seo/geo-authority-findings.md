# PrintKarr GEO, AI search and authority review

Audit date: 1 October 2026 (Asia/Kolkata). Scope: public `https://printkarr.in` and the Express/SSR code in `lib/seo.js` and `lib/views_public.js`. This review is evidence-based; it does not assign an unsupported AI visibility, domain authority or backlink score.

## Verified starting position

Direct HTTP requests returned 200 for the homepage, about page, both sampled kiosk articles, [robots.txt](https://printkarr.in/robots.txt), [sitemap.xml](https://printkarr.in/sitemap.xml) and [llms.txt](https://printkarr.in/llms.txt). The production homepage contains the current “Good prints. Zero fuss.” heading. The web search reader displayed an older homepage, so cached search excerpts are not evidence that the current deployment is old.

Public pages contain their headings, copy and JSON-LD in the initial HTML. Rendering important service answers does not depend on browser JavaScript. Existing strengths include consistent canonical origins, an Organization/WebSite/WebPage graph, organization authorship on BlogPosting records, breadcrumbs, a Vapi Service record, public FAQs and crawlable internal links. Existing Vapi copy distinguishes delivery from the planned kiosk and explains that delivery timing depends on the order.

### AI crawler policy

The live wildcard robots group allows public pages and excludes customer, order, administration and authentication routes. Its rules apply to OAI-SearchBot, GPTBot, PerplexityBot, ClaudeBot and Googlebot when no more specific group overrides them. Those bots are permitted by the published policy; a successful ordinary HTTP request does not prove that every crawler IP will pass the hosting firewall.

[OpenAI’s crawler documentation](https://developers.openai.com/api/docs/bots) separates OAI-SearchBot, which supports ChatGPT search, from GPTBot, which crawls for model training. ChatGPT-User handles user-triggered visits. Allowing search crawling does not require enabling training. Preserve the private-route exclusions if specific bot groups are ever introduced, and check actual crawler requests in hosting logs rather than relying on spoofed user-agent tests.

### AI files and ranking claims

The existing llms.txt is a useful optional factual index, not a missing requirement. Keep its links and service facts synchronized with visible pages. [Google’s AI features guidance](https://developers.google.com/search/docs/appearance/ai-features) says conventional SEO remains applicable, the page must be indexed and eligible for a snippet, and special AI text files or schema are unnecessary. Neither llms.txt nor extra schema guarantees inclusion, citations or rankings. Do not create llms-full.txt, crawler-specific landing pages or licensing rules simply to obtain an audit checkbox.

## Highest-priority content gaps

| Priority | Evidence | Minimum useful improvement |
| --- | --- | --- |
| High | Homepage heading is a brand slogan; short service/location information is spread across later sections. | Add a concise visible definition near the hero: PrintKarr provides online document printing and local delivery in Vapi and Daman; selected college delivery in Sarigam/Bhilad needs coverage confirmation. Preserve the white/blue design and avoid repetitive keyword blocks. |
| High | `running-a-printkarr-kiosk` contains two short paragraphs with rupee estimates and a platform commission, without the source, assumptions or date of the quote. | Reframe as a planning checklist for a proposed kiosk. Explain that electricity, connectivity, consumables, space and support depend on the site and written agreement. Link to current partnership information. Remove unsupported operating cost/commission claims until verified. |
| High | `replacing-xerox-queues` and `colleges-24-7-print` imply an operating unattended service or successful installations, while current public facts say the first kiosk is planned. | Explicitly describe a proposed workflow, prerequisites and operational limits. Explain current delivery ordering separately. Never imply a live pickup address or installation history. |
| Medium | BlogPosting has organization author/publisher but no recorded publication/modification dates or article image. | Keep truthful organization attribution and link it to /about. Add real dates when the article is actually reviewed or published; do not fabricate historical publication dates or reset dates on every render. Add relevant image metadata only where an actual article illustration exists. |
| Medium | Organization contains name, phone, email and city, but little explanatory identity text and no verified external identity links. | Add a factual description and matching visible about/contact content. Use the existing text wordmark as logo metadata if a suitable crawlable image asset is created. Only add sameAs links after verifying ownership; a personal founder profile is not automatically the organization profile. |
| Medium | Only Vapi has a dedicated service page despite confirmed Daman delivery. | A substantive Daman service page can answer delivery eligibility, checkout fees, document choices and timing without inventing neighbourhoods or offices. Selected-college coverage should remain qualified rather than becoming generic Sarigam/Bhilad city-wide promises. |

[Google’s Article guidance](https://developers.google.com/search/docs/appearance/structured-data/article) supports organization authors and recommends truthful dates, author identification and representative images. [Organization guidance](https://developers.google.com/search/docs/appearance/structured-data/organization) describes description, logo and verified external identity URLs. These additions communicate facts; they are not separate ranking mechanisms. Organization and Service are appropriate while no confirmed public storefront address exists. Do not fabricate LocalBusiness addresses, opening hours, coordinates, review scores or named staff credentials.

## Public entity and link evidence

Searches for `"PrintKarr" "Vapi"`, `"printkarr.in" -site:printkarr.in` and `"PrintKarr" LinkedIn YouTube Instagram` found a [LinkedIn profile for Anirudh Verma](https://in.linkedin.com/in/anniverma) describing a hyperlocal Vapi printing startup. This is a relevant self-published mention, not verified independent coverage, a confirmed organization account or a quantified backlink. Ownership and current spelling should be confirmed before connecting it through schema.

Search results also retain old Shopify product/collection pages, a demo build and older claims of available kiosk pickup. Direct requests to `/products/wooden-photo-strip-fridge-magnet` and `/collections/trending-decor` now return real 404 responses. That is appropriate for unrelated discontinued pages. Keep them crawlable for search engines to notice removal; do not redirect every former product to the homepage. Search Console can show which old pages remain indexed after recrawling.

No verified brand-owned Wikipedia, Wikidata, YouTube, Reddit or business-profile listing was established by this limited public search. This does not prove absence. Creating a Wikipedia page, buying links, posting promotional Reddit material or acquiring generic directory entries is not a prerequisite for AI search. Prefer real campus/office partnerships, useful guides, independently published mentions and customer reviews earned through actual service. Keep the business name, URL and contact details consistent on confirmed profiles.

## Practical measurement and limits

- After deployment, inspect indexability and canonical selection for the homepage and local pages in Google Search Console; submit the public sitemap and observe search impressions, clicks and queries over time. AI-feature traffic is included in Google's normal Web reporting rather than a separate visibility guarantee.
- Check Bing indexing and genuine OAI-SearchBot/PerplexityBot requests in server logs. Measure useful referral visits and completed orders instead of claims that a particular passage length forces citations.
- Review public service facts whenever prices, delivery slots, coverage or kiosk status change. Keep page text, metadata, structured data and llms.txt consistent.
- This review has no authenticated Search Console, Analytics, Bing Webmaster Tools, business-profile dashboard or paid link index. It cannot establish current organic rank, full backlink counts, search volume, conversions, crawl history or AI citation share.
- The GEO skill's quoted platform statistics, exact passage-length claims and synthetic readiness scores were not adopted as project evidence. Primary guidance and observed code/HTTP responses take precedence.

No application files or service settings were changed by this review. Implementation decisions and their validation belong to the main audit.
