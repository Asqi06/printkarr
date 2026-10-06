import { writeFileSync } from 'node:fs';
const results=[];
for (const path of ['/', '/robots.txt', '/sitemap.xml', '/llms.txt', '/printing-in-vapi']) {
  try {
    const response=await fetch('https://printkarr.in'+path), text=await response.text();
    results.push({path,status:response.status,url:response.url,title:text.match(/<title>(.*?)<\/title>/)?.[1],canonical:text.match(/rel="canonical" href="([^"]+)/)?.[1],content:path==='/'||path==='/printing-in-vapi'?undefined:text});
  } catch(error) { results.push({path,error:error.message}); }
}
writeFileSync(new URL('./public-evidence.json',import.meta.url),JSON.stringify({checkedAt:new Date().toISOString(),results},null,2));
console.log(results.map(({content,...summary})=>summary));
