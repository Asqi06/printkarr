import assert from 'node:assert/strict';
import express from 'express';
import { PAGES, SITE, discoveryRoutes } from '../lib/seo.js';
import { POSTS, vapiPage, blogArticlePage, landing } from '../lib/views_public.js';
import { blankDb } from '../lib/db.js';

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
  assert.match(await get('/llms.txt'), /Kiosks are planned in Vapi/);
  for (const [path, html] of [['/', landing({ pricing: blankDb().pricing })], ['/printing-in-vapi', vapiPage()], ...POSTS.map(p => ['/blogs/' + p.slug, blogArticlePage(p.slug)])]) {
    assert.match(html, new RegExp(`<link rel="canonical" href="${SITE + path}"`));
    const json = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1];
    assert.ok(json, path + ' structured data');
    const data = JSON.parse(json);
    assert.equal(data['@graph'].find(node => node['@id'] === SITE + path + '#page')?.url, SITE + path);
  }
  console.log(`${urls.length} sitemap URLs and public metadata checked.`);
} finally {
  server.close();
}
