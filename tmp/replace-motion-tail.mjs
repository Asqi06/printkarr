import fs from 'node:fs';const p='public/cinema-scene.js';let s=fs.readFileSync(p,'utf8');s=s.slice(0,s.indexOf(' const pose='));fs.writeFileSync(p,s);
