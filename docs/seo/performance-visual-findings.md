# Performance, images and visual audit

Audited 1 October 2026. Evidence is from the live `https://printkarr.in` deployment and the local project fixture, captured before these SEO changes were deployed. No forms were submitted and no customer/admin data was accessed.

## Measurement scope and limits

`performance-observe.mjs` opens four public pages in separate, fresh Edge browser contexts at 390×844 and 1440×1000. It records real browser paint/layout-shift entries, navigation timings, resource transfer sizes, image metadata, console/request failures and viewport screenshots. These are **unthrottled lab observations**, not Lighthouse scores or field Core Web Vitals. There was no mobile CPU/network emulation. Software WebGL is enabled, which can exaggerate renderer initialization work relative to a GPU-equipped device. The 1.5-second post-load observation window is not a complete session measurement; user interaction INP was not measured. Resource totals below exclude the HTML document and any later scrolling-triggered loads.

Google's unauthenticated PageSpeed API returned HTTP 429 (daily quota exceeded). There is no verified CrUX, INP, field LCP percentile or Lighthouse performance score in this audit. The supplied skill analyzer's synthetic fallback was deliberately not used because it estimates metrics rather than measuring them. Details are saved in `pagespeed-source.json` and `live-browser-observations.json`.

| Live page | Viewport | Observed LCP | CLS during observation | Initial subresource transfer |
|---|---:|---:|---:|---:|
| Home | 390 | 1,508 ms | 0.000883 | 247,627 B |
| How it works | 390 | 836 ms | 0 | 3,602,915 B |
| For campuses | 390 | 1,448 ms | 0.000312 | 4,540,671 B |
| Printing in Vapi | 390 | 968 ms | 0 | 93,949 B |
| Home | 1440 | 1,148 ms | 0.000507 | 2,951,171 B |
| How it works | 1440 | 756 ms | 0 | 3,602,915 B |
| For campuses | 1440 | 1,740 ms | 0.000187 | 4,540,671 B |
| Printing in Vapi | 1440 | 832 ms | 0 | 93,949 B |

All eight live page loads returned 200; no horizontal viewport overflow, JavaScript exceptions or failed requests were observed. `local-before-browser-observations.json` provides a comparable local baseline; it should not be used to predict deployed network speed.

## Verified local improvement after integration

After WebP/responsive image references, texture references, intrinsic dimensions, the near-intro CTA and description sizing were integrated, the same observer was run against the restarted local read-only fixture. Fresh browser contexts, viewports and observation timings were kept the same. All eight updated routes returned 200, with no overflow, failed requests or JavaScript exceptions. This is measured **local subresource transfer**, not a deployed or field speed result; the fixture serves assets without production Brotli compression, so compare these values to the local baseline rather than live values.

| Page | Viewport | Local transfer before | Local transfer after | Change |
|---|---:|---:|---:|---:|
| Home | 390 | 423,459 B | 424,686 B | +0.3% |
| How it works | 390 | 3,730,508 B | 330,169 B | −91.1% |
| For campuses | 390 | 5,686,557 B | 1,930,965 B | −66.0% |
| Printing in Vapi | 390 | 221,542 B | 245,081 B | +10.6% |
| Home | 1440 | 3,127,003 B | 518,300 B | −83.4% |
| How it works | 1440 | 3,730,508 B | 330,169 B | −91.1% |
| For campuses | 1440 | 5,686,557 B | 1,997,021 B | −64.9% |
| Printing in Vapi | 1440 | 221,542 B | 245,081 B | +10.6% |

The mobile homepage did not initially fetch its distant student cutout before or after, so image optimization produces no initial-load saving there; desktop now chooses the 93,314 B 480-width cutout. Instructional pages now select 400-width WebP sources at both tested viewports. The campus fallback selects 480-width WebP on mobile and 768-width on desktop, and actual model texture requests use `.webp` successfully. Vapi's modest byte increase reflects new shared styles and local service content, with no image regressions; its current CTA remains above the fold.

