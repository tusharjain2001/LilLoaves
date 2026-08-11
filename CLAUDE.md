# Lil' Loaves — project context

A US bakery's storefront (Orange County, CA). React SPA, pixel-built from Figma, backed by a headless WooCommerce store so the non-technical owner can change the catalogue herself.

**Two people work on this repo.** One owns the visual layer, one owns commerce. Read *Working alongside another developer* before you touch anything.

---

## Architecture

Two deployables, one domain.

```
                     lilloaves.com  (domain at GoDaddy)
                              │
        ┌─────────────────────┴──────────────────────┐
        │                                            │
  lil-loaves.vercel.app                jessnix04-bvcul.wpcomstaging.com
  ─────────────────────                ────────────────────────────────
  React SPA on Vercel                  WordPress.com Business + WooCommerce 11
  free                                 ~$25/mo

  / /about /menu /product/:slug        wp-admin      ← the client works here
  /cart /pickup /gallery /contact      Store API     ← catalogue reads
  /order-confirmed                     /checkout     ← the customer pays here
                                       emails
```

### Why React never calls WordPress directly

Measured, not assumed: WordPress.com throttles unauthenticated REST traffic **at its load balancer** — a burst of 8 requests from one IP returned five `429`s, error page `_error = '429-lb'`. It also sends no `Access-Control-Allow-Origin`.

So everything goes through a Vercel serverless proxy at `api/store.js`, edge-cached 60s. That collapses all customer traffic into roughly one upstream request per minute.

**Two things about that proxy bit people:**

1. It was originally `api/store/[...path].js`. Vercel never resolved that catch-all on this project — a single path segment reached the function with no `path` in the query, and a two-segment path never reached it at all. It is now a flat file taking `?endpoint=`. **Don't reintroduce a catch-all.**
2. Vercel ignores a plain `Cache-Control: s-maxage`. Every response came back `X-Vercel-Cache: MISS`, so every page load was hitting WordPress directly — exactly the throttling the proxy exists to prevent. It now sets `Vercel-CDN-Cache-Control` and `CDN-Cache-Control`. **Don't "simplify" that back to one header.**

3. It **allowlists endpoints**. A new bridge route is unreachable from the browser until it is added there — and `vite.config.js` has a parallel rewrite for `npm run dev`, so missing one breaks only dev and missing the other breaks only production.

### Pack sizes live outside the Store API

The Store API exposes a variable product's attribute terms and variation ids, and a `price_range` — but **no per-variation price**, and variations are not fetchable as products (`?include=<variation_id>` returns empty). So pack-size prices come from our own bridge route, `GET /lilloaves/v1/variations`: every variable product in **one** edge-cached request, keyed by parent id, minor units.

Selling one means sending a `variation_id` alongside the parent `id`. WooCommerce needs `add_to_cart($parent, $qty, $variation)` — passing a variation id as the product id does not work. `/quote` and the handoff both validate that the variation genuinely belongs to the parent and is purchasable; it is a selector, never a price.

### The money rule

**No money arithmetic anywhere in React.** The Store API returns minor-unit strings (`"2113"` with `currency_minor_unit: 2` means $21.13).

- `src/lib/money.js` is the only module that converts or formats.
- The cart stores product **ids and quantities only**. Prices, names and images on a cart line are a *display snapshot*, never authoritative.
- Every displayed total — including per-line totals — comes from the server via `/quote`.
- WooCommerce re-prices everything at both `/quote` and checkout handoff, so a tampered request cannot change what a customer is charged. This is verified live.

---

## Repos

| Repo | Path | What |
|---|---|---|
| Frontend | `c:\Users\asus\Desktop\LilLoaves` | React app + the Vercel proxy in `api/` |
| Backend | `c:\Users\asus\Desktop\LilLoaves-backend` | The WordPress must-use plugin |

Both push to GitHub under `tusharjain2001`. Work happens on `master`.

---

## Access

```bash
ssh lilloaves-wp            # WP-CLI on the live WordPress
```

WooCommerce CLI commands need the user flag **before** the subcommand:

```bash
wp --user=278364270 wc product list --fields=id,name,price
```

