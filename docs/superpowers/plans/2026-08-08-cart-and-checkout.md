# Cart and Checkout Handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Revision 3.** Revision 1 was rejected by three verifiers with eight blocking findings; revision 2 was rejected again with eleven narrower ones, including a fatal that would have hit every checkout. Both rounds are recorded below, because the reasoning matters more than the patches and these mistakes are easy to reintroduce.

**Goal:** A customer can add bakery items to a cart that persists, see authoritative totals computed by WooCommerce, and be handed to WooCommerce's checkout to pay.

**Architecture:** The cart lives in React (`localStorage`), holding product IDs and quantities only — never prices. Totals come from a `/quote` endpoint on a WordPress must-use plugin, which prices a temporary `WC_Cart` server-side. Checkout is a **top-level form POST** to `admin-post.php`, which populates Woo's real cart, prefills billing/shipping, and redirects to WooCommerce's checkout page. A top-level navigation is always first-party, so it survives Safari's and Firefox's third-party cookie blocking, which a `fetch()`-built cart would not.

**Tech Stack:** React 19, Vite 8, React Router 7, Tailwind 4, Vitest 4 + Testing Library, WooCommerce 11 Store API, PHP 8.4 must-use plugin.

## Global Constraints

- **Money is never computed or formatted in React.** `src/lib/money.js` formats; the server computes. The cart stores IDs and quantities; every displayed amount — including per-line totals — comes from `/quote`.
- **The client never sends prices.** WooCommerce re-prices from its own data at both `/quote` and handoff.
- **Fulfilment is decided server-side.** The client's `fulfilment` field is a *request*, not an instruction. A pickup claim can never yield a delivery rate, and a delivery postcode outside the zone must produce an **error**, never a silent $0.
- **No WooCommerce admin API** (`/wp-json/wc/v3/`) and no consumer keys anywhere, including server-side.
- **The WordPress URL must not reach the browser** in JS — it lives in the server-only `WP_STORE_URL`. One sanctioned exception: the checkout form's `action`, which is by definition a URL the browser navigates to (Task 8).
- **Existing visual code is pixel-matched to Figma. Change data sources, props and handlers; do not restyle.**
- **Do not touch `src/components/Navbar.jsx`.** A colleague is actively editing it on `master`. The live cart-count badge is deferred out of this plan to avoid a merge collision. `src/components/Footer.jsx` is **not** off-limits.
- **The must-use plugin must never be able to take the site down.** It loads on every WordPress bootstrap, before almost everything, and cannot be disabled from `wp-admin`. Every entry point guards on WooCommerce being available and returns instead of fataling.
- No new npm dependencies.
- `WP_STORE_URL` for this project is `https://jessnix04-bvcul.wpcomstaging.com`.

---

## What Revision 1 Got Wrong

Recorded because each was found by reading the plan, not by running it, and the same mistakes are easy to reintroduce.

| # | Defect | Why it mattered | Fixed in |
|---|---|---|---|
| 1 | `ll_apply_fulfilment()` read `WC()->shipping()->get_packages()` **before** `calculate_totals()` populated it. That is a bare getter with no side effect, so the array was always empty, the rate match never fired, and `chosen_shipping_methods` was always set to `[]`. | The customer's pickup-vs-delivery choice was silently discarded on **every** quote. | Task 3 — two-pass shipping |
| 2 | An out-of-zone postcode produced no matching rate, an empty method list, and **no error**. | A customer outside the delivery area was quoted **free delivery**, contradicting this plan's own Global Constraints. | Task 3 — `ll_apply_fulfilment` returns errors |
| 3 | The handoff never emptied the real cart before repopulating it. `/quote` did; the handoff spec didn't. | A double-click, a back-then-resubmit, or a network retry **doubled the order and the charge**, with no error. | Task 7 — `empty_cart()` first, plus an idempotency token |
| 4 | "CSRF is not a meaningful threat — the worst outcome is an attacker filling their own cart." | Wrong about what CSRF is. It forces a **victim's** browser to submit. A third-party page could land a victim on the real checkout, correct domain and TLS, prefilled with the attacker's shipping address. | Task 7 — Origin/Referer check |
| 5 | `/quote` had no rate limiting, and the one note said "by IP" — but WordPress sees Vercel's egress IP, not the customer's. | Unbounded unauthenticated DB work on a host that already throttles at 5-of-8 requests, plus free coupon brute-forcing. | Tasks 3 and 4 |
| 6 | Task 6 required per-line totals "from the quote", but `/quote` returned only cart-wide aggregates. | Unbuildable without multiplying in React, which the same paragraph forbade. | Task 3 — `lines[]` in the response |
| 7 | Task 5 said to build a `prices`-shaped object for `formatPrice` "from the response's `currency`", which was a bare `"USD"`. | Symbol, prefix, suffix and separators are WooCommerce-configurable and not derivable from an ISO code. Unbuildable without hardcoding USD in JS. | Task 3 — full currency object |
| 8 | The plugin deployed straight to Production with a single smoke test, no staging, no documented rollback. | A fatal in a must-use plugin 500s the whole site, has no `wp-admin` toggle, and the non-technical owner cannot recover it. | Task 0 and Task 3 |

---

## Scope Note

Plan 2 of three. Plan 1 (live catalogue read path) is complete and merged into `feat/live-catalogue`.

### Explicitly out of scope

| Deferred | Why |
|---|---|
| Live cart count in `Navbar.jsx` | Colleague is editing that file on `master` |
| **The Lunch Box builder** | The spec requires choosing bread + cracker + dessert and carrying them as order line-item meta. Revision 1 owned this nowhere — a real spec-to-plan gap. It is **not** built here: a bundle-with-options needs its own line shape, its own validation and its own order meta, and checkout is already the largest thing in this plan. Until it is built, the Lunch Box adds as a plain $39 item. **Needs its own plan.** |
| Real pickup dates and time slots | Plan 3. This plan passes whatever the existing picker yields through as order meta |
| A desktop pickup layout | Open Question 1 — Figma never drew one |
| Branded emails, SMTP, SPF/DKIM | Plan 3 |
| Variable products | None exists in the store; `hasOptions` is false everywhere |
| A live payment gateway | Open Question 2 |

