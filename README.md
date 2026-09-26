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

Real database, real auth, Razorpay, WhatsApp API, Epson integration,
live maps. The API and module boundaries are kept clean so each can be
swapped without touching the workflows: `lib/db.js` → real DB,
`lib/auth.js` → real auth, `lib/notify.js` → WhatsApp/SMS/push,
uploads → S3-compatible storage, navigate sim → Mapbox/Google.

## Going live (production)

The app is deploy-ready: no build step, no external services required.

**Option A — Render / Railway / any host (easiest):**

```bash
NODE_ENV=production
ADMIN_EMAIL=you@yourdomain.in
ADMIN_PASSWORD=<long-random-password>
```

Deploy the repo as a Node service (`npm ci && node server.mjs`),
attach a **persistent disk mounted at `/app/data`** (or the host's
equivalent) so `db.json` and uploaded PDFs survive restarts.

> ⚠ Without that disk, **every redeploy wipes the live database**:
> coupons, customers, orders and uploads vanish, and the owner admin is
> silently recreated on the empty DB — which looks exactly like "my data
> got replaced". If the boot log says `Fresh data volume on boot` on a
> shop that already had data, the disk is missing. After attaching it,
> the next deploy logs `Data volume survived redeploy`, and
> `/api/ready` reports the volume marker as proof.
On first boot with an empty database, the owner admin is created from
the env vars above — the demo accounts are *not* created in production.

**Option B — Docker / VPS:**

```bash
docker build -t printkarr .
docker run -d -p 3000:3000 \
  -e NODE_ENV=production \
  -e ADMIN_EMAIL=you@yourdomain.in \
  -e ADMIN_PASSWORD=<long-random-password> \
  -v printkarr-data:/app/data \
  printkarr
```

**Before sharing the URL:**

1. Log in as the owner, open Admin → Settings/Pricing, set your real
   business details and prices.
2. Kill the demo: set `DEMO_LOGIN=off` (demo passwords stop working and
   the demo cards vanish from `/login`), then open Admin → Settings →
   **Demo access** and remove each demo account. Orders are kept.
3. If the live DB still holds demo data, wipe it clean once:
   back up `data/db.json`, run `CONFIRM=RESET npm run reset-prod`,
   restart with `ADMIN_EMAIL`/`ADMIN_PASSWORD` set. Never run
   `npm run seed` on the live server — it restores demo data.
4. If you ever see `⚠ PRODUCTION WARNING` in the logs, a default demo
   credential is still active — finish step 2 immediately.
5. Serve behind HTTPS (Render/Railway do this automatically; on a VPS
   put nginx/Caddy in front). Secure cookies and proxy handling are
   already wired — no code change needed. Rider GPS also requires HTTPS.
6. Back up `/app/data/db.json` regularly; it is the whole database.

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
Raspberry Pi. Print files auto-delete 15 minutes after terminal state
(`FILE_RETENTION_MINUTES`); order records and history are kept.
