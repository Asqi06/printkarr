// The connected public domain is the canonical search origin.
export const SITE = new URL(process.env.PUBLIC_SITE_URL || 'https://printkarr.in').origin;
export const PAGES = {
  '/shops': ['Nearby Print & Stationery Shops', 'Find nearby PrintKarr print and stationery shops. Upload documents, browse available essentials and check local delivery options and prices before you pay.'],
  '/kiosks': ['PrintKarr Kiosks · In development', 'Explore the planned PrintKarr self-service kiosks and their current development status. Order prints online today for local delivery in Vapi and Daman areas.'],
  '/': ['Online Printing & Doorstep Delivery', 'Order A4 prints and stationery online with PrintKarr. Upload your files, choose a nearby shop and review prices for delivery to your home, school or college.'],
  '/printing-in-vapi': ['A4 & College Assignment Printing in Vapi', 'Order A4 black-and-white or colour printouts for assignments, project reports, forms and resumes in Vapi. Check local delivery, print settings and your total.'],
  '/printing-in-daman': ['Printing in Daman — PDF & Document Delivery', 'Order black-and-white or colour document printing in Daman. Upload your PDF online, choose print settings and review delivery availability and the full price.'],
  '/printing-prices': ['Document Printing Prices in Vapi & Daman', 'Explore current A4 black-and-white, colour and student print rates. See how pages, copies, processing and delivery affect your PrintKarr total before payment.'],
  '/how-it-works': ['How Online Printing Works in Vapi', 'Learn how to order prints with PrintKarr: upload a file, choose pages and print settings, review prices and select delivery to your school, home or office.'],
  '/about': ['About PrintKarr — Online Printing from Vapi', 'Meet PrintKarr, the local online printing service based in Vapi. Discover document printing, stationery delivery, nearby shop partnerships and planned kiosks.'],
  '/contact': ['Contact PrintKarr in Vapi — Call or WhatsApp', 'Contact PrintKarr for help with print orders, delivery in Vapi and Daman, school or college requests and shop partnerships. Call, WhatsApp or send an enquiry.'],
  '/blogs': ['Printing & Delivery Guides', 'Read practical PrintKarr guides to preparing PDFs, choosing print settings and ordering local delivery. Get useful checklists for assignments and documents.'],
  '/franchise': ['Future Kiosk Partnerships & Updates', 'Learn about planned PrintKarr kiosk opportunities and their development status. Contact our team for updates, or explore our existing local shop partnerships.'],
  '/xerox': ['Print Shop Partnerships with PrintKarr', 'Partner your local print shop with PrintKarr. Learn how online orders, customer print settings, rider handovers and agreed settlements work before you enquire.'],
  '/terms': ['Terms & Conditions', 'Read PrintKarr terms for document printing, local delivery, payments, wallet credit and order issues. Review your responsibilities and contact us for support.'],
  '/privacy': ['Privacy Policy', 'Learn how PrintKarr uses documents, account details, payment references and delivery information. Read about retention, cookies, analytics and privacy requests.']
};
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function seoHead(path, title, description, article = false) {
  if (!path || (!PAGES[path] && !article)) return '<meta name="robots" content="noindex,nofollow">';
  const url = SITE + path;
  const organization = { '@type': 'Organization', '@id': SITE + '/#organization', name: 'PrintKarr', legalName: 'PrintKarr Technologies Private Limited', url: SITE + '/', logo: SITE + '/wordmark.svg', description: 'Online A4 document and college assignment printing based in Vapi, with local delivery in Vapi and Daman. School and college delivery in supported local areas is ₹10 scheduled or ₹25 express.', telephone: '+919016703180', email: 'team@printkarr.in', address: { '@type': 'PostalAddress', addressLocality: 'Vapi', addressRegion: 'Gujarat', addressCountry: 'IN' }, areaServed: ['Vapi', 'Daman'], contactPoint: { '@type': 'ContactPoint', telephone: '+919016703180', email: 'team@printkarr.in', contactType: 'customer service', areaServed: 'IN' } };
  const image = SITE + '/images/paper-studio-social.png';
  const graph = [organization, { '@type': 'WebSite', '@id': SITE + '/#website', url: SITE + '/', name: 'PrintKarr', inLanguage: 'en-IN', publisher: { '@id': organization['@id'] } }, { '@type': article ? 'BlogPosting' : ({ '/about':'AboutPage', '/contact':'ContactPage', '/blogs':'CollectionPage' }[path] || 'WebPage'), '@id': url + '#page', url, headline: title, name: title, description, inLanguage: 'en-IN', isPartOf: { '@id': SITE + '/#website' }, image, ...(article ? { author: { '@type':'Organization', '@id': organization['@id'], name:'PrintKarr', url:SITE + '/about' }, publisher: { '@id': organization['@id'] }, mainEntityOfPage: url, ...(article.modified ? { dateModified:article.modified } : {}) } : {}) }];
  if (path !== '/') graph.push({ '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' }, ...(article ? [{ '@type':'ListItem', position:2, name:'Printing guides', item:SITE + '/blogs' }] : []), { '@type': 'ListItem', position: article ? 3 : 2, name: title, item: url }] });
  if (['/', '/printing-in-vapi', '/printing-in-daman'].includes(path)) graph.push({ '@type': 'Service', '@id':url + '#printing-service', name: path === '/printing-in-daman' ? 'Document printing and delivery in Daman' : 'Document printing and local delivery', serviceType:'PDF, black-and-white and colour document printing', provider: { '@id': organization['@id'] }, areaServed: path === '/printing-in-daman' ? ['Daman'] : ['Vapi', 'Daman'], description: 'Online orders can be placed at any time. Delivery availability, fees and slots are confirmed in checkout. Schools and colleges in supported local areas use ₹10 scheduled or ₹25 express delivery. Vapi kiosks are planned.', url });
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
    // Upgrade all methods on the configured public host, preserving POST bodies.
    if (new URL(SITE).protocol === 'https:' && req.hostname === new URL(SITE).hostname && req.protocol !== 'https') return res.redirect(308, SITE + req.originalUrl);
    if (!['GET', 'HEAD'].includes(req.method)) return next();
    const path = req.path === '/index.html' ? '/' : req.path.replace(/\/+$/, '').toLowerCase() || '/';
    const hostname = new URL(SITE).hostname;
    // Checkout/auth pages must use the registered public origin, including old Render links.
    if (req.hostname !== hostname && (req.hostname === 'printkarr.onrender.com' || req.hostname === 'www.' + hostname) && !req.path.startsWith('/api/agent/')) return res.redirect(paths.has(path) ? 301 : 302, SITE + req.originalUrl);
    if (!paths.has(path)) return next();
    const publicHost = req.hostname === hostname || req.hostname === 'www.' + hostname;
    if (req.path === path && (!publicHost || (req.hostname === hostname && req.protocol === new URL(SITE).protocol.slice(0,-1)))) return next();
    return res.redirect(301, (publicHost ? SITE : '') + path + req.originalUrl.slice(req.path.length));
  });
  app.get('/sitemap.xml', (_req, res) => res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.map(p => `<url><loc>${escape(SITE + p.path)}</loc>${p.modified ? `<lastmod>${escape(p.modified)}</lastmod>` : ''}</url>`).join('')}</urlset>`));
  app.get('/robots.txt', (_req, res) => res.type('text/plain').send(`User-agent: *\nAllow: /\n# Let crawlers see the noindex response on sign-in pages.\nAllow: /admin/login\nDisallow: /admin\nDisallow: /customer\nDisallow: /partner\nDisallow: /rider\nDisallow: /cart\nDisallow: /contact/thank-you\nDisallow: /order\nDisallow: /api/\nDisallow: /auth/\nDisallow: /logout\nDisallow: /share/\nDisallow: /c/\nDisallow: /qr.png\n\nSitemap: ${SITE}/sitemap.xml\n`));
  app.get('/llms.txt', (_req, res) => res.type('text/plain').send(`# PrintKarr\n\n> Online document printing and local print delivery based in Vapi, India. Operated by PrintKarr Technologies Private Limited.\n\n## Service facts\n\n- Online ordering is available 24/7. Delivery serves Vapi and Daman; availability, fees and slots are confirmed in checkout. This is not a promise of immediate or overnight delivery.\n- A4 black-and-white, colour and mixed colour-page printing supports assignments, project reports, applications and everyday documents.\n- Schools and colleges in supported local coverage use ₹5 flat delivery. Enter the institution name, address and map pin. Other available delivery has no additional charge. There are no COD convenience, processing, late-night or demand fees. Coverage and exact totals are confirmed before payment.\n- Contact: +91 90167 03180 or team@printkarr.in. WhatsApp is optional; orders can be completed on the website.\n- Upload documents, select pages, copies and colour settings, choose delivery, review the current price, then pay by wallet or the available checkout methods.\n- Bonus wallet credit is non-withdrawable and usable on PrintKarr orders; offer eligibility and validity apply. Current offers are shown in the wallet.\n- Kiosks are in development; ordering currently uses local delivery.\n- Keep your original document. Order files are removed after eligible orders reach delivered, refunded or cancelled status and the configured retention period passes.\n\n## Public pages\n\n${entries.map(p => `- [${p.title}](${SITE + p.path}): ${p.description}`).join('\n')}\n`));
}

export function privateDescription() {
  return 'Use your PrintKarr account to manage document printing, stationery, delivery and payments. Review your details securely and contact our team when you need help.';
}
export function analyticsHead() {
  const id = process.env.GA4_MEASUREMENT_ID || '';
  return '<meta name="printkarr-analytics" content="' + (/^G-[A-Z0-9]+$/.test(id) ? id : '') + '"><script src="/privacy.js?v=20261009" defer></script>';
}

// Emit only payment-confirmed commerce data; never document or customer details.
export function purchaseAnalytics(order) {
  if (order.preview || order.paymentStatus !== 'paid' || ['CREATED','PAYMENT_PENDING','CANCELLED','REFUNDED'].includes(order.status)) return '';
  return '<script type="application/json" data-analytics-purchase>'+JSON.stringify({transaction_id:order.id,value:order.total,currency:'INR',items:[{item_id:'printkarr_order',item_name:'Prints and stationery',price:order.total,quantity:1}]}).replace(/</g,'\\u003c')+'</script>';
}
