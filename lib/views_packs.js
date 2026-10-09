// Semester pack views — customer list + dashboard card + admin table.
import { layout, esc, icon } from './views.js';
import { PACKS, BOOKING_FEE, dueOf, leftOf, usableOf } from './packs.js';

const rs = (n) => '₹' + (Math.round(n * 100) / 100);

function subCard(sub, opts = {}) {
  const l = leftOf(sub), due = dueOf(sub);
  const meter = (label, used, total, left) => `<div class="sumrow"><span>${label}</span><strong>${left} left / ${total}</strong></div><div class="pbar" role="meter" aria-label="${label} used" aria-valuenow="${used}" aria-valuemin="0" aria-valuemax="${total}"><span style="width:${total ? Math.min(100,Math.round(used / total * 100)) : 0}%"></span></div>`;
  return `<article class="card pack-subscription"><p class="eyebrow">YOUR PACK</p><h3>${esc(sub.packName)}</h3><p class="field-hint">Paid ${rs(sub.paidTotal)} of ${rs(sub.price)}${usableOf(sub) ? '' : ' · quota unlocks at ₹199'}</p>
    ${meter('B&W quota',sub.bwTotal-l.bw,sub.bwTotal,l.bw)}${meter('Included colour sides',Math.min(sub.colorUsed,sub.colorTotal),sub.colorTotal,l.color)}${sub.colorSwapRate ? `<p class="field-hint">Need more colour? ${sub.colorSwapRate} unused B&amp;W sides cover 1 extra colour side automatically. Up to ${Math.floor(l.bw/sub.colorSwapRate)} extra colour sides from your remaining B&amp;W quota.${sub.colorUsed>sub.colorTotal?` ${sub.colorUsed-sub.colorTotal} extra colour sides have used ${(sub.colorUsed-sub.colorTotal)*sub.colorSwapRate} B&amp;W sides.`:''}</p>` : ''}
    ${opts.compact ? '' : due > 0 ? `<form class="pack-payment" method="POST" action="/customer/packs/${esc(sub.id)}/pay"><div class="field"><label for="pack-pay-${esc(sub.id)}">Remaining payment · ${rs(due)}</label><input id="pack-pay-${esc(sub.id)}" name="amount" type="number" min="1" max="${due}" value="${due}" required></div><div class="field"><label for="pack-method-${esc(sub.id)}">Pay with</label><select id="pack-method-${esc(sub.id)}" name="method"><option value="wallet">Wallet</option>${opts.livePay ? '' : '<option value="upi">UPI (demo)</option>'}</select></div><button class="btn loud" type="submit">Pay installment</button></form>` : `<p class="field-hint">Fully paid · ${rs(sub.paidTotal)}</p>`}
    ${opts.compact ? '' : l.files > 0 ? `<form method="POST" action="/customer/packs/${esc(sub.id)}/files/claim"><button class="rowlink" type="submit">Request a free file · ${l.files} left →</button></form>` : `<p class="field-hint">All ${sub.filesTotal} files claimed.</p>`}
  </article>`;
}

