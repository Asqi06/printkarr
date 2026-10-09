import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8').replaceAll('\r\n','\n');
let s=read('lib/seo.js');
const descriptions={
'/':'Order A4 prints and stationery online with PrintKarr. Upload your files, choose a nearby shop and review prices for delivery to your home, school or college.',
'/shops':'Find nearby PrintKarr print and stationery shops. Upload documents, browse available essentials and check local delivery options and prices before you pay.',
'/kiosks':'Explore the planned PrintKarr self-service kiosks and their current development status. Order prints online today for local delivery in Vapi and Daman areas.',
'/printing-in-vapi':'Order A4 black-and-white or colour printouts for assignments, project reports, forms and resumes in Vapi. Check local delivery, print settings and your total.',
'/printing-in-daman':'Order black-and-white or colour document printing in Daman. Upload your PDF online, choose print settings and review delivery availability and the full price.',
'/printing-prices':'Explore current A4 black-and-white, colour and student print rates. See how pages, copies, processing and delivery affect your PrintKarr total before payment.',
'/how-it-works':'Learn how to order prints with PrintKarr: upload a file, choose pages and print settings, review prices and select local delivery to your school, home or office.',
'/about':'Meet PrintKarr, the local online printing service based in Vapi. Discover document printing, stationery delivery, nearby shop partnerships and planned kiosks.',
'/contact':'Contact PrintKarr for help with print orders, delivery in Vapi and Daman, school or college requests and shop partnerships. Call, WhatsApp or send an enquiry.',
'/blogs':'Read practical PrintKarr guides to preparing PDFs, choosing print settings and ordering local delivery. Get useful checklists for assignments and documents.',
'/franchise':'Learn about planned PrintKarr kiosk opportunities and their development status. Contact our team for updates, or explore our existing local shop partnerships.',
'/xerox':'Partner your local print shop with PrintKarr. Learn how online orders, customer print settings, rider handovers and agreed settlements work before you enquire.',
'/terms':'Read PrintKarr terms for document printing, local delivery, payments, wallet credit and order issues. Review your responsibilities and contact us for support.',
'/privacy':'Learn how PrintKarr uses documents, account details, payment references and delivery information. Read about retention, cookies, analytics and privacy requests.'
};
s=s.replace(/('(?:\/[^']*)'): \[('(?:[^'\\]|\\.)*'), '(?:[^'\\]|\\.)*'\]/g,(all,key,title)=>{const p=key.slice(1,-1);return descriptions[p]?`${key}: [${title}, '${descriptions[p]}']`:all;});
s=s.replace("'/franchise': ['PrintKarr Kiosks · In development'","'/franchise': ['Future Kiosk Partnerships & Updates'");
s=s.replace("'/': ['Local Prints & Stationery Delivery in Vapi'","'/': ['Online Printing & Doorstep Delivery'");
s=s.replace("const image = SITE + '/images/printkarr-social.png';","const image = SITE + '/images/paper-studio-social.png';");
s=s.replace('Disallow: /customer\\n','Disallow: /customer\\nDisallow: /partner\\nDisallow: /rider\\nDisallow: /cart\\nDisallow: /contact/thank-you\\n');
s=s.replace("    if (!['GET', 'HEAD'].includes(req.method)) return next();",`    // Upgrade all methods on the configured public host, preserving POST bodies.
    if (new URL(SITE).protocol === 'https:' && req.hostname === new URL(SITE).hostname && req.protocol !== 'https') return res.redirect(308, SITE + req.originalUrl);
    if (!['GET', 'HEAD'].includes(req.method)) return next();`);
s += `\nexport function privateDescription(title) {
  return 'Use your PrintKarr account to manage document printing, stationery, delivery and payments. Review your details securely and contact our team whenever you need help.';
}
export function analyticsHead() {
  const id = process.env.GA4_MEASUREMENT_ID || '';
  return '<meta name="printkarr-analytics" content="' + (/^G-[A-Z0-9]+$/.test(id) ? id : '') + '"><script src="/privacy.js?v=20261009" defer></script>';
}
`;
fs.writeFileSync('lib/seo.js',s);
let v=read('lib/views.js');v="import { privateDescription, analyticsHead } from './seo.js';\n"+v;
v=v.replaceAll('<meta name="robots" content="noindex,nofollow">','<meta name="robots" content="noindex,nofollow"><meta name="description" content="${esc(privateDescription(title))}">${analyticsHead()}');
v=v.replace('<a href="/privacy">Privacy Policy</a>','<a href="/privacy">Privacy Policy</a><button class="cookie-preferences" type="button" data-cookie-settings>Cookie preferences</button>');
v=v.replace("...primary, ['/printing-prices', 'Pricing'],", "...primary,");
v=v.replace('href="/franchise">Kiosks · Coming soon','href="/kiosks">Kiosks · In development');
fs.writeFileSync('lib/views.js',v);
let p=read('lib/views_public.js');p=p.replace("import { PAGES, seoHead }", "import { PAGES, seoHead, analyticsHead, privateDescription }");
p=p.replace('${seoHead(path, title, desc, article)}','${seoHead(path, title, desc, article)}${analyticsHead()}');
p=p.replace('desc || "PrintKarr — upload your file, choose your prints and get them delivered to your school, college, home or office. See the full price before payment."','desc || privateDescription(title)');
p=p.replace('bonus>','bonus>');
p=p.replace('o.amount+o.bonus','o.amount+(o.bonus||0)');
fs.writeFileSync('lib/views_public.js',p);
for(const [p,d]of Object.entries(descriptions))console.log(d.length,p);
