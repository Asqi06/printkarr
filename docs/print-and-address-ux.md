# Print and address checkout

Choose **Split B&W + colour**, then enter or select only the original colour page numbers. All other selected pages go to the B&W PDF. Each set has a private preview; the source PDF remains unchanged. Pricing and semester-pack quotas use the original selected page counts and copies. Compressed PDFs are counted by the PDF parser.

The updated agent downloads the original PDF, creates two temporary PDFs, validates the render of all three before submitting any paper, then prints the B&W and colour sets sequentially. Each set receives its own colour mode, sides and copies. Both sets must complete before output can be confirmed. Originals stay under the existing retention policy; temporary agent files are cleaned after success or failure. Partner shops can download both sets from their assigned order.

These are **separate sets**: duplex applies within each set. The shop must arrange original page order or bind after printing. Epson L3250 duplex remains manual. Existing mixed orders retain their manual workflow; old agents cannot claim new split orders. Run `npm ci` and restart the laptop agent after updating its checkout. Real printer output still needs an operator check.

The agent cover uses the supplied PrintKarr artwork in `agent/assets/order-cover.pdf`. It preserves the design and QR, adds compact order metadata in the clear upper-right corner, and prints one separate single-sided colour sheet per order. The cover renders before any paper is submitted; document copies, colour mode and duplex settings remain separate. Metadata uses standard Latin fonts with clipped long names and replacement characters for unsupported scripts.

Assigned partner shops can download the same cover through their protected order desk. The generated preview also passed the actual Sumatra render check. Its physical test is pending while existing Epson jobs finish; their queue was left untouched.

Atlas startup reloads the latest state after file restoration and retries only boot maintenance on a version conflict, up to three attempts. A failed boot closes its database connection and starts no background timers. Background maintenance refreshes Atlas before changing data. Stale writes stop before file sync; cleanup preserves unknown/newer uploads from other instances. Customer writes retain the version guard. Run `npm run test:atlas-safety` for the offline regression and `npm run test:atlas` for persistence in a separate temporary database.

Address checkout uses saved addresses directly, with a default first. A new address asks for the full written address, city, PIN, phone and locality. It is saved for the next order. Locality coordinates estimate the delivery fee and shop proximity; optional device location takes precedence. GPS denial does not block locality checkout, and a late GPS callback cannot overwrite a changed locality or city. No map library or API key is required for address entry.

Vapi rates retain their distance bands: ₹15–₹50 express and ₹10–₹25 scheduled. Distance remains a 1.25× straight-line estimate, rather than a road route. School / college rates remain ₹10 scheduled / ₹25 express. Approximate locality centres are labelled; rider navigation searches the full written address instead of claiming the locality centre is the doorstep.

The customer stationery catalogue has no demo fallback. Only real products appear and can enter a cart. Admin `/admin/catalogue` and shop `/partner/catalogue` support product names, photos, prices, stock, visibility and ownership. Sample/draft listings remain private until published as real stock.

Checks: `npm test`, `npm run test:ux`, `npm run test:checkout`, `npm run test:store`, `npm run test:delivery`, `npm run test:design`, `npm run test:print-safety`. Print checks use temporary files, a fictional wallet and mocked printer calls; no real money, customer document, email or paper is used.

Hardware check: stop the automatic agent only when its app and printer queues are idle, then run `npm run test:print`. This submits three real sheets (cover, B&W page, colour page) through the actual agent and Sumatra using an isolated loopback queue. It never inserts paid test orders or changes customer data. Restart the scheduled task afterwards. The final ink/page-quality check must be made at the output tray.

Verification on 7 October 2026: live checkout assets match the pushed source, the live stationery catalogue has no demo cards, and the updated Windows scheduled agent resumed live polling. The first real printer check rendered the source and both split PDFs, then stopped on a printer error; the owner confirmed the printer was off/disconnected. The test's failed job was removed from its own spool queue; no customer order was created or changed.

After the owner switched the printer on, the same real check passed on `L3250 Series(Network)`: source and both split PDFs rendered, then cover, monochrome and colour queues drained sequentially. The owner confirmed all three sheets were correct, including readable B&W output and the red, green and blue blocks on the colour page. The scheduled agent resumed live polling and the printer queue was empty. Customer data and payment records were not used for this test. This verifies single-sided split printing; L3250 duplex remains manual.
