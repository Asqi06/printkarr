import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { readFileSync } from 'node:fs';
import { blankDb } from './db.js';
import { saveReview, deleteReview, publicReviews } from './reviews.js';
import { uploadScript } from './views.js';
import { landing } from './views_public.js';
import { profilePage } from './views_order.js';
import { SITE } from './seo.js';

test('reviews validate, update one per customer, preserve words, and enforce deletion ownership', () => {
  const db = blankDb(), user = { id:'one', role:'customer', name:'Ananya Shah', email:'private@example.com' };
  db.users.push(user, {id:'two', role:'customer', name:'Ravi'});
  assert.throws(() => saveReview(db, {role:'admin'}, {rating:5,text:'A lovely print.'}), /customer/);
  for (const rating of [0, 6, 1.5, '', 'bad']) assert.throws(() => saveReview(db,user,{rating,text:'A lovely print.'}), /rating/);
  for (const text of ['short', 'a'.repeat(1001)]) assert.throws(() => saveReview(db,user,{rating:5,text}), /characters/);
  const review = saveReview(db,user,{rating:'4',text:'  Clear prints & helpful service.  ',customerId:'two'});
  assert.equal(review.customerId,user.id);
  assert.equal(review.text,'Clear prints & helpful service.');
  saveReview(db,user,{rating:3,text:'Revised feedback, in my own words.'});
  assert.equal(db.reviews.length,1);
  assert.equal(db.reviews[0].id,review.id);
  assert.equal(db.reviews[0].rating,3);
  assert.equal(publicReviews(db)[0].verified,false);
  db.orders.push({customerId:'one',status:'DELIVERED'});
  const publicReview = publicReviews(db)[0];
  assert.equal(publicReview.verified,true);
  assert.equal(publicReview.name,'Ananya S.');
  assert.equal(publicReview.canDelete,false);
  assert.equal(publicReviews(db,user)[0].canDelete,true);
  assert.equal(publicReviews(db,{id:user.id,role:'rider'})[0].canDelete,false);
  assert.equal(publicReviews(db,{role:'admin'})[0].canDelete,true);
  assert.ok(!JSON.stringify(publicReview).includes(user.email));
  for (const actor of [null,db.users[1],{role:'rider'}, {id:'one',role:'rider'}]) assert.throws(() => deleteReview(db,actor,review.id), /own review/);
  assert.equal(db.reviews.length,1);
  assert.equal(deleteReview(db,user,review.id),true);
  assert.equal(publicReviews(db).length,0);
  const second = saveReview(db,db.users[1],{rating:2,text:'Delivery could be faster.'});
  assert.equal(deleteReview(db,{role:'admin'},second.id),true);
  assert.equal(deleteReview(db,user,'missing'),false);
});

test('public cards escape customer text, include low ratings, and show controls only to authorized viewers', () => {
  const db = blankDb(), user = {id:'one',role:'customer',name:'<script>evil</script>'};
  db.users.push(user);
  saveReview(db,user,{rating:1,text:'<script>alert(1)</script> ' + 'Long feedback. '.repeat(40)});
  const html = landing({pricing:db.pricing,reviews:publicReviews(db)});
  assert.match(html,/1\.0/);
  assert.match(html,/Read full review/);
  assert.match(html,/&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html,/<script>alert|Delete review|Printed with us/);
  assert.match(landing({pricing:db.pricing,reviews:publicReviews(db,user)}),/Delete review/);
  assert.match(landing({pricing:db.pricing}),/No customer notes yet/);
  const profile = profilePage(user,[],[],{review:db.reviews[0],reviewSaved:true});
  assert.match(profile,/action="\/customer\/review"/);
  assert.match(profile,/value="1" checked required/);
  assert.match(profile,/Your review is saved/);
});