---

## Open Questions

Both have a default that ships if unanswered. Neither blocks starting.

**1. Pickup has no desktop design.** `src/pages/Cart.jsx:409` wraps the pickup state in `lg:hidden`, and the delivery state is `hidden lg:block` when pickup is selected — so on desktop, choosing "Pickup" shows the delivery form. Verified.
**Default:** hide the delivery/pickup toggle on desktop and make desktop delivery-only, which is honest, rather than a toggle that silently does nothing.

**2. No payment gateway is installed.** Verified live: zero enabled gateways.
**Default:** enable WooCommerce's **Cash on delivery** so the handoff can be tested end to end and a real order lands in `wp-admin`. Swapping in a real gateway later is a plugin install and changes **zero** React code.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/context/CartContext.jsx` | **Create.** Cart state, persisted to `localStorage`. |
| `src/lib/quote.js` | **Create.** Posts the cart to `/api/store/quote`; returns authoritative totals. Cancels superseded requests. |
| `src/lib/checkout.js` | **Create.** Builds and submits the hidden top-level form. |
| `src/pages/OrderConfirmed.jsx` | **Create.** Post-payment landing page. |
| `src/pages/Cart.jsx` | **Modify.** Items from context; totals from `/quote`; controlled form; wired buttons. |
| `src/components/Footer.jsx` | **Modify.** Remove the two dead `/profile` links. |
| `src/pages/Menu.jsx`, `src/pages/Product.jsx` | **Modify.** Add to cart. |
| `src/App.jsx` | **Modify.** `CartProvider`, `/order-confirmed`, remove `/profile`. |
| `src/pages/Profile.jsx` | **Delete.** |
| `api/store/[...path].js` | **Modify.** Allow `POST` to `quote` only; forward the client IP. |
| `lil-loaves-bridge.php` (backend repo) | **Create.** `/quote` + `ll_handoff` + order meta. |

---

## Task 0: Staging safety net

**Files:** none in either repo.

A fatal in a must-use plugin 500s the entire site and cannot be switched off from `wp-admin`. Nothing in Tasks 3 or 7 touches Production until this exists.

- [ ] **Step 1: Create the staging site**

WordPress.com dashboard → the site → **Staging Site** → create. Note its hostname.

- [ ] **Step 2: Confirm SSH to staging and record it**

Confirm `wp-admin` loads on staging and that you have SFTP/SSH credentials for it. Add `WP_STAGING_URL` and its SSH alias to the backend repo's gitignored `.env` and to `.env.example`.

- [ ] **Step 3: Write the rollback runbook**

Create `c:\Users\asus\Desktop\LilLoaves-backend\README.md` with, at minimum:

> **If the site returns 500 after a plugin deploy:** the bridge is a must-use plugin and has no `wp-admin` toggle. Recover by deleting the file over SSH:
> `ssh lilloaves-wp 'rm /srv/htdocs/wp-content/mu-plugins/lil-loaves-bridge.php'`
> The site returns to normal immediately. The storefront's menu keeps rendering from its committed snapshot throughout.

Also document the deploy command, how to verify the plugin loaded, and the `/quote` request/response shapes.

- [ ] **Step 4: Commit**

```bash
cd c:\Users\asus\Desktop\LilLoaves-backend
git add -A && git commit -m "Add staging config and rollback runbook" && git push
```

---

## Task 1: Cart state

**Files:**
- Create: `src/context/CartContext.jsx`, `src/context/CartContext.test.jsx`

**Interfaces:**
- Produces: `<CartProvider>`, `useCart(): { lines, add, setQty, remove, clear, count, isEmpty, syncSnapshot }`
- `lines` is `Array<{ id: number, qty: number, name: string, image: string, priceFormatted: string }>`
- `add(product, qty = 1)` takes a normalised `woo.js` product and increments if present
- `count` sums quantities, not lines
- `syncSnapshot(id, priceFormatted)` refreshes a cached display price — see Step 3

- [ ] **Step 1: Write the failing tests**

`src/context/CartContext.test.jsx`:

