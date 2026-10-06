# PrintKarr local delivery and shop operations

The storefront now prioritises school/college prints, nearby shops and stationery. Kiosks and QR pickup are unavailable; `/kiosks` and the old franchise page explain development status.

## Delivery rules

School/college orders require the institution name, street address and delivery pin. Any institution in supported local coverage can use ₹10 scheduled delivery or ₹25 institution express. These rates are not restricted to LIT. Earned wallet benefits can waive an eligible school batch fee.

Vapi address rates use the fulfilment shop (or PrintKarr desk) as the origin:

| Estimated distance | Express | Scheduled |
| --- | ---: | ---: |
| Up to 2 km | ₹15 | ₹10 |
| Over 2 to 4 km | ₹25 | ₹15 |
| Over 4 to 6 km | ₹35 | ₹20 |
| Over 6 to 8 km | ₹45 | ₹25 |
| Over 8 km, within coverage | ₹50 | ₹25 |

Distance uses 1.25 times straight-line distance. It is an estimate, not a road routing result. The shop radius and checkout coverage checks apply. Daman and other existing address routes retain their configured rates. ₹149+ after discounts gives free scheduled address delivery; it does not waive school or express delivery.

Existing enabled windows and their IST cutoffs determine the next scheduled delivery. Vapi scheduled delivery is enabled on migration; subsequent admin choices are respected. Capacity defaults to 30 orders per desk/window and is configurable per shop. The promised window does not depend on reaching a minimum batch size.

## Onboard a shop

1. Open `/admin/partners` and create a partner account and the required rider accounts. New staff passwords are salted scrypt hashes.
2. Enter the shop’s actual pickup address, coordinates, area, service radius, capabilities, batch capacity and agreed per-side printing settlement rates.
3. Activate only when the shop and rider coverage are ready. Pause a shop with its Active setting.
4. The partner signs in at `/partner/login`, then manages its own products, selling prices, photos and stock at `/partner/catalogue`. Admin can assign product stock ownership at `/admin/catalogue`.
5. Customers find active shops at `/shops`. A selected shop is preserved through upload, price review and payment. Its stationery page shows only its products.

Without a selected shop, compatible nearby partners can be selected automatically for print-only orders. PrintKarr-owned stationery stays at the central desk. A basket combines one shop’s prints and stationery; stock from different shops needs separate purchases.

## Prepare and deliver

Use `/admin/delivery` to view paid orders by delivery window, assign riders and handle rejection/failure reports. Reassign printing before it starts. Stationery stays with the shop owning its stock; the original customer delivery fee is preserved.

At `/partner`, staff see only their assigned paid orders and documents: accept, print/check/pack, mark ready, then confirm handover to the assigned rider. A print or stock problem is reported to operations for reassignment, reprint or refund. The central printer agent cannot claim partner jobs.

At `/rider`, each rider sees only assigned trips, pickup addresses and delivery/contact details. Shop handover is required before starting a partner delivery. Delivery confirmation advances the whole basket together. Receipts show the fulfilment shop and delivery state.

Shop payable is the agreed printing rate per printed side plus its stationery selling value after allocated coupon discounts. These are recorded amounts due; bank payouts are not automated. Unpaid stock reservations are released by cancellation; gateway reconciliation and automatic hold expiry remain the next scaling improvement.

## Verification and local preview

Run `npm test`, `npm run test:delivery`, `npm run test:checkout`, `npm run test:store`, `npm run test:ux`, `npm run test:design` and `npm run test:seo`.

`npm run preview:orders` serves an isolated in-memory preview at `http://127.0.0.1:3133/`. It does not take real money, send email or use a printer. Real customer-facing shop availability requires onboarding and actual stock; the preview does not pretend shops are already live.


## Improved semester pack quota

| Pack | Price | B&W sides | Included colour sides | Files |
| --- | ---: | ---: | ---: | ---: |
| S | ₹329 | 130 | 30 | 2 |
| M | ₹499 | 250 | 45 | 4 |
| L | ₹725 | 400 | 60 | 5 |

Included colour is consumed first. Every extra colour side exchanges three unused B&W sides automatically; this is one-way. Mixed assignments and copies share the same quota check. For example, a fresh S pack covers 60 colour sides and retains 40 B&W sides; L covers 400 B&W plus 60 colour sides together.

The standard legacy S/M/L subscriptions upgrade on their next pack access or checkout validation. Used sides, file claims, payments and remaining dues are preserved; custom quota snapshots are left intact. Unpaid orders reserve both included and exchanged quota. A paid cancellation restores the actual printed sides once, which also returns exchanged B&W capacity.

A pack must cover the whole document/order. If it cannot, normal printing charges appear before payment; delivery, binding and surcharges stay separate. Booking still costs ₹199, with the remaining pack price due in installments.

Verification: `node --test lib/packs.test.js` and `node scripts/mixed-print-check.mjs` cover upgrades, 60 colour sides, mixed usage, reservations, payment and refund replay. The browser estimate uses the same quota helper as server validation.