test('review routes reject cross-site writes and unauthorized deletions without saving', () => {
  const source = readFileSync(new URL('../server.mjs',import.meta.url),'utf8'), routes = new Map();
  const db = blankDb(), user = {id:'one',role:'customer',name:'Ani'};
  db.users.push(user);
  let actor = user, saves = 0;
  const scope = {app:{post:(path,...handlers)=>routes.set(path,handlers)}, requireRole:()=> (req,res,next)=>{req.user=actor;next();}, currentUser:()=>actor, loadDb:()=>db, saveDb:()=>saves++, saveReview, deleteReview, profilePage:()=> 'Invalid review', SITE, URL};
  runInNewContext(source.slice(source.indexOf('// Reviews are public'),source.indexOf("app.post('/customer/profile'")),scope);
  const res = () => ({statusCode:200,status(code){this.statusCode=code;return this;},send(text){this.body=text;},redirect(url){this.location=url;}});
  function invoke(path,body={},headers={},params={}) {
    const response=res(), req={body,params,protocol:'https',get:key=>headers[key] ?? (key==='host'?'printkarr.in':undefined)};
    const handlers=routes.get(path);let index=0; const next=()=>handlers[index++]?.(req,response,next);next();return response;
  }
  assert.equal(invoke('/customer/review',{rating:5,text:'Excellent print quality.'},{origin:'https://evil.example'}).statusCode,403);
  assert.equal(saves,0);
  // Render redirects www POSTs with 307; browsers then send Origin: null.
  const www = new URL(SITE); www.hostname = www.hostname.startsWith('www.') ? www.hostname.slice(4) : 'www.' + www.hostname;
  for (const headers of [
    {origin:www.origin,'sec-fetch-site':'same-site'},
    {origin:'null',referer:www.origin+'/customer/profile','sec-fetch-site':'same-site'},
    {origin:SITE,host:'internal-app:3000','sec-fetch-site':'same-origin'}
  ]) {
    assert.equal(invoke('/customer/review',{rating:5,text:'Excellent print quality.'},headers).location,'/customer/profile?review=saved#review');
    assert.equal(db.reviews.length,1);
  }
  for (const headers of [
    {origin:'null'},
    {origin:'null',referer:'not a URL'},
    {origin:'null',referer:'https://printkarr.in.evil.example/customer/profile'},
    {origin:'https://untrusted.printkarr.in','sec-fetch-site':'same-site'},
    {origin:'https://evil.example',referer:www.origin+'/customer/profile'},
    {origin:SITE,'sec-fetch-site':'cross-site'}
  ]) assert.equal(invoke('/customer/review',{rating:5,text:'Excellent print quality.'},headers).statusCode,403);
  assert.equal(saves,3);
  saves=0;
  assert.equal(invoke('/customer/review',{rating:5,text:'Excellent print quality.'},{origin:'https://printkarr.in'}).location,'/customer/profile?review=saved#review');
  assert.equal(saves,1);
  const id=db.reviews[0].id;
  actor=null;assert.equal(invoke('/reviews/:id/delete',{}, {},{id}).statusCode,401);
  actor={id:'two',role:'customer'};assert.equal(invoke('/reviews/:id/delete',{}, {},{id}).statusCode,403);
  assert.equal(saves,1);
  actor={role:'admin'};assert.equal(invoke('/reviews/:id/delete',{}, {origin:'null',referer:www.origin+'/','sec-fetch-site':'same-site'},{id}).location,'/#reviews');
  assert.equal(saves,2);
});

test('both review form pages send an origin-only referrer for redirected submissions', () => {
  const source = readFileSync(new URL('../server.mjs',import.meta.url),'utf8'), routes = new Map();
  const db = blankDb(), user = {id:'one',role:'customer',name:'Ani'}; db.users.push(user);
  const scope = {app:{get:(path,...handlers)=>routes.set(path,handlers.at(-1))}, requireRole:()=>{}, currentUser:()=>user, loadDb:()=>db, profilePage, landing, publicReviews, campaignConfig:()=>db.settings.campaign, gatewayOn:()=>false, livePayFor:()=>false, eligibleWalletOffers:()=>[]};
  runInNewContext(source.slice(source.indexOf("app.get('/customer/profile'"),source.indexOf('// Reviews are public')),scope);
  runInNewContext(source.slice(source.indexOf("app.get('/', (req, res)"),source.indexOf('// Marketing pages')),scope);
  for (const route of ['/customer/profile','/']) {
    // Mirror Helmet's production default: a missing override breaks www POST redirects.
    const headers={'Referrer-Policy':'no-referrer'}, res={set(name,value){headers[name]=value;return this;},send(html){this.html=html;}};
    routes.get(route)({user,query:{},headers:{}},res);
    assert.equal(headers['Referrer-Policy'],'strict-origin',route);
    assert.equal(headers['Cache-Control'],route==='/'?'private, no-store':undefined);
  }
});

test('upload responds before deferred scripts, validates before auto-submit, blocks duplicates and restores on Back', () => {
  for (const auto of [true,false]) {
    const listeners={}, events={}, status={setAttribute(){}}, label={textContent:'See price'}, button={disabled:false,querySelector:()=>label};
    let submissions=0, timer;
    const form={dataset:{maxMb:'20'},querySelector:()=>button,addEventListener:(name,fn)=>events[name]=fn,setAttribute(name,value){this[name]=value;},removeAttribute(name){delete this[name];},requestSubmit(){if(input.validity)return;const e={preventDefault(){this.prevented=true;}};events.submit(e);if(!e.prevented)submissions++;}};
    const input={form,files:[],addEventListener:(name,fn)=>listeners[name]=fn,setCustomValidity(value){this.validity=value;},reportValidity(){this.reported=true;}};
    const scope={document:{getElementById:id=>id==='doc'?input:status},window:{addEventListener:(name,fn)=>listeners[name]=fn},setTimeout:fn=>{timer=fn;return 1;},clearTimeout(){timer=null;}};
    runInNewContext(uploadScript(auto).replace(/^<script>|<\/script>$/g,''),scope);
    input.files=[{name:'large.pdf',size:21*1024*1024}];listeners.change();
    assert.equal(submissions,0);assert.equal(input.reported,true);assert.equal(button.disabled,false);
    input.files=[{name:'assignment.pdf',size:1000}];listeners.change();
    if(!auto)form.requestSubmit();
    assert.equal(submissions,1);assert.equal(button.disabled,true);assert.equal(form['aria-busy'],'true');
    assert.match(label.textContent,/Uploading/);assert.match(status.textContent,/uploading/);
    // Completing page load must not reset an upload that started early.
    listeners.pageshow({persisted:false});form.requestSubmit();assert.equal(submissions,1);
    timer();assert.match(status.textContent,/Still processing/);
    listeners.pageshow({persisted:true});assert.equal(button.disabled,false);assert.equal(label.textContent,'See price');
    form.requestSubmit();assert.equal(submissions,2);
  }
});