How it works now displays a 49.7 px-high order button at y=439.7 px on mobile and y=488.0 px on desktop, rather than its previous only button at y=2,071 px on mobile. Its instructional paragraphs no longer appear in the under-12 px text list. The mobile homepage's upload action remains visible at y=419.6 px with a 54 px height. Post-change observed local CLS was zero on six cases, and below 0.000315 on the two Vapi cases; these short lab windows do not establish field CWV.

Additional read-only browser checks override the connection hint to `saveData=true` or `effectiveType='3g'` on the campus page. Both show a loaded static fallback, no canvas, no Three.js request and no model/texture requests. Normal connectivity still loads both WebP textures. This verifies the implemented data-saving branch without submitting any forms. Exact-version vendor cache policy changes are source changes and require deployment before their live headers can be verified.

Evidence: `local-after-browser-observations.json` and `screenshots/local-after-*.png`. The findings below describe the original deployment; items 1, 3 and the instructional-description part of 4 are addressed locally, and items 2, 5 and 6 now have their stated mitigations integrated. Re-run the live observer and PageSpeed/CrUX after deployment for production evidence.

## Findings and implementation targets

1. **High: unnecessarily large images.** Four instructional images total 3,507,766 B before encoding; the home student cutout is 2,703,244 B and is eagerly fetched by native lazy-loading when it is close enough to a desktop viewport. Kiosk fallback is 1,322,332 B; its two model textures add 2,811,087 B. This explains most of the 3.60–4.54 MB page loads. New WebP assets are ready below; replace old references, declare intrinsic dimensions, and use responsive sources.
2. **Medium: 3D initialization is costly.** The franchise page performs an observed 413 ms main-thread task at mobile viewport and 364 ms at desktop. Its renderer already has useful protections: lazy intersection initialization, reduced-motion static fallback, fixed stage geometry, visibility pausing and on-demand pointer frames rather than a perpetual loop. Retain those. For visitors with Save-Data/slow effective connection, prefer the static image or a user-triggered preview. A static image is sufficient for crawling the described planned kiosk; the real service text remains server-rendered.
3. **Medium: primary order action is deep on How it works.** On mobile, the page's only main order CTA began at y=2,071 px, after all four steps. Add a compact order link near the introduction without removing the explanatory content.
4. **Medium: very small instructional text.** At 390 px, step descriptions are 11 px; on the homepage locality label is 8 px and supporting labels are 9–10 px. Raise the descriptions to at least 13–14 px; small decorative eyebrows are less important than actionable copy. Preserve existing visible 54 px home CTAs and clear wallet/account navigation.
5. **Low: short cache lifetime on immutable assets.** Live image/font/vendor HEAD responses advertise `public, max-age=3600`. Keep ordinary mutable assets safely revalidatable; exact-version vendor names and new versioned image names can use a longer cache lifetime. Do not broadly cache personalized HTML or unversioned mutable styles forever. HTML is compressed (Brotli live, Express compression in source); Three.js is compressed in transit despite its 1.27 MB source size.
6. **Low: incomplete image markup.** Old content images lack width/height and responsive `srcset`. Shared CSS currently reserves the kiosk stage and step image heights, and no large CLS was observed. Explicit dimensions still protect layout if CSS arrives late and allow the browser to choose smaller assets. Preserve the homepage hero's existing width=1122, height=1402 and `fetchpriority="high"`; it is already only 79,740 B. Avoid lazy-loading the visible franchise/Xerox hero fallback; use lazy loading plus async decoding on genuine below-fold content.

## Ready image assets

All originals are retained. These are same-artwork format conversions, with alpha retained where present; no generation or aesthetic editing occurred. The full-size files preserve dimensions. Pillow WebP quality is 88 for site images and 94 for model textures. The reusable encoder asserts decoded dimensions and alpha mode.

