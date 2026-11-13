import { printDescription } from '../public/print-plan.js';
import { printPricing } from '../public/print-pricing.js';
// Public printing flow and marketing pages — PrintKarr print studio.
// No login walls before price. Auth happens once, at OTP time.
import { layout, esc, ASSET_V, THEME_SCRIPTS, icon, pkPublicHeader, pkPublicFooter, DELIVERY_MAP_HEAD, deliveryPicker, uploadScript, festivalAttr } from './views.js';
import { uploadStep, optionsStep, bulkPricingGuide } from './views_order.js';
import { campaignDefaults } from './campus.js';
import { PACKS, BOOKING_FEE } from './packs.js';
import { PAGES, seoHead, analyticsHead, privateDescription } from './seo.js';

const rs = (n) => '₹' + (Math.round(n * 100) / 100);
const rate = (n) => '₹' + (Math.round(n * 100) / 100).toFixed(2);
const PHONE = '+91 90167 03180';
const EMAIL = 'team@printkarr.in';

const topNav = pkPublicHeader;

function shell({ title, body, desc, active, extraHead, stickyCta, path = active, article = false }) {
  [title, desc] = PAGES[path] || [title, desc];
  return `<!DOCTYPE html>
<html lang="en"${festivalAttr()}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)} — PrintKarr</title>
<link rel="icon" href="/favicon.ico?v=${ASSET_V}">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=${ASSET_V}">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=${ASSET_V}">
<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=${ASSET_V}">
<link rel="manifest" href="/site.webmanifest?v=${ASSET_V}">
<meta name="description" content="${esc(desc || privateDescription(title))}">
${seoHead(path, title, desc, article)}${analyticsHead()}
<meta name="theme-color" content="#14261A">
<script src="/design-feel-boot.js?v=${ASSET_V}"></script>
<link rel="preload" href="/fonts/dm-sans-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/design.css?v=${ASSET_V}">
<link rel="stylesheet" href="/customer.css?v=${ASSET_V}">
<link rel="stylesheet" href="/qk-landing.css?v=${ASSET_V}">
<link rel="stylesheet" href="/site-overhaul.css?v=${ASSET_V}">
<link rel="stylesheet" href="/studio.css?v=${ASSET_V}">
<link rel="stylesheet" href="/nature-overhaul.css?v=${ASSET_V}">
${extraHead || ''}
</head>
<body data-design="paper-studio" data-public-page="${esc(path || 'message')}" class="public-site"><div class="pk-page">
${topNav(active)}
<a class="store-skip" href="#main">Skip to content</a>
<main id="main">${body}</main>
${stickyCta ? '<div class="sticky-cta"><a href="/order">Upload PDF &amp; Print →</a></div>' : ''}
${pkPublicFooter()}
</div>
<div class="toast" id="toast"></div>
${THEME_SCRIPTS}<script src="/shell.js?v=${ASSET_V}" defer></script>
</body>
</html>`;
}

export { topNav };

