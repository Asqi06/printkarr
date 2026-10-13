import crypto from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
const scripts = new AsyncLocalStorage();
export const scriptNonce = () => scripts.getStore() || '';
export function scriptContext(_req,res,next) {
  res.locals.scriptNonce = crypto.randomBytes(18).toString('base64');
  scripts.run(res.locals.scriptNonce,next);
}

export const asyncHandler = handler => (req,res,next) => Promise.resolve().then(() => handler(req,res,next)).catch(next);

// Same-origin checks cover all browser mutations, including login and uploads.
export function sameOrigin(req, res, next, site) {
  const allowed = new Set([new URL(site).origin]);
  const alias = new URL(site); alias.hostname = alias.hostname.startsWith('www.') ? alias.hostname.slice(4) : 'www.' + alias.hostname;
  allowed.add(alias.origin);
  if (process.env.NODE_ENV !== 'production') allowed.add(`${req.protocol}://${req.get('host')}`);
  let origin = req.get('origin');
  if (!origin || origin === 'null') { try { origin = new URL(req.get('referer')).origin; } catch { origin = ''; } }
  if (req.get('sec-fetch-site') === 'cross-site' || origin && !allowed.has(origin) || !origin && req.get('sec-fetch-site') !== 'same-origin') return res.status(403).send('Please submit this form from this website.');
  next();
}

// Optional Upstash REST store: native fetch, one atomic HTTP request per hit.
export function redisRateStore(prefix, request = fetch) {
  const url = process.env.UPSTASH_REDIS_REST_URL, token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url && !token) return undefined;
  if (!url || !token || new URL(url).protocol !== 'https:') throw new Error('Configure both HTTPS Upstash REST URL and token.');
  let windowMs;
  async function command(parts) {
    const response = await request(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(parts), signal: AbortSignal.timeout(3000) });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error('Rate-limit storage unavailable.');
    return data.result;
  }
  return {
    init(options) { windowMs = options.windowMs; },
    async increment(key) {
      const result = await command(['EVAL', "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('PEXPIRE',KEYS[1],ARGV[1]) end; return {n,redis.call('PTTL',KEYS[1])}", '1', `${prefix}:${key}`, String(windowMs)]);
      if (!Array.isArray(result) || !Number.isFinite(Number(result[0])) || Number(result[1]) < 0) throw new Error('Invalid rate-limit response.');
      return { totalHits: Number(result[0]), resetTime: new Date(Date.now() + Number(result[1])) };
    },
    async decrement(key) { await command(['DECR', `${prefix}:${key}`]); },
    async resetKey(key) { await command(['DEL', `${prefix}:${key}`]); }
  };
}