```jsx
import { act, render, screen } from '@testing-library/react'
import { CartProvider, useCart } from './CartContext.jsx'

const PRODUCT = { id: 13, name: 'Sour Dough', priceFormatted: '$21.13', images: [{ src: 'a.jpg' }] }
const OTHER = { id: 14, name: 'Danish Pastries', priceFormatted: '$23.00', images: [] }

let cart
function Probe() {
  cart = useCart()
  return <span data-testid="count">{cart.count}</span>
}

const renderCart = () => render(<CartProvider><Probe /></CartProvider>)

beforeEach(() => {
  localStorage.clear()
  cart = null
})

describe('CartContext', () => {
  it('starts empty', () => {
    renderCart()
    expect(cart.lines).toEqual([])
    expect(cart.isEmpty).toBe(true)
    expect(cart.count).toBe(0)
  })

  it('adds a product with its display snapshot', () => {
    renderCart()
    act(() => cart.add(PRODUCT))
    expect(cart.lines).toEqual([
      { id: 13, qty: 1, name: 'Sour Dough', image: 'a.jpg', priceFormatted: '$21.13' },
    ])
  })

  it('increments instead of duplicating', () => {
    renderCart()
    act(() => cart.add(PRODUCT))
    act(() => cart.add(PRODUCT, 2))
    expect(cart.lines).toHaveLength(1)
    expect(cart.lines[0].qty).toBe(3)
  })

  it('counts total quantity, not line count', () => {
    renderCart()
    act(() => cart.add(PRODUCT, 2))
    act(() => cart.add(OTHER, 3))
    expect(cart.count).toBe(5)
  })

  it('tolerates a product with no image', () => {
    renderCart()
    act(() => cart.add(OTHER))
    expect(cart.lines[0].image).toBe('')
  })

  it('sets a quantity and removes the line at zero', () => {
    renderCart()
    act(() => cart.add(PRODUCT, 5))
    act(() => cart.setQty(13, 2))
    expect(cart.lines[0].qty).toBe(2)
    act(() => cart.setQty(13, 0))
    expect(cart.lines).toEqual([])
  })

  it('removes and clears', () => {
    renderCart()
    act(() => cart.add(PRODUCT))
    act(() => cart.add(OTHER))
    act(() => cart.remove(13))
    expect(cart.lines.map((l) => l.id)).toEqual([14])
    act(() => cart.clear())
    expect(cart.isEmpty).toBe(true)
  })

  it('refreshes a stale display price without touching quantity', () => {
    renderCart()
    act(() => cart.add(PRODUCT, 3))
    act(() => cart.syncSnapshot(13, '$25.00'))
    expect(cart.lines[0].priceFormatted).toBe('$25.00')
    expect(cart.lines[0].qty).toBe(3)
  })

  it('persists across a remount', () => {
    const first = renderCart()
    act(() => cart.add(PRODUCT, 2))
    first.unmount()
    renderCart()
    expect(cart.lines[0]).toMatchObject({ id: 13, qty: 2 })
  })

  it('survives corrupt localStorage', () => {
    localStorage.setItem('lilloaves:cart', '{not json')
    renderCart()
    expect(cart.lines).toEqual([])
  })

  it('discards malformed persisted lines', () => {
    localStorage.setItem('lilloaves:cart', JSON.stringify([{ nope: true }, { id: 13, qty: 2 }]))
    renderCart()
    expect(cart.lines).toHaveLength(1)
    expect(cart.lines[0].id).toBe(13)
  })

  it('renders the count into the tree', () => {
    renderCart()
    act(() => cart.add(PRODUCT, 4))
    expect(screen.getByTestId('count').textContent).toBe('4')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- CartContext`
Expected: FAIL — cannot resolve `./CartContext.jsx`.

- [ ] **Step 3: Implement**

`src/context/CartContext.jsx`:

```jsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

/**
 * The cart holds product ids and quantities. Name, image and formatted price
 * are a display snapshot so the cart renders instantly without a fetch — they
 * are never sent to the server. WooCommerce re-prices everything from its own
 * data at quote and at checkout, so a tampered snapshot buys nothing.
 *
 * The snapshot can go stale: a cart persists for days and the bakery may
 * change a price meanwhile. syncSnapshot lets the Cart page refresh the
 * displayed unit price from the authoritative quote rather than showing a
 * stale figure beside a fresh total.
 */

const STORAGE_KEY = 'lilloaves:cart'
const CartContext = createContext(null)

function isValidLine(line) {
  return (
    line &&
    typeof line === 'object' &&
    Number.isFinite(line.id) &&
    Number.isFinite(line.qty) &&
    line.qty > 0
  )
}

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter(isValidLine) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [lines, setLines] = useState(readStored)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
    } catch {
      // Private mode or quota exceeded. The cart still works for this session.
    }
  }, [lines])

  const value = useMemo(() => {
    const add = (product, qty = 1) =>
      setLines((prev) => {
        const existing = prev.find((l) => l.id === product.id)
        if (existing) {
          return prev.map((l) => (l.id === product.id ? { ...l, qty: l.qty + qty } : l))
        }
        return [
          ...prev,
          {
            id: product.id,
            qty,
            name: product.name,
            image: product.images?.[0]?.src ?? '',
            priceFormatted: product.priceFormatted,
          },
        ]
      })

    const setQty = (id, qty) =>
      setLines((prev) =>
        qty <= 0 ? prev.filter((l) => l.id !== id) : prev.map((l) => (l.id === id ? { ...l, qty } : l)),
      )

    const syncSnapshot = (id, priceFormatted) =>
      setLines((prev) =>
        prev.map((l) => (l.id === id ? { ...l, priceFormatted } : l)),
      )

    const remove = (id) => setLines((prev) => prev.filter((l) => l.id !== id))
    const clear = () => setLines([])
    const count = lines.reduce((sum, l) => sum + l.qty, 0)

    return { lines, add, setQty, remove, clear, syncSnapshot, count, isEmpty: lines.length === 0 }
  }, [lines])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside a CartProvider')
  return context
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- CartContext`
Expected: PASS, 12 tests.

- [ ] **Step 5: Commit**

```bash
git add src/context/
git commit -m "feat: add cart state with localStorage persistence"
```

---

## Task 2: Mount the provider, remove the accounts UI

**Files:**
- Modify: `src/App.jsx`, `src/components/Footer.jsx`
- Delete: `src/pages/Profile.jsx`
- Create: `src/pages/OrderConfirmed.jsx`

- [ ] **Step 1: Create the confirmation page**

`src/pages/OrderConfirmed.jsx`:

```jsx
import { Link, useSearchParams } from 'react-router-dom'

export default function OrderConfirmed() {
  const [params] = useSearchParams()
  const orderNumber = params.get('order')

  return (
    <main className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-[24px] bg-cream px-[24px] py-[80px]">
      <p className="font-ligema text-[24px] uppercase text-cocoa lg:text-[32px]">Thank you!</p>
      <p className="text-center font-parkinsans text-[16px] text-clay lg:text-[20px]">
        Your order is confirmed. We&rsquo;ve sent your confirmation by email.
      </p>
      {orderNumber && (
        <p className="font-parkinsans text-[17px] font-semibold text-cocoa">Order #: {orderNumber}</p>
      )}
      <Link
        to="/menu"
        className="cursor-pointer rounded-full bg-cocoa px-[32px] py-[10px] font-parkinsans text-[16px] text-white"
      >
        Back to the menu
      </Link>
    </main>
  )
}
```