function reviewsHtml(reviews) {
  const average = reviews.length ? (reviews.reduce((total, r) => total + r.rating, 0) / reviews.length).toFixed(1) : null;
  return `<section class="qk-section qk-container customer-reviews" id="reviews" aria-labelledby="reviews-title" data-reviews>
    <div class="reviews-heading"><div><p class="section-index">CUSTOMER NOTES</p><h2 id="reviews-title">Fresh off<br><em>their print desk.</em></h2><p>Little stories from the people we print for.</p></div>
    <div class="reviews-summary">${average ? `<div><strong>${average}</strong><span>/ 5</span></div><p>${reviews.length} customer ${reviews.length === 1 ? 'review' : 'reviews'}</p>` : '<p>Your experience could be the first.</p>'}<a class="rowlink" href="/customer/profile#review">Leave your review ${icon('arrow-up-right')}</a></div></div>
    ${reviews.length ? `<div class="review-rail" id="review-rail" tabindex="0" role="region" aria-label="Customer review cards. Scroll to read more.">${reviews.map(r => {
      const date = new Date(r.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric', timeZone:'Asia/Kolkata' });
      return `<article class="review-note">
        <div class="review-note-top"><span class="review-stars" role="img" aria-label="${r.rating} out of 5 stars"><span aria-hidden="true">${'★'.repeat(r.rating)}<span class="review-star-empty">${'☆'.repeat(5-r.rating)}</span></span></span><time datetime="${esc(r.createdAt)}">${esc(date)}</time></div>
        <blockquote>${r.text.length > 240 ? `<p>${esc(r.text.slice(0,240))}…</p><details class="review-full"><summary>Read full review</summary><p>${esc(r.text)}</p></details>` : `<p>${esc(r.text)}</p>`}</blockquote>
        <footer class="review-author"><span class="review-avatar" aria-hidden="true">${esc(r.name.charAt(0).toUpperCase())}</span><div><b>${esc(r.name)}</b><small>${r.verified ? `${icon('check')} Printed with us` : 'PrintKarr customer'}</small></div></footer>
        ${r.canDelete ? `<details class="review-delete"><summary>Delete review</summary><p>Remove this review from the home page?</p><form method="POST" action="/reviews/${encodeURIComponent(r.id)}/delete"><button type="submit" class="rowlink">Yes, delete review</button></form></details>` : ''}
      </article>`;
    }).join('')}</div><div class="reviews-navigation" hidden><p>Take a look around.</p><div><button type="button" data-review-direction="-1" aria-controls="review-rail" aria-label="Previous reviews">${icon('arrow-right')}</button><button type="button" data-review-direction="1" aria-controls="review-rail" aria-label="Next reviews">${icon('arrow-right')}</button></div></div>` : '<div class="reviews-empty"><p>No customer notes yet.</p><span>Ordered a print? Tell us how it went in My Account.</span></div>'}
  </section>`;
}

export function landing({ pricing, maxMb = 20, signedIn = false, campaign = campaignDefaults(), walletOffers = [], reviews = [], pagesWeek = 0, pagesPrinted = 0 }) {
  const printed = Math.max(0, Number(pagesPrinted || pagesWeek) || 0);
  const p50 = printPricing({ bw: 50, color: 0 }, pricing);
  const p100 = printPricing({ bw: 100, color: 0 }, pricing);
  const sampleTotal = Math.round((p100.subtotal + 5) * 100) / 100;
  const slotText = (campaign?.delivery?.slots || [])
    .filter((slot) => slot.enabled !== false)
    .map((slot) => `${esc(slot.name)} ${esc(slot.start)} to ${esc(slot.end)}`)
    .join(' and ') || 'Scheduled windows shown at checkout';
  const wallet = (walletOffers || [])
    .filter((offer) => offer && offer.enabled !== false && (Number(offer.bonus) > 0 || Number(offer.freeFiles) > 0))
    .sort((a, b) => (Number(b.bonus) || 0) - (Number(a.bonus) || 0) || (Number(b.amount) || 0) - (Number(a.amount) || 0))
    .slice(0, 3);
  const walletRows = wallet.map((offer) => {
    const amount = Number(offer.amount) || 0;
    const bonus = Number(offer.bonus) || 0;
    const files = Number(offer.freeFiles) || 0;
    return `<div class="pk-wallet-offer"><span class="pk-wallet-amount"><b>${rs(amount)}</b><small>${offer.firstOnly ? 'First top-up' : 'Top-up'}</small></span><span class="pk-wallet-plus" aria-hidden="true">+</span><span class="pk-wallet-bonus"><b>${bonus ? rs(bonus) : files}</b><small>${bonus ? 'bonus credit' : 'free files'}</small></span></div>`;
  }).join('');
  const packRows = PACKS.map((pack, index) => `<article class="pk-pack">
      <div class="pk-pack-main"><span class="pk-pack-index" aria-hidden="true">0${index + 1}</span><div><h4>${esc(pack.name)}</h4><p>${esc(pack.blurb)}</p></div></div>
      <p class="pk-pack-includes"><b>${pack.bw}</b> B&amp;W · <b>${pack.color}</b> colour · <b>${pack.files}</b> files</p>
      <div class="pk-pack-price"><strong>${rs(pack.price)}</strong><span>Save ${rs(pack.save)}</span></div>
    </article>`).join('');
  return shell({ active:'/', title:'Online printing & doorstep delivery', extraHead:`<link rel="stylesheet" href="/landing-hero.css?v=${ASSET_V}"><script type="module" src="/studio.js?v=${ASSET_V}"></script>`, body:`
  <div class="pk-nature-page">
    <section class="studio-hero pk-hero" aria-labelledby="home-title">
      <div class="pk-wrap pk-hero-layout">
        <div class="pk-hero-copy">
          <p class="pk-eyebrow">A4 printing · finishing · local delivery</p>
          <h1 class="pk-hero-title" id="home-title">Ideas look good<br><span>on paper.</span></h1>
          <p class="pk-hero-lede">Upload a PDF or photo, choose your pages and copies, and see the full price before checkout. Delivered across Vapi, Sarigam, Bhilad and Daman.</p>
          <div class="pk-upload" id="home-upload">
          <form method="POST" action="${signedIn ? '/customer/orders/new/upload' : '/order/upload'}" enctype="multipart/form-data" data-max-mb="${esc(maxMb)}" data-home-upload>
            <input class="pk-upload-input" id="doc" name="doc" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" required aria-describedby="upload-hint">
            <label class="pk-upload-label" for="doc">
              <span class="pk-upload-icon" aria-hidden="true">${icon('upload-simple')}</span>
              <span class="pk-upload-copy"><b>Upload a PDF or photo</b><small id="upload-hint">PDF, JPG or PNG · up to ${esc(maxMb)} MB</small></span>
              <span class="pk-upload-pill">Choose a file</span>
            </label>
            <button type="submit" class="pk-upload-submit studio-upload-submit"><span>Continue</span>${icon('arrow-up-right')}</button>
            <p class="pk-upload-status" id="fname" role="status" aria-live="polite"></p>
            <noscript><style>.pk-upload-submit, .studio-upload-submit{display:inline-flex!important}</style></noscript>
          </form>
          ${uploadScript(true)}
          <div class="pk-price-row">
            <div class="pk-price-chip"><span>BLACK &amp; WHITE</span><b>${rs(pricing.bw)} <small>/ side</small></b></div>
            <div class="pk-price-chip"><span>COLOUR</span><b>${rs(pricing.color)} <small>/ side</small></b></div>
            <a class="pk-price-link" href="/printing-prices">All prices ${icon('arrow-up-right')}</a>
          </div>
          </div>
          <p class="pk-hero-note">No minimum order.</p>
        </div>
        <div class="pk-hero-visual" aria-hidden="true">
          <span class="pk-hero-art-kicker">YOUR IDEAS, IN PRINT</span>
          <img src="/images/paper-studio-hero.webp" alt="" width="1120" height="700" fetchpriority="high" decoding="async">
          <span class="pk-hero-art-sticker"><i></i> Made for the next big thing</span>
          <span class="pk-hero-art-spark" aria-hidden="true">✳</span>
        </div>
      </div>
      <div class="pk-trust" aria-label="What to expect">
        <div class="pk-wrap pk-trust-inner">
          <span class="pk-trust-item">${icon('check')} Exact total before payment</span>
          <span class="pk-trust-item">${icon('map-pin')} Local delivery in four areas</span>
          <span class="pk-trust-item">${icon('file-text')} PDF, JPG or PNG up to ${esc(maxMb)} MB</span>
        </div>
      </div>
    </section>

    <section class="pk-showcase" aria-labelledby="showcase-title">
      <div class="pk-wrap">
        <div class="pk-section-head">
          <p class="pk-eyebrow">THE PRINT DESK</p>
          <h2 id="showcase-title">One upload. A finished document.</h2>
          <p class="pk-sub">You control the pages, copies, colour and finishing. We show the full price before you pay, then print and deliver.</p>
        </div>
        <div class="pk-showcase-stage">
          <figure class="pk-showcase-photo">
            <img src="/images/print-desk-hero-v2.webp" alt="Printed reports and a bound document on a print desk" loading="lazy" decoding="async">
          </figure>
          <aside class="pk-ui-card pk-ui-card-a" aria-label="Example order total">
            <p class="pk-ui-kicker">EXAMPLE ORDER</p>
            <div class="pk-ui-row"><span>100 B&amp;W sides</span><b>${rs(p100.subtotal)}</b></div>
            <div class="pk-ui-row"><span>Bulk saving</span><b>${rs(p100.bulkDiscount)}</b></div>
            <div class="pk-ui-row"><span>School delivery</span><b>₹5</b></div>
            <div class="pk-ui-total"><span>Total</span><b>${rs(sampleTotal)}</b></div>
            <p class="pk-ui-note">Example from the live price ladder. Your total is shown before payment.</p>
          </aside>
          <aside class="pk-ui-card pk-ui-card-b" aria-label="Example order status">
            <p class="pk-ui-kicker">ORDER STATUS</p>
            <p class="pk-ui-status is-done">${icon('check')} Payment confirmed</p>
            <p class="pk-ui-status is-done">${icon('check')} Printing</p>
            <p class="pk-ui-status is-live">${icon('printer')} Out for delivery</p>
            <p class="pk-ui-note">Follow the real status in My Orders.</p>
          </aside>
        </div>
        <div class="pk-fact-row">
          <div class="pk-fact"><strong>${printed ? printed.toLocaleString('en-IN') : rs(pricing.bw)}</strong><span>${printed ? 'pages printed with PrintKarr' : 'per B&amp;W printed side'}</span></div>
          <div class="pk-fact"><strong>₹5</strong><span>school and college delivery</span></div>
          <div class="pk-fact"><strong>₹0</strong><span>address delivery in local coverage</span></div>
        </div>
      </div>
    </section>

    <section class="pk-features" id="delivery" aria-labelledby="features-title">
      <div class="pk-wrap">
        <div class="pk-section-head">
          <p class="pk-eyebrow">WHAT YOU CONTROL</p>
          <h2 id="features-title">Print settings that match the job.</h2>
          <p class="pk-sub">A4 document printing for notes, reports, forms and projects, with finishing and delivery in one order.</p>
        </div>
        <div class="pk-feature-grid">
          <article class="pk-feature">
            <div class="pk-feature-media" aria-hidden="true"><span class="pk-feature-icon">${icon('file-text')}</span></div>
            <div class="pk-feature-body">
              <h3>Mixed pages, one total</h3>
              <p>Set B&amp;W and colour pages in the same file. Copies, colour pages and other documents count towards the bulk ladder together.</p>
              <div class="pk-mini">
                <div class="pk-mini-row"><span>B&amp;W side</span><b>${rs(pricing.bw)}</b></div>
                <div class="pk-mini-row"><span>Colour side</span><b>${rs(pricing.color)}</b></div>
                <div class="pk-mini-row"><span>Bulk ladder</span><b>Automatic</b></div>
              </div>
              <a class="pk-link" href="/printing-prices">See printing prices ${icon('arrow-up-right')}</a>
            </div>
          </article>
          <article class="pk-feature">
            <div class="pk-feature-media" aria-hidden="true"><span class="pk-feature-icon">${icon('stack')}</span></div>
            <div class="pk-feature-body">
              <h3>Finishing that holds up</h3>
              <p>Choose loose sheets, staple, spiral, wiro or hardcover thesis binding. Paper is 75 GSM copy or 100 GSM bond.</p>
              <div class="pk-mini">
                <div class="pk-chiprow"><span class="pk-chip">75 GSM</span><span class="pk-chip">100 GSM</span><span class="pk-chip">Spiral</span><span class="pk-chip">Wiro</span><span class="pk-chip">Hardcover</span></div>
              </div>
              <a class="pk-link" href="/how-it-works">See the print options ${icon('arrow-up-right')}</a>
            </div>
          </article>
          <article class="pk-feature">
            <div class="pk-feature-media" aria-hidden="true"><span class="pk-feature-icon">${icon('map-pin')}</span></div>
            <div class="pk-feature-body">
              <h3>From upload to doorstep</h3>
              <p>Follow every order in your account. Express delivery is available in Vapi; pick ${slotText} where the route runs.</p>
              <div class="pk-mini">
                <div class="pk-mini-row"><span>Payment confirmed</span><b>${icon('check')}</b></div>
                <div class="pk-mini-row"><span>Printing</span><b>${icon('check')}</b></div>
                <div class="pk-mini-row"><span>Out for delivery</span><b class="pk-live-dot">Live</b></div>
              </div>
              <a class="pk-link" href="/customer/orders">Track an order ${icon('arrow-up-right')}</a>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="pk-process" id="how-it-works" aria-labelledby="process-title">
      <div class="pk-wrap pk-process-grid">
        <div class="pk-process-copy">
          <p class="pk-eyebrow">HOW IT WORKS</p>
          <h2 id="process-title">From file to doorstep.</h2>
          <p class="pk-sub">Four steps, with the total shown before you pay.</p>
          <div class="pk-accordion">
            <details class="pk-step" open>
              <summary><span class="pk-step-num">01</span><span class="pk-step-title">Upload your file</span></summary>
              <div class="pk-step-body"><p>Send a PDF or photo. We count the pages, check the file and show the print options.</p></div>
            </details>
            <details class="pk-step">
              <summary><span class="pk-step-num">02</span><span class="pk-step-title">Set pages and copies</span></summary>
              <div class="pk-step-body"><p>Choose B&amp;W and colour pages, copies, paper and binding. Mixed colour pages stay in the same file.</p></div>
            </details>
            <details class="pk-step">
              <summary><span class="pk-step-num">03</span><span class="pk-step-title">Check the total</span></summary>
              <div class="pk-step-body"><p>Bulk savings and delivery are itemised before payment. Nothing is added after you confirm.</p></div>
            </details>
            <details class="pk-step">
              <summary><span class="pk-step-num">04</span><span class="pk-step-title">Print and deliver</span></summary>
              <div class="pk-step-body"><p>We print and finish the job, then deliver or hand it over at school or college. Follow the status in your account.</p></div>
            </details>
          </div>
        </div>
        <figure class="pk-process-media">
          <div class="pk-media-frame">
            <img src="/images/host-cta-cutout.webp" alt="Student checking a print order on a phone" loading="lazy" decoding="async">
            <div class="pk-media-pill">${icon('check')} Order status in your account</div>
          </div>
          <figcaption>A print order in progress, from upload to handover.</figcaption>
        </figure>
      </div>
    </section>

    <section class="pk-audiences" aria-labelledby="audiences-title">
      <div class="pk-wrap">
        <div class="pk-section-head">
          <p class="pk-eyebrow">WHO IT IS FOR</p>
          <h2 id="audiences-title">Built for the work you print.</h2>
          <p class="pk-sub">The same print desk handles a single worksheet, a full project report or a week of class notes.</p>
        </div>
        <div class="pk-audience-grid">
          <article class="pk-audience">
            <span class="pk-audience-icon">${icon('users')}</span>
            <h3>Coaching &amp; classes</h3>
            <p>Test papers, worksheets and revision sets, with a clear per-side price before you print.</p>
            <ul>
              <li>School and college handover is ₹5</li>
              <li>Scheduled windows where available</li>
              <li>Bulk rates on larger sets</li>
              <li>B&amp;W and colour in one set</li>
              <li>75 or 100 GSM paper</li>
            </ul>
            <a class="pk-link" href="/order">Start a class set ${icon('arrow-up-right')}</a>
          </article>
          <article class="pk-audience pk-audience-photo">
            <img src="/images/stationery-demo-hero.webp" alt="Notebooks, folders, pencils and a ruler on a desk" width="1200" height="800" loading="lazy" decoding="async">
            <div class="pk-audience-photo-body">
              <span class="pk-audience-icon">${icon('file-text')}</span>
              <h3>Students</h3>
              <p>Assignments, lab records and project reports. Mix B&amp;W notes with colour diagrams and bind the final copy.</p>
              <a class="pk-link" href="/customer/packs">See semester packs ${icon('arrow-up-right')}</a>
            </div>
          </article>
          <article class="pk-audience">
            <span class="pk-audience-icon">${icon('receipt')}</span>
            <h3>Offices &amp; local businesses</h3>
            <p>Forms, proposals and everyday copies. Keep repeat runs simple with a pack or wallet credit.</p>
            <ul>
              <li>One total for the whole basket</li>
              <li>Saved addresses for repeat orders</li>
              <li>Order history in your account</li>
              <li>Bulk rates applied automatically</li>
              <li>UPI, cards and wallet</li>
            </ul>
            <a class="pk-link" href="/printing-prices">Check business rates ${icon('arrow-up-right')}</a>
          </article>
        </div>
      </div>
    </section>

    <section class="pk-money" aria-labelledby="money-title">
      <div class="pk-wrap">
        <div class="pk-section-head">
          <p class="pk-eyebrow">PAY LESS PER SIDE</p>
          <h2 id="money-title">Print more. Pay less per side.</h2>
          <p class="pk-sub">Bulk rates apply automatically. Semester packs and wallet top-ups are optional prepaid ways to plan the next order.</p>
        </div>
        <div class="pk-money-grid">
          <div class="pk-packs" id="packs">
            <div class="pk-money-head"><h3>Semester packs</h3><p>Prepaid print bundles for college work. Delivery is separate.</p></div>
            <div class="pk-pack-list">${packRows}</div>
            <div class="pk-packs-note"><strong>How pack pages are counted</strong><span>One printed side uses one page from your pack. Copies count separately. Three B&amp;W sides can cover one colour side. Delivery is priced per order.</span></div>
            <div class="pk-money-foot"><span>Start with ${rs(BOOKING_FEE)}. Pay the rest in instalments.</span><a class="pk-btn pk-btn-dark" href="/customer/packs">Choose a pack ${icon('arrow-up-right')}</a></div>
          </div>
          <aside class="pk-wallet" id="wallet" aria-labelledby="wallet-title">
            <p class="pk-eyebrow">PRINTKARR WALLET</p>
            <h3 id="wallet-title">Top up once. Print all term.</h3>
            <p>Pay in fewer steps and keep print credit ready for the next submission.</p>
            <div class="pk-wallet-offers">${walletRows || '<p class="pk-wallet-empty">Top up from your wallet page and use the credit on a future order.</p>'}</div>
            <p class="pk-wallet-note">Added money stays in your wallet without expiry. Bonus credit is non-withdrawable. Delivery is priced separately.</p>
            <a class="pk-btn pk-btn-leaf" href="/customer/wallet">Open wallet ${icon('arrow-up-right')}</a>
          </aside>
        </div>
      </div>
    </section>

    <section class="pk-stationery" id="stationery" aria-labelledby="stationery-title">
      <div class="pk-wrap pk-stationery-inner">
        <div>
          <p class="pk-eyebrow">DESK SUPPLIES</p>
          <h2 id="stationery-title">A small shelf, when in stock.</h2>
          <p>The stationery shelf is deliberately small. Browse the items in stock today, and add them to your print delivery.</p>
        </div>
        <a class="pk-btn pk-btn-ghost" href="/stationery">Browse stationery ${icon('arrow-up-right')}</a>
      </div>
    </section>

    ${reviews.length ? reviewsHtml(reviews) : ''}

    <section class="pk-price" id="pricing" aria-labelledby="pricing-title">
      <div class="pk-wrap pk-price-grid">
        <div class="pk-price-copy">
          <p class="pk-eyebrow">PRICE BEFORE YOU PAY</p>
          <h2 id="pricing-title">The price you see is the price you pay.</h2>
          <p>Printing in Vapi and across Sarigam, Bhilad and Daman. B&amp;W and colour sides share one bulk ladder, and copies and separate documents in the same checkout count together.</p>
          <p class="pk-price-example" data-price-examples><b>B&amp;W price examples, 1 copy</b><br>50 printed sides = ${rs(p50.subtotal)} · 100 printed sides = ${rs(p100.subtotal)}<br>Printing only. Delivery is itemised before payment.</p>
          <details class="pk-bulk"><summary>See bulk rates and delivery charges</summary>${bulkPricingGuide(pricing, true)}</details>
          <a class="pk-link" href="/printing-prices">See the full price list ${icon('arrow-up-right')}</a>
        </div>
        <div class="pk-quote studio-quote" data-pricing="${esc(JSON.stringify({ bw: pricing.bw, color: pricing.color, printOffers: pricing.printOffers || [] }))}">
          <h3>Quick price check</h3>
          <p class="pk-quote-intro">Printing only. Delivery is added at checkout.</p>
          <form data-studio-quote>
            <div class="pk-quote-grid">
              <label>B&amp;W sides<input name="bwPages" type="number" inputmode="numeric" min="0" max="1000" step="1" value="100" required></label>
              <label>Colour sides<input name="colorPages" type="number" inputmode="numeric" min="0" max="1000" step="1" value="0" required></label>
              <label>Copies<input name="copies" type="number" inputmode="numeric" min="1" max="200" step="1" value="1" required></label>
            </div>
          </form>
          <p class="pk-quote-error" data-quote-error role="alert" hidden></p>
          <div class="pk-quote-lines" data-quote-breakdown>
            <div><span data-quote-bw>B&amp;W · 100 printed sides</span><b data-quote-bw-rate>${rate(p100.bwRate)} / side</b></div>
            <div><span data-quote-color>Colour · 0 printed sides</span><b data-quote-color-rate>${rate(pricing.color)} / side</b></div>
            <div class="pk-quote-total"><span>Printing estimate</span><b data-quote-total>${rs(p100.subtotal)}</b></div>
            <div class="pk-quote-save"><span>Regular rate</span><b data-quote-regular>${rs(p100.regularSubtotal)}</b></div>
            <div class="pk-quote-save"><span>Bulk saving</span><b data-quote-savings>${rs(p100.bulkDiscount)} (${p100.regularSubtotal ? (p100.bulkDiscount / p100.regularSubtotal * 100).toFixed(2) : '0.00'}%)</b></div>
          </div>
          <p class="pk-quote-note">Delivery: ₹0 to your address in local coverage, or ₹5 for school and college handover. The exact total is shown before payment.</p>
          <a class="pk-btn pk-btn-primary pk-btn-block" href="/order">Start a print ${icon('arrow-up-right')}</a>
        </div>
      </div>
    </section>

    <section class="pk-faq" id="faq" aria-labelledby="faq-title">
      <div class="pk-wrap pk-faq-grid">
        <div>
          <p class="pk-eyebrow">QUESTIONS</p>
          <h2 id="faq-title">The details, before you print.</h2>
          <p class="pk-sub">If something is not covered here, call or WhatsApp ${PHONE}.</p>
        </div>
        <div class="pk-faq-list">
          <details class="pk-faq-item" open>
            <summary>Where do you deliver?</summary>
            <p>We deliver across Vapi, Sarigam, Bhilad and Daman. Address delivery is ₹0 in local coverage. School and college handover is ₹5. Availability is confirmed at checkout.</p>
          </details>
          <details class="pk-faq-item">
            <summary>How fast is delivery?</summary>
            <p>Express delivery is available in Vapi. Scheduled windows are ${slotText} where the route runs. Choose a window at checkout; the exact timing is confirmed before payment.</p>
          </details>
          <details class="pk-faq-item">
            <summary>Which files can I upload?</summary>
            <p>PDF, JPG and PNG up to ${esc(maxMb)} MB. Save a WhatsApp file to your phone first, then upload it here. You can add another document from the order page.</p>
          </details>
          <details class="pk-faq-item">
            <summary>How is the price calculated?</summary>
            <p>We price each printed side. B&amp;W and colour sides, copies and separate documents in one checkout count together towards progressive bulk rates. The total is shown before payment.</p>
          </details>
          <details class="pk-faq-item">
            <summary>What finishing is available?</summary>
            <p>Loose sheets, staple, spiral, wiro and hardcover thesis binding. Paper is 75 GSM copy or 100 GSM bond. We flag tight margins before spiral or wiro holes cut the text.</p>
          </details>
          <details class="pk-faq-item">
            <summary>What is a semester pack?</summary>
            <p>A prepaid print bundle with B&amp;W sides, colour sides and paper files. Packs cover printing only; delivery is separate. Start with ${rs(BOOKING_FEE)} and pay the rest in instalments.</p>
          </details>
        </div>
      </div>
    </section>

    <section class="pk-close" aria-labelledby="close-title">
      <div class="pk-wrap pk-close-inner">
        <p class="pk-eyebrow">READY WHEN YOU ARE</p>
        <h2 id="close-title">Send the file.<br><em>We will handle the print.</em></h2>
        <p>PDF, JPG or PNG up to ${esc(maxMb)} MB. No minimum order.</p>
        <a href="/order" class="pk-btn pk-btn-primary">Start a print ${icon('arrow-up-right')}</a>
        <a class="pk-close-call" href="https://wa.me/919016703180" target="_blank" rel="noopener">Questions? WhatsApp ${PHONE}</a>
      </div>
    </section>
  </div>` });
}

export function orderPage({ draft, pricing, error, maxMb, surcharges = {}, campaign = campaignDefaults(), referral = '' }) {
  return draft ? optionsStep(null,draft,[],campaign,pricing,surcharges,error,referral) : uploadStep(null,{maxMb,error});
}

export function phonePage({ draft, error, referral, quote: q }) {
  const s=draft.selections, college=!!s.campusId || !!s.institutionAddress, contact=draft.contactForm || draft.contact || {};
  return layout({title:'Your details',focused:true,back:`/order?draft=${encodeURIComponent(draft.id)}`,extraHead:DELIVERY_MAP_HEAD,body:`
    <h1>Your details.</h1><p class="order-intro">One step before payment. We email a 6-digit code to confirm it’s you — then you pick how to pay.</p><section class="order-section"><h2>${esc(draft.document)}</h2><p>${s.effPages} page${s.effPages===1?'':'s'} · ${esc(printDescription(s))} · ${s.copies} ${s.copies===1?'copy':'copies'}</p><p class="order-contact">${esc(s.institutionName ? s.institutionName+' · '+s.slot : s.campusId ? s.slot : s.area+' · '+s.slot)}</p><a class="order-text" href="/order?draft=${esc(draft.id)}">Edit print or delivery</a></section>
    ${q ? `<section class="order-section order-quote-box"><h2>Your total</h2><div class="sumrow"><span>Printing${q.studentDiscount ? ' (before student discount)' : ''}</span><span>${rs(q.subtotal + (q.studentDiscount || 0))}</span></div>${q.studentDiscount ? `<div class="sumrow"><span>Student discount</span><span>−${rs(q.studentDiscount)}</span></div>` : ''}${q.processingFee ? `<div class="sumrow"><span>Processing</span><span>${rs(q.processingFee)}</span></div>` : ''}<div class="sumrow"><span>Delivery</span><span>${q.deliveryFee ? rs(q.deliveryFee) : 'FREE'}</span></div>${q.lateNightFee ? `<div class="sumrow"><span>Late-night delivery</span><span>${rs(q.lateNightFee)}</span></div>` : ''}<div class="sumrow total"><span>Total</span><span>${rs(q.total)}</span></div><p class="field-hint">The exact total is checked again before payment.</p></section>` : ''}
    ${error ? `<p class="login-err" role="alert">${esc(error)}</p>` : ''}
    <form method="POST" action="/order/otp-request" data-inline-order><input type="hidden" name="draft" value="${esc(draft.id)}">
      <section class="order-section"><h2>Your details</h2><div class="field"><label for="nn">Name</label><input id="nn" name="name" value="${esc(contact.name || '')}" autocomplete="name" required maxlength="60" placeholder="Full name"></div><div class="field"><label for="ee">Email</label><input id="ee" name="email" value="${esc(contact.email || '')}" type="email" autocomplete="email" required maxlength="120" placeholder="you@example.com"></div><div class="field"><label for="pp">Contact phone</label><input id="pp" name="phone" value="${esc(contact.phone || '')}" type="tel" required autocomplete="tel" inputmode="tel" maxlength="20" placeholder="10-digit mobile"></div>
      ${college ? '' : `<div class="field"><label for="aa">Street address</label><input id="aa" name="address" value="${esc(contact.address || '')}" required autocomplete="street-address" maxlength="200" placeholder="Flat / room, building, street"></div><div class="grid c2"><div class="field"><label for="pin">PIN code</label><input id="pin" name="pin" value="${esc(contact.pin || '')}" required inputmode="numeric" pattern="[0-9]{6}" autocomplete="postal-code" maxlength="6" placeholder="396191"></div><div class="field"><label for="ll">Landmark (optional)</label><input id="ll" name="landmark" value="${esc(contact.landmark || '')}" maxlength="100"></div></div>${deliveryPicker(s.area,{...draft.contact?.deliveryPoint,localityId:contact.localityId || draft.contact?.deliveryPoint?.localityId,lat:contact.deliveryLat || draft.contact?.deliveryPoint?.lat,lng:contact.deliveryLng || draft.contact?.deliveryPoint?.lng})}`}
      <input type="hidden" name="referral" value="${esc(contact.referral || referral || '')}"></section>
      <button class="btn loud big" type="submit">Email me a code →</button><p class="field-hint">Payment comes after the code — your exact total is confirmed before you pay.</p>
    </form>`});
}

export function otpPage({ draft, email, demoCode, mailError, error }) {
  return layout({title:'Verify your email',focused:true,back:`/order/phone?draft=${encodeURIComponent(draft.id)}`,extraHead:DELIVERY_MAP_HEAD,body:`
    <h1>Verify your email.</h1><section class="order-section"><p class="order-intro">Enter the 6-digit code sent to <b>${esc(email)}</b>. Your order is saved — payment comes right after this.</p>${demoCode ? `<p class="login-err">${esc(mailError || 'Email delivery is not configured.')} Demo code: ${esc(demoCode)}</p>` : ''}${error ? `<p class="login-err" role="alert">${esc(error)}</p>` : ''}
      <form method="POST" action="/order/otp-verify" data-inline-order><input type="hidden" name="draft" value="${esc(draft.id)}"><div class="field"><label for="cc">Email code</label><input id="cc" name="code" required inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" placeholder="6-digit code" autofocus></div><button class="btn loud big" type="submit">Verify code — then pay →</button></form>
      <form method="POST" action="/order/otp-request" data-inline-order><input type="hidden" name="draft" value="${esc(draft.id)}"><input type="hidden" name="resend" value="1"><button class="order-text" type="submit">Resend code</button></form>
    </section>`});
}

/* ---------- marketing pages (workspace port) ---------- */

function pageWrap(inner) {
  return `<div class="pk-nature-page pk-interior"><div class="interior-wrap"><div class="interior-edition" aria-hidden="true"><span>PRINTKARR · NATURE EDITION</span><span>✳</span></div>${inner}</div></div>`;
}

export function howItWorksPage() {
  return shell({ active: '/how-it-works', title: 'How it works', body: pageWrap(`<section class="service-guide">
    <span class="pill">How it works</span>
    <h1 class="display">Your file.<br><em>Your local print desk.</em></h1>
    <p>Print notes, assignments and documents, or add stationery to your order. See the price and delivery window before paying.</p>
    <div class="pk-trust" style="margin:24px 0 36px" aria-label="What to expect">
      <div class="pk-trust-inner">
        <span class="pk-trust-item">${icon('check')} Exact total before payment</span>
        <span class="pk-trust-item">${icon('map-pin')} ₹0 address delivery in local coverage</span>
        <span class="pk-trust-item">${icon('users')} ₹5 school and college delivery</span>
        <span class="pk-trust-item">${icon('file-text')} PDF, JPG, PNG up to 20 MB</span>
      </div>
    </div>
    <ol class="guide-steps">
      <li>
        <h2>Start with your file</h2>
        <p>Upload a PDF, JPG or PNG to begin. Let us find a suitable fulfilment desk for your location.</p>
      </li>
      <li>
        <h2>Upload and choose your print</h2>
        <p>Upload a PDF, JPG or PNG. Preview your document and choose B&amp;W, colour or mixed pages. Copies and printed sides appear in your total. Optional binding and instructions stay under more options.</p>
      </li>
      <li>
        <h2>Choose where it goes</h2>
        <p>Schools, colleges and classes in local coverage use ₹5 flat delivery. Enter the institution’s name and address. Other available local delivery has no additional charge. Choose a locality and add the full address so your rider knows where to go.</p>
      </li>
      <li>
        <h2>Review, pay and track</h2>
        <p>See printing, items and delivery together. You can add stationery or another document before paying once. Follow your order from preparation to delivery in your account.</p>
      </li>
    </ol>
    <div class="pk-hero-actions" style="margin-top:36px">
      <a class="btn loud pk-btn pk-btn-primary" href="/order">Upload &amp; print ${icon('arrow-up-right')}</a>
      <a class="pk-btn pk-btn-ghost" href="/printing-prices">Check print prices</a>
    </div>
    <p class="field-hint" style="margin-top:20px">Online ordering is available any time. Delivery uses the windows shown in checkout.</p>
  </section>`) });
}

export function aboutPage() {
  return shell({
    active: '/about',
    title: 'About PrintKarr',
    body: pageWrap(`<section class="about-story">
      <div class="about-intro">
        <span class="pill rv">About PrintKarr</span>
        <h1 class="display story-title rv">Paper shouldn’t<br><em>have closing hours.</em></h1>
        <p class="rv">We started in Vapi, Gujarat, because an assignment, admit card, or business document cannot always wait until a shop opens.</p>
        <p class="rv">Today, PrintKarr accepts online orders around the clock for delivery in Vapi and Daman. Upload a PDF, choose your pages, and see the total before paying. Delivery availability and slots are confirmed in checkout; schools and colleges in supported local coverage can use the institution delivery option.</p>
        <p class="rv">Our print and delivery team prepares each paid order for your selected destination.</p>
        <p class="rv">PrintKarr is operated by PrintKarr Technologies Private Limited. Our service is based in Vapi; delivery coverage does not mean we have a walk-in branch in every city. We show current print prices, delivery fees and available payment options before an order is placed.</p>
        <p class="rv">Customers can sign in with Google to track orders and manage their wallet. Bonus wallet credit is usable on PrintKarr orders and is non-withdrawable; offer eligibility and validity are shown with the offer. Campus batch delivery and address delivery have different availability and fee rules.</p>
        <p class="rv">Read our <a href="/printing-in-vapi">Vapi service guide</a>, <a href="/printing-in-daman">Daman delivery guide</a> and <a href="/printing-prices">printing prices</a>. For coverage or a deadline, contact <a href="tel:+919016703180">+91 90167 03180</a> or <a href="mailto:team@printkarr.in">team@printkarr.in</a>. WhatsApp is optional: the website handles the order flow.</p>
      </div>
      <blockquote class="about-quote rv">If groceries can reach us in minutes, why is printing still stuck behind a shutter at 9 pm? PrintKarr is our answer.<cite>— Anirudh Verma, Founder</cite></blockquote>
      <div class="grid c2">
        <article class="card rv"><span class="qk-label">Our mission</span><h2>Printing when people need it.</h2><p>Make everyday printing easier with clear prices, careful printing and local delivery.</p></article>
        <article class="card ink rv"><span class="qk-label">Our vision</span><h2>One print network, built with trust.</h2><p>Start with the Vapi pilot and grow a reliable print network for students, families, and businesses.</p></article>
      </div>
      <div class="pk-hero-actions" style="margin-top:28px">
        <a class="pk-btn pk-btn-primary" href="/order">Start a print ${icon('arrow-up-right')}</a>
        <a class="pk-btn pk-btn-ghost" href="/contact">Contact the team</a>
      </div>
    </section>`)
  });
}

export const CONTACT_TOPICS = ['Help with my print order','School / college delivery','Need a custom solution','Home / office delivery','Just saying hello'];
export function contactPage({ error = '', values = {} } = {}) {
  const value = key => esc(typeof values[key] === 'string' ? values[key] : '');
  return shell({
    active: '/contact',
    title: 'Contact PrintKarr',
    body: pageWrap(`<div style="display:grid;gap:32px" class="contact-grid"><div>
      <span class="pill rv">Contact</span>
      <h1 class="display rv" style="font-size:clamp(2rem,5vw,3rem);margin-top:16px">A little help.<br><em>Right when you need it.</em></h1>
      <ul class="rv" style="margin-top:24px;list-style:none;display:flex;flex-direction:column;gap:16px;font-size:14px">
        <li>${icon('phone')} <a href="tel:+919016703180">${PHONE}</a> · <a href="https://wa.me/919016703180">WhatsApp</a><br><span class="muted">Online orders any time. Confirm delivery availability and slots in checkout.</span></li>
        <li>${icon('envelope')} <a class="rowlink" href="mailto:${EMAIL}">${EMAIL}</a></li>
        <li>${icon('map-pin')} PrintKarr Technologies Private Limited<br><span class="muted">Based in Vapi, Gujarat. Delivery across Vapi and Daman; selected colleges in Sarigam and Bhilad.</span></li>
      </ul></div>
      <form class="card rv" method="POST" action="/contact">
        ${error ? `<p class="contact-error" role="alert">${esc(error)}</p>` : ''}<div class="contact-honey" aria-hidden="true"><label for="contact-website">Leave this field empty</label><input id="contact-website" name="website" tabindex="-1" autocomplete="off"></div>
        <div class="field"><label for="field-model">How can we help?</label><select id="field-model" name="model" required><option value="" disabled ${!values.model?'selected':''}>Choose one</option>${CONTACT_TOPICS.map(topic=>`<option ${values.model===topic?'selected':''}>${esc(topic)}</option>`).join('')}</select></div>
        <div class="grid c2"><div class="field"><label for="field-name">Name</label><input id="field-name" name="name" autocomplete="name" maxlength="100" value="${value('name')}" required></div><div class="field"><label for="field-phone">Phone</label><input id="field-phone" name="phone" type="tel" autocomplete="tel" maxlength="24" value="${value('phone')}" required></div></div>
        <div class="field"><label for="field-email">Email</label><input id="field-email" name="email" type="email" autocomplete="email" maxlength="254" value="${value('email')}" required></div>
        <div class="field"><label for="field-message">Message</label><textarea id="field-message" name="message" rows="4" maxlength="4000" required>${value('message')}</textarea><p class="field-hint">We use these details to answer your enquiry. <a href="/privacy">Read our privacy policy</a>.</p></div>
        <button class="btn loud pk-btn pk-btn-primary" style="width:100%" type="submit"><span>Send enquiry ${icon('arrow-up-right')}</span></button>
      </form></div>
      <style>.contact-grid{grid-template-columns:1fr}@media(min-width:768px){.contact-grid{grid-template-columns:.9fr 1.1fr}}</style>`)
  });
}

export function contactThankYouPage({ confirmed = false } = {}) {
  return shell({title:confirmed?'Enquiry received':'Contact confirmation',body:pageWrap(`<section class="studio-message"><span class="studio-message-symbol" aria-hidden="true">${icon(confirmed?'check':'envelope')}</span><p class="studio-kicker">${confirmed?'MESSAGE RECEIVED':'YOUR PRINTKARR ENQUIRY'}</p><h1>${confirmed?'Thanks for the note.':'Let’s get in touch.'}</h1><p>${confirmed?'Your enquiry has been saved. Our team will use the contact details you shared to get back to you.':'Use our contact form to send an enquiry. If you have already sent one, our team will get back to you using the details you shared.'}</p><div class="hero-actions"><a class="btn loud pk-btn pk-btn-primary" href="/order">Start a print ${icon('arrow-up-right')}</a><a class="btn ghost pk-btn pk-btn-ghost" href="/">Back to Home</a></div><a class="studio-link" href="/contact">${confirmed?'Need urgent order help?':'Send an enquiry'} →</a>${confirmed?'<span hidden data-contact-confirmed></span>':''}</section>`)});
}
export function notFoundPage() {
  return shell({title:'Page not found',body:pageWrap(`<section class="studio-message"><div class="studio-404" aria-hidden="true">4<span>0</span>4</div><p class="studio-kicker">A PAGE OUT OF PLACE</p><h1>Page not found.</h1><p>The link may have changed, or this page no longer exists. Your next great print is still right here.</p><div class="hero-actions"><a class="btn loud pk-btn pk-btn-primary" href="/">Back to Home ${icon('arrow-up-right')}</a><a class="btn ghost pk-btn pk-btn-ghost" href="/order">Start a print</a></div><a class="studio-link" href="/contact">Get help with an order →</a></section>`)});
}

export const POSTS = [
  {
    slug: 'prepare-documents-for-printing-vapi', title: 'How to prepare a PDF for printing in Vapi', modified: '2026-10-01',
    excerpt: 'Prepare PDFs for local printing with checks for pages, margins, colour and delivery. Avoid common mistakes before ordering assignments, resumes and documents.',
    headings: ['Start with the final document', 'Check every page in the PDF', 'Match the page range to the file', 'Keep page size and margins deliberate', 'Choose colour and sides for the purpose', 'Review copies and the complete price', 'Choose delivery before your deadline', 'Inspect the finished print'],
    sources: [{ title: 'Adobe: adjusting PDF page size for printing', url: 'https://helpx.adobe.com/acrobat/desktop/print-documents/set-up-and-print-pdfs/page-size.html' }, { title: 'Adobe: printing PDFs in Acrobat Reader', url: 'https://helpx.adobe.com/reader/desktop/print-pdfs.html' }],
    body: [
      'Finish edits in the original document before exporting your PDF. Check names, roll numbers, dates, page headings and any information the recipient expects. A readable filename such as assignment-final.pdf helps you recognise the correct version at upload. Use the original document where possible rather than a screenshot of text; a screenshot may already contain blurred letters or missing edges.',
      'Open the exported PDF on the device you will use to order. Scroll through the cover, contents, diagrams, references and final page rather than checking only the first screen. Look for missing characters, shifted tables, accidental blank pages and images that have become hard to read. If something is wrong, correct the original document and export again before uploading.',
      'PDF page positions and the page numbers printed inside a report can differ. A cover may be the first page in the file even when the report starts numbering later. For example, a cover followed by ten numbered pages contains eleven PDF pages. Use the upload preview and detected page count to identify your selection, then check that the final selected range includes everything required.',
      'Choose the paper size required by your college, employer or document issuer. Check whether the PDF mixes portrait and landscape pages or different sizes. Adobe distinguishes fitting content to a printable area from printing at actual size; either choice can change the result. If exact scale matters, such as for a template, confirm that requirement with support before paying rather than assuming automatic fitting will preserve it.',
      'Black-and-white is often sufficient for ordinary text. Choose colour when a diagram, annotation or instruction depends on colours being distinguishable. Read the recipient’s rules before selecting single-sided or double-sided printing. A submission that requires single-sided pages should follow that rule even if duplex would use less paper. For a report read as a booklet, also check the intended page order.',
      'Review the number of copies separately from the page selection. Selecting ten pages and two copies requests twenty printed pages, while the number of physical sheets depends on the sides setting. Check the current printing charge and every delivery or applicable fee in the order summary. Wallet bonus terms and eligibility can differ from the amount you pay into your wallet, so read the displayed offer details.',
      'PrintKarr accepts online orders at any time, with delivery options depending on the location and available service. Vapi and Daman delivery and selected-campus batch slots are different arrangements. Enter your destination and choose an available option before checking out. If an assignment deadline is close, confirm that the promised timing works for you; online availability does not promise immediate physical delivery.',
      'After receiving the prints, compare the first and last pages, page order, copies, colour choice and legibility with your PDF. Keep your order reference and contact support promptly if the result differs from the selected settings. Retain your own original file for future corrections; PrintKarr’s print-file retention process is separate from your personal copy. The preparation checklist is useful even when you print elsewhere.'
    ]
  },
  {
    slug: 'admit-card-printing-checklist', title: 'Admit card printing: a checklist before exam day', modified: '2026-10-01',
    excerpt: 'Check your admit card against the issuing authority’s instructions, choose suitable print settings and confirm your delivery deadline before placing an order.',
    headings: ['Read the current official instructions', 'Download and verify the correct file', 'Check photographs and machine-readable codes', 'Choose the required print settings', 'Keep every required page', 'Leave time for delivery and inspection', 'Compare the print with the original', 'Pack the documents the authority asks for'],
    body: [
      'Start with the exam authority’s official website, admit card and current instructions for your specific examination. There is no universal rule requiring all admit cards to be colour, black-and-white, single-sided or accompanied by the same identity document. Follow the issuer’s stated requirements. If a coaching message or social post conflicts with the official instructions, ask the authority to resolve the difference before ordering.',
      'Download the admit card yourself from the official source and keep the original PDF available. Check that it belongs to the correct examination and session, and review your name, application details, examination centre and reporting information. A printing service cannot correct the authority’s record. If those details appear wrong, use the issuer’s support process rather than editing the admit card to make it look correct.',
      'Preview every page at a readable zoom. The photograph, signature area, barcode or QR code should not be obscured by cropping, annotations or a screenshot interface. A blurred download cannot be repaired simply by printing in colour. When something appears incomplete, download again from the official source or ask the issuing authority for guidance. Avoid redrawing codes or adding unrequested information.',
      'Select the paper size, colour and sides specified for the exam. If the instructions require an A4 colour single-sided print, choose those settings explicitly. Where the issuer does not specify a setting, choose a legible result and contact the authority if unsure about acceptance. Do not assume a document preview on a bright screen guarantees that a faint photograph or tiny text will print clearly.',
      'Check the complete file before choosing a page range. Some admit cards include instructions, declarations or additional pages that must be brought to the centre. A cover or instruction page can also change the PDF page positions. Select all required pages and the required number of copies; do not remove a page merely because it looks unrelated to the first-page admission details.',
      'Work backwards from the time you need to leave for the examination, including time to receive and inspect the print. PrintKarr accepts online orders at any time, but the available delivery options depend on your address and selected service. A participating campus morning slot is not automatically an urgent home-delivery service. Confirm timing with support before paying if the available option does not clearly meet your deadline.',
      'When the prints arrive, compare them with the saved PDF. Check your details, all page edges, photographs, codes, instructions and page order. If the job does not match your selected settings or text is unreadable, keep the order reference and contact support promptly. Leave enough time for a correction rather than discovering the issue while travelling to the centre.',
      'Read the authority’s checklist again when packing your bag. Bring only the photographs, original identity documents, declarations or other materials it requires, and complete signatures only where and when instructed. Keep digital backups for your own reference, but do not treat a phone copy as a substitute where a physical document is required. A PrintKarr print does not establish document validity or guarantee examination admission.'
    ]
  },
  {
    slug: 'running-a-printkarr-kiosk', title: 'PrintKarr kiosk planning: costs and responsibilities', modified: '2026-10-01',
    excerpt: 'Explore planned PrintKarr kiosk partnerships. Compare hardware, consumables, servicing and responsibilities, then contact our team to discuss a future proposal.',
    headings: ['Treat this as a proposed partnership', 'Separate hardware from operating costs', 'Choose a capacity for actual demand', 'List the recurring costs', 'Decide who owns each responsibility', 'Plan access, uptime and exceptions', 'Model demand without assuming returns', 'Ask for a location-specific proposal'],
    body: [
      'PrintKarr’s first self-service kiosk is planned for Vapi. This guide is a preparation checklist for a proposed kiosk partnership, not an operating-profit report from a live public installation. Delivery ordering is available separately. Before committing to a machine or a location, ask the team about pilot availability, the intended deployment process and which terms will apply to your proposal.',
      'The public partnership page lists indicative hardware reference prices of ₹1,29,000 plus GST for PrintKarr PRO and ₹69,000 plus GST for PrintKarr MINI. Those figures should not be read as an all-inclusive installation or operating quote. Ask what is included, what is optional, how taxes apply and whether delivery, setup, connectivity or other location requirements add costs.',
      'The published capacity references are 1,950 sheets for PRO and 650 sheets for MINI. Paper capacity is not the same as daily print throughput, guaranteed uptime or colour capability. Estimate the likely mix of short assignments and longer documents at your location, then ask which proposed hardware configuration fits it. Consider how often somebody could realistically refill paper during busy periods.',
      'Make a recurring-cost list before building a budget: paper, toner or ink, consumable replacements, electricity, internet connectivity, cleaning, servicing and any space cost. Actual amounts depend on equipment, suppliers, usage and the agreement. Obtain quotations rather than copying generic rent, electricity or commission numbers. Also ask how damaged sheets, unsuccessful jobs and unexpected component replacements are accounted for.',
      'PrintKarr describes franchise-owned, space-partner and custom partnership models. The public overview gives different responsibilities for hardware, space, consumables, support and the platform. Turn that overview into a written checklist for your own agreement. Identify who purchases refills, receives service alerts, attends the location, approves refunds and communicates with users when the machine cannot fulfil an order.',
      'Check power, network reliability, access permissions and physical placement with the building owner. A machine in a college corridor cannot serve users when that corridor is locked. Discuss accessible placement, safe cable routing and the response when internet, power or printing fails. Ask for the proposed service arrangement and escalation contacts instead of assuming that self-service means nobody needs to manage it.',
      'Estimate demand from a real location survey or existing print activity, using quieter days as well as deadline peaks. Separate projected paid orders from free or promotional printing. Compare expected revenue against consumables and the quoted agreement terms, and include a lower-demand scenario. A kiosk price or paper capacity does not establish a payback period, fixed income or guaranteed return.',
      'Use the partnership enquiry with your city, type of location, expected audience, available space, power and internet details. Ask for current pricing, deployment readiness, servicing terms, payment responsibilities and contract conditions in writing. Keep your investment decision tied to that proposal. Until a public kiosk launch and pickup location are announced, customer orders should use the available delivery service rather than travel to an assumed kiosk.'
    ]
  },
  {
    slug: 'replacing-xerox-queues', title: 'Online printing or a Xerox shop: how to choose', modified: '2026-10-01',
    excerpt: 'Compare online document uploads, print settings and delivery with in-person print shop services. Decide which option fits your files, timing and printing needs.',
    headings: ['Start with the job you need done', 'Use online printing for a prepared document', 'Choose an in-person service when it helps', 'Compare the complete job price', 'Make the print settings explicit', 'Allow for delivery and collection time', 'Handle personal documents carefully', 'Know what PrintKarr offers today'],
    body: [
      'A prepared PDF and a damaged paper original are different printing jobs. Before choosing a provider, decide whether you need ordinary document printing, photocopying, scanning, binding, lamination or a specialist finish. An online document upload does not automatically offer every service associated with a Xerox shop. Checking this first prevents an order that cannot produce the result you actually need.',
      'Online ordering can be useful when the final file is already on your phone or computer. You can select pages, copies, colour and available sides, then review the summary before payment. It is especially helpful for repeatable document jobs such as assignments, resumes or forms. You still need to check the document carefully; a digital order will not correct spelling, missing pages or inaccurate information.',
      'An in-person shop may be the better fit if you need someone to inspect a physical original, discuss a binding finish or check paper options that an online flow does not list. Confirm the shop’s actual services and opening hours rather than assuming every counter has the same equipment. For a specialist requirement, ask for a sample or clear description of the intended result before committing to the whole job.',
      'Compare the complete job rather than only the advertised price per page. Page selection, copies, colour and sides can change the printing amount. Delivery, other applicable fees or a separate finishing service can change the total. A wallet bonus is order credit under displayed rules, not cash returned to you. Read any offer eligibility or expiry before treating it as a saving for your particular job.',
      'Make the instructions precise whichever provider you use. Identify pages by their positions in the PDF, check whether the recipient requires single-sided printing, and explain when colour is essential for a diagram. Confirm the number of copies separately. A short review of these details is easier than fixing a whole assignment that was printed in the wrong range or orientation.',
      'For delivery, select an option that reaches the correct address or participating campus within your deadline. For a shop visit, include travel, opening hours and collection arrangements. Online order placement at night does not guarantee that physical printing or delivery happens immediately. If the timing is urgent or unclear, confirm it with the provider before paying instead of relying on a broad availability slogan.',
      'Check your file for unrelated personal information before sharing it with any provider. Use the intended upload process, keep your own original and read the provider’s privacy information. If a document needs a signature or correction after printing, follow the recipient’s instructions. No general printing service can establish that an identity document, certificate or submitted form is legally valid.',
      'PrintKarr currently offers online document ordering and available delivery in Vapi and Daman, with selected-campus arrangements in Sarigam and Bhilad. Its first Vapi self-service kiosk is planned; there is no announced public pickup address. Start with the delivery options shown for your destination. If you need binding, lamination, walk-in collection or an unlisted specialist service, confirm availability with support rather than assuming the planned kiosk provides it today.'
    ]
  },
  {
    slug: 'colleges-24-7-print', title: 'Campus printing: delivery slots and kiosk planning', modified: '2026-10-01',
    excerpt: 'Plan student document delivery and evaluate a proposed campus print kiosk. Understand how online ordering hours differ from physical access and delivery times.',
    headings: ['Separate current delivery from a planned kiosk', 'Check whether your campus participates', 'Understand the slot and cutoff', 'Review fees and wallet conditions', 'Give complete handover information', 'Prepare files for the institution’s rules', 'Evaluate a kiosk with the campus team', 'Define responsibilities before a partnership'],
    body: [
      'Students often need printing around assignment and examination deadlines, but a useful service needs clear delivery arrangements as well as online ordering. PrintKarr accepts online document orders at any time. Selected-campus batch delivery is a current order option where enabled. Self-service kiosk deployment is a separate planned initiative, beginning with a Vapi pilot; it should not be described as an open machine at every college.',
      'Check the participating campuses and options shown in the order flow. General mentions of Sarigam or Bhilad do not mean every college or hostel in those areas is covered. If your campus is absent, ask support about your exact location before paying for a service that may not reach it. Do not choose another campus merely to obtain a slot or a delivery offer.',
      'Read the available delivery slot and the order cutoff together. A morning slot may require placing the order before an overnight cutoff; an afternoon option can have a different deadline. Use the current times shown for your chosen campus rather than an old promotion or a screenshot. Missing a cutoff can change the available slot, so check the order summary immediately before you confirm payment.',
      'School / college delivery is ₹5 flat. Other available delivery has no extra charge. Wallet top-ups may add bonus credit under displayed rules. Bonus credit is non-withdrawable and may expire.',
      'Provide a working contact number and select the correct campus delivery point. Keep track of the promised slot and follow the order status in your account. If the displayed point is unsuitable for your class timetable or hostel access, confirm another arrangement with support before checkout. A late-delivery wallet credit applies only under an enabled eligible guarantee and does not replace planning around a submission deadline.',
      'Check the assignment or examination instructions before uploading. Confirm the required pages, copies, colour, sides and any cover sheet with the institution’s rules. Export and inspect the final PDF rather than sending several unfinished versions. For a group assignment, decide who will receive the prints and verify the complete page range so a teammate’s section is not accidentally left out.',
      'A campus considering a kiosk should first identify the intended users, permitted access hours, expected demand and proposed location. Assess power, internet connectivity, safe placement, accessibility and how users will get help. A machine behind a locked building door cannot provide unrestricted access. Ask PrintKarr about the planned pilot and a location-specific proposal instead of assuming installation is immediately available.',
      'The public partnership overview offers franchise-owned, space-partner and custom models. Before agreeing, document who provides the space, hardware, consumables, maintenance access and student support. Ask how failed jobs, payments, refunds and service interruptions would be handled. Use the campus partnership enquiry for a proposal. Until a launch and pickup location are announced, students should select the actual delivery option offered for their campus.'
    ]
  },
].filter((post) => !['running-a-printkarr-kiosk', 'colleges-24-7-print'].includes(post.slug));

export function blogsPage() {
  return shell({active:'/blogs',title:'Printing guides',body:pageWrap(`<div class="information-hero"><p class="eyebrow">NOTES FROM THE PRINT DESK</p><h1 class="display">Good prints begin<br><em>with a little know-how.</em></h1><p>Practical guides for assignments, admit cards and documents. A few checks now can save a reprint later.</p></div><div class="journal-grid">${POSTS.map((p,i)=>`<a class="journal-card" href="/blogs/${esc(p.slug)}"><span class="eyebrow">PRINTING GUIDE · ${String(i+1).padStart(2,'0')}</span><h2>${esc(p.title)}</h2><p>${esc(p.excerpt)}</p><span class="rowlink">Read guide ${icon('arrow-up-right')}</span></a>`).join('')}</div>`)});
}

export function blogArticlePage(slug) {
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) return shell({ title: 'Not found', body: pageWrap(`<h1 class="display">Story not found</h1><a class="rowlink" href="/blogs">Back to blogs</a>`) });
  return shell({
    path: '/blogs/' + post.slug,
    article: post,
    desc: post.excerpt,
    title: post.title,
    body: pageWrap(`<article class="service-guide"><nav class="guide-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/blogs">Printing guides</a></nav><h1 class="display">${esc(post.title)}</h1><p class="muted">${esc(post.excerpt)}</p><p class="guide-byline">By <a href="/about">PrintKarr</a> · Reviewed <time datetime="${esc(post.modified)}">1 October 2026</time></p><details class="article-toc"><summary>In this guide</summary><nav aria-label="Article contents">${post.headings.map((heading,i)=>`<a href="#section-${i+1}">${esc(heading)}</a>`).join('')}</nav></details>${post.body.map((p, i) => `<section class="article-section" id="section-${i+1}"><h2>${esc(post.headings[i])}</h2><p>${esc(p)}</p></section>`).join('')}${post.sources ? `<section><h2>Further reading</h2><ul>${post.sources.map(s => `<li><a href="${esc(s.url)}">${esc(s.title)}</a></li>`).join('')}</ul></section>` : ''}<aside class="guide-next"><h2>Put your document into print.</h2><p>Check <a href="/printing-prices">current print prices</a>, <a href="/printing-in-vapi">Vapi delivery</a> or <a href="/printing-in-daman">Daman delivery</a>. For a deadline or campus address, <a href="/contact">confirm coverage and timing</a> before paying.</p><a class="btn loud pk-btn pk-btn-primary" href="/order">Upload &amp; print ${icon('arrow-up-right')}</a></aside></article>`)
  });
}

