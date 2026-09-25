// Referral views — customer Refer & Earn page + admin referrals console.
import { layout, esc } from './views.js';

const rs = (n) => '₹' + (Math.round(n * 100) / 100);

export function referralsPage(user, { cfg, code, stats, cash, payouts, shareText }) {
  const ms = cfg.milestones.map((m) => {
    const hit = stats.qualified >= m.n;
    const left = Math.max(0, m.n - stats.qualified);
    return `<div class="sumrow"><span>${hit ? '✓' : `${left} to go`} · ${m.n} delivered referrals</span><span><b>+${rs(m.bonus)} bonus</b></span></div>
      <div class="pbar"><span style="width:${Math.min(100, Math.round((stats.qualified / m.n) * 100))}%"></span></div>`;
  }).join('');
  const rows = payouts.map((p) =>
    `<div class="sumrow"><span>${rs(p.amount)} → ${esc(p.upiId)} · ${esc(p.status)}${p.decidedAt ? ` · ${esc(new Date(p.decidedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }))}` : ''}</span></div>`
  ).join('') || '<p class="muted">No withdrawals yet — earnings land here after delivery.</p>';
  const waShare = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  return layout({
    title: 'Refer & Earn', user, extraCss: '/customer.css', active: '/customer/referrals',
    body: `
    <p class="eyebrow rv">Refer &amp; earn · real cash, not credit</p>
    <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem)">Don't just save.<br><em>Earn from it.</em></h1>
    <div class="card promo rv" style="margin-top:16px">
      <p class="eyebrow">How it works</p>
      <div class="sumrow"><span>Friend gets ${rs(cfg.friendOff)} OFF first order of ${rs(cfg.friendMinOrder)}+</span></div>
      <div class="sumrow"><span>You get <b>${rs(cfg.referrerCash)} real cash via UPI</b> when their order is delivered</span></div>
      <div class="sumrow"><span>Cash out from ${rs(cfg.minWithdrawal)} · max ${rs(cfg.monthlyCap)}/month</span></div>
    </div>
    <div class="card rv" style="margin-top:14px">
      <p class="eyebrow">Your code</p>
      <div class="stat"><div class="v mono">${esc(code)}</div><div class="k">Friends enter this before their first order</div></div>
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
        <button class="btn solid" type="button" onclick="navigator.clipboard&&navigator.clipboard.writeText('${esc(code)}');toast('Code copied')"><span>Copy code</span></button>
        <a class="btn loud" href="${waShare}" target="_blank" rel="noopener"><span>Share on WhatsApp →</span></a>
      </div>
    </div>
    <div class="grid c2" style="margin-top:14px">
      <div class="card rv"><p class="eyebrow">Friends</p>
        <div class="sumrow"><span>Joined with your code</span><span><b>${stats.joined}</b></span></div>
        <div class="sumrow"><span>Delivered (earning)</span><span><b>${stats.qualified}</b></span></div>
        <div class="sumrow"><span>Lifetime cash earned</span><span><b>${rs(stats.earned)}</b></span></div>
      </div>
      <div class="card rv"><p class="eyebrow">Milestone bonuses</p>${ms}</div>
    </div>
    <div class="card rv" style="margin-top:14px">
      <p class="eyebrow">Cash earnings · separate from print wallet</p>
      <h2 class="display" style="font-size:clamp(2rem,6vw,3rem)">${rs(cash.balance)}</h2>
      <form method="POST" action="/customer/referrals/withdraw" style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;align-items:end">
        <div class="field" style="margin:0"><label>UPI ID or mobile number</label><input name="upiId" required placeholder="name@upi / 98250XXXXX" maxlength="60" style="max-width:200px"></div>
        <div class="field" style="margin:0"><label>Amount (min ${rs(cfg.minWithdrawal)})</label><input name="amount" type="number" min="1" max="${cash.balance}" value="${Math.min(cash.balance, cfg.minWithdrawal)}" required style="max-width:130px"></div>
        <button class="btn sun" type="submit"><span>Withdraw →</span></button>
      </form>
      <p class="muted mono" style="font-size:10px;margin-top:8px">The shop sends UPI manually and marks it paid — usually within a day.</p>
      <div style="margin-top:10px">${rows}</div>
    </div>`
  });
}

