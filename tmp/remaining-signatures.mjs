import fs from 'node:fs';
for(const f of ['lib/views_store.js','lib/views_public.js']){const s=fs.readFileSync(f,'utf8');for(const m of s.matchAll(/export function (cataloguePage|collectPage|storeError)\([^]*?\{/g))console.log(f,m[0]);}