export function termsPage() {
  return shell({
    path: '/terms',
    title: 'Terms & Conditions',
    body: pageWrap(`<article class="service-guide"><h1 class="display">Terms &amp; Conditions</h1><p>PrintKarr online document printing is operated by PrintKarr Technologies Private Limited, based in Vapi, Gujarat, India.</p><details class="article-toc"><summary>On this page</summary><nav aria-label="Page contents"><a href="#section-1">Print jobs and delivery</a><a href="#section-2">Files and account access</a><a href="#section-3">Payments, wallet and refunds</a><a href="#section-4">Copyright and takedown requests</a><a href="#section-5">Grievance officer &amp; contact</a></nav></details><h2 id="section-1">Print jobs and delivery</h2><p>You confirm you have the legal right to upload and print the file you submit. Review your PDF, page range, copies, colour, sides and delivery details before placing the order. Online ordering is available any time; delivery availability and slots are shown in checkout. For a time-sensitive document or college address, confirm arrangements before paying.</p><h2 id="section-2">Files and account access</h2><p>Uploaded files are stored solely to process your order and supplied to the authorized print workflow. Eligible order files are removed after delivered, refunded or cancelled status and the configured retention period. Keep your original document; PrintKarr is not a permanent file archive. Read our <a href="/privacy">privacy information</a>.</p><h2 id="section-3">Payments, wallet and refunds</h2><p>Pay with Razorpay or your funded wallet. School / college delivery is ₹5 flat; other available delivery has no extra charge. No hidden processing or late-night surge fees apply. Review printing, items and delivery in the final quote. Wallet bonus credit is non-withdrawable and usable only on PrintKarr orders; offer eligibility and expiry rules apply. Where available, use the cancellation action in your account before printing or dispatch. For online payment refunds, hardware failures, incorrect prints or delivery issues, contact support with the order number so the team can verify eligibility and process the refund. Refund timing depends on the payment provider; do not assume a refund has completed until confirmed.</p><h2 id="section-4">Copyright and takedown requests</h2><p>PrintKarr respects intellectual property rights. If you believe any material uploaded or printed through the service infringes your copyright or intellectual property, please submit a written takedown notice to our Grievance Officer at <a href="mailto:${EMAIL}">${EMAIL}</a> with identification of the copyrighted work, evidence of authorization/ownership, and contact details. In accordance with Rule 3(1)(d) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, verified infringing material will be removed or disabled within 36 hours.</p><h2 id="section-5">Grievance officer &amp; contact</h2><p>In accordance with the Information Technology Act, 2000 and rules made thereunder, the contact details of the Grievance Officer are:</p><p><strong>Grievance Officer:</strong> Anirudh Verma<br><strong>Company:</strong> PrintKarr Technologies Private Limited<br><strong>Address:</strong> Vapi, Gujarat, India - 396191<br><strong>Email:</strong> <a href="mailto:${EMAIL}">${EMAIL}</a> · <strong>Phone:</strong> <a href="tel:+919016703180">+91 90167 03180</a></p></article>`)
  });
}

