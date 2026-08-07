# Lil' Loaves — WooCommerce Commerce Layer

**Date:** 2026-08-07
**Status:** Approved design, ready for implementation planning

## Problem

The site is a React SPA built pixel-for-pixel from Figma, with no backend. Every
piece of commerce data is a hardcoded array — products, prices, cart contents,
pickup dates, order history. The bakery owner cannot change the menu, and the
site cannot take money.

Two goals:

1. The client updates the catalogue and menu themselves, regularly, without a
   developer.
2. Customers pay online, securely.

WooCommerce is the chosen platform for both.

## Decisions

| Decision | Choice |
|---|---|
| Architecture | Hybrid headless — React browses and carts, WooCommerce takes payment |
| Handoff point | After contact + address; Woo handles review + payment only |
| Client-managed | Catalogue, Seasonal Specials, Lunch Box options, pickup slots |
| Not client-managed | Marketing copy (Home, About, Gallery, FAQ) stays in React |
| Fulfilment | Local pickup + local delivery. No nationwide shipping. |
| Market | United States, USD |
| Payment gateway | Deferred — swappable in WordPress with zero React changes |
| Accounts | None. No login. Guest checkout only. |
| Order records | Confirmation emails to buyer and bakery |
| Pickup slots | Recurring weekly schedule + blackout dates, no capacity limits |
| Lunch Box | Tag-based composition using existing products, not Product Bundles |
| WordPress hosting | Deferred — see requirements below |

## Architecture

Two deployables under one domain.

```
                        lilloaves.com  (GoDaddy DNS)
                                |
          +---------------------+----------------------+
          |                                            |
    lilloaves.com                            shop.lilloaves.com
    ----------------                         --------------------
    React SPA on Vercel                      WordPress + WooCommerce
    Free                                     ~$10-11/mo

    / /about /menu /product                  wp-admin      <- client works here
    /cart /pickup /gallery /contact          Store API     <- React reads this
    /order-confirmed                         /checkout     <- customer pays here
                                             emails        <- buyer + bakery
```

The React app remains the entire customer-facing experience except for one
screen: the WooCommerce checkout page where payment is taken.

### Read path

React calls the **Store API** (`/wp-json/wc/store/v1/`) directly from the
browser. That API is public and read-only by design, so no credentials exist in
the Vite bundle.

The WooCommerce **admin** REST API (`/wp-json/wc/v3/`, consumer key + secret)
must never be called from the frontend. Those keys are effectively admin
credentials and anything in a client bundle is public.

Responses cache in `sessionStorage` for the session. A build-time snapshot at
`src/data/products.fallback.json` renders the menu if the API is unreachable,
so an outage degrades stock accuracy rather than showing an empty bakery.

### Write path

```
1. React /cart      customer picks items, enters contact + address,
                    or chooses pickup store + date + slot
                            |
2.                  form POST (top-level navigation, NOT fetch)
                            v
3. WP mu-plugin     validates payload, re-prices server-side,
                    fills Woo's cart, prefills billing/shipping,
                    stores pickup meta, redirects
                            v
4. Woo /checkout    order review + payment method + [Pay]
                            v
5. Gateway          Stripe/Square handles the card. We never see it.
                            v
6. Woo              creates order, emails buyer + bakery,
                    redirects to lilloaves.com/order-confirmed
```

Two load-bearing choices:

**Step 2 is a top-level form POST, not `fetch()`.** Building the cart through
API calls would store it in a WordPress session cookie. From `lilloaves.com` to
`shop.lilloaves.com` that is a third-party cookie, which Safari and Firefox
block by default — carts would silently empty at checkout for a large share of
customers, intermittently. A top-level form POST is always first-party.

**Step 3 re-prices server-side.** React posts product IDs and quantities only,
never prices. WooCommerce looks up its own prices. Without this, anyone could
edit the POST body in DevTools and buy a $21 loaf for $0.01.

### Fulfilment

One shipping zone with two methods:

```
Shipping Zone: "Lil' Loaves service area"
  |- Local Pickup     $0        -> no shipping address required
  +- Local Delivery   $5 flat   -> shipping address required, ZIP must
                                   fall inside the zone
```

