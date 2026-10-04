# Printkarr — Demo Build (PRD Phase 1)

Hyperlocal print + stationery ordering and delivery for Vapi · Sarigam · Bhilad.
Three role apps (customer, rider, printer/admin) running on one demo server with
mock data and simulated payments, printing and deliveries.

> **Demo Mode** — no real payments, printer jobs or deliveries occur.
> Every page carries the demo banner.

## Quickstart

```bash
npm install
npm run seed   # load the demo dataset (9 users, 19 orders)
npm start      # http://localhost:3000
```

`npm test` runs the order state-machine suite.

Admin alerts are at `/admin/notifications`: customer sign-ins, confirmed print orders and successful wallet top-ups appear across open admin pages (5-second polling). Click **Enable sound** on each page to unlock browser audio; choose Chime, Bell or Soft in the inbox. Sound styles are saved on that browser, and each event has a different melody. Closed or suspended browser pages do not receive background push alerts.

Customers can enable reminder/offer emails and change website reminder preferences at `/customer/notifications`. The existing OTP mailer also sends these emails; no new credentials or dependency are needed. Admins can switch reminders/offers/email off and set the delay (default: 1 hour after login). A server job checks every minute, sends at most one reminder/offer per customer per 7 days, stops no-order reminders after payment, and targets only customers who signed in within 30 days. Old accounts begin tracking on their next login. Emails include an unsubscribe confirmation link; pending messages recheck preferences, orders and offer eligibility before sending. The server must remain running for scheduled delivery. Email delivery counts are visible in the admin inbox.

Run `node --test lib/notify.test.js` for notification scheduling, delivery and access checks. Tests use an isolated in-memory database and a fake mailer.

Influencer coupons use the existing checkout coupon field. At `/admin/coupons`, add an optional influencer name/handle when creating a code (leave it blank for regular offers). Use the same name for multiple codes belonging to one influencer. The performance table shows unique paying customers, new customers, paid checkouts, net sales, coupon discounts and cancelled/refunded checkouts. Attribution is saved on orders and shared baskets; unpaid reservations and preview/demo payments do not count, refunds remove active conversions, and a shared basket is counted once per influencer. Print-level coupons attribute only the print's paid value; cart coupons attribute the basket. This tracks coupon redemptions, not visits or logins. New customers are identified by their first successful paid checkout.

Influencer coupons do not create friend referrals or award referral wallet credit. Friend codes stay in the separate referral field, and existing Refer & Earn eligibility and rewards still apply. New coupon and referral codes cannot collide. The existing one-use-per-customer coupon rule and prohibition on adding a cart coupon over a print coupon remain in place. No influencer commission or payout system is added. Run `node --test lib/influencers.test.js` for the attribution and coexistence checks.

## Demo accounts (`/login`)

| Role | Email | Password |
|------|-------|----------|
| Customer (Ani) | `customer@demo.printkarr.in` | `customer123` |
| Rider (Rahul) | `rider@demo.printkarr.in` | `rider123` |
| Printer / Admin | `admin@demo.printkarr.in` | `admin123` |

## The golden loop (60 seconds)

1. **Customer** → + New Print Order → upload any PDF → set options → pay (simulated).
2. **Admin** → order queue → open the job → send to print queue → start printing → mark printed → assign Rahul.
3. **Rider** → accept → at pickup → picked up → start delivery → arrived → confirm delivery.
4. **Customer** → order page shows ✓ Delivered with the full trail and timestamps.

## Structure

```
prd.md              product spec — source of truth
PROGRESS.md         PRD § → phase → status tracker
server.mjs          routes (role-gated) + serving (public/ only)
lib/machine.js      §38 order state machine — the only way statuses change
lib/db.js           JSON mock-DB layer (+ seed defaults incl. pricing)
lib/auth.js         demo sessions (httpOnly cookie, persisted)
lib/pricing.js      live-config quotes, page-range parser, progress %
lib/notify.js       in-app notifications on every major state
lib/views*.js       server-rendered pages sharing one design system
data/seed.js        deterministic demo dataset (§43)
data/uploads/       customer PDFs (git-ignored)
public/             design.css, login.css, customer.css, shell.js, index
```

Only `public/` is served statically — `*.md`, `/data/*`, `/lib/*`,
`server.mjs` all return 404.

## Deliberately simulated (PRD Phase 2/3 later)