- [ ] **Step 2: Wire App.jsx**

Import `CartProvider` and `OrderConfirmed`. Delete the `Profile` import and its route. Add `<Route path="/order-confirmed" element={<OrderConfirmed />} />` inside `Layout`. Wrap `<Routes>` in `<CartProvider>`.

- [ ] **Step 3: Delete Profile and its Footer links**

```bash
git rm src/pages/Profile.jsx
```

`src/components/Footer.jsx:16-17` has two `/profile` links ("Profile" and "Orders"). **Verified present.** Remove both entries from the link list. Change no styling — the surrounding list markup stays exactly as it is.

- [ ] **Step 4: Check for dangling references**

```bash
grep -rn "Profile\|/profile" src/
```

Expected: matches **only** in `src/components/Navbar.jsx`, which is off-limits — a colleague is editing it on `master`, and a dead link there is a smaller problem than a merge conflict in someone else's file. Note it in your report for later removal. Any match anywhere else is a finding.

- [ ] **Step 5: Verify**

Run: `npm test && npm run lint && npm run build`. Open `/order-confirmed?order=1234` in `npm run dev`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: mount cart provider, add order confirmation, drop accounts UI"
```

---

## Task 3: Bridge plugin — `/quote`

**Files:**
- Create: `c:\Users\asus\Desktop\LilLoaves-backend\mu-plugins\lil-loaves-bridge.php`

**Interfaces:**
- Produces: `POST /wp-json/lilloaves/v1/quote` accepting `{ items: [{id, qty}], fulfilment, postcode, coupon }`, returning `{ lines[], subtotal, delivery, discount, tax, total, currency{}, errors[] }` — all amounts in **minor units**, `currency` the full Store-API-shaped object.

- [ ] **Step 1: Write the plugin**

```php
<?php
/**
 * Plugin Name: Lil' Loaves Bridge
 * Description: Prices a cart for the React storefront and hands it to WooCommerce checkout.
 *
 * The React app sends product ids and quantities only. Every price, shipping
 * rate and discount is computed here from WooCommerce's own data, so a
 * tampered request cannot change what a customer is charged.
 *
 * This is a MUST-USE plugin: it loads on every request and cannot be disabled
 * from wp-admin. A fatal here takes the whole site down, so every entry point
 * guards on WooCommerce being available and returns rather than throwing.
 * Rollback is documented in the backend repo's README.
 */

define('LL_BRIDGE', '1');

const LL_QUOTE_WINDOW      = 10;  // seconds
const LL_QUOTE_MAX         = 20;  // quotes per window per client
const LL_COUPON_MAX        = 5;   // coupon attempts per window per client

add_action('rest_api_init', function () {
    if (!ll_wc_ready()) return;
    register_rest_route('lilloaves/v1', '/quote', [
        'methods'             => 'POST',
        'permission_callback' => '__return_true', // public, like the Store API; it creates nothing
        'callback'            => 'll_quote',
    ]);
});

/** Never assume WooCommerce is loaded. A must-use plugin runs before it may be. */
function ll_wc_ready() {
    return function_exists('WC') && WC() && class_exists('WC_Cart');
}

/**
 * Best-effort throttle. This is defence in depth, not a security boundary:
 * the forwarded IP is only as trustworthy as the proxy that set it. The
 * global cap is what actually protects the origin from a distributed burst.
 */
function ll_throttled($client, $bucket, $max) {
    $key  = 'll_' . $bucket . '_' . md5($client);
    $hits = (int) get_transient($key);
    if ($hits >= $max) return true;
    set_transient($key, $hits + 1, LL_QUOTE_WINDOW);
    return false;
}

function ll_global_throttled() {
    $hits = (int) get_transient('ll_quote_global');
    if ($hits >= 300) return true;                 // ~30/s sustained, well under the LB's limit
    set_transient('ll_quote_global', $hits + 1, LL_QUOTE_WINDOW);
    return false;
}

/**
 * The Vercel proxy forwards the real client IP in X-LL-Client. Falls back to
 * REMOTE_ADDR, which behind the proxy is the proxy itself — in that case every
 * customer shares one bucket, which is why the global cap exists too.
 */
function ll_client_id(WP_REST_Request $request) {
    $forwarded = $request->get_header('x_ll_client');
    if ($forwarded) return sanitize_text_field($forwarded);
    return isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field($_SERVER['REMOTE_ADDR']) : 'unknown';
}

/**
 * Prices a prospective cart without creating an order.
 */
