// The connected public domain is the canonical search origin.
export const SITE = new URL(process.env.PUBLIC_SITE_URL || 'https://printkarr.in').origin;
export const PAGES = {
  '/': ['Online Printing in Vapi — 24/7 Print Delivery', 'Order document printing online in Vapi. Black-and-white and colour prints, 24/7 delivery in Vapi and Daman. Call or WhatsApp 9016703180.'],
  '/printing-in-vapi': ['Printing in Vapi — Documents, PDFs & Local Delivery', 'Print PDFs, assignments, resumes and documents in Vapi. Delivery across Vapi and Daman, plus selected colleges in Sarigam and Bhilad.'],
  '/how-it-works': ['How Online Printing Works in Vapi', 'Learn how to upload a document, select pages and print settings, review your price and order local print delivery with PrintKarr.'],
  '/about': ['About PrintKarr — Online Printing from Vapi', 'Meet PrintKarr: online document printing and local delivery from Vapi, with self-service kiosks planned for Vapi.'],
  '/contact': ['Contact PrintKarr in Vapi — Call or WhatsApp', 'Call or WhatsApp PrintKarr on +91 90167 03180 for print delivery in Vapi and Daman, college coverage or kiosk partnerships.'],
  '/blogs': ['Printing Guides & Kiosk Journal', 'Practical guides to preparing documents for printing, choosing print settings and understanding PrintKarr self-service kiosks.'],
  '/franchise': ['PrintKarr Kiosk Partnerships & Franchise', 'Explore PrintKarr kiosk partnership models for campuses, offices and local businesses. Contact our team about a proposed location.'],
  '/xerox': ['Print Shop Partnerships with PrintKarr', 'Bring online document orders and customer-selected print settings to your print shop. Enquire about partnering with PrintKarr.'],
  '/terms': ['Terms & Conditions', 'Read the terms for PrintKarr document printing, orders, payments and refunds.'],
  '/privacy': ['Privacy Policy', 'Read how PrintKarr handles uploaded documents and contact information, and how to contact us about privacy.']
};
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function seoHead(path, title, description, article = false) {
  if (!path || (!PAGES[path] && !article)) return '<meta name="robots" content="noindex,nofollow">';
  const url = SITE + path;
  const organization = { '@type': 'Organization', '@id': SITE + '/#organization', name: 'PrintKarr', url: SITE + '/', telephone: '+919016703180', email: 'team@printkarr.in', address: { '@type': 'PostalAddress', addressLocality: 'Vapi', addressRegion: 'Gujarat', addressCountry: 'IN' }, areaServed: ['Vapi', 'Daman'], contactPoint: { '@type': 'ContactPoint', telephone: '+919016703180', contactType: 'customer service' } };
  const graph = [organization, { '@type': 'WebSite', '@id': SITE + '/#website', url: SITE + '/', name: 'PrintKarr', publisher: { '@id': organization['@id'] } }, { '@type': article ? 'BlogPosting' : 'WebPage', '@id': url + '#page', url, headline: title, name: title, description, inLanguage: 'en-IN', isPartOf: { '@id': SITE + '/#website' }, ...(article ? { author: { '@id': organization['@id'] }, publisher: { '@id': organization['@id'] }, mainEntityOfPage: url } : {}) }];
  if (path !== '/') graph.push({ '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: title, item: url }] });
  if (path === '/printing-in-vapi') graph.push({ '@type': 'Service', name: 'Document printing and delivery', provider: { '@id': organization['@id'] }, areaServed: ['Vapi', 'Daman'], description: '24/7 print delivery across Vapi and Daman; selected colleges in Sarigam and Bhilad by confirmation. Kiosks are planned in Vapi.', url });
  return `<link rel="canonical" href="${escape(url)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta property="og:locale" content="en_IN"><meta property="og:site_name" content="PrintKarr">
<meta property="og:type" content="${article ? 'article' : 'website'}"><meta property="og:url" content="${escape(url)}">
<meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}">
<meta property="og:image" content="${SITE}/images/kiosk-hero.png"><meta property="og:image:alt" content="PrintKarr planned self-service kiosk">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="${escape(description)}"><meta name="twitter:image" content="${SITE}/images/kiosk-hero.png">
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')}</script>`;
}
export function discoveryRoutes(app, posts) {
  const entries = [...Object.entries(PAGES).map(([path, [title, description]]) => ({ path, title, description })), ...posts.map(p => ({ path: '/blogs/' + p.slug, title: p.title, description: p.excerpt }))];
  app.get('/sitemap.xml', (_req, res) => res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.map(p => `<url><loc>${escape(SITE + p.path)}</loc></url>`).join('')}</urlset>`));
  app.get('/robots.txt', (_req, res) => res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /customer\nDisallow: /order\nDisallow: /api/\nDisallow: /auth/\nDisallow: /login\nDisallow: /logout\nDisallow: /share/\nDisallow: /c/\nDisallow: /qr.png\n\nSitemap: ${SITE}/sitemap.xml\n`));
  app.get('/llms.txt', (_req, res) => res.type('text/plain').send(`# PrintKarr\n\n> Online document printing and local print delivery based in Vapi, India.\n\n## Service facts\n\n- 24/7 delivery across Vapi and Daman. Selected colleges in Sarigam and Bhilad: confirm coverage by phone.\n- Call or WhatsApp: +91 90167 03180.\n- Upload documents, select pages, copies and colour settings, then review the current price before payment. Delivery and applicable fees are shown separately.\n- Kiosks are planned in Vapi; no public kiosk address is announced yet.\n- Delivery time and college availability should be confirmed for each order.\n\n## Public pages\n\n${entries.map(p => `- [${p.title}](${SITE + p.path}): ${p.description}`).join('\n')}\n`));
}