`Local Pickup` is a core WooCommerce shipping method. When it is the selected
method, `cart_needs_shipping_address()` returns false and WooCommerce hides and
stops validating the shipping address block. This is core behaviour, not custom
code.

Fields collected per path:

| Field | Pickup | Delivery |
|---|---|---|
| Name, email, phone | Yes | Yes |
| Street, city, state | No | Yes |
| ZIP | No | Yes — also gates the delivery zone |
| Country | No | Fixed `US` |
| Pickup store | Yes | No |
| Pickup date + time slot | Yes | No |

The delivery/pickup toggle sits at the top of the cart flow, because it decides
whether the address fields exist at all.

**Delivery orders do not select a date in v1.** The Figma design has a date and
slot picker for pickup only, and inventing one for delivery would be scope the
client has not asked for. Deliveries go out on the bakery's next delivery day
and the confirmation email states which. Flagged as an open question below — if
the client wants customers choosing a delivery date, it reuses the same weekly
schedule with no time slots, and is a small addition rather than a redesign.

React posts `fulfilment=pickup|delivery`; the mu-plugin sets the matching
shipping method before redirecting, and re-validates it. A tampered POST cannot
obtain free delivery to an out-of-area address.

Three things core WooCommerce does not provide, all handled in the mu-plugin:

- Pickup date/time scheduling (Local Pickup has none)
- Minimum order value for delivery
- Distance-based delivery radius — we gate by ZIP list instead, which is free

## Content model

Everything below is a screen the client already has in `wp-admin`, except where
marked custom.

| On the site | In WooCommerce | Client's workflow |
|---|---|---|
| Menu tabs (Breads, Muffins, Cookies, Crackers) | Product categories | Add a category, a new tab appears |
| Menu items | Products | Products > Add New |
| Pack of 2 / Pack of 4 | Variable product + `Pack Size` attribute | Each size gets its own price and stock |
| Sold out | Stock status | Toggle "Out of stock"; React greys the card |
| 4 Seasonal Specials (Home + Menu) | Native **Featured** flag | Click the star in the product list |
| Lunch Box options | Product tags | Tag a product `lunchbox-bread` etc. |
| Delivery fee and area | Settings > Shipping zone | Edit rate, add/remove ZIPs |
| Discount codes | Marketing > Coupons | Native |
| Pickup stores, days, slots, delivery minimum | **Custom** `WooCommerce > Fulfilment` screen | One page, built by us |

### Lunch Box

A bundle — one bread, one cracker, one dessert, one fixed price. The obvious
solution is the Product Bundles plugin (~$49-79/year); we are not buying it,
because the options are products the client already maintains.

```
Product: "Sourdough"            tags: lunchbox-bread
Product: "Japanese Milk Bread"  tags: lunchbox-bread
Product: "Chief's Crackers"     tags: lunchbox-cracker
Product: "Doc's Crackers"       tags: lunchbox-cracker
Product: "Cookies (6)"          tags: lunchbox-dessert
Product: "Muffins (4)"          tags: lunchbox-dessert

Product: "Lunch Box"            price: $39.00   (plain simple product)
```

React builds each column of the builder from the tagged sets, so names and
photos come from products the client already edits. Adding a fourth bread option
means adding a tag.

Chosen options ride along as order line-item meta, so the admin order screen and
packing slip read:

```
Lunch Box x 1 — $39.00
   Bread:    Sourdough
   Crackers: Doc's Crackers
   Dessert:  Muffins (Pack of 4)
```

**Accepted trade-offs:** selecting a Lunch Box does not decrement the individual
sourdough loaf's stock, and premium options cannot carry a price surcharge
without custom work. Swapping in Product Bundles later does not disturb the
checkout architecture.

### Pickup slots

A single settings page under `WooCommerce > Fulfilment`:

```
+- Store -----------------------------------------+
| Name     Orange County Store                    |
| Address  1234 Example Ave, Orange County, CA    |
|                                                 |
| Collection days                                 |
|   Mon Tue Wed Thu Fri [x]Sat [x]Sun             |
|   From 14:00  To 16:00   Slot length 30 min     |
|                                                 |
| Blackout dates                                  |
|   2026-12-25, 2026-12-26, 2027-01-01            |
|                                                 |
| Show the next  4  weeks                         |
+-------------------------------------------------+
                 [ + Add store ]
```