function ll_quote(WP_REST_Request $request) {
    if (!ll_wc_ready()) {
        return new WP_REST_Response(['errors' => ['Store unavailable']], 503);
    }

    $client = ll_client_id($request);
    if (ll_global_throttled() || ll_throttled($client, 'q', LL_QUOTE_MAX)) {
        return new WP_REST_Response(['errors' => ['Too many requests']], 429);
    }

    $items      = $request->get_param('items');
    $fulfilment = $request->get_param('fulfilment') === 'pickup' ? 'pickup' : 'delivery';
    $postcode   = sanitize_text_field((string) $request->get_param('postcode'));
    $coupon     = sanitize_text_field((string) $request->get_param('coupon'));
    $errors     = [];

    if (!is_array($items) || count($items) === 0) {
        return new WP_REST_Response(ll_empty_quote(), 200);
    }

    ll_boot_cart();
    WC()->cart->empty_cart();

    foreach ($items as $item) {
        $id  = absint($item['id'] ?? 0);
        $qty = max(1, absint($item['qty'] ?? 1));
        if (!$id) continue;

        $product = wc_get_product($id);
        if (!$product || $product->get_status() !== 'publish' || !$product->is_purchasable()) {
            $errors[] = 'One of your items is no longer available';
            continue;
        }
        if (!$product->is_in_stock()) {
            $errors[] = sprintf('%s is sold out', $product->get_name());
            continue;
        }
        // add_to_cart returns false for reasons is_in_stock() does not cover,
        // such as a managed stock quantity below the requested amount.
        if (!WC()->cart->add_to_cart($id, $qty)) {
            $errors[] = sprintf('We could not add %s in that quantity', $product->get_name());
        }
    }

    $errors = array_merge($errors, ll_apply_fulfilment($fulfilment, $postcode));

    if ($coupon !== '') {
        if (ll_throttled($client, 'c', LL_COUPON_MAX)) {
            $errors[] = 'Too many coupon attempts, please wait a moment';
        } elseif (!WC()->cart->apply_coupon($coupon)) {
            $errors[] = 'That coupon code is not valid';
        }
        // WooCommerce reports the reason via wc_add_notice; we deliberately
        // return one generic message so an attacker learns nothing from probing.
        wc_clear_notices();
    }

    WC()->cart->calculate_totals();

    $minimum  = (float) get_option('ll_delivery_minimum', 0);
    $subtotal = (float) WC()->cart->get_subtotal();
    if ($fulfilment === 'delivery' && $minimum > 0 && $subtotal < $minimum) {
        $errors[] = sprintf('Delivery orders have a %s minimum', strip_tags(wc_price($minimum)));
    }

    // line_subtotal is pre-discount and shares its basis with get_subtotal().
    // line_total is post-discount, so using it here would make the line items
    // visibly fail to sum to the Subtotal row whenever a coupon is applied.
    // The discount is shown on its own row; it must not also be baked into
    // the lines.
    $lines = [];
    foreach (WC()->cart->get_cart() as $cart_item) {
        $lines[] = [
            'id'    => (int) $cart_item['product_id'],
            'qty'   => (int) $cart_item['quantity'],
            'total' => ll_minor($cart_item['line_subtotal'] + $cart_item['line_subtotal_tax']),
            'unit'  => ll_minor($cart_item['data']->get_price()),
        ];
    }

    $response = [
        'lines'    => $lines,
        'subtotal' => ll_minor(WC()->cart->get_subtotal()),
        'delivery' => ll_minor(WC()->cart->get_shipping_total()),
        'discount' => ll_minor(WC()->cart->get_discount_total()),
        'tax'      => ll_minor(WC()->cart->get_total_tax()),
        'total'    => ll_minor((float) WC()->cart->get_total('edit')),
        'currency' => ll_currency(),
        'errors'   => array_values(array_unique($errors)),
    ];

    WC()->cart->empty_cart();

    return new WP_REST_Response($response, 200);
}

function ll_empty_quote() {
    return [
        'lines' => [], 'subtotal' => 0, 'delivery' => 0, 'discount' => 0,
        'tax' => 0, 'total' => 0, 'currency' => ll_currency(), 'errors' => [],
    ];
}

/** WooCommerce's cart, session and customer do not exist during a REST request. */
function ll_boot_cart() {
    if (null === WC()->session) WC()->initialize_session();
    if (null === WC()->customer) WC()->customer = new WC_Customer(0, true);
    if (null === WC()->cart) WC()->initialize_cart();
}

/**
 * Chooses the shipping method server-side and returns any errors.
 *
 * Two passes, and the order matters. WC_Shipping::get_packages() is a bare
 * getter — the package list is only populated by calculate_shipping(). Calling
 * it first (as revision 1 did) always saw an empty array, so the rate match
 * never fired and the customer's fulfilment choice was silently discarded.
 * Pass one populates the rates, we select from them, pass two applies the
 * selection.
 */
function ll_apply_fulfilment($fulfilment, $postcode) {
    $errors  = [];
    $country = WC()->countries->get_base_country();

    WC()->customer->set_shipping_country($country);
    WC()->customer->set_shipping_postcode($fulfilment === 'delivery' ? $postcode : '');
    WC()->customer->set_billing_postcode($fulfilment === 'delivery' ? $postcode : '');

    WC()->cart->calculate_shipping();               // pass one: populate

    $wanted = $fulfilment === 'pickup' ? 'local_pickup' : 'flat_rate';
    $match  = null;
    foreach (WC()->shipping()->get_packages() as $package) {
        foreach ($package['rates'] as $key => $rate) {
            if ($rate->get_method_id() === $wanted) { $match = $key; break 2; }
        }
    }

    if (null === $match) {
        // No rate for the requested method. For delivery this means the
        // postcode is outside the zone, which must be an error and never a
        // silent zero — revision 1 quoted free delivery here.
        WC()->session->set('chosen_shipping_methods', []);
        $errors[] = $fulfilment === 'delivery'
            ? 'We do not deliver to that postcode yet'
            : 'Pickup is not available at the moment';
        return $errors;
    }

    WC()->session->set('chosen_shipping_methods', [$match]);
    WC()->cart->calculate_shipping();               // pass two: apply

    return $errors;
}

/**
 * The same shape the Store API returns, so the client can pass it straight to
 * formatPrice. Symbol, position and separators are all configurable in
 * WooCommerce and are not derivable from the ISO code alone.
 */
function ll_currency() {
    $code     = get_woocommerce_currency();
    $symbol   = html_entity_decode(get_woocommerce_currency_symbol($code));
    $position = get_option('woocommerce_currency_pos', 'left');

    $prefix = in_array($position, ['left', 'left_space'], true)
        ? $symbol . ($position === 'left_space' ? ' ' : '')
        : '';
    $suffix = in_array($position, ['right', 'right_space'], true)
        ? ($position === 'right_space' ? ' ' : '') . $symbol
        : '';

    return [
        'currency_code'                => $code,
        'currency_symbol'              => $symbol,
        'currency_minor_unit'          => wc_get_price_decimals(),
        'currency_decimal_separator'   => wc_get_price_decimal_separator(),
        'currency_thousand_separator'  => wc_get_price_thousand_separator(),
        'currency_prefix'              => $prefix,
        'currency_suffix'              => $suffix,
    ];
}