export function privacyPage() {
  return shell({
    path: '/privacy',
    title: 'Privacy Policy',
    body: pageWrap(`<article class="service-guide"><h1 class="display">Privacy Policy</h1><p>Last updated: November 2026. PrintKarr Technologies Private Limited ("PrintKarr", "we", "us") operates the online document printing, stationery and local delivery platform at printkarr.in. This Privacy Policy explains in plain language what personal data we collect, why we collect it, how it is handled, our retention rules, and how you can exercise your rights under India's Digital Personal Data Protection (DPDP) Act 2023, the EU/UK General Data Protection Regulation (GDPR), and applicable US privacy laws.</p><details class="article-toc"><summary>On this page</summary><nav aria-label="Page contents"><a href="#section-1">1. Information we collect</a><a href="#section-2">2. Why we collect it (Purposes &amp; lawful basis)</a><a href="#section-3">3. Who we share your information with</a><a href="#section-4">4. Document retention &amp; automatic purge</a><a href="#section-5">5. Cookies and optional analytics</a><a href="#section-6">6. Your rights &amp; self-service data tools</a><a href="#section-7">7. Children and age requirements</a><a href="#section-8">8. Data security &amp; breach notification</a><a href="#section-9">9. Grievance officer &amp; contact</a></nav></details><h2 id="section-1">1. Information we collect</h2><ul><li><strong>Account information:</strong> When you sign in with Google, we receive your name, email address, profile picture letter, and a unique Google user ID.</li><li><strong>Contact &amp; delivery information:</strong> Delivery addresses you save, recipient phone number, campus/institution name, PIN code, and optional locality coordinates for rider dispatch.</li><li><strong>Uploaded files:</strong> PDF, JPG, and PNG documents you upload for printing. We process your files solely to count pages, extract print specifications, and print your order.</li><li><strong>Transaction &amp; wallet records:</strong> Order histories, itemized printing specs, wallet balances, top-up amounts, coupon codes, and Razorpay payment reference IDs. Card numbers, UPI PINs, and bank passwords are never received or stored by PrintKarr.</li><li><strong>Customer support &amp; reviews:</strong> Messages you send via our contact form and optional reviews you share for the home page.</li></ul><h2 id="section-2">2. Why we collect it (Purposes &amp; lawful basis)</h2><ul><li>To calculate exact printing rates and generate order previews.</li><li>To fulfill, print, pack, and deliver your orders to your designated location.</li><li>To communicate live status updates, delivery alerts, and order confirmations.</li><li>To manage wallet credits, referral rewards, and issue refunds when applicable.</li><li>To comply with statutory legal, accounting, and tax requirements in India.</li></ul><h2 id="section-3">3. Who we share your information with</h2><p>We do not sell, rent, or trade your personal data. We never share your information with third-party data brokers or for targeted behavioural advertising. Data is shared strictly on a need-to-know basis with:</p><ul><li><strong>Print operations:</strong> Order files and print specifications are available only to team members who need them to fulfill the order.</li><li><strong>Delivery riders:</strong> Customer name, delivery address, locality, and contact phone number to complete the physical delivery.</li><li><strong>Payment processor (Razorpay):</strong> Transaction totals and payment reference IDs for payment capture and refund verification. Razorpay operates under PCI-DSS Level 1 compliance.</li><li><strong>Email service providers (Resend / Google):</strong> Customer email address and order confirmation messages to deliver transactional and notification emails.</li><li><strong>Law enforcement &amp; regulatory authorities:</strong> Only when strictly required by applicable court order or binding legal subpoena.</li></ul><h2 id="section-4">4. Document retention &amp; automatic purge</h2><p>PrintKarr is a print-and-delivery service, not a cloud document repository. We operate an automated janitor process to delete files promptly:</p><ul><li><strong>Completed orders:</strong> Uploaded files from delivered, refunded, or cancelled orders are automatically deleted from server storage after a 15-minute verification grace period.</li><li><strong>Abandoned drafts:</strong> Unassigned uploads and unpaid draft files are automatically purged after 24 hours.</li><li><strong>Active orders:</strong> Files for orders currently in the queue or out for delivery are kept only until delivery confirmation.</li><li><strong>Accounts and receipts:</strong> Account profiles, itemized order receipts, and wallet ledger histories are retained for statutory accounting and customer history until you request account deletion.</li></ul><h2 id="section-5">5. Cookies and optional analytics</h2><p>Essential cookies and browser storage are strictly necessary to maintain your sign-in session, keep your cart active, and ensure security. Non-essential analytics (Google Analytics) is <strong>disabled by default</strong> and never loads before your explicit consent. With your permission, it collects aggregated page visits and checkout conversion events without document contents, filenames, or customer contact details.</p><p>You can adjust or revoke your cookie choices at any time by clicking <button class="cookie-preferences" type="button" data-cookie-settings>Cookie preferences</button> in the footer.</p><h2 id="section-6">6. Your rights &amp; self-service data tools</h2><p>Under India's DPDP Act 2023, EU/UK GDPR, and US state privacy laws, you have clear rights over your personal data:</p><ul><li><strong>Right to Access &amp; Portability:</strong> You can download a complete machine-readable JSON copy of your personal data, saved addresses, orders, and wallet records at any time by visiting <a href="/customer/profile#privacy-data">My Account → Data &amp; privacy</a> or clicking <a href="/customer/data/export" download>Download my data</a>.</li><li><strong>Right to Correction:</strong> You can update your name, phone number, and delivery addresses directly in your account profile.</li><li><strong>Right to Erasure (Delete account):</strong> You can permanently delete and anonymize your customer account and wipe all personal records directly in <a href="/customer/profile#privacy-data">My Account → Data &amp; privacy</a>, or by emailing <a href="mailto:${EMAIL}">${EMAIL}</a>.</li><li><strong>Right to Withdraw Consent:</strong> You can withdraw consent for marketing emails via the one-click unsubscribe link in any notification email, or withdraw analytics consent via Cookie Preferences.</li><li><strong>"Do Not Sell or Share My Info":</strong> We do not sell or share personal data under the California Consumer Privacy Act (CCPA) or other state privacy regulations.</li></ul><h2 id="section-7">7. Children and age requirements</h2><p>PrintKarr is intended for individuals who are at least 18 years of age (or the age of majority in your jurisdiction), or students using the platform with the guidance and consent of a parent or legal guardian. We do not knowingly collect personal data from children under 18 without verifiable parental consent under Section 9 of the DPDP Act 2023. If you become aware that a child has provided us with personal data without parental consent, please contact our Grievance Officer immediately for prompt data erasure.</p><h2 id="section-8">8. Data security &amp; breach notification</h2><p>We implement end-to-end HTTPS encryption in transit, strict Content Security Policies with script nonces, scoped role-based access controls, and rate-limited endpoints. In the unlikely event of a security breach affecting personal data, PrintKarr maintains an incident response protocol to notify the Data Protection Board of India and affected users within the timelines mandated by applicable law.</p><h2 id="section-9">9. Grievance officer &amp; contact</h2><p>If you have any questions, concerns, or requests regarding this Privacy Policy or the processing of your data, you can contact our designated Grievance Officer:</p><p><strong>Grievance Officer:</strong> Anirudh Verma<br><strong>Company:</strong> PrintKarr Technologies Private Limited<br><strong>Registered Address:</strong> Vapi, Gujarat, India - 396191<br><strong>Email:</strong> <a href="mailto:${EMAIL}">${EMAIL}</a> · <strong>Phone:</strong> <a href="tel:+919016703180">+91 90167 03180</a></p><p>We acknowledge all privacy grievances within 48 hours and resolve verified requests within 30 calendar days as required by law.</p></article>`)
  });
}

