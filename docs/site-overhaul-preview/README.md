# PrintKarr website overhaul — 6 October 2026

The local ordering preview is available at http://127.0.0.1:3133/ . Its data, wallet, orders, payments and printer are isolated demo state.

The shared layout now covers the storefront, print flow, stationery and basket, customer dashboard/orders/wallet/packs/profile/referrals/inbox, public guides and sign-in, admin panels, shop partner catalogue and rider workspace. Existing actions and server validation are reused.

## Verification

- 72 rendered screen states: landmarks, headings, shared styling and inline scripts.
- All 72 states at 320px and 768px: one main heading and no document horizontal overflow; detailed tables scroll within their container. Measurements are in `responsive-checks.json`.
- Representative desktop and 390px mobile screens visually reviewed.
- 67 automated tests passed.
- Delivery, checkout, mixed print, store and SEO checks passed.
- Isolated account actions checked: wallet offer credit, pack booking and installment, profile save, valid address save and invalid-address rejection.
- Native disclosures checked in the browser for pack selection and address entry. Offer selection updates its amount and announced balance.

## Screenshots

- `home-desktop.jpg`: student and hyperlocal delivery homepage.
- `packs-desktop.jpg`: three comparable packs with clear booking and remaining cost.
- `wallet-desktop.jpg`: configured offers with selection state.
- `account-mobile.jpg`: personal details on a small phone.
- `partners-mobile.jpg`: shop onboarding form on a small phone.

Real shops must be activated with accurate service capability, owned stock and staff/rider accounts before they appear in nearby shop results. The preview does not send email, collect real payments or print documents. No live deployment was performed.
