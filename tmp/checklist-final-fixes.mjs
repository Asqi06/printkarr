import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8').replaceAll('\r\n','\n');
let server=read('server.mjs').replace("app.post('/contact', contactLimiter, (req, res) => {","app.post('/contact', contactLimiter, siteOrigin, (req, res) => {");
server=server.replace("  const origin = req.get('origin');\n  if (origin && origin !== baseUrl(req)) return res.status(403).send(contactPage({error:'Please send this form from the PrintKarr website.',values}));\n",'');fs.writeFileSync('server.mjs',server);
let p=read('scripts/order-preview.mjs');p=p.replace("      runInNewContext(source.slice(source.indexOf('const contactLimiter =')", "      scope.siteOrigin = runInNewContext(source.match(/function siteOrigin\\(req, res, next\\) \\{[^]*?\\n\\}/)[0]+'\\nsiteOrigin;', {SITE:'https://printkarr.in',URL});\n      runInNewContext(source.slice(source.indexOf('const contactLimiter =')");fs.writeFileSync('scripts/order-preview.mjs',p);
let s=read('lib/seo.js').replace('export function privateDescription(title)', 'export function privateDescription()');
s+=`\n// Emit only payment-confirmed commerce data; never document or customer details.
export function purchaseAnalytics(order) {
  if (order.preview || order.paymentStatus !== 'paid' || ['CREATED','PAYMENT_PENDING','CANCELLED','REFUNDED'].includes(order.status)) return '';
  return '<script type="application/json" data-analytics-purchase>'+JSON.stringify({transaction_id:order.id,value:order.total,currency:'INR',items:[{item_id:'printkarr_order',item_name:'Prints and stationery',price:order.total,quantity:1}]}).replace(/</g,'\\\\u003c')+'</script>';
}
`;fs.writeFileSync('lib/seo.js',s);
s=read('lib/views_store.js');s="import { purchaseAnalytics } from './seo.js';\n"+s;s=s.replace(/  const conversion = [^\n]+;/,"  const conversion = !admin ? purchaseAnalytics(p) : '';");fs.writeFileSync('lib/views_store.js',s);
s=read('lib/views_customer.js');s="import { purchaseAnalytics } from './seo.js';\n"+s;s=s.replace('    title: `Order ${order.id}`, user, extraCss:', '    extraHead: !order.purchaseId ? purchaseAnalytics(order) : \'\',\n    title: `Order ${order.id}`, user, extraCss:');fs.writeFileSync('lib/views_customer.js',s);
s=read('lib/reviews.test.js').replace("assert.match(landing({pricing:db.pricing}),/No customer notes yet/);", "assert.doesNotMatch(landing({pricing:db.pricing}),/id=\"reviews\"|customer reviews/, 'No invented social proof or empty testimonial section');");fs.writeFileSync('lib/reviews.test.js',s);
s=read('public/privacy.js');const start=s.indexOf('  const route ='),end=s.indexOf('\n  const page =',start);
s=s.slice(0,start)+`  const safeRoutes = ['/order','/order/phone','/login','/customer','/customer/wallet','/customer/orders','/customer/orders/new','/customer/purchases','/customer/profile','/customer/referrals','/customer/packs','/customer/notifications','/cart','/stationery','/contact/thank-you'];
  const route = canonical ? new URL(canonical.href).pathname : safeRoutes.includes(location.pathname) ? location.pathname : /^\\/customer\\/(orders|purchases)\\//.test(location.pathname) ? '/customer/'+location.pathname.split('/')[2]+'/detail' : /^\\/order\\//.test(location.pathname) ? '/order' : '/other';`+s.slice(end);fs.writeFileSync('public/privacy.js',s);