The Atlas deployment persists the existing JSON data model and print files.
A relational data model, stronger auth and larger file storage can follow
when the pilot outgrows Atlas Free.

## Going live (production)

### Search visibility for Vapi

The public site serves `/printing-in-vapi`, `/sitemap.xml`, `/robots.txt`, and `/llms.txt`. Canonical URLs and the sitemap use `PUBLIC_SITE_URL` (default `https://printkarr.in`). Run `npm run test:seo` when changing public pages or posts; the sitemap is generated from the same page list as the metadata.

After deployment, verify the live sitemap and service page, then verify the site in [Google Search Console](https://search.google.com/search-console/about) and submit `/sitemap.xml`. Add the site to [Bing Webmaster Tools](https://www.bing.com/webmasters/) too. The owner must complete account verification. Create a Google Business Profile only when the business meets Google's eligibility rules and has a verifiable real business presence; enter the real location, phone, delivery area and hours, then maintain them as service changes. Do not list a kiosk pickup address until it opens. Search placement and AI citations depend on crawlers and search systems; these files do not guarantee a ranking.

The app needs durable storage for its JSON database and customer uploads.

**Option A — MongoDB Atlas Free with Render Free:**

Atlas stores the complete database and customer uploads in GridFS. Create
a Free/M0 cluster, a database user, and allow your computer's IP and the
[Render service's outbound IP ranges](https://render.com/docs/outbound-ip-addresses)
in Atlas Network Access. Keep the connection string secret. Set
`MONGODB_URI` in a local `.env`, then initialize a **new empty shop** once:

```bash
CONFIRM=INIT_EMPTY_ATLAS npm run init:atlas
```

On PowerShell, set `$env:CONFIRM='INIT_EMPTY_ATLAS'` before the command.
The initializer refuses to overwrite an existing Atlas database. Add
`MONGODB_URI` to Render's Environment page using **Save only**, then deploy
the code. The app refuses to start if Atlas is unavailable or uninitialized;
`/api/ready` reports `mongodb-atlas` when connected. Remove any old
`INIT_EMPTY_DB` variable. Atlas Free has a 512 MB hard storage limit, so
monitor usage and export regular backups as the shop grows.

**Option B — host with a persistent disk:**

```bash
NODE_ENV=production
ADMIN_EMAIL=you@yourdomain.in
ADMIN_PASSWORD=<long-random-password>
```

Attach a **persistent disk at the app's `data` directory** so `db.json`
and uploaded files survive restarts. The exact Render mount path is
`/app/data` for this Dockerfile, or `/opt/render/project/src/data` if
the service uses Render's native Node runtime. A Dockerfile `VOLUME`
declaration alone does not provision a Render persistent disk.

> ⚠ Render's default filesystem loses changes on every deploy or restart.
> Production now refuses to start unless its `data` directory is an
> actual mount. It also refuses a missing or unreadable database instead
> of replacing customers, orders, coupons or prices with defaults.

**If the shop already has live data, back it up before changing the disk
or deploying again.** Copy both `data/db.json` and the entire
`data/uploads/` directory from the currently running instance to a safe
location, then restore them onto the new disk before starting the new
version. Verify the customer and order counts against `/api/ready` and
check a recent admin price and coupon. Do not run `npm run seed` or
`npm run reset-prod` during this migration. On a paid Render web service,
use its Shell/SSH access to export the current files. Free Render web
services do not provide Shell/SSH or persistent disks, so preserve any
still-running data before upgrading or redeploying.

For a genuinely new empty shop, set `INIT_EMPTY_DB=yes` for its first
boot on the mounted disk, then remove that variable. Existing shops
should restore their database instead. After the next deploy,
`/api/ready` and the boot log should show that the same volume marker
survived. The owner admin is created from the env vars above on an
empty database; demo accounts are not created in production.

**Option C — Docker / VPS:**

```bash
docker build -t printkarr .
docker run -d -p 3000:3000 \
  -e NODE_ENV=production \
  -e ADMIN_EMAIL=you@yourdomain.in \
  -e ADMIN_PASSWORD=<long-random-password> \
  -e INIT_EMPTY_DB=yes \
  -v printkarr-data:/app/data \
  printkarr
```

Use `INIT_EMPTY_DB=yes` only for a new shop with no existing records, then
remove it. A VM setup is described in [deploy/README.md](deploy/README.md).

**Before sharing the URL:**

1. Log in as the owner, open Admin → Settings/Pricing, set your real
   business details and prices.
2. Kill the demo: set `DEMO_LOGIN=off` (demo passwords stop working and
   the demo cards vanish from `/login`), then open Admin → Settings →
   **Demo access** and remove each demo account. Orders are kept.
3. For **disk-backed deployments only**, if the live DB still holds demo data, wipe it clean once:
   back up `data/db.json`, run `CONFIRM=RESET npm run reset-prod`,
   restart with `ADMIN_EMAIL`/`ADMIN_PASSWORD` set. Never run
   `npm run seed` on the live server — it restores demo data.
4. If you ever see `⚠ PRODUCTION WARNING` in the logs, a default demo
   credential is still active — finish step 2 immediately.
5. Serve behind HTTPS (Render/Railway do this automatically; on a VPS
   put nginx/Caddy in front). Secure cookies and proxy handling are
   already wired — no code change needed. Rider GPS also requires HTTPS.
6. Export the Atlas database and uploads regularly, or back up the entire
   `data/` directory on a disk-backed deployment.

### Google sign-in (production)

With `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` set, `/login` shows
**Continue with Google**. Behaviour:

- Google verifies the email, so sign-in **links by email**: a matching
  rider/admin account keeps its role (handy — your rider signs in with
  the same Gmail you registered for them).
- Brand-new addresses become **customers** automatically (wallet included).
- Without keys the button hides itself — local demo is unaffected.
- Register both redirect URIs in Google Cloud Console (see `.env.example`):
  `http://localhost:3000/auth/google/callback` for local testing and
  `https://YOUR-LIVE-DOMAIN/auth/google/callback` for production.
- Never commit `.env` — it's git-ignored; paste keys into the host's env dashboard.

### WhatsApp order forwarding (no API key)

Set `OWNER_WHATSAPP_NUMBER` (digits with country code, e.g. your mobile).
Every order page — customer detail, pay page, admin job screen — then shows
a WhatsApp button that opens a chat containing the full brief (document,
pages, spec, customer, address, slot, totals, payment state) **plus a secure
PDF link**. The link (`/share/<token>`) needs no login, expires in 7 days,
and is scoped to that one order. No WhatsApp Business API required.

### Razorpay (live payment)

Set `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET`. The pay page then offers a
live Razorpay option (card/UPI) alongside the simulated methods; the server
creates the gateway order and verifies the HMAC signature before confirming.
Without keys the option hides itself. Always test end-to-end with `rzp_test_`
keys first, then swap to live keys.

### Is production healthy?

Open `https://YOUR-DOMAIN/api/ready` — user/order counts, uploads
writability, and capability flags (razorpay/whatsapp/google). If anything
shows `false` or `0 users`, fix env/storage before sharing the URL.
Boot logs also self-report: storage status, missing keys, and weak demo
credentials are all printed at startup — read them first when something
looks dead.

### Env keys (see `.env.example` — copy, don't invent)

| Key | Needed? | What for |
|-----|---------|----------|
| `PORT` | Optional (default 3000) | Port to listen on |
| `NODE_ENV=production` | Yes, in production | Prod logging, secure cookies, demo-credential warning |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Yes, first boot | Creates your owner admin on an empty DB |
| `HUB_LAT` / `HUB_LNG` | Optional | Hub pin on the live map (defaults: Sarigam) |
| `MAP_TILES_URL` / `MAP_ATTRIBUTION` | Optional | Only if you switch tile providers (Mapbox) |

**Maps need zero secrets.** Rider GPS comes from the phone browser,
tiles come from OpenStreetMap (free, no key, attribution included on
every map). The only requirement is **HTTPS in production** — browsers
block GPS on plain HTTP. Render/Railway give you HTTPS automatically.

### Live tracking how-it-works

Rider opens a job → Navigate → **Share live location** → phone GPS posts
a fix every few seconds → customer's order page polls and moves the dot.
Fixes are scoped: a customer sees only their own order's rider, only
while it's on the road; riders can only write their own fix. No fix yet
(or GPS denied) → both sides see an honest waiting state, never a fake dot.

## V0 classroom pilot runbook (laptop + Epson L3250, ₹0)

Student scans QR → orders on their phone → laptop prints → student collects.
No Raspberry Pi, no delivery riders, no real money (V0-A test payments).

### Desk setup (once)
1. Epson L3250 on USB, Windows driver installed, test page prints.
2. SumatraPDF (free) — run the installer; use the installed binary at
   `%LOCALAPPDATA%\SumatraPDF\SumatraPDF.exe` (a fresh portable exe may
   self-install on first run instead of printing — always verify with the
   paper test in step 4 of Pilot day).
3. Print ONE pdf by hand and note what works:
   `SumatraPDF.exe -print-to "Epson L3250 Series" -print-settings "duplexlong,monochrome" file.pdf`
   If mono/color/duplex flags differ on your machine, set `PRINT_SETTINGS`
   in `.env` instead of guessing — the agent uses it verbatim.
4. Laptop + student phones on the **same Wi-Fi**. `ipconfig` → IPv4
   (e.g. `192.168.1.5`). Paper + ink loaded.

### Pilot `.env` (on the laptop)
```
PORT=3000
AGENT_TOKEN=<long-random>
PRINTER_NAME=Epson L3250 Series
SUMATRA_PDF=C:\Users\WELCOME\AppData\Local\SumatraPDF\SumatraPDF.exe
FILE_RETENTION_MINUTES=15
DEMO_LOGIN=on
```
No Razorpay/Google/WhatsApp keys needed for V0-A.
The agent sends page ranges and copy count directly to SumatraPDF. Its log
shows how long each cover and document took to spool; printer hardware may
take longer to put the sheet in the tray.

### Slow printing? (Epson L3250 is an inkjet, ~10 pages/min in Draft)

1. Windows Settings → Printers → Epson L3250 → Printing preferences →
   Quality **Standard (Normal)**, grayscale default. Draft mode prints
   faint slips that look half-missing; photo quality spools huge jobs and
   crawls. Standard is the pilot setting.
2. Keep B&W orders monochrome (the agent already sends `monochrome` for
   B&W) and close other apps competing for USB/spool.
3. The agent prints serially by design (one job at a time so files never
   mix) — a queue of big jobs is supposed to take minutes, not seconds.

### Pickup flow (no Pi yet)

Printed jobs auto-advance to **Ready for pickup**, which the customer sees
live with a kiosk chime. The agent also prints the pickup QR as its own
page after the document, and the admin order page shows the same QR while
the order awaits collection: the customer scans it with their phone and
taps "I collected my prints", flipping the order to **Collected**. The
link is single-use and expires in 7 days — it is the same mechanism the
Pi screen will display later. Customers can also open the scanner from
their order page (camera permission + on-device QR decode, with a
"just use your phone camera" fallback).

### Pilot day (two terminals)
```bash
npm install
npm start            # terminal 1: app + queue on http://localhost:3000
npm run agent        # terminal 2: print agent (polls every 2s)
```
1. Open `http://localhost:3000/admin/qr`, print the page, paste in classroom.
2. QR encodes `http://<laptop-LAN-IP>:3000/order` — students scan, upload,
   pick Classroom pickup (₹0 delivery), test-pay, watch status.
   Paid orders auto-queue: the agent grabs them within ~2 seconds and
   prints with no clicks from you. (Manual queue buttons remain for
   requeues and failures.)
3. Collect printed bundles at the counter, matched by the cover slip
   (Order ID on top of every job — never re-sort the output tray).
4. Dry-run the whole loop first without paper:
   `DRY_RUN=1 npm run agent` (add `RUN_ONCE=1` for a single job).

### Soak target (§23)
50–100 test orders with zero manual Ctrl+P before even discussing
Raspberry Pi. Completed working files become eligible for cleanup after 15 minutes
(`FILE_RETENTION_MINUTES`); cleanup runs every 5 minutes. Order records and history are kept.


### Automatic Windows print agent

Run `npm run agent:install` once on the computer connected to the printer.
This installs a hidden Windows Scheduled Task for the current user and starts
it immediately (if a manual agent is running, the task waits for it to exit before taking over).
It uses this checkout's `.env`, polls the existing queue, restarts after crashes,
and starts again each time this Windows user signs in. Keep the checkout at
its installed path; rerun installation if you move it or change Node's path.
The task uses your normal user account so the installed printer is available.

- `npm run agent:status` shows the task state and log path.
- Logs: `%LOCALAPPDATA%\PrintKarr\logs\agent.log` (5 MB plus one archive).
- `npm run agent:uninstall` removes future startup; it does not kill an active print.
- Windows allows only one local agent through an OS-managed lock, including
  accidental manual `npm run agent` launches.

The PC must be awake, signed in, connected to the internet, and able to reach
the printer. Locking the screen is fine; signing out or shutting down stops
printing. No Windows password is stored and power settings are not changed.
Already-started jobs are not automatically reprinted after a crash; inspect
failed/stuck orders and the output tray before retrying from the admin page.

## Campus wallet and delivery offers

Customer wallet offers default to ₹49→₹59 (first top-up only, first campus batch delivery free), ₹99→₹110, ₹199→₹225, ₹499→₹575, and ₹799→₹950. Custom top-ups credit the paid amount without a percentage ladder. Purchased and legacy balances do not expire; new bonus grants default to 90 days, remain non-withdrawable, and are spent first. Refunds retain each grant's original expiry instead of turning bonuses into purchased money.

Configure offers, bonus validity (0 = no expiry), campus addresses, batch fees, slots, and the missed-slot guarantee at `/admin/settings`. The optional Semester Pass is disabled by default; enabling it gives ₹550 wallet balance for ₹499 and 90 days of free campus batch delivery. Existing quota-based Semester Packs remain separate.

Morning delivery defaults to 09:00–11:00 IST with payment before 01:00 IST; Afternoon defaults to 13:00–15:00 with payment before 11:00. Batch delivery is free at ₹99 print subtotal or through an eligible wallet/pass benefit. Express delivery retains its paid tariff. The order stores its promised slot and reward terms. A settlement sweep runs each minute and on startup, issuing the ₹20 missed-morning-slot credit once for eligible paid orders. Customers see the selected date and payment cutoff before paying.

Configure referrals at `/admin/referrals`: link the code before the first paid order, add ₹99+ in one wallet top-up, and complete the first paid order. Only then credit the friend ₹20 and the referrer ₹25, plus ₹50 at 3 successful referrals and ₹100 at 5. Milestones, qualification amounts, rewards, monthly cap, and program availability are editable. Previously earned cash stays in its original withdrawal ledger.

Guest checkout, signed-in checkout, and reorders share the same review and payment flow. WhatsApp sharing is optional. Run `npm test`, `npm run test:design`, `npm run test:seo`, and `node scripts/delivery-check.mjs` for verification.


### Print reliability and file retention (October 2026)

The Windows agent renders every source page with SumatraPDF before submitting any paper,
validates actual page count/range, explicitly sets A4, scaling, colour, sides and copies,
and monitors the printer queue until it drains. Cover and document run sequentially.
Keep Windows printer defaults at the intended quality and A4; the agent cannot detect ink
coverage on a physical sheet. L3250 automatic duplex is unavailable; those jobs are held
for manual processing.

**Output verification is required:** the order stays PRINTING after queue completion.
In `/admin/orders/:id`, check page count, first/last pages, legibility and copies, then
click “Confirm all pages printed”. This marks it ready and allows the next order.
Choose the incomplete/blank action for bad output. Inspect the printer before retrying;
a retry prints the whole order. To avoid duplicating good pages, download the original,
manually print only missing pages, then confirm the complete output. Printing failures
pause the queue across agent restarts; inspect the failed order and retry or refund it.
No unattended automatic retries occur.

Update server and agent together. An old agent cannot confirm completion on the new server.
`PRINT_TIMEOUT_SECONDS` defaults to 1800 (30 minutes per file). The monitored helper cancels
only jobs belonging to that invocation on failure; it never resets the shared spooler.

Completed (DELIVERED, REFUNDED, CANCELLED) working files are deleted after the configured
retention period (default 15 minutes) on a cleanup that runs every 5 minutes. Abandoned
drafts and unassigned upload files expire after 24 hours. Active and failed order files
are retained for processing/correction. Deleted working files are also removed from Atlas
GridFS, including older duplicate versions, by storage sync. Cleanup also runs at startup.
Cleanup failures are logged and retried; a failed storage sync requires service recovery.
Order/payment history remains. Provider backups and already downloaded copies have their
own retention. Agent temporary documents are removed after the monitored invocation ends.

Paper-free regression checks: `node scripts/print-safety-check.mjs` and `npm test`.
The real printer still needs an operator-observed run of the previously failing PDF;
queue status cannot certify whether a sheet is blank.