export function packsPage(user, { subs, walletBalance, livePay, refErr, refOff = 20 }) {
  const cards = PACKS.map(p => `<article class="card pack-card ${p.id === 'M' ? 'featured' : ''}"><p class="eyebrow">${p.id === 'M' ? 'THE EVERYDAY SEMESTER' : p.id === 'S' ? 'THE ESSENTIALS' : 'THE FULL SEMESTER'}</p><h3>${esc(p.name)}</h3><p class="muted">${esc(p.blurb)}</p><p class="pack-price">${rs(p.price)} <small>total pack price</small></p><ul class="pack-includes"><li>${icon('check')}<strong>${p.bw}</strong> B&W printed sides</li><li>${icon('check')}<strong>${p.color}</strong> included colour sides</li><li>${icon('check')}<strong>${p.files}</strong> paper / cardboard files</li></ul><p class="field-hint">More colour? Swap ${p.colorSwapRate} unused B&amp;W sides for 1 extra colour side automatically.</p><p class="pack-booking"><strong>${rs(BOOKING_FEE)} today</strong> to start.<br>${rs(p.price - BOOKING_FEE)} remaining, payable in installments.</p>
    <details class="pack-checkout"><summary class="btn ${p.id === 'M' ? 'loud' : ''}">Choose Pack ${p.id}</summary><form method="POST" action="/customer/packs/${p.id}/subscribe"><div class="field"><label for="pack-plan-${p.id}">Payment plan</label><select id="pack-plan-${p.id}" name="plan"><option value="booking">₹${BOOKING_FEE} today + installments</option><option value="full">Full ${rs(p.price)} now</option></select></div><div class="field"><label for="pack-paywith-${p.id}">Pay with</label><select id="pack-paywith-${p.id}" name="method"><option value="wallet">Wallet · ${rs(walletBalance)}</option>${livePay ? '' : '<option value="upi">UPI (demo)</option>'}</select></div><div class="field"><label for="pack-referral-${p.id}">Referral code (optional)</label><input id="pack-referral-${p.id}" name="referral" maxlength="12" placeholder="Your friend’s code"><small class="field-hint">Referral rewards follow top-up and first paid order eligibility.</small></div>${livePay && walletBalance < BOOKING_FEE ? '<p class="field-hint">Add money to your wallet before booking this pack.</p><a class="btn loud" href="/customer/wallet">Top up wallet →</a>' : '<button class="btn loud" type="submit">Confirm pack booking →</button>'}</form></details></article>`).join('');
  return layout({title:'Semester packs',user,extraCss:'/customer.css',active:'/customer/packs',body:`<div class="page-heading"><p class="eyebrow">FOR YOUR NEXT SEMESTER</p><h1>More notes.<br><em>A little less to pay.</em></h1><p>More colour included, with flexible B&amp;W-to-colour exchange for bigger assignments. Start with ₹${BOOKING_FEE}, use your quota, and pay the remaining amount in installments.</p></div>
    ${refErr ? `<p class="login-err" role="alert">${esc(refErr)}</p>` : ''}
    ${subs.length ? `<h2 class="h-sec">Your active packs</h2><div class="grid c2">${subs.map(sub=>subCard(sub,{livePay})).join('')}</div>` : ''}
<h2 class="h-sec">Choose your pack</h2><div class="pack-grid">${cards}</div>    <div class="pack-intro" style="margin-top:32px"><strong>Printing and wallet balance are separate.</strong> Included colour quota is used first. Each extra colour side uses 3 unused B&amp;W sides. Copies count separately; double-sided sheets still count each printed side. Delivery and extras are charged per order. Orders automatically use your oldest pack with enough quota for the whole print. If no pack can cover it, the full print charge is shown before payment.</div><p class="field-hint" style="margin-top:24px">File handover is arranged with our team. Your account tracks available sides, file claims and remaining payment.</p>`});
}

export function packDashboardHtml(subs) {
  if (!subs.length) {
    return `<a class="card promo rv" href="/customer/packs" style="text-decoration:none">
      <p class="eyebrow">Semester packs</p>
      <div class="stat"><div class="v">From ₹329</div><div class="k">₹199 today secures a pack · the rest is due later →</div></div>
    </a>`;
  }
  const rows = subs.map((s) => {
    const l = leftOf(s);
    const due = dueOf(s);
    return `<div class="sumrow"><span><b>${esc(s.packName)}</b> · B&W left ${l.bw}/${s.bwTotal} · Included colour left ${l.color}/${s.colorTotal}${s.colorSwapRate?` · 3 B&W = 1 extra colour`:""} · Files ${l.files}${due > 0 ? ` · due ${rs(due)}` : ' · paid'}</span><a class="rowlink" href="/customer/packs">manage →</a></div>`;
  }).join('');
  return `<div class="card promo rv"><p class="eyebrow">Semester pack · pages left / used</p><div style="margin-top:6px">${rows}</div></div>`;
}

export function adminPacksPage(user, { subs, users }) {
  const trs = subs.map((s) => {
    const u = users.find((x) => x.id === s.customerId) || {};
    const l = leftOf(s);
    return `<tr><td class="mono">${esc(s.id)}</td><td>${esc(u.name || s.customerId)}</td><td>${esc(s.packName)}</td>
      <td>B&W ${s.bwUsed}/${s.bwTotal} · Colour used ${s.colorUsed} (${s.colorTotal} included) · F ${s.filesUsed}/${s.filesTotal}</td>
      <td><b>${rs(s.paidTotal)}</b> / ${rs(s.price)}${dueOf(s) > 0 ? ` · due ${rs(dueOf(s))}` : ''}</td>
      <td class="mono" style="font-size:11px">left B&W ${l.bw} · included colour ${l.color}${s.colorSwapRate?` · +${Math.floor(l.bw/s.colorSwapRate)} colour via B&W exchange`:""}</td></tr>`;
  }).join('') || `<tr><td colspan="6" class="muted">No subscriptions yet.</td></tr>`;
  return layout({
    title: 'Semester packs', user, extraCss: '/customer.css', active: '/admin/packs',
    body: `
    <div class="page-heading"><p class="eyebrow rv">Semester packs · ${subs.length} subscriptions</p>
    <h1 class="display rv">Prepaid pages,<br><em>tracked.</em></h1></div>
    <div class="tblwrap rv" style="margin-top:16px"><table class="tbl"><thead><tr><th>Sub</th><th>Student</th><th>Pack</th><th>Used</th><th>Paid</th><th>Left</th></tr></thead><tbody>${trs}</tbody></table></div>`
  });
}
