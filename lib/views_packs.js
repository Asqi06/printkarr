// Semester pack views — customer list + dashboard card + admin table.
import { layout, esc } from './views.js';
import { PACKS, BOOKING_FEE, dueOf, leftOf, usableOf } from './packs.js';

const rs = (n) => '₹' + (Math.round(n * 100) / 100);

function subCard(sub, opts = {}) {
  const l = leftOf(sub);
  const due = dueOf(sub);
  const pct = (used, total) => (total ? Math.min(100, Math.round((used / total) * 100)) : 0);
  const payBox = due > 0
    ? `<form method="POST" action="/customer/packs/${esc(sub.id)}/pay" style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;align-items:end">
        <div class="field" style="margin:0"><label>Pay installment (due ${rs(due)})</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><input name="amount" type="number" min="1" max="${due}" value="${due}" style="max-width:130px;min-width:0" required>
        <select name="method" aria-label="Payment method"><option value="upi">UPI (demo)</option><option value="wallet">Wallet</option></select>
        <button class="btn sun" type="submit"><span>Pay</span></button></div></div>
      </form>`
    : `<p class="mono" style="font-size:11px;margin-top:8px">✓ Fully paid · ${rs(sub.paidTotal)}</p>`;
  const fileClaim = l.files > 0
    ? `<form method="POST" action="/customer/packs/${esc(sub.id)}/files/claim" style="margin-top:8px"><button class="rowlink" type="submit" style="border:none;background:none;cursor:pointer">Claim 1 free file at kiosk (${l.files} left) →</button></form>`
    : `<p class="mono muted" style="font-size:11px;margin-top:8px">Files: ${sub.filesUsed}/${sub.filesTotal} claimed</p>`;
  return `<article class="card rv">
    <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
      <b>${esc(sub.packName)}</b><span class="mono muted" style="font-size:11px">${esc(sub.id)}</span>
    </div>
    <p class="mono muted" style="font-size:11px;margin-top:4px">Paid ${rs(sub.paidTotal)} / ${rs(sub.price)}${due > 0 ? ` · due ${rs(due)}` : ''}${usableOf(sub) ? '' : ' · quota unlocks at ₹199'}</p>
    <div style="margin-top:10px">
      <div class="sumrow"><span>B&W sides · used ${sub.bwUsed}/${sub.bwTotal} · left <b>${l.bw}</b></span></div>
      <div class="pbar"><span style="width:${pct(sub.bwUsed, sub.bwTotal)}%"></span></div>
      <div class="sumrow" style="margin-top:8px"><span>Color sides · used ${sub.colorUsed}/${sub.colorTotal} · left <b>${l.color}</b></span></div>
      <div class="pbar"><span style="width:${pct(sub.colorUsed, sub.colorTotal)}%"></span></div>
    </div>
    ${opts.compact ? '' : payBox}
    ${opts.compact ? '' : fileClaim}
  </article>`;
}

