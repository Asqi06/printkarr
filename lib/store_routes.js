import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { analyzeUpload } from './files.js';
import { parseCookies } from './auth.js';
import { catalogue, cartFor, cartItems, setQuantity, addPrint, cartQuote, createPurchase, checkPurchase, confirmPurchase, cancelPurchase, collectCash, saveProduct, availableStock } from './store.js';
import { campaignConfig, walletOf } from './campus.js';
import { transition } from './machine.js';
import { shopPage, cartPage, purchasePage, purchasesPage, cataloguePage, storeError } from './views_store.js';

export function installStoreRoutes(app, { loadDb, saveDb, currentUser, requireRole, siteOrigin, validateCoupon, notifyState, restorePackQuota, voidPendingForOrder, qualifyForOrder, gateway, preview = false, fetchGateway = fetch, uploadsDir = path.resolve('data/uploads') }) {
  app.use(['/partner/catalogue', '/stationery', '/cart', '/customer/purchases', '/admin/catalogue', '/admin/purchases'], (_req, res, next) => {
    if (_req.path.startsWith('/partner')) res.set('X-Robots-Tag','noindex, nofollow');
    res.set('Referrer-Policy', 'strict-origin'); res.set('Cache-Control', 'private, no-store'); next();
  });
  const cartCookie = (req, res, cart) => res.cookie('pk_cart', cart.id, { httpOnly: true, sameSite: 'lax', secure: req.protocol === 'https', maxAge: 30 * 864e5 });
  function getCart(db, req, res) {
    const user = currentUser(req), cart = cartFor(db, user?.role === 'customer' ? user.id : null, parseCookies(req.headers.cookie).pk_cart);
    cartCookie(req, res, cart); return cart;
  }
  const fail = (res, req, error, back = '/cart') => req.get('accept')?.includes('application/json') ? res.status(400).json({ error: error.message }) : res.status(400).send(storeError(currentUser(req), error.message, back));
  const customerPurchase = (db, req) => (db.purchases || []).find((p) => p.id === req.params.id && p.customerId === req.user.id);
  const receiptUrl = (p) => `/customer/purchases/${p.id}`;
  const gatewayReady = () => !!(gateway.id && gateway.secret);
  const mutate = (fn, back) => (req, res) => {
    try { const db = loadDb(); fn(db, req, res); }
    catch (error) { fail(res, req, error, back); }
  };

  app.get('/stationery', (req, res) => {
    const db = loadDb(), user = currentUser(req), token = parseCookies(req.headers.cookie).pk_cart;
    const cart = (db.carts || []).find((c) => user?.role === 'customer' ? c.customerId === user.id : c.id === token && !c.customerId);
    const shop = req.query.shop && (db.partners || []).find(s=>s.id===req.query.shop && s.active && s.stationery);
    if (req.query.shop && !shop) return res.status(404).send(storeError(user,'This shop is not available for stationery.','/shops'));
    res.send(shopPage(catalogue(db).filter((p) => p.active && (shop ? p.shopId === shop.id : !p.shopId)).map((p) => ({ ...p, stock: availableStock(db, p.id) })), cart, req.query.added === '1', shop));
  });
  app.post('/cart/items', siteOrigin, mutate((db, req, res) => {
    const cart = getCart(db, req, res);
    setQuantity(db, cart, req.body.productId, req.body.color, req.body.quantity, req.body.add === '1');
    saveDb(db);
    if (req.get('accept')?.includes('application/json')) return res.json({ count: cart.lines.reduce((s, l) => s + l.quantity, 0) + cart.printIds.length });
    res.redirect(req.body.add === '1' ? '/stationery?added=1#catalogue' : '/cart');
  }));
  app.post('/cart/prints/:id', siteOrigin, requireRole('customer'), mutate((db, req, res) => {
    const cart = addPrint(db, req.user.id, req.params.id); cartCookie(req, res, cart); saveDb(db); res.redirect('/cart');
  }));
  app.post('/cart/remove', siteOrigin, mutate((db, req, res) => {
    const cart = getCart(db, req, res);
    if (cart.purchaseId) throw new Error('Cancel the current checkout before removing items.');
    if (req.body.printId) {
      const order = db.orders.find((o) => o.id === req.body.printId && o.customerId === cart.customerId && cart.printIds.includes(o.id));
      if (order && ['CREATED', 'PAYMENT_PENDING'].includes(order.status)) { transition(order, 'CANCELLED', { by: cart.customerId }); voidPendingForOrder(db, order.id); }
      cart.printIds = cart.printIds.filter((id) => id !== req.body.printId);
    }
    else cart.lines = cart.lines.filter((l) => !(l.productId === req.body.productId && l.color === String(req.body.color || '')));
    saveDb(db); res.redirect('/cart');
  }));
  app.get('/cart', (req, res) => {
    try {
      const db = loadDb(), user = currentUser(req), cart = getCart(db, req, res);
      if (!user) res.cookie('pk_next', '/cart', { httpOnly: true, sameSite: 'lax', secure: req.protocol === 'https', maxAge: 10 * 60_000 });
      if (cart.lines.length || cart.printIds.length || cart.purchaseId) saveDb(db);
      if (cart.purchaseId) return res.redirect(`/customer/purchases/${cart.purchaseId}`);
      let contents, quote, error;
      try { contents = cartItems(db, cart, user?.id); if (user?.role === 'customer' && (contents.items.length || contents.prints.length)) quote = cartQuote(db, cart, user.id, {}, validateCoupon); } catch (e) { error = e.message; }
      res.send(cartPage(user, db, cart, contents, quote, error));
    } catch (error) { fail(res, req, error); }
  });
  app.post('/cart/quote', siteOrigin, requireRole('customer'), mutate((db, req, res) => {
    const cart = getCart(db, req, res); saveDb(db);
    let quote, error;
    try { quote = cartQuote(db, cart, req.user.id, req.body, validateCoupon); } catch (e) { error = e.message; }
    res.status(error ? 400 : 200).send(cartPage(req.user, db, cart, cartItems(db, cart, req.user.id), quote, error, req.body));
  }));
  app.post('/cart/checkout', siteOrigin, requireRole('customer'), mutate((db, req, res) => {
    const cart = getCart(db, req, res), purchase = createPurchase(db, cart, req.user.id, req.body, validateCoupon, preview);
    saveDb(db); res.redirect(receiptUrl(purchase));
  }));
  app.get('/customer/purchases', requireRole('customer'), (req, res) => {
    res.send(purchasesPage(req.user, (loadDb().purchases || []).filter((p) => p.customerId === req.user.id)));
  });
  app.get('/customer/purchases/:id', requireRole('customer'), (req, res) => {
    const db = loadDb(), p = customerPurchase(db, req);
    if (!p) return res.sendStatus(404);
    res.send(purchasePage(req.user, p, db, { gateway: gatewayReady(), preview }));
  });
  app.post('/customer/purchases/:id/wallet', siteOrigin, requireRole('customer'), mutate((db, req, res) => {
    const p = customerPurchase(db, req); if (!p) return res.sendStatus(404);
    const changed = confirmPurchase(db, p, 'wallet', null, validateCoupon);
    saveDb(db);
    if (changed) for (const id of p.printIds) notifyState(db.orders.find((o) => o.id === id));
    res.redirect(receiptUrl(p));
  }));
  app.post('/customer/purchases/:id/cod', siteOrigin, requireRole('customer'), mutate((db,req,res)=>{
    const p=customerPurchase(db,req);if(!p)return res.sendStatus(404);
    if(req.body.confirmCash!=='1')throw new Error('Confirm the displayed cash total and ₹10 COD fee.');
    if(p.status==='CREATED' && req.body.expectedTotal!==undefined && Number(req.body.expectedTotal)!==p.total)throw new Error('The total changed. Review it before confirming cash payment.');
    const changed=confirmPurchase(db,p,'cod',null,validateCoupon);saveDb(db);
    if(changed)for(const id of p.printIds)notifyState(db.orders.find(o=>o.id===id));
    res.redirect(receiptUrl(p));
  }));
  app.post('/customer/purchases/:id/cancel', siteOrigin, requireRole('customer'), mutate((db, req, res) => {
    const p = customerPurchase(db, req); if (!p) return res.sendStatus(404);
    cancelPurchase(db, p, req.user.id, restorePackQuota, voidPendingForOrder); saveDb(db); res.redirect(receiptUrl(p));
  }));

  const gatewayHeaders = () => ({ 'Content-Type': 'application/json', Authorization: 'Basic ' + Buffer.from(`${gateway.id}:${gateway.secret}`).toString('base64') });
  app.post('/customer/purchases/:id/gateway', siteOrigin, requireRole('customer'), async (req, res) => {
    let purchaseId, ownsLock = false;
    try {
      if (!gatewayReady() || preview) return res.status(503).json({ error: 'Online payment is unavailable in this preview.' });
      let db = loadDb(), p = customerPurchase(db, req); purchaseId = p?.id;
      if (!p || p.status !== 'CREATED' || p.total <= 0 || p.items.some((i) => i.demo)) throw new Error('This checkout cannot be paid online.');
      checkPurchase(db, p, validateCoupon);
      if (p.gatewayOrderId) return res.json({ keyId: gateway.id, id: p.gatewayOrderId, amount: Math.round(p.total * 100) });
      if (p.gatewayCreating) throw new Error('Payment is opening. Please wait and retry.');
      p.gatewayCreating = true; saveDb(db); ownsLock = true;
      const response = await fetchGateway('https://api.razorpay.com/v1/orders', { method: 'POST', signal: AbortSignal.timeout(15000), headers: gatewayHeaders(), body: JSON.stringify({ amount: Math.round(p.total * 100), currency: 'INR', receipt: p.id.slice(0, 40), notes: { purchaseId: p.id, customerId: p.customerId } }) });
      const result = await response.json();
      if (!response.ok || !result.id || result.amount !== Math.round(p.total * 100) || result.currency !== 'INR') throw new Error('Payment provider refused this checkout.');
      db = loadDb(); p = customerPurchase(db, req);
      if (!p || p.status !== 'CREATED') throw new Error('Checkout was cancelled. No payment has been taken.');
      p.gatewayOrderId = result.id; p.gatewayCreating = false; saveDb(db);
      res.json({ keyId: gateway.id, id: result.id, amount: result.amount });
    } catch (error) {
      if (ownsLock && purchaseId) { const db = loadDb(), p = (db.purchases || []).find((p) => p.id === purchaseId); if (p) { p.gatewayCreating = false; saveDb(db); } }
      res.status(400).json({ error: error.message });
    }
  });
  app.post('/customer/purchases/:id/verify', siteOrigin, requireRole('customer'), async (req, res) => {
    try {
      if (!gatewayReady() || preview) throw new Error('Online payment is unavailable.');
      let db = loadDb(), p = customerPurchase(db, req);
      if (!p) return res.sendStatus(404);
      const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
      if (p.paymentStatus === 'paid' && p.paymentId === paymentId) return res.redirect(receiptUrl(p));
      if (p.status !== 'CREATED' || p.gatewayOrderId !== orderId || !paymentId || !/^[0-9a-f]{64}$/.test(signature || '')) throw new Error('Payment proof does not belong to this checkout.');
      const expected = crypto.createHmac('sha256', gateway.secret).update(`${orderId}|${paymentId}`).digest();
      if (!crypto.timingSafeEqual(expected, Buffer.from(signature, 'hex'))) throw new Error('Payment signature mismatch.');
      checkPurchase(db, p, validateCoupon);
      const response = await fetchGateway(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, { headers: gatewayHeaders() });
      let payment = await response.json();
      if (!response.ok || payment.order_id !== orderId || payment.currency !== 'INR' || payment.amount !== Math.round(p.total * 100)) throw new Error('Payment does not match this checkout.');
      if (payment.status === 'authorized') {
        const captured = await fetchGateway(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/capture`, { method: 'POST', headers: gatewayHeaders(), body: JSON.stringify({ amount: Math.round(p.total * 100), currency: 'INR' }) });
        payment = await captured.json();
        if (!captured.ok) {
          // Automatic capture or another callback may have won the race; read the provider's current state.
          const latest = await fetchGateway(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, { headers: gatewayHeaders() });
          payment = await latest.json();
        }
      }
      if (payment.order_id !== orderId || payment.currency !== 'INR' || payment.amount !== Math.round(p.total * 100) || payment.status !== 'captured') throw new Error('Payment has not been captured for this checkout. Contact support if money was debited.');
      db = loadDb(); p = customerPurchase(db, req);
      if (!p || p.gatewayOrderId !== orderId || (db.purchases || []).some((other) => other.id !== p.id && other.paymentId === paymentId)) throw new Error('Payment proof is already linked to another checkout.');
      const changed = confirmPurchase(db, p, 'razorpay', paymentId, validateCoupon); saveDb(db);
      if (changed) for (const id of p.printIds) notifyState(db.orders.find((o) => o.id === id));
      res.redirect(receiptUrl(p));
    } catch (error) { fail(res, req, error, `/customer/purchases/${req.params.id}`); }
  });

  const catalogueRole = (req,res,next) => requireRole(req.path.startsWith('/partner') ? 'partner' : 'admin')(req,res,next);
  app.get(['/admin/catalogue','/partner/catalogue'], catalogueRole, (req, res) => {
    const db = loadDb(), shop = (db.partners || []).find(s=>s.staffId===req.user.id);
    if (req.user.role === 'partner') {
      if (!shop) return res.sendStatus(403);
      db.products = db.products.filter(p=>p.shopId===shop.id);
      if (req.query.edit && !db.products.some(p=>p.id===req.query.edit)) return res.sendStatus(404);
    }
    res.send(cataloguePage(req.user, db, req.query.edit));
  });
  const photoUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 20, parts: 22 } }).single('photo');
  app.post(['/admin/catalogue','/partner/catalogue'], siteOrigin, catalogueRole, (req, res) => {
    photoUpload(req, res, async (error) => {
      let savedPhoto;
      try {
        if (error) throw new Error(error.code === 'LIMIT_FILE_SIZE' ? 'Choose a product photo no larger than 5 MB.' : 'Could not upload the photo. Choose one PNG or JPG and try again.');
        const db = loadDb(), input = { ...req.body };
        if (req.user.role === 'partner') {
          const shop=(db.partners || []).find(s=>s.staffId===req.user.id);
          if (!shop || input.id && !db.products.some(p=>p.id===input.id && p.shopId===shop.id)) throw new Error('You can manage only your shop’s products.');
          input.shopId=shop.id;
        }
        // Keep an existing photo unless the owner chooses a replacement.
        input.image = db.products?.find((p) => p.id === input.id)?.image || '';
        let name;
        if (req.file) {
          if (!/\.(png|jpe?g)$/i.test(req.file.originalname)) throw new Error('Choose a PNG or JPG product photo.');
          const { ext } = await analyzeUpload(req.file.originalname, req.file.buffer);
          name = `store-${crypto.randomUUID()}.${ext}`;
          input.image = `/product-images/${name}`;
        }
        saveProduct(db, input);
        if (name) {
          fs.mkdirSync(uploadsDir, { recursive: true });
          savedPhoto = path.join(uploadsDir, name);
          fs.writeFileSync(savedPhoto, req.file.buffer, { flag: 'wx' });
        }
        saveDb(db); res.redirect(req.path);
      } catch (error) {
        if (savedPhoto) fs.rmSync(savedPhoto, { force: true });
        fail(res, req, error, '/admin/catalogue');
      }
    });
  });
  app.get('/product-images/:name', (req, res) => {
    const name = req.params.name;
    if (!/^store-[a-f0-9-]{36}\.(png|jpg)$/.test(name) || !(loadDb().products || []).some((p) => p.image === `/product-images/${name}`)) return res.sendStatus(404);
    res.set('X-Content-Type-Options', 'nosniff');
    res.sendFile(name, { root: uploadsDir, maxAge: '1d' }, (error) => { if (error && !res.headersSent) res.sendStatus(error.statusCode || 500); });
  });
  app.get('/admin/purchases', requireRole('admin'), (req, res) => res.send(purchasesPage(req.user, loadDb().purchases || [])));
  app.get('/admin/purchases/:id', requireRole('admin'), (req, res) => {
    const db = loadDb(), p = (db.purchases || []).find((p) => p.id === req.params.id);
    if (!p) return res.sendStatus(404);
    res.send(purchasePage(req.user, p, db, {}));
  });
  app.post('/admin/purchases/:id/status', siteOrigin, requireRole('admin'), mutate((db, req, res) => {
    const p = (db.purchases || []).find((p) => p.id === req.params.id); if (!p) return res.sendStatus(404);
    const to = req.body.to, allowed = { PAID: 'READY', READY: 'OUT_FOR_DELIVERY', OUT_FOR_DELIVERY: 'DELIVERED' };
    if (to === 'CANCELLED') cancelPurchase(db, p, req.user.id, restorePackQuota, voidPendingForOrder);
    else {
      if (allowed[p.status] !== to && !(p.status === 'READY' && p.deliveryMode === 'pickup' && to === 'DELIVERED')) throw new Error('Choose the next available fulfilment step.');
      if (p.fulfillmentId && to === 'OUT_FOR_DELIVERY' && !p.handedOverAt) throw new Error('The shop must confirm rider handover before delivery starts.');
      const prints = p.printIds.map((id) => db.orders.find((o) => o.id === id));
      if (to === 'READY' && prints.some((o) => !o || !['PRINTED', 'READY_FOR_PICKUP'].includes(o.status))) throw new Error('Complete all printing before marking this basket ready.');
      if(to==='DELIVERED')collectCash(db,p,req.user.id,req.body.cashReceived);
      for (const o of prints) {
        if (to === 'READY' && o.status === 'PRINTED') transition(o, 'READY_FOR_PICKUP', { by: req.user.id });
        if (to === 'OUT_FOR_DELIVERY') { transition(o, 'PICKED_UP', { by: req.user.id }); transition(o, 'OUT_FOR_DELIVERY', { by: req.user.id }); }
        if (to === 'DELIVERED' && o.status !== 'DELIVERED') { transition(o, 'DELIVERED', { by: req.user.id }); qualifyForOrder(db, o); }
      }
      p.status = to; p.history.push({ to, at: new Date().toISOString(), by: req.user.id });
    }
    saveDb(db); res.redirect(`/admin/purchases/${p.id}`);
  }, '/admin/purchases'));
}
