import fs from 'node:fs';
const s=fs.readFileSync('public/studio.css','utf8');console.log(s.split('}').filter(x=>x.includes('article-toc')||x.includes('guide-breadcrumb')||x.includes('guide>h1')||x.includes('guide>p:')).join('}\n'));
console.log(fs.readFileSync('scripts/store-preview.mjs','utf8').split('\n').slice(0,28).join('\n'));
