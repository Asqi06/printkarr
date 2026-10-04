# Stationery marketplace preview

The marketplace includes an in-memory preview for reviewing the shop and shared checkout without real payments.

Run `npm run preview:store`, then open [the shop](http://127.0.0.1:3131/stationery). The preview uses an in-memory database, a fictional customer with ₹1,000 of demo wallet credit, and a sample delivery address. Nothing reaches a payment provider, printer, customer database or email service. “Add a print” uses a fictional assignment in this preview; the website retains its normal PDF/image upload and print settings flow.

Switch to [the demo shop owner](http://127.0.0.1:3131/preview/role/admin) or [the demo customer](http://127.0.0.1:3131/preview/role/customer). Restarting the preview resets its data.

## Delivery and discounts

- A single cart holds stationery quantities/colours and owned unpaid print orders. One checkout creates a purchase receipt and takes one payment. Each basket uses one address and delivery slot; changing the cart delivery updates every linked print when payment succeeds.
- Free delivery applies at **₹149 or more of combined item value after discounts**, including stationery-only, print-only and mixed baskets. Prepaid semester-pack coverage, first-print benefits, print coupons, referrals and a cart coupon reduce qualifying item value. Wallet payments and wallet bonuses are payment methods and do not reduce it. Below ₹149, the progress bar shows the exact shortfall.
- Server pricing determines product prices, discounts, serviceability, route charge and total; submitted price/fee/total fields are ignored. The address map, scheduled route radius, enabled campus/slots and explicitly enabled pickup location remain authoritative. A ₹149 basket cannot enable an unavailable route or an address outside coverage.
- The old configurable ₹99 ordinary campus free-delivery rule is replaced by ₹149 **for shared checkouts**. Existing first campus delivery and wallet member benefits can still make a smaller basket eligible for free delivery. Pickup remains free when enabled. Available emergency express is also waived at ₹149; it has no unrequested exclusion.
- Late-night charges and print demand surcharges stay separately itemised. Free delivery waives the base delivery charge; it does not silently waive these existing extras. Missed-slot credits remain one per delivery, rather than one per document.

## Catalogue and fulfilment

No real products, selling prices, photos or stock list were supplied. Initial cards are explicitly marked as demo products and cannot be purchased with real money. Default samples disappear when the shop owner adds a catalogue. Use `/admin/catalogue` to add/edit names, categories, descriptions, prices, stock, product photos, visibility and the demo flag. Local photos may use `/images/…`; remote photos must use HTTPS. Products without a photo have a labelled placeholder. File colours are orange, green, red and yellow; stock is pooled across these colour options and this is stated in the editor.

Use `/admin/purchases` to manage whole baskets. Paid prints enter the existing printer queue; stationery and the parent purchase never enter it. Pack stationery with the linked prints before marking the whole basket ready. Prints must finish before a mixed basket can be ready. Admin fulfilment then confirms dispatch/delivery or pickup. Individual print dispatch, cancellation/refund and print-only collection QR confirmation are blocked for shared purchases, so a basket is not accidentally split.

Customer purchase history is at `/customer/purchases`. Removing a print from the cart cancels that unpaid print and releases its coupon/pack reservations; its original upload follows the existing cancellation retention policy. Paid wallet purchases can be cancelled/refunded once, as a whole, while fulfilment permits it. The refund restores the original wallet grant allocations through the existing wallet helper, plus product stock and used pack quota. Paid coupons remain used after refund. Card/UPI refunds use support and the provider dashboard; the site does not claim an online refund it has not processed.

Existing print analytics continue to track the print portions of mixed purchases. Purchase history contains the full basket amounts, including stationery, for reconciliation.

## Payment and reservations

Every coupon can be used once per customer across print orders and basket purchases. An open order reserves the code; cancelling before payment releases it. Existing print coupons cannot stack with a new cart coupon. Checkout/payment retries and refunds are idempotent.

An open checkout freezes price, delivery and stock snapshots. A newly earned wallet delivery benefit can lower an unpaid basket's charge before an online payment has been bound; it cannot change a provider-bound amount. Stock is reserved server-side, and stock edits cannot undercut held units. Unpaid holds currently last until explicit cancellation; add gateway-aware expiry and webhook reconciliation before high-volume sales. A checkout with a bound/open online payment cannot be cancelled automatically, because that payment may still complete. The receipt offers support instead. Recovery uses the retained checkout and payment proof; automatic webhook recovery is not part of this preview.

Razorpay checkout binds its order ID to the stored basket total. Verification checks the signature and server-fetched payment's order, currency, amount and captured status; an authorised payment is captured for that exact amount. Retry callbacks cannot debit or reduce stock twice. This follows the provider's [payment fetch/capture documentation](https://github.com/razorpay/razorpay-node/blob/master/documents/payment.md). No real charge was made during validation.

## Validation

`npm run test:store` checks print-only, stationery-only and mixed totals at ₹148.99, ₹149 and ₹150; discount treatment, invalid/disabled serviceability, ownership, colour/quantity validation, stock holds, coupon reuse across legacy/new purchases, pack reservation limits, wallet refunds and payment replay. It also calls the actual feature HTTP routes with an in-memory DB to verify native forms, origin/auth checks, ignored client totals and bound gateway proof using a mocked provider.

`node scripts/store-check.mjs --browser` additionally tests 320, 390 and 1440px layouts in Edge: search, colour selection, AJAX add, mixed demo cart, coupon progress, single wallet payment and the admin editor. Screenshots are saved under `docs/store-preview/`. Existing `npm test`, `npm run test:design`, `npm run test:checkout` and print safety checks cover the existing print/account flows.

## Image provenance

Tool mode: built-in image generation. Saved workspace asset: `public/images/stationery-demo-hero.png`. The hero is marked “Illustrative demo imagery”; it is not presented as an actual stock/product photo. All product photos remain explicit placeholders until provided by the shop owner.

Prompt: “Create one wide editorial still-life photograph for a DEMO stationery marketplace hero banner. Landscape 3:2 composition: a stack of unbranded cream and cobalt-blue A5 notebooks, three orange and green cardboard document folders, a few yellow pencils, a white eraser and steel ruler artfully arranged on a warm ivory desk. Soft natural side lighting, tangible paper texture, tasteful student stationery, overhead at a slight angle, authentic quiet studio styling. Cobalt blue #1746e0, warm parchment, restrained orange accents. Place objects mostly on the right half with ample clear ivory negative space on left for HTML headlines, no text anywhere, no logos, no packaging claims, no watermarks, no human. This is clearly illustrative sample catalogue imagery, not a representation of an existing branded commercial product. Sharp detailed texture, usable as a polished website raster asset.”