| Original | Full-size WebP | Dimensions | Bytes before → after |
|---|---|---:|---:|
| `images/host-cta-cutout.png` | `images/host-cta-cutout.webp` | 1024×1536 | 2,703,244 → 334,674 |
| `images/kiosk-hero.png` | `images/kiosk-hero.webp` | 921×1708 | 1,322,332 → 175,264 |
| `images/host-cta.jpg` | `images/host-cta.webp` | 1152×1728 | 474,981 → 194,306 |
| `images/step-1-qr.jpg` | `images/step-1-qr.webp` | 1086×1448 | 889,143 → 108,332 |
| `images/step-2-upload.jpg` | `images/step-2-upload.webp` | 1086×1448 | 846,398 → 97,910 |
| `images/step-3-settings.jpg` | `images/step-3-settings.webp` | 1086×1448 | 875,420 → 89,684 |
| `images/step-4-collect.jpg` | `images/step-4-collect.webp` | 1086×1448 | 896,805 → 99,704 |
| `models/kiosk-front.png` | `models/kiosk-front.webp` | 1024×1536 | 1,526,965 → 169,696 |
| `models/kiosk-side.png` | `models/kiosk-side.webp` | 1024×1536 | 1,284,122 → 132,212 |

The nine full-size resources fall from 10,819,410 B to 1,401,782 B, an 87.0% reduction; this is an asset byte comparison, not a measured complete-page speed gain.

Responsive variants are also ready: `host-cta-cutout-480.webp` (93,314 B), `-768.webp` (222,174 B); `kiosk-hero-480.webp` (74,692 B), `-768.webp` (140,748 B); `host-cta-480.webp` (45,268 B), `-768.webp` (103,174 B); every instructional image has `-400.webp` and `-800.webp`. All exact dimensions/bytes are listed in `image-optimization.json`.

Recommended references in `lib/views_public.js`: use WebP for `stepsHtml`, `hostBannerHtml`, homepage feature portrait, homepage kiosk fallback, franchise fallback and Xerox hero. Example for an instructional image:

```html
<img src="/images/step-2-upload-800.webp"
     srcset="/images/step-2-upload-400.webp 400w, /images/step-2-upload-800.webp 800w, /images/step-2-upload.webp 1086w"
     sizes="(max-width:360px) calc(100vw - 32px), (max-width:760px) calc((100vw - 56px) / 2), (max-width:1440px) calc((100vw - 232px) / 4), 302px"
     width="1086" height="1448" loading="lazy" decoding="async"
     alt="Upload the right PDF on a phone">
```

The current Three.js `TextureLoader` loads the new WebP textures unchanged. In `public/models/kiosk.mtl`, replace only `map_Kd kiosk-front.png`/`kiosk-side.png` with `.webp`; the model geometry and renderer remain the same. Verify the model still renders after changing references.

## Crawl/visual strengths

The homepage, franchise and Vapi service page all have one meaningful H1 and visible primary actions above the fold at both tested widths. Navigation, headings, prices, delivery service descriptions and contextual links are server-rendered; crawler access does not depend on the 3D canvas. Public images have explicit descriptive alt text, or empty alt when the accessible parent already names the decorative product view. Locality copy is visible on the mobile homepage. The text wordmark, white/blue contrast, clear upload and wallet controls and bottom navigation are intact.

## Evidence and repeatable checks

```powershell
node docs/seo/performance-observe.mjs https://printkarr.in live
node docs/seo/performance-observe.mjs http://127.0.0.1:3100 local-after
python docs/seo/optimize-images.py
```

The image encoder requires Pillow (available in the bundled Codex Python runtime). The browser observer requires the already-installed `puppeteer-core` and existing Edge path; no package dependency was added. Screenshots are in `docs/seo/screenshots/`. The browser script is a diagnostic baseline, not a score generator or an automated assertion that field CWV passes.

Sources for recommendations: [Google image SEO guidance](https://developers.google.com/search/docs/appearance/google-images), [responsive image delivery](https://web.dev/articles/responsive-images), and [LCP optimization and lab/field distinctions](https://web.dev/articles/optimize-lcp). Actual findings and byte values above come from the project and the recorded browser run, rather than these sources.
