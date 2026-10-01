# PrintKarr: editorial print desk

One visual system across the public website, checkout, customer workspace, and administration.

## Foundations

- White canvas (`#ffffff`), ultramarine actions (`#2448ef`), ink text (`#14203b`), blue-tinted surfaces (`#f2f5ff`). Green and red retain their status meanings.
- DM Sans for navigation, data, and forms. Instrument Serif italic for public editorial accents. Fonts are served locally with `font-display: swap`; OFL licenses accompany the files.
- Eight-pixel spacing rhythm. Public sections use 64–128px breathing room; workspace forms use 16–32px gaps. Shared cards use 16px corners and buttons 12px.
- Public navigation prioritizes Print, Wallet and My Account. Mobile customers have Home, Print, Orders, Wallet, My Account at all times. Admin tables scroll within their containers; the admin menu exposes every section.
- Page names and field labels remain task-oriented. Display balance comes from the existing wallet ledger; prices and offers remain admin-configured.
- Public interior pages share a centered container with responsive side gutters. Campus sections use aligned model cards, a contained kiosk view, and a two-column enquiry area that stacks on mobile. Native section links use one shared header offset (112px desktop, 96px mobile).
- Customer sign-in offers one Google action plus guest printing. Email-code and password controls are removed from that page; staff credentials use `/admin/login`. Customer Google authentication cannot create or sign into a staff account. The Google button uses the current official logo and locally served Google Sans, following [Google's branding guidelines](https://developers.google.com/identity/branding-guidelines); its font license accompanies the file.

## References and implementation

- [Family Style on Awwwards](https://www.awwwards.com/sites/family-style): bold blue, white space and confident typography.
- [Park on Awwwards](https://www.awwwards.com/sites/park): restrained composition and typographic hierarchy.
- [Editorial photography on Dribbble](https://dribbble.com/shots/27563444-Minimal-Editorial-Photography-Website-UI): generous editorial spacing.
- [21st.dev](https://21st.dev/community/components) / [Magic UI interactive hover button](https://v3.magicui.design/docs/components/interactive-hover-button): the existing native HTML/CSS adaptation is reused for the campus contact action.
- [Motion](https://motion.dev/docs/quick-start) 12.23.24: real, locally served browser library for one-shot section entrances and spring arrow feedback. MIT license is in `public/vendor`.
- [GSAP](https://gsap.com/docs/v3/Installation/) 3.13.0: real, locally served library for the landing headline and paper entrance; loaded only on the landing page. See [GSAP's standard license](https://gsap.com/standard-license/).
- [Originkit](https://github.com/vellum-ai/originkit) and [ThreeUI](https://threeui.com/browse): motion and contained product-stage references. Their component source is not imported. Originkit's source access requires an API key. The original studio-paper hero is AI-generated with the built-in image generation tool and optimized to WebP; the kiosk composition is authored for PrintKarr; the kiosk reuses the site's existing model and pinned, locally served Three.js 0.160.0 renderer (MIT license in `public/vendor`).
- [Phosphor](https://github.com/phosphor-icons/core): MIT-licensed official icons served as a local SVG sprite, with license in `public/vendor`.

Animation never gates content or changes scrolling. Missing libraries leave the page usable. Reduced-motion preferences skip effects, including when changed while a page is open. The kiosk retains a static image when WebGL or its model fails to load. Printed faces use unlit, colour-managed textures so studio lighting cannot bleach the artwork; the physical enclosure and ground shadow remain lit. The presentation is on the white page, with a three-quarter view and no coloured backdrop.

## Checks and read-only preview

Run `npm run test:design`, `npm run test:seo`, and `npm test`. For a read-only preview with fictional data, run `node scripts/design-check.mjs --serve` and open http://127.0.0.1:3100. Forms in that preview do not submit to the application.

## Original hero asset

Saved asset: `public/images/print-desk-hero-v2.webp` (79,740 bytes). Generated with the built-in image generation tool, then encoded as WebP without changing the artwork. The original PNG is preserved in the tool's generated-images directory.

Final prompt:

> Use case: product-mockup. Asset type: original editorial hero photograph for PrintKarr, an online document printing website. Create a premium editorial studio photograph, portrait 4:5 composition. Overhead/three-quarter view of a crisp white A4 document and a small stack of printed pages on a very pale cool blue-white matte tabletop. The top page is slightly rotated clockwise and has a confident ultramarine blue editorial print layout: one large cropped abstract blue circular shape, fine blue typographic detail, a large tasteful serif italic headline reading exactly 'Your next chapter.' and a tiny label 'PRINTKARR'. Physical paper edges, subtle real paper texture, sharp crisp print, daylight casting a gentle long soft shadow. White and ultramarine #2448ef dominate, abundant negative space around the papers. Subject fills about 70 percent of the frame with all paper edges inside the photograph. Sophisticated contemporary magazine art direction, restrained, sculptural, beautiful, realistic studio photography. No hands, people, devices, printers, decorative stationery, orange, beige, black background, gradients, glossy plastic, UI screens, watermarks or extra props. The image is a sample print illustration for the website; no pricing or invented customer claims. Save-ready high-quality photograph suitable for a lightweight website hero.
