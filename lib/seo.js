// The connected public domain is the canonical search origin.
export const SITE = new URL(process.env.PUBLIC_SITE_URL || 'https://printkarr.in').origin;
export const PAGES = {
  '/': ['Online Printouts in Vapi & Daman | PrintKarr', 'Order A4 PDF and photo printouts online in Vapi or Daman. Select pages, copies and colour, then check delivery coverage, available slots and the full price before payment.'],
  '/printing-in-vapi': ['Online Printouts & Assignment Printing in Vapi | PrintKarr', 'Order assignment, report, form and admit-card printouts in Vapi. Upload a PDF or photo, choose B&W or colour, and check address delivery charges and slots before paying.'],
  '/printing-in-daman': ['PDF Printouts & Document Delivery in Daman | PrintKarr', 'Order A4 PDF and photo printing online in Daman. Choose black-and-white or colour, enter your delivery address, and check coverage, fee and available slot before paying.'],
  '/printing-prices': ['B&W & Colour Printout Prices in Vapi & Daman', 'Explore current A4 black-and-white, colour and student print rates. See how pages, copies, print settings and delivery affect your total before you pay.'],
  '/how-it-works': ['How to Order Printouts in Vapi & Daman | PrintKarr', 'See how to upload a PDF or photo, choose pages and print settings, then check whether your Vapi or Daman address or participating campus is covered before paying.'],
  '/about': ['About PrintKarr — Online Printing from Vapi', 'Meet PrintKarr, the local online printing service based in Vapi. Order document printing and stationery delivery in supported areas.'],
  '/contact': ['Contact PrintKarr in Vapi — Call or WhatsApp', 'Contact PrintKarr for help with print orders, delivery in Vapi and Daman, school or college requests. Call, WhatsApp or send an enquiry.'],
  '/blogs': ['Printing & Delivery Guides', 'Read practical PrintKarr guides to preparing PDFs, choosing print settings and ordering local delivery. Get useful checklists for assignments and documents.'],
  '/terms': ['Terms & Conditions', 'Read PrintKarr terms for document printing, local delivery, payments, wallet credit and order issues. Review your responsibilities and contact us for support.'],
  '/privacy': ['Privacy Policy', 'Learn how PrintKarr uses documents, account details, payment references and delivery information. Read about retention, cookies, analytics and privacy requests.']
};
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function seoHead(path, title, description, article = false) {
  if (!path || (!PAGES[path] && !article)) return '<meta name="robots" content="noindex,nofollow">';
  const url = SITE + path;
  const organization = { '@type': 'Organization', '@id': SITE + '/#organization', name: 'PrintKarr', legalName: 'PrintKarr Technologies Private Limited', url: SITE + '/', logo: SITE + '/wordmark.svg', description: 'Online A4 PDF and photo printing based in Vapi, with address delivery in Vapi and Daman where checkout confirms coverage. Delivery to school and college destinations is available only for participating locations shown in checkout.', telephone: '+919016703180', email: 'team@printkarr.in', address: { '@type': 'PostalAddress', addressLocality: 'Vapi', addressRegion: 'Gujarat', addressCountry: 'IN' }, areaServed: ['Vapi', 'Daman'], contactPoint: { '@type': 'ContactPoint', telephone: '+919016703180', email: 'team@printkarr.in', contactType: 'customer service', areaServed: 'IN' } };
  const image = SITE + '/images/paper-studio-social.png';
  const graph = [organization, { '@type': 'WebSite', '@id': SITE + '/#website', url: SITE + '/', name: 'PrintKarr', inLanguage: 'en-IN', publisher: { '@id': organization['@id'] } }, { '@type': article ? 'BlogPosting' : ({ '/about':'AboutPage', '/contact':'ContactPage', '/blogs':'CollectionPage' }[path] || 'WebPage'), '@id': url + '#page', url, headline: title, name: title, description, inLanguage: 'en-IN', isPartOf: { '@id': SITE + '/#website' }, image, ...(article ? { author: { '@type':'Organization', '@id': organization['@id'], name:'PrintKarr', url:SITE + '/about' }, publisher: { '@id': organization['@id'] }, mainEntityOfPage: url, ...(article.modified ? { dateModified:article.modified } : {}) } : {}) }];
  if (path !== '/') graph.push({ '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' }, ...(article ? [{ '@type':'ListItem', position:2, name:'Printing guides', item:SITE + '/blogs' }] : []), { '@type': 'ListItem', position: article ? 3 : 2, name: title, item: url }] });
  if (['/', '/printing-in-vapi', '/printing-in-daman'].includes(path)) {
    const areaServed = path === '/printing-in-daman' ? ['Daman'] : path === '/printing-in-vapi' ? ['Vapi'] : ['Vapi', 'Daman'];
    graph.push({
      '@type': 'Service',
      '@id': url + '#printing-service',
      name: path === '/printing-in-daman' ? 'Online document printing in Daman' : path === '/printing-in-vapi' ? 'Online document printing in Vapi' : 'Online document printing and delivery',
      serviceType: 'A4 PDF and photo printing, black-and-white and colour',
      provider: { '@id': organization['@id'] },
      areaServed,
      description: 'Upload a PDF or photo, choose pages, copies and print settings, then review the current price. Checkout confirms whether the entered delivery address or selected campus is covered and shows the available delivery charge and slot.',
      url
    });
  }
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
    if (req.hostname !== hostname && (['printkarr.onrender.com', 'printkarr.com', 'www.printkarr.com', 'www.' + hostname].includes(req.hostname)) && !req.path.startsWith('/api/agent/')) return res.redirect(paths.has(path) ? 301 : 302, SITE + req.originalUrl);
    if (!paths.has(path)) return next();
    const publicHost = req.hostname === hostname || req.hostname === 'www.' + hostname;
    if (req.path === path && (!publicHost || (req.hostname === hostname && req.protocol === new URL(SITE).protocol.slice(0,-1)))) return next();
    return res.redirect(301, (publicHost ? SITE : '') + path + req.originalUrl.slice(req.path.length));
  });
  app.get('/sitemap.xml', (_req, res) => res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.map(p => `<url><loc>${escape(SITE + p.path)}</loc>${p.modified ? `<lastmod>${escape(p.modified)}</lastmod>` : ''}</url>`).join('')}</urlset>`));
  app.get('/robots.txt', (_req, res) => res.type('text/plain').send(`User-agent: *\nAllow: /\n# Public service pages are available to Google, Bing and OAI-SearchBot.\n# Private account, checkout and API paths are excluded below.\nAllow: /admin/login\nDisallow: /admin\nDisallow: /customer\nDisallow: /rider\nDisallow: /cart\nDisallow: /contact/thank-you\nDisallow: /order\nDisallow: /api/\nDisallow: /auth/\nDisallow: /logout\nDisallow: /share/\nDisallow: /c/\nDisallow: /qr.png\n\nSitemap: ${SITE}/sitemap.xml\n`));
  app.get('/llms.txt', (_req, res) => res.type('text/plain').send(`# PrintKarr\n\n> PrintKarr is an online A4 document printing service based in Vapi, Gujarat, India. It accepts orders on its website and offers local delivery in Vapi and Daman. Participating school and college destinations are confirmed in checkout.\n\n## What customers can order\n\n- A4 document printing from PDF, JPG and PNG files, including assignments, reports, forms, resumes, tickets and admit cards.\n- Black-and-white, colour, selected page ranges, copies and mixed colour pages. Print and finishing options shown in the order flow depend on the selected job.\n- The current per-page rates and live quote are shown on the pricing page and in checkout. Copies, selected pages, print settings, finishing, stationery and delivery can change the total. Review the complete quote before payment.\n\n## Delivery and timing\n\n- Address delivery is offered in Vapi and Daman, subject to the PIN code, locality and route being available in checkout.\n- School and college delivery is limited to participating institutions shown in checkout. A Sarigam or Bhilad address does not by itself confirm campus coverage.\n- Customers see the delivery fee and available slot before paying. Online orders can be placed at any time; this does not promise immediate or overnight printing or delivery.\n\n## How to order\n\nUpload a PDF or photo, choose pages and copies, select print settings, enter a delivery address or supported campus, review the itemised price and delivery slot, then pay using the available checkout methods. WhatsApp is optional.\n\n## Contact\n\nPhone: +91 90167 03180\nEmail: team@printkarr.in\nBusiness base: Vapi, Gujarat, India\n\n## Public pages\n\n${entries.map(p => `- [${p.title}](${SITE + p.path}): ${p.description}`).join('\n')}\n`));
}

export function privateDescription() {
  return 'Use your PrintKarr account to manage document printing, stationery, delivery and payments. Review your details securely and contact our team when you need help.';
}
export function analyticsHead() {
  const id = process.env.GA4_MEASUREMENT_ID || '';
  return '<meta name="printkarr-analytics" content="' + (/^G-[A-Z0-9]+$/.test(id) ? id : '') + '"><script src="/privacy.js?v=20261014" defer></script>';
}

// Emit only payment-confirmed commerce data; never document or customer details.
export function purchaseAnalytics(order) {
  if (order.preview || order.paymentStatus !== 'paid' || ['CREATED','PAYMENT_PENDING','CANCELLED','REFUNDED'].includes(order.status)) return '';
  return '<script type="application/json" data-analytics-purchase>'+JSON.stringify({transaction_id:order.id,value:order.total,currency:'INR',items:[{item_id:'printkarr_order',item_name:'Prints and stationery',price:order.total,quantity:1}]}).replace(/</g,'\\u003c')+'</script>';
}
