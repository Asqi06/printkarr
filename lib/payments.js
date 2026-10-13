import crypto from 'node:crypto';

export function validSignature(secret, value, signature) {
  return typeof signature === 'string' && /^[a-f0-9]{64}$/.test(signature) && crypto.timingSafeEqual(crypto.createHmac('sha256', secret).update(value).digest(), Buffer.from(signature, 'hex'));
}

// Every gateway entry point verifies the server-owned order and captured amount.
export async function capturedPayment(gateway, orderId, paymentId, amount, signature, fetchGateway = fetch, trustedWebhook = false) {
  if (!gateway.id || !gateway.secret || typeof orderId !== 'string' || typeof paymentId !== 'string' || !/^order_[a-zA-Z0-9]+$/.test(orderId) || !/^pay_[a-zA-Z0-9]+$/.test(paymentId) || !Number.isFinite(amount) || amount <= 0) throw new Error('Payment proof does not belong to this checkout.');
  if (!trustedWebhook && !validSignature(gateway.secret, `${orderId}|${paymentId}`, signature)) throw new Error('Payment signature mismatch.');
  const headers = { 'Content-Type': 'application/json', Authorization: 'Basic ' + Buffer.from(`${gateway.id}:${gateway.secret}`).toString('base64') };
  const cents = Math.round(amount * 100);
  const matches = p => p.id === paymentId && p.order_id === orderId && p.currency === 'INR' && p.amount === cents;
  const get = async () => {
    const r = await fetchGateway(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, { headers, signal: AbortSignal.timeout(15000) });
    const payment = await r.json();
    if (!r.ok || !matches(payment)) throw new Error('Payment does not match this checkout.');
    return payment;
  };
  let payment = await get();
  if (payment.status === 'authorized') {
    await fetchGateway(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/capture`, { method: 'POST', headers, signal: AbortSignal.timeout(15000), body: JSON.stringify({ amount: cents, currency: 'INR' }) });
    payment = await get(); // Re-read: automatic capture or another callback may win.
  }
  if (payment.status !== 'captured') throw new Error('Payment is not captured. Retry confirmation or contact support if money was debited.');
  return payment;
}

export function assertUnusedPayment(db, paymentId, ownerId) {
  if ((db.topups || []).some(t => t.used && t.paymentId === paymentId && t.rzpOrderId !== ownerId) ||
      (db.walletTx || []).some(t => t.paymentId === paymentId && !(db.topups || []).some(p => p.rzpOrderId === ownerId && p.paymentId === paymentId)) ||
      (db.purchases || []).some(p => p.paymentId === paymentId && p.id !== ownerId) ||
      db.orders.some(o => o.paymentId === paymentId && o.id !== ownerId && o.purchaseId !== ownerId)) throw new Error('This payment already belongs to another checkout.');
}