**Testing the REST API:** use `wp eval` over SSH, not `curl`. The load balancer throttles external REST traffic and you will get misleading 429s.

```bash
ssh lilloaves-wp 'wp eval "
\$r = new WP_REST_Request(\"GET\",\"/wc/store/v1/products\");
echo wp_json_encode(rest_get_server()->response_to_data(rest_do_request(\$r), false));
"'
```

**This project deliberately does not use 1Password** — Manan reserves that for other work. Secrets live in the frontend repo's gitignored `.env`.

| Variable | Where | Notes |
|---|---|---|
| `WP_STORE_URL` | Vercel + `.env` | Server-side only. **Never** `VITE_` prefixed |
| `LL_BRIDGE_SECRET` | Vercel + `.env` + WP option `ll_bridge_secret` | Read at request time — no rebuild needed |
| `VITE_WP_CHECKOUT_URL` | Vercel + `.env` | **Public by design** (the browser navigates to it). Baked in at build time, so **a redeploy is required** after changing it |

---

## What is built

**Phase 1 — live catalogue.** Home, Menu and Product read WooCommerce. Categories, prices, stock, Seasonal Specials (the native Featured ⭐), Lunch Box option columns (from product tags `lunchbox-bread` / `-cracker` / `-dessert`).

**Phase 2 — cart and checkout.** `CartContext` persisted to `localStorage`; server-computed totals via `/quote`; a top-level form POST handoff to WooCommerce checkout; `/order-confirmed`. No customer accounts — `Profile.jsx` was deleted and `/profile` redirects to `/`.

**Phase 3 — pickup scheduling and emails.** A `WooCommerce → Fulfilment` settings screen; server-generated collection dates and slots; slot validation at handoff; branded confirmation emails rebuilt on tables.

195 tests, lint clean. Real orders have been placed end to end and deleted; the store sits at zero orders.

---

## Working alongside another developer

**Do not touch `src/components/Navbar.jsx`.** A colleague owns it and edits it frequently. There is deliberately no cart-count badge for this reason.

They also actively work on: `Home.jsx`, `SeasonalSpecials.jsx`, `FaqSection.jsx`, `index.css`, fonts, and gallery assets.

**Before starting anything, and again before merging:**

```bash
git fetch origin && git log --oneline HEAD..origin/master
```

When their work and yours overlap, **take their visual code wholesale and re-apply the data wiring on top.** Their layer is the design; ours is where data comes from. Don't impose renames on their files — one merge already reverted a `specials` → `items` prop rename for exactly this reason.

---

## Hard-won gotchas

Every one of these was found by running against the real server, not by reading code. Several would have silently reached customers.

| Trap | What actually happens |
|---|---|
| **`admin-post.php` breaks WooCommerce** | It defines `WP_ADMIN` before `wp-load.php`, so `is_admin()` is true and WooCommerce skips `frontend_includes()` **and** never creates `WC()->cart`/`session`/`customer`. Call `ll_boot_cart()` first or you fatal on every request. `ll_wc_ready()` does **not** cover this |
| **This store uses the block checkout** | `woocommerce_checkout_create_order` never fires. Pickup meta silently never reached orders until `woocommerce_store_api_checkout_order_processed` was also hooked. The post-payment redirect needed `woocommerce_get_checkout_order_received_url` for the same reason |
| **`WC_Shipping::get_packages()` is a bare getter** | It returns an empty array until `WC()->cart->calculate_shipping()` populates it. Reading it first means the customer's pickup-vs-delivery choice is silently discarded |
| **PHP `\x` escapes need double quotes** | `'\xe2\x80\x94'` in single quotes is literal. Every bakery order email read `New Pickup Order \xe2\x80\x94 Name` in production |
| **Vite bakes `VITE_` vars at build time** | An unset one interpolates to the literal string `"undefined"`. `form.action` became `undefined/wp-admin/admin-post.php` and customers hit a 405 on our own domain |
| **A SPA needs `vercel.json`** | Without it every route but `/` returns 404. The rewrite must exclude `/api/`, or it swallows the proxy and kills every price on the site |
| **`local_pickup` must exist on zone 0** | Pickup blanks the postcode, and zone 1 matches on postcode alone — so restricting the delivery area made collection unreachable |
| **`/quote` is not naturally stateless** | `calculate_totals()` fires `set_customer_session_cookie(true)` unconditionally, persisting a session row per call. It calls `destroy_session()` deliberately — don't remove it |
| **Origin checks can't secure `/quote`** | It's called server-to-server by the Vercel function, which sends no `Origin`. It uses a shared secret. The **handoff** is a real browser form POST, so that one correctly uses Origin. Don't "harmonise" them |
| **`empty_cart()` is the double-submit guard** | Not the idempotency token. Proven with two concurrent PHP processes: `WC_Session_Handler` writes the session as one atomic blob, so racers converge on the same correct cart |