/** WooCommerce works in decimal; the Store API and React work in minor units. */
function ll_minor($amount) {
    return (int) round(((float) $amount) * (10 ** wc_get_price_decimals()));
}
```

- [ ] **Step 2: Deploy to STAGING and smoke test**

Production is not touched until Step 4 passes.

```bash
cd c:\Users\asus\Desktop\LilLoaves-backend
scp mu-plugins/lil-loaves-bridge.php <staging-alias>:/srv/htdocs/wp-content/mu-plugins/
ssh <staging-alias> 'wp eval "echo defined(\"LL_BRIDGE\") ? \"loaded\" : \"NOT loaded\";"'
```

Expected: `loaded`. Then confirm `wp-admin` and the storefront still load — a must-use plugin that fatals shows up here.

- [ ] **Step 3: Prove every behaviour on staging**

Run each and record the actual output in your report. Use `wp eval` rather than curl — the load balancer throttles external REST traffic.

**Store configuration these cases depend on**, already applied to production and staging — verify before running them, because without it cases 2 and 3 cannot distinguish a working fix from a broken one:

- Shipping zone 1 is restricted to postcodes **92866, 92867, 92868, 92869** (placeholders; the bakery edits them). Before this, the zone had **no** location rows and matched every postcode on earth.
- `flat_rate` instance 2 costs **5.00**. Before this it cost `0`, so "delivery is non-zero" was unprovable.

| # | Case | Expected |
|---|---|---|
| 1 | 2 × Sour Dough (13), `pickup` | `subtotal` 4226, `delivery` **0**, `lines[0].total` 4226, chosen method id is **`local_pickup:1`**, no errors |
| 2 | 2 × Sour Dough, `delivery`, postcode **92868** | `delivery` **500**, chosen method id is **`flat_rate:2`** |
| 3 | 2 × Sour Dough, `delivery`, postcode **90210** | `delivery` 0, chosen methods **empty**, and an error `We do not deliver to that postcode yet` |
| 4 | Nonexistent product id | error, no fatal, other lines still priced |
| 5 | Japanese Milk Bread (16), out of stock | rejected with a "sold out" error |
| 6 | An invalid coupon | generic invalid-coupon error; totals otherwise unchanged |
| 7 | A **valid** coupon | `Σ lines[].total === subtotal`, with the discount on its own row. This is the assertion that proves the pre/post-discount basis is right. |
| 8 | 25 quotes in a row | the later ones return HTTP 429 |
| 9 | `items: []` | a zeroed quote with a full `currency` object, HTTP 200 |
| 10 | Full response shape | `currency` carries prefix, suffix, both separators and `currency_minor_unit` |

Cases 1-3 are the set that proves the two-pass shipping fix. **Assert on the chosen shipping method id, not only on the dollar amount** — a zero amount is ambiguous, a method id is not. Read it with `WC()->session->get('chosen_shipping_methods')`. If case 2 does not select `flat_rate:2`, the two-pass fix is still wrong — stop and report.

- [ ] **Step 4: Promote to production**

Only after every case above passes on staging:

```bash
scp mu-plugins/lil-loaves-bridge.php lilloaves-wp:/srv/htdocs/wp-content/mu-plugins/
ssh lilloaves-wp 'wp eval "echo defined(\"LL_BRIDGE\") ? \"loaded\" : \"NOT loaded\";"'
```

Then load the production storefront and `wp-admin` to confirm both still work. Re-run cases 1, 2 and 3 against production.

- [ ] **Step 5: Commit**

```bash
cd c:\Users\asus\Desktop\LilLoaves-backend
git add -A && git commit -m "Add bridge plugin with server-side cart quoting" && git push
```

---

## Task 4: Proxy POST to `/quote`

**Files:**
- Modify: `api/store/[...path].js`, `api/store/handler.test.js`

- [ ] **Step 1: Write the failing tests**

Cover: a POST to `quote` forwards the JSON body to the `lilloaves/v1` namespace, not `wc/store/v1`; a POST to any other path is 405; a GET to `quote` is 404; the response sets `Cache-Control: no-store` (a stale total is worse than a slow one); the client IP is forwarded as `X-LL-Client`; upstream failure returns 502; the 5s timeout still applies.

- [ ] **Step 2: Implement**

Add a POST branch before the existing GET-only guard. Accept only `path === 'quote'`. Forward `req.body` as JSON to `${base}/wp-json/lilloaves/v1/quote`, setting `X-LL-Client` from `req.headers['x-forwarded-for']?.split(',')[0]?.trim()` so the plugin's throttle can see the real customer rather than Vercel's egress IP. Set `Cache-Control: no-store`. Reuse the existing timeout and 502 handling. Leave every GET path and both allowlists untouched.

- [ ] **Step 3: Verify and commit**

Run: `npm test -- handler && npm run lint`

```bash
git add api/
git commit -m "feat: proxy POST to the quote endpoint"
```

---

## Task 5: Quote client

**Files:**
- Create: `src/lib/quote.js`, `src/lib/quote.test.js`

**Interfaces:**
- Produces: `fetchQuote({ lines, fulfilment, postcode, coupon, signal }): Promise<Quote>`
- `Quote` = `{ ok, lines: [{id, qty, totalFormatted, unitFormatted}], subtotalFormatted, deliveryFormatted, discountFormatted, taxFormatted, totalFormatted, errors }`

Send `{id, qty}` only — strip the display snapshot. Pass the response's `currency` object **straight into** `formatPrice` as its first argument; it is already the shape `money.js` expects, which is why Task 3 returns it in full. On a network failure or an aborted request return `ok: false` with empty strings so the Cart can say "calculated at checkout" rather than show a wrong number.

Accept an `AbortSignal`. Debouncing alone does not guarantee ordering — a slower earlier response can still land after a faster later one and overwrite the display with a stale total.

- [ ] **Step 1: Write the failing tests**

Cover: posts only ids and quantities, never names or prices; formats every minor-unit integer through `money.js` using the returned currency object; formats per-line totals; passes the coupon; surfaces server `errors`; returns `ok: false` on a rejected fetch; returns `ok: false` on an aborted request without throwing; returns a zeroed quote for an empty cart without hitting the network.

- [ ] **Step 2: Run, implement, run, commit**

Run: `npm test -- quote`

```bash
git add src/lib/quote.js src/lib/quote.test.js
git commit -m "feat: add quote client for server-computed totals"
```

---

## Task 6: Cart page — items, form, totals

**Files:**
- Modify: `src/pages/Cart.jsx`
- Create: `src/pages/Cart.test.jsx`

**Read the whole file before editing** — 543 lines, pixel-matched. Verified facts:

- `INITIAL_CART_ITEMS` at line 14 and `SUMMARY_ROWS` at line 36 are hardcoded and must go.
- Line 198 is `${item.price.toFixed(2)}` — the unit price. Render `line.priceFormatted` instead.
- Line 232 is `${(item.price * (item.qty ?? 1)).toFixed(2)}` — the **line total**. This is why Task 3 returns `lines[]`: render the quote's per-line `totalFormatted`, never a multiplication in React.
- `Total` is hardcoded `$39` at line 378. "Proceed to Checkout" is at line 381 with no handler.
- The pickup block at line 409 is `lg:hidden`; the delivery block is `hidden lg:block` when pickup is chosen. See Open Question 1 — do not invent a desktop pickup layout.
- `PICKUP_DATES` is defined at **line 75** and mapped at line 522. Leave it; Plan 3 owns pickup scheduling.
- **`CONTACT_FIELDS`, `ADDRESS_FIELD_ROWS` and `PICKUP_CONTACT_FIELDS` render uncontrolled inputs with no state.** Adding that state belongs to **this task**, not Task 8 — Task 8's `submitCheckout` needs those values and must not have to invent them.

- [ ] **Step 1: Write the failing tests**

Cover: renders lines from the cart context; the items count reflects total quantity; increment, decrement and remove call the context; "Clear Cart" empties it; an empty cart renders an empty state and disables checkout; summary rows, per-line totals and Total all render the quote's formatted strings; a quote error renders visibly and disables checkout; a superseded quote does not overwrite a newer one; contact and address inputs are controlled.

- [ ] **Step 2: Run, implement, run**

Replace `INITIAL_CART_ITEMS` with `useCart()`, `SUMMARY_ROWS` and the Total with quote values, and the line total with the quote's per-line figure. Add controlled state for every contact, address and pickup field. Re-quote when the cart **contents**, fulfilment mode, postcode or coupon change. Derive the effect's dependency from a string key of `id:qty` pairs, **not from the `lines` array itself** — `syncSnapshot` calls `setLines`, producing a new array reference on every quote, so depending on `lines` makes each quote trigger another one forever against a rate-limited endpoint. Debounce at least 300ms and with the previous request aborted, since quantity buttons fire rapidly and each quote is a real WordPress request. Wire "Apply Coupon". When a quote returns, call `syncSnapshot` for each line so a stale cached unit price cannot sit beside a fresh total.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Cart.jsx src/pages/Cart.test.jsx
git commit -m "feat: cart page reads the real cart and server totals"
```