export function packsPage(user, { subs, walletBalance, livePay }) {
  const mine = subs.length
    ? `<h2 class="h-sec rv">My packs · pages left / used</h2><div class="grid c2">${subs.map((s) => subCard(s)).join('')}</div>`
    : `<div class="card sun rv"><p class="eyebrow">No pack yet</p><p style="font-weight:700">Pick one below — ₹199 secures it, rest in installments.</p></div>`;
  const cards = PACKS.map((p) => {
    const value = p.bw * p.bwRate + p.color * p.colorRate + p.files * p.fileValue;
    const saveLabel = `${rs(p.save)}${p.savePlus ? '+' : ''}`;
    return `<article class="card rv">
      <p class="eyebrow">${esc(p.blurb)}</p>
      <h3 class="display" style="font-size:1.6rem">${esc(p.name)} · ${rs(p.price)}</h3>
      <div class="sumrow"><span>${p.bw} B&W sides × ₹${p.bwRate}</span><span>${rs(p.bw * p.bwRate)}</span></div>
      <div class="sumrow"><span>${p.color} color sides × ₹${p.colorRate}</span><span>${rs(p.color * p.colorRate)}</span></div>
      <div class="sumrow"><span>${p.files} free files × ₹${p.fileValue}</span><span>${rs(p.files * p.fileValue)}</span></div>
      <div class="sumrow"><span>Bandle value</span><span>${rs(value)}</span></div>
      <div class="sumrow disc"><span>Market minimum ${rs(p.market)}</span><span>you save ${saveLabel}</span></div>
      <form method="POST" action="/customer/packs/${p.id}/subscribe" style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;align-items:end">
        <div class="field" style="margin:0"><label>Start with</label>
        <select name="plan"><option value="booking">₹${BOOKING_FEE} booking + installments</option><option value="full">Full ${rs(p.price)} now</option></select></div>
        <div class="field" style="margin:0"><label>Pay via</label>
        <select name="method"><option value="upi"${livePay ? ' disabled' : ''}>UPI${livePay ? ' (off in live)' : ' (demo)'}</option><option value="wallet">Wallet (${rs(walletBalance)})</option></select></div>
        <button class="btn loud" type="submit"><span>Secure pack →</span></button>
      </form>
    </article>`;
  }).join('');
  return layout({
    title: 'Semester packs', user, extraCss: '/customer.css', active: '/customer/packs',
    body: `
    <p class="eyebrow rv">Semester print packs · pay ₹${BOOKING_FEE} now, rest in installments</p>
    <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem)">Print all semester.<br><em>Pay in pieces.</em></h1>
    <p class="muted rv" style="margin:10px 0 18px;max-width:56ch">Packs cover printing only — delivery is charged per order. Orders auto-use your oldest pack with enough sides left. Quota unlocks once ₹${BOOKING_FEE} is secured.</p>
    ${mine}
    <h2 class="h-sec rv">Choose a pack</h2>
    <div class="grid c2">${cards}</div>`
  });
}

export function packDashboardHtml(subs) {
  if (!subs.length) {
    return `<a class="card promo rv" href="/customer/packs" style="text-decoration:none">
      <p class="eyebrow">Semester packs</p>
      <div class="stat"><div class="v">₹199<em> secures it</em></div><div class="k">130–400 B&W sides + color + free files · pay rest in installments →</div></div>
    </a>`;
  }
  const rows = subs.map((s) => {
    const l = leftOf(s);
    const due = dueOf(s);
    return `<div class="sumrow"><span><b>${esc(s.packName)}</b> · B&W left ${l.bw}/${s.bwTotal} · Color left ${l.color}/${s.colorTotal} · Files ${l.files}${due > 0 ? ` · due ${rs(due)}` : ' · paid'}</span><a class="rowlink" href="/customer/packs">manage →</a></div>`;
  }).join('');
  return `<div class="card promo rv"><p class="eyebrow">Semester pack · pages left / used</p><div style="margin-top:6px">${rows}</div></div>`;
}

export function adminPacksPage(user, { subs, users }) {
  const trs = subs.map((s) => {
    const u = users.find((x) => x.id === s.customerId) || {};
    const l = leftOf(s);
    return `<tr><td class="mono">${esc(s.id)}</td><td>${esc(u.name || s.customerId)}</td><td>${esc(s.packName)}</td>
      <td>B&W ${s.bwUsed}/${s.bwTotal} · C ${s.colorUsed}/${s.colorTotal} · F ${s.filesUsed}/${s.filesTotal}</td>
      <td><b>${rs(s.paidTotal)}</b> / ${rs(s.price)}${dueOf(s) > 0 ? ` · due ${rs(dueOf(s))}` : ''}</td>
      <td class="mono" style="font-size:11px">left B&W ${l.bw} · C ${l.color}</td></tr>`;
  }).join('') || `<tr><td colspan="6" class="muted">No subscriptions yet.</td></tr>`;
  return layout({
    title: 'Semester packs', user, extraCss: '/customer.css', active: '/admin/packs',
    body: `
    <p class="eyebrow rv">Semester packs · ${subs.length} subscriptions</p>
    <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem)">Prepaid pages,<br><em>tracked.</em></h1>
    <div class="tblwrap rv" style="margin-top:16px"><table class="tbl"><thead><tr><th>Sub</th><th>Student</th><th>Pack</th><th>Used</th><th>Paid</th><th>Left</th></tr></thead><tbody>${trs}</tbody></table></div>`
  });
}