React reads this from a public endpoint and generates the actual dates, so
`PICKUP_DATES` becomes computed and always rolls forward. No per-slot capacity
limits, which avoids a reservation race condition at checkout.

## React changes

### New files

| File | Job |
|---|---|
| `src/lib/woo.js` | Store API client — products, categories, tagged sets, pickup config; `sessionStorage` cache + fallback |
| `src/context/CartContext.jsx` | Single source of cart truth, persisted to `localStorage` |
| `src/lib/quote.js` | Calls `/quote` on cart change (debounced); returns authoritative totals |
| `src/lib/checkout.js` | Builds and submits the handoff form |
| `src/pages/OrderConfirmed.jsx` | Post-payment landing page |
| `src/data/products.fallback.json` | Build-time snapshot |
| `scripts/fetch-fallback.mjs` | Regenerates the snapshot during `npm run build`. If the API is unreachable at build time it logs a warning and keeps the committed snapshot — a WordPress outage must never fail a Vercel deploy. |

### Changed files

| File | Change |
|---|---|
| `src/pages/Menu.jsx` | `BREADS_ITEMS`, `MENU_ITEMS`, `SPECIALS` to API; Lunch Box columns from tagged products. Largest edit. |
| `src/pages/Product.jsx` | Route becomes `/product/:slug`; `PACK_OPTIONS` to real variations |
| `src/pages/Home.jsx` | Specials from featured products |
| `src/components/SeasonalSpecials.jsx` | Takes items as props |
| `src/pages/Cart.jsx` | Reads cart context; mode toggle drives address requirement; coupon field; `SUMMARY_ROWS` fed by `/quote`, never computed locally; submits to Woo |
| `src/pages/Pickup.jsx` | Dates and slots computed from the weekly schedule |
| `src/components/Navbar.jsx` | Live cart count; Profile link removed |
| `src/App.jsx` | `/profile` removed, `/order-confirmed` added, `/product/:slug` |

### Deleted

- `src/pages/Profile.jsx` (409 lines) — no accounts
- The `/email-pickup` route, once its design is ported into the email template

### Cart state refactor

Cart state currently lives in per-page `useState` — quantities in `Menu.jsx`,
a separate `INITIAL_CART_ITEMS` in `Cart.jsx`. These become one context.
Without it, adding on /menu and viewing /cart are unrelated states.

## WordPress side

One must-use plugin, `lil-loaves-bridge.php`, with five responsibilities:

1. **`admin-post.php?action=ll_handoff`** — receives the cart POST, re-prices
   from Woo's data, validates fulfilment mode against the shipping zone,
   populates the cart, prefills billing/shipping, attaches pickup meta,
   redirects to checkout. Registered on both `admin_post_ll_handoff` and
   `admin_post_nopriv_ll_handoff`, the standard WordPress pattern for a form
   POST from a logged-out visitor.
2. **`/wp-json/lilloaves/v1/quote`** — see below
3. **Fulfilment settings screen** — stores, days, hours, slot length, blackout
   dates, and the delivery minimum order value
4. **`/wp-json/lilloaves/v1/pickup`** — public read of that config for React
5. **Order meta display** — pickup store/date/slot on the admin order screen,
   packing slip and emails

Everything else — products, prices, stock, categories, coupons, shipping zones,
orders, refunds, payments, emails — is stock WooCommerce.

### The quote endpoint

`Cart.jsx` already renders a summary of subtotal, shipping and discount
(`SUMMARY_ROWS`). Computing those in React would duplicate WooCommerce's pricing
logic — coupons, tax, delivery rates, minimum-order rules — and any drift
between the two produces a cart total that disagrees with the amount charged.
That is a bug factory and an immediate trust problem for the customer.

Instead, React never calculates money. It POSTs the cart to
`/wp-json/lilloaves/v1/quote` with items, fulfilment mode, ZIP and any coupon
code, and receives authoritative figures back:

```
POST /wp-json/lilloaves/v1/quote
{ items: [{id, qty, variation}], fulfilment: "delivery",
  postcode: "92868", coupon: "LOAF10" }

-> { subtotal: 4226, delivery: 500, discount: 423, tax: 0, total: 4303,
     currency: "USD",
     errors: [] }
```

This is a stateless calculation against a temporary `WC_Cart` — it creates no
session and no order. It resolves four things at once: real coupon validation,
the real delivery fee, sales tax if configured, and the delivery minimum-order
check. The same server-side validation runs again at handoff, so the quote is a
display convenience and never the authority.

The minimum order value for delivery is configurable on the settings screen and
defaults to 0 (disabled).

## Emails

WooCommerce already sends both required emails with no code: **New Order** to
the bakery, **Order Processing/Completed** to the customer. The work is branding
and deliverability.

`src/pages/EmailPickup.jsx` is the customer template's **visual reference, not a
port**. Two hard constraints:

- **No flexbox.** Outlook renders with Word's engine; the layout is rebuilt on
  tables with inline CSS.
- **Custom fonts mostly will not load.** Ligema, Parkinsans and Pacifico fall
  back to system fonts in Gmail and Outlook. The email will be recognisably
  Lil' Loaves — colours, wave header, scalloped cards, pill badges — but not
  pixel-identical. Set the client's expectation accordingly.

Two variants: pickup (store, date, slot, "bring your order number") and delivery
(address, delivery date).

**Launch blocker:** WordPress's default mail uses PHP `mail()`, which lands in
spam or is silently dropped — meaning the bakery misses orders. Install WP Mail
SMTP with a real sender (SendGrid, Brevo or Postmark free tier) and add SPF and
DKIM records to the GoDaddy DNS before launch.

## Security

| Threat | Defence |
|---|---|
| Store credentials leaked from the JS bundle | No credentials exist; Store API is public and read-only, admin API never touched |
| Customer edits prices in the POST | Server re-prices from Woo; client sends IDs and quantities only |
| Free delivery to an out-of-area address | Shipping method and ZIP re-validated server-side against the zone |
| Card data breach | Cards never reach our code or server; gateway-hosted fields; SAQ-A |
| Cart lost in Safari/Firefox | Top-level form POST, never a third-party cookie |
| Handoff endpoint abused | No authenticated session to hijack; rate-limited; worst case is filling your own cart |
| WordPress compromise | Managed host with automatic security patching |

## Hosting

Architecture is identical on every host, so this is deferrable to deploy day.
Four requirements, all met by the candidates below — confirm before paying:

1. Install arbitrary plugins (WooCommerce, gateway)
2. Upload a must-use plugin via SFTP or SSH
3. REST API reachable with controllable CORS headers
4. PHP 8.1+ and a staging environment

| Option | Renewal cost | Server admin | Support |
|---|---|---|---|
| WordPress.com Business (India billing) | Rs 9,600/yr | None | Automattic 24/7 |
| Cloudways, US region | ~$132/yr | Minimal | Cloudways chat |
| WordPress.com Commerce | Rs 17,280/yr | None | Automattic 24/7 |
| Contabo VPS | ~Rs 5,600/yr | All yours | None |

WordPress.com prices by billing country — a US client billing a US card will see
USD pricing (~$45/mo Commerce), not the India-adjusted rate. Whoever buys it
becomes the billing owner.

Commerce's advantage over Business is premium store extensions and store themes,
none of which a headless build renders. Verify with WordPress.com support:
*"On the Business plan, do I get SFTP or SSH access to upload a custom must-use
plugin to wp-content/mu-plugins?"*

The Contabo price gap is not worth it for a client store. Unmanaged means nobody
patches WordPress when a vulnerability drops and nobody takes backups, on a
system holding customer addresses and taking card payments.

React deploys to Vercel free. Vercel cannot host WordPress: its filesystem is
read-only and wiped between invocations, it ships no MySQL, and it has no
first-class PHP runtime. WordPress is stateful software and needs a machine that
stays on and remembers.

## Image quality risk

