// The connected public domain is the canonical search origin.
export const SITE = new URL(process.env.PUBLIC_SITE_URL || 'https://printkarr.in').origin;
export const PAGES = {
  '/': ['Online Printing in Vapi & Daman', 'Order PDF, assignment and document prints online, any time. Choose print settings and local delivery in Vapi or Daman; review your total before payment.'],
  '/printing-in-vapi': ['Printing in Vapi — PDFs & Local Delivery', 'Print PDFs, assignments, resumes and documents in Vapi. Delivery across Vapi and Daman; confirm selected college coverage in Sarigam and Bhilad.'],
  '/printing-in-daman': ['Printing in Daman — PDF & Document Delivery', 'Order black-and-white or colour document printing in Daman. Upload online, confirm your delivery location and slot, and see the price before paying.'],
  '/printing-prices': ['Document Printing Prices in Vapi & Daman', 'See current A4 black-and-white, colour and student printing rates. Understand pages, copies, wallet credit and delivery fees before ordering online.'],
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
  const organization = { '@type': 'Organization', '@id': SITE + '/#organization', name: 'PrintKarr', legalName: 'PrintKarr Technologies Private Limited', url: SITE + '/', logo: SITE + '/wordmark.svg', description: 'Online document printing based in Vapi, with local delivery in Vapi and Daman. Selected colleges in Sarigam and Bhilad require coverage confirmation.', telephone: '+919016703180', email: 'team@printkarr.in', address: { '@type': 'PostalAddress', addressLocality: 'Vapi', addressRegion: 'Gujarat', addressCountry: 'IN' }, areaServed: ['Vapi', 'Daman'], contactPoint: { '@type': 'ContactPoint', telephone: '+919016703180', email: 'team@printkarr.in', contactType: 'customer service', areaServed: 'IN' } };
  const image = SITE + '/images/printkarr-social.png';
  const graph = [organization, { '@type': 'WebSite', '@id': SITE + '/#website', url: SITE + '/', name: 'PrintKarr', inLanguage: 'en-IN', publisher: { '@id': organization['@id'] } }, { '@type': article ? 'BlogPosting' : ({ '/about':'AboutPage', '/contact':'ContactPage', '/blogs':'CollectionPage' }[path] || 'WebPage'), '@id': url + '#page', url, headline: title, name: title, description, inLanguage: 'en-IN', isPartOf: { '@id': SITE + '/#website' }, image, ...(article ? { author: { '@type':'Organization', '@id': organization['@id'], name:'PrintKarr', url:SITE + '/about' }, publisher: { '@id': organization['@id'] }, mainEntityOfPage: url, ...(article.modified ? { dateModified:article.modified } : {}) } : {}) }];
  if (path !== '/') graph.push({ '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' }, ...(article ? [{ '@type':'ListItem', position:2, name:'Printing guides', item:SITE + '/blogs' }] : []), { '@type': 'ListItem', position: article ? 3 : 2, name: title, item: url }] });
  if (['/', '/printing-in-vapi', '/printing-in-daman'].includes(path)) graph.push({ '@type': 'Service', '@id':url + '#printing-service', name: path === '/printing-in-daman' ? 'Document printing and delivery in Daman' : 'Document printing and local delivery', serviceType:'PDF, black-and-white and colour document printing', provider: { '@id': organization['@id'] }, areaServed: path === '/printing-in-daman' ? ['Daman'] : ['Vapi', 'Daman'], description: 'Online orders can be placed at any time. Delivery availability, fees and slots are confirmed in checkout. Selected college coverage in Sarigam and Bhilad requires confirmation; Vapi kiosks are planned.', url });
  return `<link rel="canonical" href="${escape(url)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta property="og:locale" content="en_IN"><meta property="og:site_name" content="PrintKarr">
<meta property="og:type" content="${article ? 'article' : 'website'}"><meta property="og:url" content="${escape(url)}">
<meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}">
<meta property="og:image" content="${image}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="PrintKarr — online document printing in Vapi and Daman">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="${escape(description)}"><meta name="twitter:image" content="${image}"><meta name="twitter:image:alt" content="PrintKarr — online document printing in Vapi and Daman">
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')}</script>`;
}
export function discoveryRoutes(app, posts) {
  const entries = [...Object.entries(PAGES).map(([path, [title, description]]) => ({ path, title, description })), ...posts.map(p => ({ path: '/blogs/' + p.slug, title: p.title, description: p.excerpt, modified:p.modified }))];
  const paths = new Set([...entries.map(p => p.path), '/robots.txt', '/sitemap.xml', '/llms.txt']);
  app.use((req, res, next) => {
    if (!['GET', 'HEAD'].includes(req.method)) return next();
    const path = req.path === '/index.html' ? '/' : req.path.replace(/\/+$/, '').toLowerCase() || '/';
    if (!paths.has(path)) return next();
    const hostname = new URL(SITE).hostname;
    const publicHost = req.hostname === hostname || req.hostname === 'www.' + hostname;
    if (req.path === path && (!publicHost || (req.hostname === hostname && req.protocol === new URL(SITE).protocol.slice(0,-1)))) return next();
    return res.redirect(301, (publicHost ? SITE : '') + path + req.originalUrl.slice(req.path.length));
  });
  app.get('/sitemap.xml', (_req, res) => res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.map(p => `<url><loc>${escape(SITE + p.path)}</loc>${p.modified ? `<lastmod>${escape(p.modified)}</lastmod>` : ''}</url>`).join('')}</urlset>`));
  app.get('/robots.txt', (_req, res) => res.type('text/plain').send(`User-agent: *\nAllow: /\n# Let crawlers see the noindex response on sign-in pages.\nAllow: /admin/login\nDisallow: /admin\nDisallow: /customer\nDisallow: /order\nDisallow: /api/\nDisallow: /auth/\nDisallow: /logout\nDisallow: /share/\nDisallow: /c/\nDisallow: /qr.png\n\nSitemap: ${SITE}/sitemap.xml\n`));
  app.get('/llms.txt', (_req, res) => res.type('text/plain').send(`# PrintKarr\n\n> Online document printing and local print delivery based in Vapi, India. Operated by PrintKarr Technologies Private Limited.\n\n## Service facts\n\n- Online ordering is available 24/7. Delivery serves Vapi and Daman; availability, fees and slots are confirmed in checkout. This is not a promise of immediate or overnight delivery.\n- Selected colleges in Sarigam and Bhilad require coverage confirmation.\n- Contact: +91 90167 03180 or team@printkarr.in. WhatsApp is optional; orders can be completed on the website.\n- Upload documents, select pages, copies and colour settings, choose delivery, review the current price, then pay by wallet or the available checkout methods.\n- Bonus wallet credit is non-withdrawable and usable on PrintKarr orders; offer eligibility and validity apply. Current offers are shown in the wallet.\n- Kiosks are planned in Vapi; no public kiosk address is announced yet.\n- Keep your original document. Order files are removed after eligible orders reach delivered, refunded or cancelled status and the configured retention period passes.\n\n## Public pages\n\n${entries.map(p => `- [${p.title}](${SITE + p.path}): ${p.description}`).join('\n')}\n`));
}
