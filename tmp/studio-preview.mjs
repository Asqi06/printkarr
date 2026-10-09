import {createOrderPreview} from '../scripts/order-preview.mjs';
import {notFoundPage,POSTS} from '../lib/views_public.js';
import {discoveryRoutes} from '../lib/seo.js';
const {app}=createOrderPreview();discoveryRoutes(app,POSTS);app.use((_req,res)=>res.status(404).send(notFoundPage()));app.listen(3137,'127.0.0.1',()=>console.log('Paper Studio local preview: http://127.0.0.1:3137 — in-memory demo, no real payments, emails or printer.'));
