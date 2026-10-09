import fs from 'node:fs';
for(const file of ['lib/views_admin.js','lib/views_order.js','lib/views_packs.js','lib/views_referrals.js','lib/views_store.js','lib/views_public.js']){
const s=fs.readFileSync(file,'utf8');const parts=[...s.matchAll(/export function (\w+)\([^]*?(?=\nexport function |$)/g)];console.log(file);for(const p of parts)console.log(p[1], [...new Set([...p[0].matchAll(/class="([^"$]+)"/g)].map(m=>m[1]))].slice(0,23).join(' | '));}
