import fs from 'node:fs';
let p='lib/views_public.js',s=fs.readFileSync(p,'utf8');
const start=s.indexOf('<details class="article-toc">',s.indexOf('export function printPricesPage'));
const end=s.indexOf('</details>',start)+10;
s=s.slice(0,start)+s.slice(end);s=s.replace('<h2 id="section-1">${label}</h2>','<h2>${label}</h2>');fs.writeFileSync(p,s);
p='public/studio.css';s=fs.readFileSync(p,'utf8').replaceAll('.service-guide>p:first-of-type','.service-guide>p:first-of-type:not(.eyebrow)');
s+='\n.app-view .wallet-balance .muted,.app-view .card.ink .muted{color:#dde5ff!important}\n';fs.writeFileSync(p,s);
p='package.json';const pkg=JSON.parse(fs.readFileSync(p,'utf8'));pkg.scripts['test:pages']='node scripts/site-coverage-check.mjs';pkg.scripts['preview:pages']='node scripts/site-coverage-check.mjs --serve';fs.writeFileSync(p,JSON.stringify(pkg,null,2)+'\n');
