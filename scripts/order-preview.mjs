import { rateLimit } from 'express-rate-limit';
// Runs actual ordering and cart handlers against temporary files/in-memory data.
// Email verification is a labelled local simulation; payments and printers are disconnected.
import fs from 'node:fs';
import path from 'node:path';
import {tmpdir} from 'node:os';
import crypto from 'node:crypto';
import multer from 'multer';
import { runInNewContext } from 'node:vm';
import { createStorePreview, previewDb, couponPolicy } from './store-preview.mjs';
import { COOKIE, parseCookies } from '../lib/auth.js';
import { esc } from '../lib/views.js';
import * as print from '../public/print-plan.js';
import * as pricing from '../lib/pricing.js';
import * as printPricingPolicy from '../public/print-pricing.js';
import { LOCALITIES, distanceFee } from '../public/localities.js';
import * as campaign from '../lib/campus.js';
import * as packs from '../lib/packs.js';
import * as referrals from '../lib/referrals.js';
import * as files from '../lib/files.js';
import * as account from '../lib/views_order.js';
import * as publicViews from '../lib/views_public.js';
import * as adminViews from '../lib/views_admin.js';
import * as packViews from '../lib/views_packs.js';
import * as referralViews from '../lib/views_referrals.js';
import { installNotificationRoutes } from '../lib/notify_routes.js';
import { saveReview } from '../lib/reviews.js';
const {adminOrderDetail} = adminViews;
import { orderDetail, customerDashboard, ordersList } from '../lib/views_customer.js';
import { buildOrderCover } from '../agent/cover.js';
import { transition, nextStates, canTransition, canFulfil } from '../lib/machine.js';
import { fulfillmentFor } from '../lib/partners.js';
import { installPartnerRoutes } from '../lib/partner_routes.js';
import { firstOffers } from '../lib/offers.js';
import { normEmail, normPhone } from '../lib/otp.js';
import { addPrint, cartFor, cartItems, cartQuote, createPurchase, printNet, checkPackQuota } from '../lib/store.js';
import { canUseOwnerTestPrint } from '../lib/owner-test.js';
const source = fs.readFileSync(new URL('../server.mjs', import.meta.url), 'utf8').replaceAll('\r\n','\n');
const body = (method, route) => { const start = source.indexOf(`app.${method}('${route}'`), end = source.indexOf('\n});',start)+4; if (start < 0) throw new Error(route); return source.slice(start,end); };

