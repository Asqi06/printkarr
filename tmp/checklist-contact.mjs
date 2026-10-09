import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8').replaceAll('\r\n','\n');
let s=read('lib/views_public.js');
s=s.replace('export function contactPage({ sent } = {}) {',`export const CONTACT_TOPICS = ['Help with my print order','School / college delivery','Need a custom solution','Onboard my Xerox shop','Home / office delivery','Just saying hello'];
export function contactPage({ error = '', values = {} } = {}) {
  const value = key => esc(typeof values[key] === 'string' ? values[key] : '');`);
s=s.replace('${sent ? `<p class="pill" style="margin-bottom:12px">✓ Received. We’ll get back to you.</p>` : \'\'}','${error ? `<p class="contact-error" role="alert">${esc(error)}</p>` : \'\'}<div class="contact-honey" aria-hidden="true"><label for="contact-website">Leave this field empty</label><input id="contact-website" name="website" tabindex="-1" autocomplete="off"></div>');
s=s.replace('<option value="" disabled selected>Choose one</option><option>Help with my print order</option><option>School / college delivery</option><option>Need a custom solution</option><option>Onboard my Xerox shop</option><option>Home / office delivery</option><option>Just saying hello</option>', '<option value="" disabled ${!values.model?\'selected\':\'\'}>Choose one</option>${CONTACT_TOPICS.map(topic=>`<option ${values.model===topic?\'selected\':\'\'}>${esc(topic)}</option>`).join(\'\')}');
s=s.replace('id="field-name" name="name" required','id="field-name" name="name" autocomplete="name" maxlength="100" value="${value(\'name\')}" required');
s=s.replace('id="field-phone" name="phone" type="tel" autocomplete="tel" required','id="field-phone" name="phone" type="tel" autocomplete="tel" maxlength="24" value="${value(\'phone\')}" required');
s=s.replace('id="field-email" name="email" type="email" required','id="field-email" name="email" type="email" autocomplete="email" maxlength="254" value="${value(\'email\')}" required');
s=s.replace('name="message" rows="4"></textarea>','name="message" rows="4" maxlength="4000" required>${value(\'message\')}</textarea><p class="field-hint">We use these details to answer your enquiry. <a href="/privacy">Read our privacy policy</a>.</p>');
s=s.replace('export const POSTS = [',`export function contactThankYouPage({ confirmed = false } = {}) {
  return shell({title:confirmed?'Enquiry received':'Contact confirmation',body:pageWrap(\`<section class="studio-message"><span class="studio-message-symbol" aria-hidden="true">\${icon(confirmed?'check':'envelope')}</span><p class="studio-kicker">\${confirmed?'MESSAGE RECEIVED':'YOUR PRINTKARR ENQUIRY'}</p><h1>\${confirmed?'Thanks for the note.':'Let’s get in touch.'}</h1><p>\${confirmed?'Your enquiry has been saved. Our team will use the contact details you shared to get back to you.':'Use our contact form to send an enquiry. If you have already sent one, our team will get back to you using the details you shared.'}</p><div class="hero-actions"><a class="btn loud" href="/order">Start a print \${icon('arrow-up-right')}</a><a class="btn ghost" href="/">Back to Home</a></div><a class="studio-link" href="/contact">\${confirmed?'Need urgent order help?':'Send an enquiry'} →</a>\${confirmed?'<span hidden data-contact-confirmed></span>':''}</section>\`)});
}
export function notFoundPage() {
  return shell({title:'Page not found',body:pageWrap(\`<section class="studio-message"><div class="studio-404" aria-hidden="true">4<span>0</span>4</div><p class="studio-kicker">A PAGE OUT OF PLACE</p><h1>Page not found.</h1><p>The link may have changed, or this page no longer exists. Your next great print is still right here.</p><div class="hero-actions"><a class="btn loud" href="/">Back to Home \${icon('arrow-up-right')}</a><a class="btn ghost" href="/order">Start a print</a></div><a class="studio-link" href="/contact">Get help with an order →</a></section>\`)});
}

export const POSTS = [`);
s=s.replace('Hardware failures and order issues should be reported to support for review and the appropriate refund process.', 'Where available, use the cancellation action in your account before printing or dispatch. Wallet-paid purchases can be cancelled at the eligible order stage and refunded to the wallet; cash orders can be cancelled before printing where shown. For online payment refunds, hardware failures, incorrect prints or delivery issues, contact support with the order number so the team can check eligibility and the appropriate refund process. Refund timing depends on the payment provider; do not assume a refund has completed until confirmed.');
s=s.replace('<h2 id="section-3">Your requests</h2>', '<h2>Cookies and optional analytics</h2><p>Essential cookies and browser storage support sign-in, your basket, order recovery, referral attribution and offer eligibility. These are needed for the relevant service features. If optional Google Analytics is enabled, we ask before loading it. With your permission, it measures page visits, successful enquiries and confirmed purchases. Document contents, filenames, contact details and delivery addresses are not included in our analytics events. Google may process analytics information on its infrastructure; see <a href="https://policies.google.com/privacy">Google’s privacy policy</a>.</p><p>You can reject optional analytics and still order. Use <button class="cookie-preferences" type="button" data-cookie-settings>Cookie preferences</button> to change or withdraw your choice. Your preference is stored in this browser; withdrawing stops future collection and removes accessible analytics cookies, but does not erase previously collected records.</p><h2 id="section-3">Your requests</h2>');
fs.writeFileSync('lib/views_public.js',s);
let server=read('server.mjs');server=server.replace('contactPage, blogsPage','contactPage, CONTACT_TOPICS, contactThankYouPage, notFoundPage, blogsPage');
const start=server.indexOf("app.get('/contact',"),end=server.indexOf("app.get('/blogs',",start);
server=server.slice(0,start)+`// Public enquiries: bounded fields, honeypot, origin check and per-IP throttling.
const contactLimiter = rateLimit({ windowMs: 15 * 60_000, max: 5, standardHeaders: 'draft-7', legacyHeaders: false,
  handler: (_req,res) => res.status(429).send(contactPage({error:'Too many enquiries. Please try again in 15 minutes, or call us for urgent order help.'})) });
app.get('/contact', (_req, res) => res.send(contactPage()));
app.get('/contact/thank-you', (req,res) => {
  const confirmed = parseCookies(req.headers.cookie).pk_contact_sent === '1';
  res.clearCookie('pk_contact_sent', {path:'/contact/thank-you'});
  res.set('Cache-Control','no-store').set('X-Robots-Tag','noindex,nofollow').send(contactThankYouPage({confirmed}));
});
app.post('/contact', contactLimiter, (req, res) => {
  const body = req.body || {}, values = {};
  const limits = {model:80,name:100,phone:24,email:254,message:4000};
  for (const [key,max] of Object.entries(limits)) values[key] = typeof body[key] === 'string' ? body[key].trim().slice(0,max) : '';
  if (body.website) return res.redirect(303,'/contact/thank-you');
  const origin = req.get('origin');
  if (origin && origin !== baseUrl(req)) return res.status(403).send(contactPage({error:'Please send this form from the PrintKarr website.',values}));
  const invalid = Object.entries(limits).some(([key,max]) => typeof body[key] !== 'string' || body[key].length > max) || !CONTACT_TOPICS.includes(values.model) || !values.name || !values.message || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(values.email) || !/^[+()\\d\\s-]+$/.test(values.phone) || !/^\\d{7,15}$/.test(values.phone.replace(/\\D/g,''));
  if (invalid) return res.status(400).send(contactPage({error:'Check your name, email, phone, enquiry type and message, then send again.',values}));
  try {
    const db = loadDb();
    db.leads = db.leads || [];
    db.leads.unshift({ at: new Date().toISOString(), ...values });
    saveDb(db);
  } catch {
    return res.status(503).send(contactPage({error:'Your enquiry could not be saved. Your details are below; please try again or call us.',values}));
  }
  res.cookie('pk_contact_sent','1',{httpOnly:true,sameSite:'lax',secure:req.secure,maxAge:120000,path:'/contact/thank-you'});
  res.redirect(303,'/contact/thank-you');
});
`+server.slice(end);
server=server.replace(".send('<!doctype html><html lang=\"en\"><title>Page not found — PrintKarr</title><main><h1>Page not found</h1><a href=\"/\">Go to PrintKarr</a></main></html>')",'.send(notFoundPage())');
server=server.replace("'/admin', '/customer', '/order',", "'/admin', '/customer', '/partner', '/rider', '/cart', '/order',");
fs.writeFileSync('server.mjs',server);
