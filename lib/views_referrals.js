// Referral views — customer Refer & Earn page + admin referrals console.
import { layout, esc, icon } from './views.js';

const rs = (n) => '₹' + (Math.round(n * 100) / 100);

export function referralsPage(user, { cfg, code, stats, credit, cash, payouts, shareText }) {
  const ms = cfg.milestones.map((m) => {
    const hit = stats.qualified >= m.n;
    const left = Math.max(0, m.n - stats.qualified);
    return `<div class="sumrow"><span>${hit ? '✓' : `${left} to go`} · ${m.n} eligible referrals</span><span><b>+${rs(m.bonus)} print credit</b></span></div>
      <div class="pbar"><span style="width:${Math.min(100, Math.round((stats.qualified / m.n) * 100))}%"></span></div>`;
  }).join('');
  const rows = payouts.map((p) =>
    `<div class="sumrow"><span>${rs(p.amount)} → ${esc(p.upiId)} · ${esc(p.status)}${p.decidedAt ? ` · ${esc(new Date(p.decidedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }))}` : ''}</span></div>`
  ).join('') || '<p class="muted">No withdrawals yet — earnings land here after delivery.</p>';
  const waShare = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  return layout({title:'Refer & Earn',user,extraCss:'/customer.css',active:'/customer/referrals',body:`<div class="page-heading"><p class="eyebrow">A GOOD THING TO PASS ON</p><h1>Their next print.<br><em>Your next reward.</em></h1><p>Share PrintKarr with a friend. Eligible referrals earn credit for both of you after the required top-up and first paid order.</p></div><div class="referral-layout"><section class="card"><p class="eyebrow">YOUR REFERRAL CODE</p><p class="referral-code">${esc(code)}</p><p class="muted">Your friend enters this code before their first paid order or with their wallet top-up.</p><div class="action-row"><button class="btn" type="button" onclick="if(navigator.clipboard){navigator.clipboard.writeText('${esc(code)}').then(()=>toast('Code copied')).catch(()=>toast('Copy the code shown above.'));}else{toast('Copy the code shown above.');}">Copy code</button><a class="btn loud" href="${waShare}" target="_blank" rel="noopener">Share on WhatsApp ${icon('arrow-up-right')}</a></div></section><section class="card"><h2>How you both earn</h2><ol class="referral-steps"><li>Share your code with a friend who is new to PrintKarr.</li><li>Your friend adds ${rs(cfg.minTopup ?? 99)}+ and completes their first paid order${cfg.friendMinOrder?` of ${rs(cfg.friendMinOrder)}+`:''}.</li><li>Your friend receives ${rs(cfg.friendOff)} wallet credit. You receive ${rs(cfg.referrerCredit)} print credit.</li></ol><p class="field-hint" style="margin-top:20px">Use rewards on future orders. Monthly reward limit: ${rs(cfg.monthlyCap)} per person.</p></section></div><h2 class="h-sec">Your referral progress</h2><div class="grid c3"><section class="card stat"><div class="v">${stats.joined}</div><div class="k">Friends joined</div></section><section class="card stat"><div class="v">${stats.qualified}</div><div class="k">Eligible referrals</div></section><section class="card stat"><div class="v">${rs(stats.earned)}</div><div class="k">Print credit earned</div></section></div><h2 class="h-sec">Milestone rewards</h2><section class="card">${ms || '<p class="muted">No extra milestones at the moment. Your standard referral reward still applies.</p>'}<p class="field-hint" style="margin-top:20px">Print wallet balance: ${rs(credit.balance)}</p></section>${cash.balance>0 || payouts.length?`<section class="card" style="margin-top:24px"><h2>Previous cash earnings · ${rs(cash.balance)}</h2>${cash.balance>=cfg.minWithdrawal?`<form method="POST" action="/customer/referrals/withdraw" class="pack-payment"><div class="field"><label for="referral-upi">UPI ID or mobile number</label><input id="referral-upi" name="upiId" required maxlength="60" placeholder="name@upi"></div><div class="field"><label for="referral-amount">Amount · minimum ${rs(cfg.minWithdrawal)}</label><input id="referral-amount" name="amount" type="number" min="1" max="${cash.balance}" value="${Math.min(cash.balance,cfg.minWithdrawal)}" required></div><button class="btn loud" type="submit">Request withdrawal</button></form>`:''}${rows}</section>`:''}`});
}

export function adminReferralsPage(user, { cfg, referrals, users, payouts }) {
  const name = (id) => (users.find((u) => u.id === id) || {}).name || id;
  const rtrs = referrals.map((r) =>
    `<tr><td class="mono">${esc(r.code)}</td><td>${esc(name(r.referrerId))}</td><td>${esc(name(r.refereeId))}</td>
     <td>${r.sourceKind === 'pack' ? 'pack ' : r.sourceKind === 'topup' ? 'top-up ' : ''}<span class="mono">${esc(r.orderId || r.sourceId || '')}</span></td><td>${esc(r.status)}</td><td><b>${rs(r.friendCredit ?? r.friendDiscount)}</b></td></tr>`
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
    <div class="page-heading"><p class="eyebrow rv">Referrals · give ${rs(cfg.friendOff)} credit, get ${rs(cfg.referrerCredit)} print credit</p>
    <h1 class="display rv">Paid by <em>word of mouth.</em></h1></div>
    <form class="card rv" style="margin-top:18px" method="POST" action="/admin/referrals/config">
      <p class="eyebrow">Offer settings</p>
      <label class="pick" style="margin:10px 0"><input type="checkbox" name="enabled" value="1" ${cfg.enabled ? 'checked' : ''}> Program live</label>
      <div class="grid c2">${num('friendOff', 'Friend credit ₹')}${num('minTopup', 'Required wallet top-up ₹')}${num('friendMinOrder', 'First paid order minimum ₹')}</div>
      <div class="grid c2">${num('referrerCredit', 'Referrer print credit ₹')}${num('minWithdrawal', 'Previous cash withdrawal minimum ₹')}</div>
      <div class="grid c2">${num('monthlyCap', 'Monthly cap ₹/person')}
        <div class="field"><label for="milestones">Milestones (count:bonus)</label><input id="milestones" name="milestones" value="${cfg.milestones.map((m) => `${m.n}:${m.bonus}`).join(', ')}"><small class="field-hint">Example: 3:50, 5:100. Leave blank to disable milestones.</small></div></div>
      <button class="btn loud" type="submit"><span>Save →</span></button>
    </form>
    <h2 class="h-sec rv">Previous cash payouts — pay from your UPI app, then mark paid</h2>
    <div class="tblwrap rv"><table class="tbl"><thead><tr><th>ID</th><th>Student</th><th>₹</th><th>UPI</th><th>Status</th><th></th></tr></thead><tbody>${ptrs}</tbody></table></div>
    <h2 class="h-sec rv">Referrals</h2>
    <div class="tblwrap rv"><table class="tbl"><thead><tr><th>Code</th><th>Referrer</th><th>Friend</th><th>Source</th><th>Status</th><th>Friend credit</th></tr></thead><tbody>${rtrs}</tbody></table></div>`
  });
}