Commit `f844563` optimised assets from 42MB to 14MB by hand at build time. Once
the client uploads product photos that control is gone, and a bakery owner
photographs bread on an iPhone at 6-8MB. This is the most likely way the project
degrades after handover. Three defences, all applied:

- **Request WordPress's generated sizes, never the original.** Woo's API returns
  `thumbnail`, `medium`, `large` and `woocommerce_single` variants; React uses
  `srcset`, so a 6MB upload serves ~120KB.
- **Install an optimiser** (ShortPixel or Imagify free tier) to compress and
  serve WebP on upload, automatically.
- **Write the client a one-page guide**: square crop, ~1200x1200, and how to
  confirm it worked.

## Out of scope

No customer accounts or login. No marketing-content management — Home, About,
Gallery and FAQ copy stay in React. No subscriptions, multi-currency, product
reviews, wishlist, or in-store POS sync unless Square is later chosen.

## Order of work

Phases 1 and 2 run in parallel, deliberately.

| # | Phase | Who |
|---|---|---|
| 0 | WordPress + WooCommerce installed, staging, HTTPS | Developer |
| 1 | **Client enters the real catalogue** | **Client — start immediately** |
| 2 | Read path: `woo.js`, Menu, Product, Home from API | Developer |
| 3 | Cart context + Cart page wiring | Developer |
| 4 | mu-plugin handoff + checkout styled | Developer |
| 5 | Pickup settings screen + slot generation | Developer |
| 6 | Emails, SMTP, SPF/DKIM | Developer |
| 7 | Launch: sales tax, live gateway keys, DNS cutover, backups, client training | Both |

Phase 1 is the phase that slips. A bakery with 30 products, each needing a
photo, description and price, is a week of the client's time, and no work can be
properly tested until some of it exists. Start them before writing code.

## Open questions for the client

These do not block implementation. Each has a stated default that ships if the
client says nothing.

| Question | Default if unanswered |
|---|---|
| Should delivery customers choose a delivery date? | No. Delivered on the next delivery day, stated in the confirmation email. |
| Is there a minimum order value for delivery? | None. Setting exists, defaults to 0. |
| Which ZIP codes are in the delivery area, and what is the fee? | Placeholder zone with a $5 flat rate; client edits before launch. |
| Are bakery items taxable in their state? | Tax disabled. Must be confirmed with their accountant before launch. |
| Payment gateway — Stripe, Square, or both? | Stripe. Swappable later with zero React changes. |
| Does the bakery use Square at the physical counter? | Assumed no. If yes, Square is the better gateway — it syncs counter and online stock. |

## Pre-launch checklist

- **US sales tax on food is state-specific.** Many states exempt or reduce tax
  on bakery items, often only when sold "not for immediate consumption". This is
  a configuration and accountant question the client must answer before launch.
- Payment gateway selected and live keys installed
- SMTP configured; SPF and DKIM records added to GoDaddy DNS
- Test order placed end to end on both pickup and delivery paths
- Backups verified running
- Client trained on: adding a product, marking sold out, editing the Specials
  star, adding a blackout date, refunding an order

## Testing

Manual test matrix before launch, each on desktop and mobile:

| Case | Expected |
|---|---|
| Pickup order, valid slot | No address fields; slot appears in both emails |
| Delivery order, in-zone ZIP | Address required; $5 delivery applied |
| Delivery order, out-of-zone ZIP | Rejected with a clear message, both client- and server-side |
| Coupon applied | `/quote` returns the discount; Woo's checkout total matches the cart exactly |
| Invalid or expired coupon | `/quote` returns an error; cart shows it without breaking totals |
| Delivery order below the minimum | Checkout blocked with a clear message, client- and server-side |
| Quote endpoint unreachable | Cart still submits; totals shown as "calculated at checkout" rather than a wrong number |
| Sold-out product | Cannot be added; card greyed |
| Variable product | Correct variation price charged |
| Lunch Box | Chosen options appear as line-item meta on the order |
| Tampered POST (price, fulfilment, ZIP) | Server rejects; Woo's own prices win |
| Empty cart submitted | Handled, no PHP error |
| Store API unreachable | Menu renders from fallback snapshot |
| Slot rollover past a blackout date | Blackout date absent from the list |