export function vapiPage() {
  return shell({ path: '/printing-in-vapi', body: pageWrap(`
    <article class="service-guide">
      <nav class="guide-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><span>Printing in Vapi</span></nav>
      <p class="eyebrow">PRINTKARR · LOCAL DOCUMENT PRINTING</p>
      <h1 class="display">A4 printouts in Vapi.<br><em>For assignments &amp; everyday documents.</em></h1>
      <p>PrintKarr prints A4 college assignments, project reports, forms and everyday documents for local delivery in Vapi. Upload a PDF, JPG or PNG from your phone, choose B&amp;W or colour, and review the printing and delivery total before payment.</p>
      <div class="local-print-actions"><a class="btn loud pk-btn pk-btn-primary" href="/order">Upload &amp; print ${icon('arrow-up-right')}</a><a class="pk-btn pk-btn-ghost" href="https://wa.me/919016703180">WhatsApp 9016703180</a></div>
      <details class="article-toc"><summary>On this page</summary><nav aria-label="Page contents"><a href="#section-1">What can you print?</a><a href="#section-2">Delivery areas and timing</a><a href="#section-3">How much does printing cost?</a><a href="#section-4">Where can I get delivery?</a><a href="#section-5">How do I order?</a><a href="#section-6">How do I print a college assignment in Vapi?</a><a href="#section-7">How do I set my school or college address?</a><a href="#section-8">Can I get it before my submission deadline?</a><a href="#section-9">Wallet payment and file access</a><a href="#section-10">Before you print</a><a href="#section-11">Need help with a local order?</a></nav></details><h2 id="section-1">What can you print?</h2>
      <p>Order black-and-white or colour document prints for college assignments, project reports, resumes, office documents, forms, tickets and admit cards. Select your page range and copies in the order flow. Follow your college, employer or exam authority’s requirements for paper and print settings.</p>
      <h2 id="section-2">Delivery areas and timing</h2>
      <ul><li><strong>Vapi:</strong> local delivery to the address you select, subject to checkout coverage.</li><li><strong>Daman:</strong> see our <a href="/printing-in-daman">Daman document delivery guide</a> for address and timing checks.</li><li><strong>Schools and colleges:</strong> choose institution delivery, then enter the name, address and locality. Local coverage is checked before payment.</li></ul>
      <p>Online ordering is available 24/7. Delivery uses available slots and service rules, rather than an immediate-delivery promise. Enter the correct address, PIN code and locality, then review the fee and slot. For a deadline or an address the checkout cannot accept, call <a href="tel:+919016703180">+91 90167 03180</a> before paying.</p>
      <h2 id="section-3">How much does printing cost?</h2>
      <p>See our <a href="/printing-prices">current A4 printing rates</a>. Your exact total depends on selected pages, copies, colour, sides and delivery. The quote shows printing, delivery and applicable fees before payment. <a href="/order">Upload your document to see your quote</a>; a displayed per-page rate is not an all-inclusive delivery charge.</p>
      <h2 id="section-4">Where can I get delivery?</h2>
      <p>Choose an available delivery address or eligible campus option in checkout.</p>
      <h2 id="section-5">How do I order?</h2>
      <ol><li>Upload your document and check its page count.</li><li>Select the pages, copies and print settings you need.</li><li>Select your delivery address or eligible campus slot and review the total.</li><li>Use your wallet or the available payment options, then place the order and follow it in your customer account.</li></ol>
      <h2 id="section-6">How do I print a college assignment in Vapi?</h2>
      <p>Upload your assignment and check the preview before paying. Choose the pages, single-sided or both sides, and copies your college requires. For a report with colour diagrams, use mixed B&amp;W and colour printing to select the colour pages individually. A Vapi hostel or home uses address delivery; choose school / college delivery only when the institution is your actual destination.</p>
      <p lang="hi">वापी में कॉलेज असाइनमेंट या A4 प्रिंटआउट चाहिए? PDF या फोटो अपलोड करें। भुगतान से पहले प्रिंट सेटिंग, डिलीवरी शुल्क और समय देखें।</p>
      <h2 id="section-7">How do I set my school or college address?</h2>
      <p>School / college delivery is ₹5 flat. Enter the institution name, address and locality. Other available delivery has no additional charge.</p>
      <h2 id="section-8">Can I get it before my submission deadline?</h2>
      <p>Check the next available delivery window shown in your order. Campus and scheduled routes use cutoff times; uploading after a cutoff moves the window to the next day. Online ordering is available at any time, but printing or delivery is not guaranteed around the clock. For a deadline outside the displayed window, <a href="/contact">confirm with support</a> before paying.</p>
      <h2 id="section-9">Wallet payment and file access</h2>
      <p>Google sign-in gives access to your order history and wallet. Purchased balance and promotional bonus credit can have different rules; bonus credit is non-withdrawable and usable on PrintKarr orders. Review the current offer and its validity before a top-up. You can complete an order on the website without a mandatory WhatsApp conversation.</p>
      <p>Keep the final PDF until you have checked the delivered print. Uploaded order files are removed after eligible completed, refunded or cancelled orders pass the configured retention period; the website is not a document archive. Read the <a href="/privacy">file-handling information</a> before uploading sensitive material.</p>
      <h2 id="section-10">Before you print</h2>
      <p>Check fonts, margins, cover pages and diagrams in the final PDF. Read our <a href="/blogs/prepare-documents-for-printing-vapi">document preparation guide</a> and <a href="/blogs/admit-card-printing-checklist">admit card checklist</a>.</p>
      <h2 id="section-11">Need help with a local order?</h2>
      <p><a href="tel:+919016703180">Call 9016703180</a>, <a href="https://wa.me/919016703180">message us on WhatsApp</a> or <a href="/contact">contact PrintKarr</a> to confirm college coverage, urgent delivery timing or address coverage.</p>
    </article>`) });
}