export function adminReferralsPage(user, { cfg, referrals, users, payouts }) {
  const name = (id) => (users.find((u) => u.id === id) || {}).name || id;
  const rtrs = referrals.map((r) =>
    `<tr><td class="mono">${esc(r.code)}</td><td>${esc(name(r.referrerId))}</td><td>${esc(name(r.refereeId))}</td>
     <td class="mono">${esc(r.orderId)}</td><td>${esc(r.status)}</td><td><b>−${rs(r.friendDiscount)}</b></td></tr>`
  ).join('') || `<tr><td colspan="6" class="muted">No referrals yet.</td></tr>`;
  const ptrs = payouts.map((p) =>
    `<tr><td class="mono">${esc(p.id)}</td><td>${esc(name(p.customerId))}</td><td><b>${rs(p.amount)}</b></td>
     <td class="mono">${esc(p.upiId)}</td><td>${esc(p.status)}</td>
     <td>${p.status === 'requested'
       ? `<form method="POST" action="/admin/referrals/payouts/${esc(p.id)}/pay" style="display:inline"><button class="rowlink" type="submit">mark paid</button></form> · <form method="POST" action="/admin/referrals/payouts/${esc(p.id)}/reject" style="display:inline"><button class="rowlink" type="submit">reject</button></form>`
       : `<span class="mono" style="font-size:11px">${esc(p.decidedAt || '')}</span>`}</td></tr>`
  ).join('') || `<tr><td colspan="6" class="muted">No withdrawals requested.</td></tr>`;
  const num = (k, label) => `<div class="field"><label for="rf-${k}">${label}</label><input id="rf-${k}" name="${k}" type="number" min="0" value="${cfg[k]}"></div>`;
  return layout({
    title: 'Referrals', user, extraCss: '/customer.css', active: '/admin/referrals',
    body: `
    <p class="eyebrow rv">Referrals · give ${rs(cfg.friendOff)}, get ${rs(cfg.referrerCash)} cash</p>
    <h1 class="display rv" style="font-size:clamp(2rem,6vw,3.6rem)">Paid by <em>word of mouth.</em></h1>
    <form class="card rv" style="margin-top:18px" method="POST" action="/admin/referrals/config">
      <p class="eyebrow">Offer settings</p>
      <label class="pick" style="margin:10px 0"><input type="checkbox" name="enabled" value="1" ${cfg.enabled ? 'checked' : ''}> Program live</label>
      <div class="grid c2">${num('friendOff', 'Friend OFF ₹')}${num('friendMinOrder', 'Friend min order ₹')}</div>
      <div class="grid c2">${num('referrerCash', 'Referrer cash ₹')}${num('minWithdrawal', 'Min withdrawal ₹')}</div>
      <div class="grid c2">${num('monthlyCap', 'Monthly cap ₹/person')}
        <div class="field"><label>Milestones (count:bonus)</label><input value="${cfg.milestones.map((m) => `${m.n}:${m.bonus}`).join(', ')}" disabled><small class="muted mono" style="font-size:10px">Fixed ladder — edit code to change.</small></div></div>
      <button class="btn loud" type="submit"><span>Save →</span></button>
    </form>
    <h2 class="h-sec rv">UPI payouts — pay from your UPI app, then mark paid</h2>
    <div class="tblwrap rv"><table class="tbl"><thead><tr><th>ID</th><th>Student</th><th>₹</th><th>UPI</th><th>Status</th><th></th></tr></thead><tbody>${ptrs}</tbody></table></div>
    <h2 class="h-sec rv">Referrals</h2>
    <div class="tblwrap rv"><table class="tbl"><thead><tr><th>Code</th><th>Referrer</th><th>Friend</th><th>Order</th><th>Status</th><th>Off</th></tr></thead><tbody>${rtrs}</tbody></table></div>`
  });
}