---

## Task 7: Bridge plugin — checkout handoff

**Files:**
- Modify: `c:\Users\asus\Desktop\LilLoaves-backend\mu-plugins\lil-loaves-bridge.php`

Registered on **both** `admin_post_ll_handoff` and `admin_post_nopriv_ll_handoff`.

- [ ] **Step 1: Implement**

Required behaviour, in order:

1. **Guard.** If `!ll_wc_ready()`, redirect back to the cart with an error. Never fatal.
2. **Boot the cart — `ll_boot_cart()`, the same helper `/quote` uses.** WooCommerce only auto-creates `WC()->cart`, `WC()->session` and `WC()->customer` when `is_request('frontend')` is true, which requires `!is_admin()`. `admin-post.php` defines `WP_ADMIN` before `wp-load.php` runs, so `is_admin()` is true for the entire request and **none of them exist**. Revision 2 omitted this and every checkout submission would have fataled on `empty_cart() on null`. Note `ll_wc_ready()` does **not** cover this — it checks that the `WC_Cart` *class* exists, not that `WC()->cart` was instantiated.
3. **Origin check.** Reject unless `Origin` or `Referer` matches an allowlisted storefront origin, stored in an option. **Fail closed:** if both headers are absent, reject. Revision 1 argued CSRF was harmless here; that was wrong — CSRF forces a *victim's* browser to submit, and without this check a third-party page can land a victim on the real checkout prefilled with an attacker's shipping address.
4. **Throttle** using the same per-client helper as `/quote`, but with **its own global bucket** — not `ll_quote_global`. Sharing one bucket means anyone flooding `/quote` directly (the WordPress URL is public by necessity, it is the form's `action`) can trip the cap and block real customers from *completing checkout*, not merely from seeing quotes. Use an atomic counter (`wp_cache_incr`, available here — the host runs a persistent object cache) rather than `get_transient`/`set_transient`, whose read-modify-write undercounts precisely under the concurrent bursts that matter.
5. **Idempotency.** The client sends a token generated **once per cart state**, not once per click — see Task 8. Mark the token seen **immediately on check**, before doing any work. The tradeoff is explicit: a submission that crashes partway leaves the token spent, so a retry redirects to a checkout with an empty cart rather than risking a double charge. Prefer a confusing empty cart over billing someone twice.
6. **`WC()->cart->empty_cart()` before adding.** Revision 1 omitted this; a double-click or a back-then-resubmit doubled the order and the charge. This operates on the customer's real, persistent session, so it is not optional.
7. **Re-price every line** from WooCommerce. Ignore anything price-shaped in the POST.
8. **Re-validate fulfilment** with the same `ll_apply_fulfilment` used by `/quote`. If it returns errors, abort and redirect back to `/cart` with an error code — do not proceed with no shipping method.
9. **Enforce the delivery minimum** server-side.
10. **Prefill** billing and shipping from the POST, sanitised.
11. **Store pickup store, date and slot** as session data that carries onto the order, and display it on the admin order screen.
12. `wp_safe_redirect(wc_get_checkout_url())`.

**Failure UX, explicitly:** every rejection redirects to `{storefront}/cart?error=<code>` with a short machine code (`out_of_area`, `below_minimum`, `unavailable`, `origin`, `throttled`). No `wp_die()` — a bakery customer must never see a raw WordPress error page. Task 9 renders these. Build the redirect target from the **stored allowlist option**, never from the incoming `Origin` or `Referer`, or the failure path becomes an open redirect.

- [ ] **Step 2: Deploy to staging and prove the defences**

Record actual output for each in your report:

| # | Case | Expected |
|---|---|---|
| 1 | Normal delivery submission | lands on WooCommerce checkout, cart correct, fields prefilled |
| 2 | Normal pickup submission | lands on checkout, no shipping address required, pickup meta present |
| 3 | **Submit the same form twice** | the order does **not** double |
| 4 | POST with a halved price field | WooCommerce's totals unchanged |
| 5 | POST claiming `pickup` with a delivery postcode | no delivery rate applied |
| 6 | POST with an out-of-zone postcode | redirected to `/cart?error=out_of_area`, no order |
| 7 | POST from a foreign Origin | rejected |
| 8 | Empty cart POST | handled, no PHP error |

- [ ] **Step 3: Promote to production and commit**

---

## Task 8: Add to cart from Menu and Product

**Files:**
- Modify: `src/pages/Menu.jsx`, `src/pages/Product.jsx` and their tests

`Menu.jsx` keys its quantity state by product **name** (lines 222, 234, 397-400) — verified. Re-key to `id`; `p.id` is already available. `Product.jsx` has dead "Add to Cart" and "Buy Now" buttons at lines 203-222, already gated on `product.inStock`.

"Buy Now" adds to the cart and navigates to `/cart`.

- [ ] **Step 1: Tests, implementation, commit**

Cover: adding from a Menu card puts the line in the cart; adding twice increments; an out-of-stock product cannot be added from either page; "Add to Cart" adds one; "Buy Now" adds and navigates; two products with the same name remain distinct lines.

```bash
git add src/pages/
git commit -m "feat: add to cart from the menu and product pages"
```

---

This must precede the checkout task: its end-to-end test begins "add items on `/menu`",
which is the UI this task builds. Revision 2 had them the wrong way round.

---

## Task 9: Checkout client and end-to-end

**Files:**
- Create: `src/lib/checkout.js`, `src/lib/checkout.test.js`
- Modify: `src/pages/Cart.jsx`, `.env`
- Create: `.env.example` (does not exist in the frontend repo yet — verified)

- [ ] **Step 1: Env**

Add `VITE_WP_CHECKOUT_URL=https://jessnix04-bvcul.wpcomstaging.com` to `.env`, create `.env.example` with both variables documented, and **set it in the Vercel dashboard** for Production, Preview and Development — Vite bakes `VITE_` vars at build time, so a local-only value ships an empty action attribute. Note in the README that this variable is intentionally public.

- [ ] **Step 2: Implement**

`checkout.js` builds a `<form method="POST" action="{VITE_WP_CHECKOUT_URL}/wp-admin/admin-post.php">` carrying `action=ll_handoff`, a JSON payload of **ids and quantities only**, the fulfilment mode, contact and address fields, pickup store/date/slot, the coupon, and a freshly generated idempotency token. Append to `document.body` and submit — the page is navigating away.

Tests: the form has the right method and action; the payload contains no prices; `fetch` is never called; a token is present and differs between submissions.

- [ ] **Step 3: Wire the button and the error states**

Wire "Proceed to Checkout" at `Cart.jsx:381`. Disable it when the cart is empty, a quote is in flight, or the quote reports errors. Read `?error=` on mount and render the matching message from Task 7's code list.

- [ ] **Step 4: End-to-end on production**

Enable **Cash on delivery** in `WooCommerce → Settings → Payments`. Then place a real order: add items on `/menu`, open `/cart`, fill the form, check out, complete payment, and confirm the order appears in `wp-admin → WooCommerce → Orders` with the right total and pickup meta, and that you land on `/order-confirmed`.

- [ ] **Step 5: Commit both repos**

---

## Definition of Done

- `npm test`, `npm run lint` and `npm run build` all pass.
- Adding an item on `/menu` shows it on `/cart` after a full page reload.
- Changing a price in `wp-admin` changes the cart total within a minute.
- **A delivery order is charged a delivery fee and a pickup order is not** — the honest-customer case, verified on both `/quote` and the handoff.
- **An out-of-zone postcode produces a visible error, never free delivery.**
- **Submitting checkout twice does not double the order.**
- A coupon applies and shows a real discount; an invalid code shows an error and does not break the total.
- Checkout lands on WooCommerce with the cart and customer details prefilled; completing payment creates an order and returns to `/order-confirmed`.
- A pickup order carries store, date and slot onto the admin order screen.
- **A tampered POST cannot change what is charged** — verified by hand, output recorded.
- Deleting the plugin file over SSH restores the site — verified once on staging.
- `grep -rn "INITIAL_CART_ITEMS\|SUMMARY_ROWS" src/` returns nothing.
- `src/pages/Profile.jsx` is gone; no route serves `/profile`; `Footer.jsx` has no `/profile` links.
- **This plan contributed no commit touching `src/components/Navbar.jsx`:** `git log <merge-base>..HEAD -- src/components/Navbar.jsx` is empty. Do not compare against live `origin/master` — the colleague keeps pushing to it, so that check can never pass and says nothing about our discipline.