export function damanPage() {
  return shell({ path:'/printing-in-daman', body:pageWrap(`<article class="service-guide">
    <nav class="guide-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><span>Printing in Daman</span></nav>
    <p class="eyebrow">PRINTKARR · DAMAN DOCUMENT DELIVERY</p><h1 class="display">Printouts in Daman.<br><em>Order from your phone.</em></h1>
    <p>PrintKarr offers online document printing with local delivery in Daman. The service is based in Vapi: upload your PDF or photo, choose black-and-white or colour printing, and confirm a Daman delivery address and available slot before paying.</p>
    <div class="local-print-actions"><a class="btn loud pk-btn pk-btn-primary" href="/order">Upload &amp; print ${icon('arrow-up-right')}</a><a class="pk-btn pk-btn-ghost" href="/printing-prices">See printing prices</a></div>
    <details class="article-toc"><summary>On this page</summary><nav aria-label="Page contents"><a href="#section-1">Confirm your Daman address first</a><a href="#section-2">Documents for work, applications and everyday use</a><a href="#section-3">Can I order at night?</a><a href="#section-4">Daman delivery and college batches are different</a><a href="#section-5">What does the order cost?</a><a href="#section-6">Before submitting and after delivery</a></nav></details><h2 id="section-1">Confirm your Daman address first</h2><p>Enter a complete address, recipient contact number and PIN code, and check the map point when the order flow asks for it. These details help distinguish your destination from the service’s Vapi base. Review the available delivery option and its fee before placing the order. If checkout does not accept your location, contact <a href="tel:+919016703180">+91 90167 03180</a> before making a payment; a city-wide description does not confirm every individual address.</p>
    <h2 id="section-2">Documents for work, applications and everyday use</h2><p>Use the service for PDFs, resumes, forms, tickets, assignments, reports and admit cards. Select only the PDF pages you need and the correct number of copies. For diagrams or photographs that must retain colour, choose colour explicitly. Check the organisation’s instructions before selecting paper size, single-sided or double-sided output. A printed copy does not replace an original document when an application requires the original.</p>
    <h2 id="section-3">Can I order at night?</h2><p>Yes, online orders can be placed at any time. The delivery time depends on the available slot, location and order rules. We do not promise an immediate or overnight delivery simply because the website accepts an order. For an exam, travel departure or appointment, confirm the timing before payment and allow time to inspect the delivered pages.</p>
    <h2 id="section-4">Daman delivery and college batches are different</h2><p>A residential or business delivery in Daman is not automatically a campus batch. Fixed college slots and free-delivery offers apply only where the college and order qualify. Selected colleges in Sarigam and Bhilad require separate confirmation; availability there does not establish a Daman campus partnership. Choose the option that matches the actual destination rather than selecting a college to obtain a delivery benefit.</p>
    <h2 id="section-5">What does the order cost?</h2><p>Our <a href="/printing-prices">printing price guide</a> shows current per-page rates. Selected pages, copies, print settings, delivery and applicable fees determine the final total. Preview the quote before using wallet balance or the available online payment options. Promotional wallet credit is non-withdrawable and can have eligibility and expiry rules; review them before topping up.</p>
    
    <h2 id="section-6">Before submitting and after delivery</h2><p>Open the final PDF, check every page and leave important text away from page edges. Use the <a href="/blogs/prepare-documents-for-printing-vapi">PDF preparation checklist</a> and <a href="/blogs/admit-card-printing-checklist">admit card guide</a> when relevant. Keep your original file and compare the delivery with your order settings. If you need help, quote the order number when you <a href="/contact">contact PrintKarr</a>. WhatsApp is optional; uploading, payment and order placement happen on the website.</p>
  </article>`) });
}