export function createOrderPreview(seed = previewDb()) {
  const uploadsDir=path.join(fs.mkdtempSync(path.join(tmpdir(),'printkarr-order-preview-')),'data','uploads');fs.mkdirSync(uploadsDir,{recursive:true});
  return createStorePreview(seed, { uploadsDir,
    resolveUser(db, req) { const cookies = parseCookies(req.headers.cookie); if (cookies[COOKIE]) return db.users.find(u => u.id === cookies[COOKIE]) || null; const role = cookies.preview_role || 'customer'; return role === 'guest' ? null : db.users.find(u => u.role === role); },
    installPrintRoutes({ app, loadDb, saveDb, currentUser, requireRole, uploadsDir }) {
      installPartnerRoutes(app, {loadDb, saveDb, requireRole, siteOrigin:(_req,_res,next)=>next(), uploadsDir, notifyState(){}, qualifyForOrder(){}});
      app.get('/shops',(_req,res)=>res.send(publicViews.nearbyShopsPage(loadDb().partners || [])));
      app.get('/kiosks',(_req,res)=>res.send(publicViews.kioskStatusPage()));
      const upload = runInNewContext(source.slice(source.indexOf('const upload = multer('),source.indexOf('function countPdfPages(')).replace("dest: 'data/uploads/'", 'dest: uploadsDir')+'\nupload;', {multer,uploadsDir});
      const disk = { ...fs, promises: { ...fs.promises, readFile: name => fs.promises.readFile(path.join(uploadsDir,path.basename(name))) }, readFileSync: name => fs.readFileSync(path.join(uploadsDir,path.basename(name))), renameSync:(from,to)=>fs.renameSync(path.join(uploadsDir,path.basename(from)),path.join(uploadsDir,path.basename(to))) };
      const scope = { ...print, ...pricing, ...printPricingPolicy, LOCALITIES, distanceFee, ...campaign, ...packs, ...referrals, ...files, ...account, ...publicViews, ...packViews, ...referralViews, app, loadDb, saveDb, currentUser, requireRole, upload, multer, Date, fs:disk, crypto, path, Buffer, URL, URLSearchParams, COOKIE,
        ROOT:path.resolve(uploadsDir,'../..'), baseUrl:req=>req.protocol+'://'+req.get('host'), rateLimit, parseCookies, normEmail, normPhone, esc, firstOffers, fulfillmentFor, addPrint, cartFor, cartItems, cartQuote, printNet, createPurchase:(db,cart,id,selection,validate)=>createPurchase(db,cart,id,selection,validate,true), gatewayOn:()=>false, checkPackQuota, canUseOwnerTestPrint, transition, canTransition, canFulfil, buildOrderCover, agentSeenAt:Date.now(),refundPaidOrder(){},finishPrintAtKiosk(db,o,by){o.printAwaitingVerification=false;transition(o,'PRINTED',{by});transition(o,'READY_FOR_PICKUP',{by});saveDb(db);},
        offerDevice(){}, otpLimiter:(_req,_res,next)=>next(),
        requestEmailOtp:async()=>({ok:true,mailed:false,demo:'000000',error:'LOCAL PREVIEW: no email is sent. Use the demo code.'}), verifyEmailOtp:(_email,code)=>({ok:code==='000000',error:'Use local demo code 000000.'}), createSession:id=>id,
        referralCodeFor:referrals.codeFor, validateCoupon:couponPolicy.validateCoupon, notifyState(){}, waForwardUrl:()=>null,
        ordersList, saveReview, siteOrigin:(_req,_res,next)=>next(), livePayFor:()=>false, referralConfig:referrals.getConfig, ACTIVE:o=>!['DELIVERED','REFUNDED','CANCELLED'].includes(o.status), safeOrderId:id=>/^PK-[A-Z0-9-]+$/.test(id||'')?id:null,
        oops:(user,back,message)=>`<p role="alert">${message}</p><a href="${esc(back)}">Go back</a>`, agentAuth:(_req,_res,next)=>next()
      };
      const pricingSource = fs.readFileSync(new URL('../lib/pricing.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replaceAll('export ','');
      scope.quote = runInNewContext(pricingSource+'\nquote;', scope);
      for (const name of ['maxUploadBytes','nextOrderId','zoneOf','guestToken','guestDraft','printQuoteExtras','purchaseForDraft','custOrders','referralStats']) runInNewContext(source.match(new RegExp('function '+name+'\\([^]*?\\n\\}'))[0],scope);
      for (const [method, route] of [['get','/order'],['post','/order/upload'],['post','/order/options'],['get','/order/phone'],['post','/order/otp-request'],['post','/order/otp-verify'],['get','/customer/orders/new'],['post','/customer/orders/new/upload'],['post','/customer/orders/new/confirm'],['get','/customer/orders/new/summary'],['post','/customer/orders/new/place'],['get','/customer/orders/:id'],['get','/customer/orders'],['get','/customer/wallet'],['post','/customer/wallet/add'],['post','/customer/wallet/files/:txId/claim'],['get','/customer/profile'],['post','/customer/profile'],['post','/customer/addresses/add'],['post','/customer/addresses/default'],['post','/customer/review'],['get','/customer/packs'],['post','/customer/packs/:id/subscribe'],['post','/customer/packs/:subId/pay'],['post','/customer/packs/:subId/files/claim'],['get','/customer/referrals']]) runInNewContext(body(method,route),scope);
      scope.siteOrigin = runInNewContext(source.match(/function siteOrigin\(req, res, next\) \{[^]*?\n\}/)[0]+'\nsiteOrigin;', {SITE:'https://printkarr.in',URL});
      runInNewContext(source.slice(source.indexOf('const contactLimiter ='),source.indexOf("app.get('/blogs',")),scope);
      installNotificationRoutes(app,{loadDb,saveDb,currentUser,requireRole,siteOrigin:(_req,_res,next)=>next()});
      for(const [route,view] of Object.entries({'/about':'aboutPage','/how-it-works':'howItWorksPage','/franchise':'franchisePage','/xerox':'xeroxPage','/blogs':'blogsPage','/terms':'termsPage','/privacy':'privacyPage','/printing-in-vapi':'vapiPage','/printing-in-daman':'damanPage'})) app.get(route,(_req,res)=>res.send(publicViews[view]()));
      app.get('/printing-prices',(_req,res)=>res.send(publicViews.printPricesPage({pricing:loadDb().pricing})));
      app.get('/blogs/:slug',(req,res)=>res.send(publicViews.blogArticlePage(req.params.slug)));
      app.get('/admin',requireRole('admin'),(req,res)=>res.send(adminViews.adminDashboard(req.user,{today:0,printing:0,ready:0,revenue:0,pages:0,delivered:0})));
      app.get('/admin/orders',requireRole('admin'),(req,res)=>res.send(adminViews.orderQueue(req.user,{filter:'all',q:'',rows:loadDb().orders.map(o=>({...o,cname:loadDb().users.find(u=>u.id===o.customerId)?.name}))})));
      app.get('/admin/print-queue',requireRole('admin'),(req,res)=>res.send(adminViews.printQueuePage(req.user,[],{name:'Local preview · printer disconnected',online:false,ink:0,paper:0})));
      app.get('/admin/customers',requireRole('admin'),(req,res)=>res.send(adminViews.customersPage(req.user,loadDb().users.filter(u=>u.role==='customer').map(u=>({...u,count:0,spent:0,wallet:campaign.walletOf(loadDb(),u.id).balance})))));
      app.get('/admin/pricing',requireRole('admin'),(req,res)=>res.send(adminViews.pricingPage(req.user,loadDb().pricing)));
      app.get('/admin/analytics',requireRole('admin'),(req,res)=>res.send(adminViews.analyticsPage(req.user,{salesToday:0,salesWeek:0,pages:0,bw:0,color:0,done:0,cancelled:0,live:0,total:loadDb().orders.length,repeat:0,customers:loadDb().users.filter(u=>u.role==='customer').length,avgHrs:0})));
      app.get('/admin/settings',requireRole('admin'),(req,res)=>res.send(adminViews.settingsPage(req.user,loadDb().settings,[])));
      app.get('/admin/coupons',requireRole('admin'),(req,res)=>res.send(adminViews.couponsPage(req.user,loadDb().coupons)));
      app.get('/admin/packs',requireRole('admin'),(req,res)=>res.send(packViews.adminPacksPage(req.user,{subs:loadDb().packSubs,users:loadDb().users})));
      app.get('/admin/referrals',requireRole('admin'),(req,res)=>res.send(referralViews.adminReferralsPage(req.user,{cfg:referrals.getConfig(loadDb()),referrals:loadDb().referrals,users:loadDb().users,payouts:loadDb().payouts})));
      // Same original bytes as production previews; restrict access to the draft/order owner.
      app.get('/order/:draft/preview',(req,res)=>{const d=scope.guestDraft(loadDb(),{headers:req.headers,query:{draft:req.params.draft}});if(!d)return res.sendStatus(404);res.type(files.mimeFor(d.fileExt)).sendFile(path.join(uploadsDir,path.basename(d.stored)));});
      app.get('/customer/orders/new/:draftId/preview.pdf',requireRole('customer'),(req,res)=>{const d=loadDb().drafts.find(d=>d.id===req.params.draftId&&d.customerId===req.user.id);if(!d)return res.sendStatus(404);res.type(files.mimeFor(d.fileExt)).sendFile(path.join(uploadsDir,path.basename(d.stored)));});
      app.get('/customer',requireRole('customer'),(req,res)=>{const db=loadDb();res.send(customerDashboard(req.user,{pricing:db.pricing,notes:db.notifications.filter(n=>n.customerId===req.user.id),current:db.orders.find(o=>o.customerId===req.user.id && !['DELIVERED','CANCELLED','REFUNDED'].includes(o.status)),packsHtml:packViews.packDashboardHtml(packs.mySubs(db,req.user.id)),walletBalance:campaign.walletOf(db,req.user.id).balance}));});
      app.get('/admin/orders/:id',requireRole('admin'),(req,res)=>{const db=loadDb(),o=db.orders.find(o=>o.id===req.params.id);if(!o)return res.sendStatus(404);res.send(adminOrderDetail(req.user,o,db.users.find(u=>u.id===o.customerId),db.addresses.find(a=>a.id===o.addressId)||{},nextStates(o.status),null,Date.now()));});
      runInNewContext(source.match(/async function sendSplitDraft\([^]*?\n\}/)[0],scope);
      runInNewContext(body('get','/customer/orders/new/:draftId/split/:part.pdf'),scope);
      runInNewContext(body('get','/order/:draft/split/:part.pdf'),scope);
      runInNewContext(body('post','/admin/orders/:id/transition'),scope);
      runInNewContext(body('get','/api/agent/file/:id'),scope);
      runInNewContext(body('get','/admin/orders/:id/file'),scope);
      runInNewContext(body('get','/api/agent/:id/progress'),scope);
      runInNewContext(body('post','/api/agent/:id/progress'),scope);
      runInNewContext(body('post','/api/agent/:id/failed'),scope);
      runInNewContext(source.slice(source.indexOf('app.use((err, req, res,'),source.indexOf('// ---- API ----')),scope);
      const agentSource = source.slice(source.indexOf('const agentJob ='),source.indexOf("app.get('/api/agent/file/:id'"));
      runInNewContext(agentSource,scope);
      runInNewContext(source.slice(source.indexOf('function agentStep('),source.indexOf("app.post('/api/agent/:id/done'")),scope);
      runInNewContext(body('post','/api/agent/:id/done'),scope);
    }
  });
}
if (process.argv[1]?.endsWith('order-preview.mjs')) createOrderPreview().app.listen(3133,'127.0.0.1',()=>console.log('Ordering preview: http://127.0.0.1:3133/order?fresh=1 (use /preview/role/guest for first-time customer). No real money, email or printer.'));
