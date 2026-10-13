import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { sameOrigin, redisRateStore, asyncHandler } from './security.js';
import { capturedPayment, assertUnusedPayment, validSignature } from './payments.js';
import { parseCookies, demoLoginOn, hashPassword, passwordMatches } from './auth.js';
import { requestEmailOtp } from './otp.js';

test('production rejects demo auth, missing email transport and malformed cookies safely', async () => {
  const previous={...process.env};
  try {
    process.env.NODE_ENV='production';process.env.DEMO_LOGIN='on';
    for(const key of ['RESEND_API_KEY','SMTP_USER','SMTP_PASS','GOOGLE_REFRESH_TOKEN'])process.env[key]='';
    assert.equal(demoLoginOn(),false);
    const result=await requestEmailOtp('customer@example.test');assert.equal(result.ok,false);assert.equal(result.demo,undefined);
    assert.equal(parseCookies('broken=%E0%A4%A; pk_demo=valid').pk_demo,'valid');
    assert.equal(Object.getPrototypeOf(parseCookies('__proto__=bad')),null);
    const hash=hashPassword('a sufficiently long password');assert.equal(passwordMatches('a sufficiently long password',hash),true);assert.equal(passwordMatches('wrong',hash),false);
  } finally { process.env=previous; }
});

test('all browser POSTs require a trusted origin even when Host is forged', () => {
  const previous=process.env.NODE_ENV;process.env.NODE_ENV='production';
  const invoke=headers=>{let passed=false,status=200;const req={protocol:'https',get:key=>headers[key]};sameOrigin(req,{status(n){status=n;return this;},send(){}},()=>passed=true,'https://printkarr.in');return {passed,status};};
  try {
    assert.equal(invoke({host:'attacker.test',origin:'https://attacker.test'}).status,403);
    assert.equal(invoke({host:'printkarr.in','sec-fetch-site':'cross-site',origin:'https://printkarr.in'}).status,403);
    assert.equal(invoke({host:'printkarr.in'}).status,403);
    assert.equal(invoke({host:'printkarr.in',origin:'https://www.printkarr.in'}).passed,true);
    assert.equal(invoke({origin:'null',referer:'https://printkarr.in/customer/wallet'}).passed,true);
  } finally {if(previous===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=previous;}
});

test('gateway rejects missing signature, another order, wrong amount/currency and uncaptured money', async () => {
  const gateway={id:'test',secret:'secret'},orderId='order_123',paymentId='pay_123';
  const signature=crypto.createHmac('sha256',gateway.secret).update(orderId+'|'+paymentId).digest('hex');
  const base={id:paymentId,order_id:orderId,amount:9900,currency:'INR',status:'captured'};
  const reply=payment=>async()=>new Response(JSON.stringify(payment),{status:200});
  await assert.rejects(capturedPayment(gateway,orderId,paymentId,99,undefined,reply(base)),/signature/);
  for(const patch of [{order_id:'order_other'},{amount:1},{currency:'USD'},{id:'pay_other'},{status:'failed'}])await assert.rejects(capturedPayment(gateway,orderId,paymentId,99,signature,reply({...base,...patch})));
  assert.deepEqual(await capturedPayment(gateway,orderId,paymentId,99,signature,reply(base)),base);
  let calls=0;
  await capturedPayment(gateway,orderId,paymentId,99,signature,async(_url,options)=>{
    calls++;assert.ok(options.signal);
    return new Response(JSON.stringify({...base,status:calls===1?'authorized':'captured'}),{status:calls===2?400:200});
  });assert.equal(calls,3,'Capture race re-reads the authoritative provider state');
  assert.equal(validSignature('secret',Buffer.from('payload'),'bad'),false);
  const db={orders:[],purchases:[],walletTx:[{paymentId}],topups:[]};assert.throws(()=>assertUnusedPayment(db,paymentId,'other'),/another checkout/);
});

test('Redis uses an atomic expiring counter, rejects errors and async route errors reach Express', async () => {
  const previous={...process.env};
  try {
    process.env.UPSTASH_REDIS_REST_URL='https://redis.example.test';process.env.UPSTASH_REDIS_REST_TOKEN='test';
    let command;const store=redisRateStore('test',async(_url,options)=>{command=JSON.parse(options.body);return new Response(JSON.stringify({result:[2,900]}));});
    store.init({windowMs:1000});const hit=await store.increment('ip');assert.equal(hit.totalHits,2);assert.equal(command[0],'EVAL');assert.match(command[1],/PEXPIRE/);
    const failed=redisRateStore('test',async()=>new Response(JSON.stringify({error:'unavailable'}),{status:503}));failed.init({windowMs:1000});await assert.rejects(failed.increment('ip'));
    let error;await asyncHandler(async()=>{throw new Error('caught');})({}, {}, e=>error=e);assert.equal(error.message,'caught');
  } finally {process.env=previous;}
});