export function printPricesPage({ pricing }) {
  return shell({ path:'/printing-prices', body:pageWrap(`<article class="service-guide pricing-guide">
    <nav class="guide-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><span>Printing prices</span></nav>
    <p class="eyebrow">A4 DOCUMENT PRINTING · VAPI &amp; DAMAN</p>
    <h1 class="display">Clear prices.<br><em>Before you pay.</em></h1>
    <p>These are PrintKarr’s current A4 document printing rates. The final quote includes your selected pages, copies and settings, plus delivery and applicable fees. Review that quote before placing an order.</p>
    <div class="local-print-actions">
      <a class="btn loud pk-btn pk-btn-primary" href="/order">Get your exact quote ${icon('arrow-up-right')}</a>
      <a class="pk-btn pk-btn-ghost" href="/how-it-works">How it works</a>
    </div>
    <div class="grid c3 guide-rates">${[['Black & white',pricing.bw],['Colour',pricing.color],['Student B&W',pricing.studentBw]].map(([label,value])=>`<section class="card"><h2>${label}</h2><strong>${rs(value)}</strong><p>per printed page${label==='Student B&W' ? ', when eligible' : ''}</p></section>`).join('')}</div>
    <div class="pk-chiprow" style="margin:20px 0 28px"><span class="pk-chip">75 GSM Copy</span><span class="pk-chip">100 GSM Bond</span><span class="pk-chip">Loose sheets</span><span class="pk-chip">Stapled</span><span class="pk-chip">Spiral</span><span class="pk-chip">Wiro</span><span class="pk-chip">Hardcover Thesis</span></div>
    ${bulkPricingGuide(pricing)}
    <h2 id="section-2">Pages, sheets and copies</h2><p>A PDF page and a physical sheet are different. A double-sided sheet can carry two printed document pages; it does not automatically halve the charge for the document content. Selecting ten document pages and two copies produces twenty printed pages. Review the detected page count, selected range and copies so you do not pay to print unwanted covers or blank pages.</p>
    <h2 id="section-3">Black-and-white, colour and student rates</h2><p>Use black-and-white for text-only documents when colour is not required. Select colour for diagrams, photographs or instructions that depend on it. Student pricing applies only when the account or order meets the eligibility shown by the service; it is not a blanket discount on every colour or delivery charge. Choose single-sided or double-sided printing according to your college, employer or exam authority’s requirements.</p>
    <h2 id="section-4">Delivery is quoted separately</h2><p>Per-page rates describe printing. Address delivery in <a href="/printing-in-vapi">Vapi</a> or <a href="/printing-in-daman">Daman</a>, eligible campus batches and express options can have different fees and availability. Free campus delivery, minimum order rules and cutoff times apply only where the checkout confirms eligibility. Enter the actual destination and inspect the full total; do not assume that a wallet bonus covers every delivery option.</p>
    <h2 id="section-5">Wallet credit and offers</h2><p>Your wallet can pay for PrintKarr orders. Current top-up offers and their bonus amounts appear on the <a href="/customer/wallet">wallet page</a>. Purchased balance and promotional credit have different rules: bonus credit is non-withdrawable, usable on PrintKarr orders and subject to any offer expiry. Membership passes, when enabled, are separate from ordinary top-ups. Review the terms shown for the specific offer before paying.</p>
    <h2 id="section-6">A quote tailored to your document</h2><p>Upload the final file, choose page ranges and copies, select print settings and delivery, then review the itemised quote. It shows the price for that order rather than an estimate for an unseen document. There is no mandatory WhatsApp step. Follow our <a href="/how-it-works">order guide</a> or <a href="/contact">contact support</a> if the destination or a time-sensitive request needs clarification.</p>
    <div class="pk-hero-actions" style="margin-top:36px">
      <a class="btn loud pk-btn pk-btn-primary" href="/order">Start a print ${icon('arrow-up-right')}</a>
    </div>
  </article>`) });
}