---

## Conventions

- **Pixel-matched Figma code.** Change data sources, props and handlers. Do not restyle. No new colours, fonts or spacing values — compose from what's already in the file.
- **TDD**, and prefer a test that drives the real component over one that calls a context function directly. A Lunch Box bug shipped because tests exercised the cart's functions and the page's buttons separately, and the two paths never crossed.
- **Verify in a browser at 390px and 1440px**, and against the live store — not just `npm test`. Most bugs above were invisible to the suite.
- **Never fatal in the must-use plugin.** It loads on every request and cannot be disabled from `wp-admin`. Rollback: `ssh lilloaves-wp 'rm /srv/htdocs/wp-content/mu-plugins/lil-loaves-bridge.php'`.
- Delete any test orders you create.

---

## Store facts

| | |
|---|---|
| Products | The client's real catalogue. Breads (Sourdough, Japanese Milk Bread) and Lunch Box **15** are simple. Muffins **82/84/86**, cookies **88/91** and crackers **94/97** are **variable**, sharing the global `pa_pack-size` attribute |
| Pack sizes | Muffins *Pack of 4* $10 · Cookies *Single* $5 / *Box of 6* $20 · Crackers *5 oz* $7 / *10 oz* $12. All owner-editable in `wp-admin` — **never hardcode a size, price or count** |
| Delivery zone | Postcodes 92866–92869, flat rate **$5.00**. Test with **92868 / Orange / CA**; **90210** is out of area |
| Pickup | `local_pickup` on zones 1 **and** 0 |
| Coupon | `LOAF10` = 10% off |
| Gateway | Cash on Delivery only — **Stripe vs Square is undecided** |
| Currency | USD, taxes disabled (US food tax is state-specific and unresolved) |

---

## Not done

- **The Lunch Box's chosen options reach checkout but aren't saved onto the order.** The client sends them; `ll_handoff()` reads only `id`/`qty`. Needs storing as line-item meta
- **No desktop layout for collection in the cart** — Figma never drew one, so desktop routes to `/pickup`
- **Store address and hours are placeholders** (`1234 Example Ave`), and that address goes into customer emails
- No payment gateway beyond COD
- `Pickup.jsx`'s month chevrons are non-functional
- Only the first configured store is ever used — no multi-store picker
- **A sale price on a *variation* won't show its struck-through "was" price.** `/variations` returns only the current price, so the strikethrough stays tied to the parent. Nothing is on sale today
- Chocolate Muffins has no photo, and Dinner Rolls sits as a draft awaiting a price
- Ingredients and allergens are unpublished — the client's own doc says they must verify them first

---

## Documents

| File | What |
|---|---|
| `docs/superpowers/specs/2026-08-07-woocommerce-commerce-layer-design.md` | The design and why it's shaped this way |
| `docs/superpowers/plans/2026-08-08-live-catalogue-read-path.md` | Phase 1 |
| `docs/superpowers/plans/2026-08-08-cart-and-checkout.md` | Phase 2, including *What Revision 1 Got Wrong* — three verification rounds of real bugs caught before coding |
| `docs/client/running-your-shop.md` | Plain-English guide for the bakery owner |
| `docs/client/lil-loaves-catalogue-template.csv` | CSV for bulk-importing their catalogue |
| `LilLoaves-backend/README.md` | Plugin deploy, rollback, endpoint shapes |
