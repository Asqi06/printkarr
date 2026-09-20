# Printkarr — Build Progress Tracker

Source of truth: `prd.md`. Every PRD section maps to exactly one phase.
Status: `pending` · `in-progress` · `done` · `verified`.
A phase is `verified` only when its "Done-means" check passes.

## Phase 0 — Foundation (scaffold, machine, seed, design tokens)
| PRD | Section | Status | Note |
|-----|---------|--------|------|
| §38 | Order state machine | verified | `lib/machine.js`, 5 tests green |
| §39–40 | DB models / order shape | verified | `lib/db.js` + `data/seed.js` |
| §43 | Demo data (5+3 people, 15–20 orders) | verified | 9 users, 18 orders, 12 statuses |
| §46 | Pragmatic demo stack (user decision) | verified | Express + JSON DB, `npm start` |

## Phase 1 — Auth + shell
| PRD | Section | Status | Note |
|-----|---------|--------|------|
| §3 | Demo login, 3 accounts, Demo Mode banner | verified | 3 logins, 401 on bad pw, logout kills session |
| §4 | Shared shell, sidebar + mobile bottom nav | verified | role navs, 403 cross-role, anonymous bounced |

## Phase 2 — Customer
| PRD | Section | Status | Note |
|-----|---------|--------|------|
| §5 | Customer dashboard | verified | current-order card, quick actions, live promo |
| §6 | Upload PDF | verified | real page count, 50MB cap, PDF-only guard |
| §7 | Document preview + page range | verified | range parser, 400 on invalid |
| §8–9 | Print options + extras | verified | type/sides/copies/A4/orientation/binding/notes |
| §10 | Addresses | verified | saved + new inline + default switching |
| §11 | Delivery slots | verified | ASAP/Today/Schedule + times |
| §12 | Order summary + student discount | verified | math asserted ₹29 incl. discount line |
| §13 | Simulated payment | verified | UPI/wallet/COD, wallet deduct, 402 when light |
| §14 | Tracking timeline | verified | history-driven, timestamped |
| §15–16 | Orders tabs + reorder | verified | active/completed/cancelled + clone flow |
| §17 | Wallet | verified | add money, tx ledger, refund on cancel |
| §18–19 | Profile + notifications | verified | details, addresses, feed, help |

## Phase 3 — Rider
| PRD | Section | Status | Note |
|-----|---------|--------|------|
| §20 | Rider dashboard | verified | next-delivery card, pending/today/earnings |
| §21 | Rider order tabs | verified | assigned/active/completed + ownership |
| §22 | 7-step delivery workflow | verified | accept→pickup→deliver, skip-guard asserted |
| §23 | Simulated navigate | verified | hub→drop km/min/contact card |
| §24 | Delivery proof | verified | handover radio + note, merged to customer timeline |
| §25 | Earnings | verified | today/week/breakdown from ledger (₹15/₹30) |

## Phase 4 — Admin
| PRD | Section | Status | Note |
|-----|---------|--------|------|
| §26 | Control-center dashboard | verified | live counts, revenue, pages |
| §27 + §44 | Order queue + search/filter | verified | 8 filters + id/customer search |
| §28–29 | Print queue + job screen | verified | queue→printing→printed, PDF download |
| §30 | Printer status sim | verified | ink/paper drain per job, current job |
| §31–32 | Riders + manual assignment | verified | add/toggle, assign w/ distance sort |
| §33 | Customers | verified | ledger, history, addresses |
| §34 | Pricing editor (no hardcode) | verified | live via /api/config, asserted |
| §35 | Coupons | verified | create/toggle + applied at checkout (₹70) |
| §36 | Analytics | verified | sales, pages, repeat, avg delivery |
| §37 | Settings | verified | business, hours, limits editable |

## Phase 5 — Golden loop + hardening
| PRD | Section | Status | Note |
|-----|---------|--------|------|
| §1–2 | Roles/service area/pricing | verified | zones + prices asserted via /api/config |
| §41–42 | Notifications + demo loop | verified | PK-1043 full loop, 9 pings audited |
| §45 | Mobile responsiveness | verified | bottomnav/safe-area/reduced-motion/tblwrap pass |
| §47–51 | Routes, phasing, architecture | verified | 31 route checks, README documents phasing |

Out of scope (PRD Phase 2/3): real DB, real auth, Razorpay, WAHA, Epson integration, maps.

## Conversion layer (blueprint, post-Phase-5)
| Blueprint | Item | Status | Note |
|-----------|------|--------|------|
| §2 | Minimal landing, one CTA, no login wall | verified | live stats, trust strip, 3-step |
| §2 | Action-before-identity guest funnel | verified | upload → configure → OTP → order |
| §2 | OTP-only auth (no passwords for customers) | verified | rate-limited, demo code shown locally |
| §3 | Single-scroll configurator + live total | verified | toggles, stepper, area chips, sticky total |
| §3 | Merged top-up/pay CTA | verified | one tap covers shortfall + bonus |
| §4 | Wallet ladder + live nudge | verified | tiers live from pricing, bonus credited |
| §4 | First-delivery-free trial | verified | auto on first order, shown everywhere |
| §6 | Reorder-first returning home | verified | one-tap reprint card |
| §7 | No catalog/wizard/progress-bar clutter | verified | guest flow is one scroll, no progress bar |

## V0 prototype (classroom pilot: laptop + Epson L3250, Hindi PRD)
| V0 PRD | Item | Status | Note |
|--------|------|--------|------|
| §3–5,18–19 | Student web flow (upload/options/ID/queue) | verified | guest funnel already matched; pickup zone added |
| §6,38-machine | Print queue + serial agent API | verified | token auth, oldest-first, 409 on illegal |
| §7,9,17 | Laptop agent (Node, poll-print-report) | verified | DRY_RUN cycle: cover + serial copies → PRINTED |
| §13 | Cover page identification | verified | hand-built PDF, xref-validated, no deps |
| §15 | PK-*.pdf filenames, PDF-only | verified | pre-existing; enforced per settings cap |
| §16 | Auto-delete (6h default) | verified | janitor sweeps old terminal files only |
| §11 | QR entry | verified | /qr.png encodes live host URL + printable page |
| §10 V0-A | Test payments | verified | simulated paths intact for pilot |
| §8,22 | Status + acceptance | verified live | real paper proven: upload → auto-queue → agent → Epson, PK-1043/1045/1046 PRINTED on hardware |
| §14,30+ | AI / Pi / enclosure / sensors | out of scope | explicitly per PRD, after 50–100 order soak |

## Live cutover (production, no mockups)
| Item | Status | Note |
|------|--------|------|
| Mock data wiped (backup at `data/db.backup-live.json`) | done | live DB: 1 owner admin, 0 orders |
| Demo logins killed (`DEMO_LOGIN=off`) | verified | cards hidden, demo passwords 401 |
| Live-only payments (Razorpay + COD) | verified | simulated methods hidden + POST-guarded (400) |
| Demo wallet top-ups off | verified | form hidden, POST-guarded |
| Google button actually rendered | fixed+verified | was accepted but never painted; now asserted |
| Owner bootstrap + login | verified | cutover script green end-to-end |
