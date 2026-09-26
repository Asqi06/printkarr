// Kiosk live/demomode — lets the admin take the kiosk online (real payments)
// or offline (simulated) at runtime instead of redeploying env vars.
// Pure helpers: server passes its env-derived flags in.
export function kioskLive(db) {
  return !!(db.settings && db.settings.kiosk && db.settings.kiosk.live);
}

// Live when the env already forces it, or the admin switched it on AND a
// real gateway is configured (never live on simulated money).
export function effectiveLive({ envLive, gatewayOn, kioskLive: kiosk }) {
  return !!(envLive || (kiosk && gatewayOn));
}
