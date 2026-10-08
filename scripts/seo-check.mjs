import assert from 'node:assert/strict';
import express from 'express';
import { PAGES, SITE, discoveryRoutes } from '../lib/seo.js';
import { POSTS, printPricesPage } from '../lib/views_public.js';
import { blankDb } from '../lib/db.js';
import { pages } from './design-check.mjs';
import { existsSync, readFileSync } from 'node:fs';
import { get as httpGet } from 'node:http';
import {runInNewContext} from 'node:vm';

const serverSource=readFileSync(new URL('../server.mjs',import.meta.url),'utf8').replaceAll('\r\n','\n');
const origin=runInNewContext(serverSource.match(/function baseUrl\(req\) \{[^]*?\n\}/)[0]+'\n'+serverSource.match(/function googleRedirectUri\(req\) \{[^]*?\n\}/)[0]+'\n({baseUrl,googleRedirectUri});',{SITE,URL});
for(const hostname of ['printkarr.onrender.com','printkarr.in','www.printkarr.in']){const req={hostname,protocol:'https',get:()=> 'printkarr.onrender.com'};assert.equal(origin.baseUrl(req),SITE);assert.equal(origin.googleRedirectUri(req),SITE+'/auth/google/callback');}
assert.equal(origin.baseUrl({hostname:'localhost',protocol:'http',get:()=> 'localhost:3000'}),'http://localhost:3000');
const app = express();
discoveryRoutes(app, POSTS);
const server = app.listen(0, '127.0.0.1');
await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
try {
  const base = `http://127.0.0.1:${server.address().port}`;
  const get = async path => {
    const response = await fetch(base + path);
    assert.equal(response.status, 200, path);
    return response.text();
  };
  const sitemap = await get('/sitemap.xml');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  assert.deepEqual(urls, [...Object.keys(PAGES), ...POSTS.map(post => '/blogs/' + post.slug)].map(path => SITE + path));
  assert.doesNotMatch(sitemap, /\/customer|\/order|\/admin/);
  assert.match(await get('/robots.txt'), new RegExp(`Sitemap: ${SITE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/sitemap\\.xml`));
  assert.match(await get('/robots.txt'), /Allow: \/admin\/login\n/);
  assert.doesNotMatch(await get('/robots.txt'), /Disallow: \/login/);
  assert.match(await get('/llms.txt'), /Kiosks are in development/);
  for (const path of [...Object.keys(PAGES), ...POSTS.map(p => '/blogs/' + p.slug)]) {
    const html = pages.get(path);
    assert.ok(html, path + ' public page is rendered');
    assert.match(html, new RegExp(`<link rel="canonical" href="${SITE + path}"`));
    const json = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1];
    assert.ok(json, path + ' structured data');
    const data = JSON.parse(json);
    assert.equal(data['@graph'].find(node => node['@id'] === SITE + path + '#page')?.url, SITE + path);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, path + ' one main heading');
    assert.match(html, /name="robots" content="index,follow/);
    assert.doesNotMatch(html, /24\/7 (?:print )?delivery|delivered 24\/7|files are encrypted|Jobs are encrypted|deleted after printing/i, path + ' factual delivery and file-handling claims');
    assert.doesNotMatch(JSON.stringify(data), /AggregateRating|LocalBusiness|streetAddress|FAQPage|HowTo/, path + ' no invented local-business or review signals');
    for (const match of html.matchAll(/<(?:img|script|link)\b[^>]*(?:src|href)="(\/[^"?]+)(?:\?[^" ]*)?"[^>]*>/g)) {
      assert.ok(existsSync(new URL('../public' + match[1], import.meta.url)), path + ' asset exists: ' + match[1]);
    }
    if (path !== '/') assert.ok(pages.get('/').includes(`href="${path.startsWith('/blogs/') ? '/blogs' : path}"`), path + ' linked from home or journal');
    if (path.startsWith('/blogs/')) {
      const post = POSTS.find(p => path.endsWith('/' + p.slug));
      const article = data['@graph'].find(n => n['@type'] === 'BlogPosting');
      assert.equal(article.dateModified, post.modified);
      assert.equal(article.datePublished, undefined, 'Do not invent historical publication dates');
      assert.equal(post.headings.length, post.body.length);
      assert.match(html, new RegExp(`<time datetime="${post.modified}">`));
      assert.equal(data['@graph'].find(n => n['@type'] === 'BreadcrumbList').itemListElement.length, 3);
    }
  }
  assert.equal([...sitemap.matchAll(/<lastmod>/g)].length, POSTS.length, 'Sitemap dates track actual article revisions');
  assert.match(printPricesPage({ pricing:{...blankDb().pricing, bw:7, color:11, studentBw:6} }), /Black & white<\/h2><strong>₹7<\/strong>[\s\S]*Colour<\/h2><strong>₹11<\/strong>[\s\S]*Student B&W<\/h2><strong>₹6<\/strong>/, 'Public prices use actual configured rates');
  for (const [path, target] of [['/PRINTING-IN-VAPI/?utm_source=check','/printing-in-vapi?utm_source=check'], ['/printing-in-daman/','/printing-in-daman'], ['/index.html','/']]) {
    const response = await fetch(base + path, { redirect:'manual' });
    assert.equal(response.status, 301, path); assert.equal(response.headers.get('location'), target);
  }
  const withHost = (host,route='/about?source=check') => new Promise((resolve,reject) => {
    httpGet(base + route, { headers:{host} }, res => { res.resume(); resolve({status:res.statusCode,location:res.headers.location}); }).on('error',reject);
  });
  const hostRedirect = await withHost('www.' + new URL(SITE).host);
  assert.equal(hostRedirect.status,301); assert.equal(hostRedirect.location,SITE + '/about?source=check');
  assert.equal((await withHost('unrelated.example')).status,404, 'No host-header-driven external redirect');
  for(const route of ['/order?draft=demo','/customer/purchases/demo','/auth/google']){const redirect=await withHost('printkarr.onrender.com',route);assert.equal(redirect.status,302);assert.equal(redirect.location,SITE+route);}
  assert.equal((await withHost('printkarr.onrender.com','/api/agent/next')).status,404,'Agent authorization is not redirected across origins');
  assert.match(readFileSync(new URL('../server.mjs',import.meta.url),'utf8'),/referrerPolicy: \{ policy: 'strict-origin-when-cross-origin' \}/,'Checkout can identify its registered origin');
  assert.equal((await fetch(base + '/PRINTING-IN-VAPI/', { method:'POST', redirect:'manual' })).status,404, 'Do not redirect order/form POSTs');
  for (const path of ['/login','/admin/login','/customer','/customer/wallet','/order']) assert.match(pages.get(path), /name="robots" content="noindex,nofollow"/, path + ' private pages excluded');
  for (const html of pages.values()) assert.doesNotMatch(html, /kiosk-3d|three-0/, 'Kiosk stays an image on all pages');
  console.log(`${urls.length} sitemap URLs and public metadata checked.`);
} finally {
  server.close();
}
