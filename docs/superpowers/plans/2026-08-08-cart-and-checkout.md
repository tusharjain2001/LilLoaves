# Cart and Checkout Handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A customer can add bakery items to a cart that persists, see authoritative totals computed by WooCommerce, and be handed to WooCommerce's checkout to pay.

**Architecture:** The cart lives in React (`localStorage`), holding product IDs and quantities only — never prices. Totals come from a new `/quote` endpoint on a WordPress must-use plugin, which prices a temporary `WC_Cart` server-side. Checkout is a **top-level form POST** to `admin-post.php`, which populates Woo's real cart, prefills billing/shipping, and redirects to WooCommerce's checkout page. A top-level navigation is always first-party, so it survives Safari's and Firefox's third-party cookie blocking, which a `fetch()`-built cart would not.

**Tech Stack:** React 19, Vite 8, React Router 7, Tailwind 4, Vitest 4 + Testing Library, WooCommerce 11 Store API, PHP 8.4 must-use plugin.

## Global Constraints

- **Money is never computed or formatted in React.** `src/lib/money.js` formats; the server computes. The cart stores IDs and quantities; every displayed total comes from `/quote`.
- **The client never sends prices.** WooCommerce re-prices from its own data at both `/quote` and handoff. Otherwise a DevTools edit buys a $21 loaf for $0.01.
- **Fulfilment is re-validated server-side.** A POST claiming `pickup` must not obtain a delivery rate, and a delivery ZIP outside the zone must be rejected by the server, not only the UI.
- **No WooCommerce admin API** (`/wp-json/wc/v3/`) and no consumer keys anywhere, including server-side.
- **The WordPress URL must not reach the browser** in JS — it lives in the server-only `WP_STORE_URL`. The one exception is the checkout form's `action` attribute, which is by definition a URL the browser navigates to; it comes from a build-time env var, documented in Task 7.
- **Existing visual code is pixel-matched to Figma. Change data sources, props and handlers; do not restyle.**
- **Do not touch `src/components/Navbar.jsx`.** A colleague is actively editing it on `master`. The live cart-count badge is deliberately deferred out of this plan to avoid a merge collision.
- No new npm dependencies.
- `WP_STORE_URL` for this project is `https://jessnix04-bvcul.wpcomstaging.com`.

---

## Scope Note

This is Plan 2 of three. Plan 1 (the live catalogue read path) is complete and merged into `feat/live-catalogue`.

- **Plan 1 — done.** Home, Menu, Product on live WooCommerce data via a Vercel caching proxy.
- **This plan.** Cart state, add-to-cart, server-computed totals, the checkout handoff, order confirmation, and removing the accounts UI.
- **Plan 3.** Pickup slot scheduling (a `WooCommerce > Fulfilment` settings screen and real dates), and the branded confirmation emails.

### Explicitly out of scope

| Deferred | Why |
|---|---|
| Live cart count in `Navbar.jsx` | Colleague is editing that file on `master` |
| Real pickup dates and time slots | Plan 3. This plan passes whatever the existing picker yields straight through as order meta |
| A desktop pickup layout | See Open Question 1 — Figma never drew one |
| Branded emails, SMTP, SPF/DKIM | Plan 3 |
| Variable products (Pack of 2 / Pack of 4) | No variable product exists in the store yet; `hasOptions` is false everywhere |
| A live payment gateway | See Open Question 2 |

---

## Open Questions

Both have a stated default that ships if unanswered. Neither blocks starting.

**1. Pickup has no desktop design.** `src/pages/Cart.jsx:409` wraps the entire pickup state in `lg:hidden`, and the delivery state is `hidden lg:block` when pickup is selected — so on a desktop viewport, choosing "Pickup" shows the delivery form. Figma only ever drew pickup at the mobile breakpoint.
**Default if unanswered:** the delivery/pickup toggle is hidden on desktop and desktop is delivery-only, which is honest, rather than showing a pickup toggle that silently does nothing. Flagged to the human before Task 6.

**2. No payment gateway is installed.** The store has no Stripe, Square or PayPal.
**Default if unanswered:** enable WooCommerce's built-in **Cash on delivery** method so the handoff can be tested end to end and a real order lands in `wp-admin`. Swapping in a real gateway later is a plugin install in WordPress and changes **zero** React code — that is the point of putting the handoff where it is.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/context/CartContext.jsx` | **Create.** Cart state: `{id, qty, name, image, priceFormatted}` per line, persisted to `localStorage`. Display fields are a cached snapshot; they are never sent to the server. |
| `src/context/CartContext.test.jsx` | **Create.** |
| `src/lib/quote.js` | **Create.** Posts the cart to `/api/store/quote` and returns authoritative totals. Debounced by the caller. |
| `src/lib/quote.test.js` | **Create.** |
| `src/lib/checkout.js` | **Create.** Builds and submits the hidden top-level form. |
| `src/lib/checkout.test.js` | **Create.** |
| `src/pages/OrderConfirmed.jsx` | **Create.** Post-payment landing page. |
| `src/pages/Cart.jsx` | **Modify.** Items from context; totals from `/quote`; controlled form; wired buttons. Largest edit. |
| `src/pages/Menu.jsx` | **Modify.** Quantity controls write to the cart. |
| `src/pages/Product.jsx` | **Modify.** "Add to Cart" writes to the cart. |
| `src/App.jsx` | **Modify.** Wrap in `CartProvider`, add `/order-confirmed`, remove `/profile`. |
| `src/pages/Profile.jsx` | **Delete.** 409 lines. No accounts in this design. |
| `api/store/[...path].js` | **Modify.** Allow `POST` to the single path `quote`; everything else stays GET-only. |
| `lil-loaves-bridge.php` (backend repo) | **Create.** `/quote` REST route + `ll_handoff` admin-post action + order meta display. |

`quote.js` and `checkout.js` are separate deliberately: quoting is a repeated, cancellable read; checkout is a one-shot navigation that leaves the SPA. Sharing a module would couple a hot path to a cold one.

---

## Task 1: Cart state

**Files:**
- Create: `src/context/CartContext.jsx`
- Create: `src/context/CartContext.test.jsx`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `<CartProvider>{children}</CartProvider>`
  - `useCart(): { lines, add, setQty, remove, clear, count, isEmpty }`
  - `lines` is `Array<{ id: number, qty: number, name: string, image: string, priceFormatted: string }>`
  - `add(product, qty = 1)` takes a normalised product from `woo.js` and increments if already present
  - `count` is the sum of quantities, not the number of lines

- [ ] **Step 1: Write the failing tests**

`src/context/CartContext.test.jsx`:

```jsx
import { act, render, screen } from '@testing-library/react'
import { CartProvider, useCart } from './CartContext.jsx'

const PRODUCT = {
  id: 13,
  slug: 'sour-dough',
  name: 'Sour Dough',
  priceFormatted: '$21.13',
  images: [{ src: 'a.jpg' }],
}

const OTHER = {
  id: 14,
  slug: 'danish-pastries',
  name: 'Danish Pastries',
  priceFormatted: '$23.00',
  images: [],
}

let cart
function Probe() {
  cart = useCart()
  return <span data-testid="count">{cart.count}</span>
}

const renderCart = () =>
  render(
    <CartProvider>
      <Probe />
    </CartProvider>,
  )

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

  it('increments instead of duplicating when the same product is added twice', () => {
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
    expect(cart.lines).toHaveLength(2)
    expect(cart.count).toBe(5)
  })

  it('tolerates a product with no image', () => {
    renderCart()
    act(() => cart.add(OTHER))
    expect(cart.lines[0].image).toBe('')
  })

  it('sets a quantity directly and removes the line at zero', () => {
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

  it('persists across a remount', () => {
    const first = renderCart()
    act(() => cart.add(PRODUCT, 2))
    first.unmount()
    renderCart()
    expect(cart.lines[0]).toMatchObject({ id: 13, qty: 2 })
  })

  it('survives corrupt localStorage rather than crashing', () => {
    localStorage.setItem('lilloaves:cart', '{not json')
    renderCart()
    expect(cart.lines).toEqual([])
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
 * The cart holds product ids and quantities. The name, image and formatted
 * price are a display snapshot so the cart renders instantly without a fetch —
 * they are never sent to the server. WooCommerce re-prices everything from its
 * own data at quote and at checkout, so a tampered snapshot buys nothing.
 */

const STORAGE_KEY = 'lilloaves:cart'
const CartContext = createContext(null)

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    // Corrupt or unavailable storage must not take the site down.
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
          return prev.map((l) =>
            l.id === product.id ? { ...l, qty: l.qty + qty } : l,
          )
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
        qty <= 0
          ? prev.filter((l) => l.id !== id)
          : prev.map((l) => (l.id === id ? { ...l, qty } : l)),
      )

    const remove = (id) => setLines((prev) => prev.filter((l) => l.id !== id))
    const clear = () => setLines([])
    const count = lines.reduce((sum, l) => sum + l.qty, 0)

    return { lines, add, setQty, remove, clear, count, isEmpty: lines.length === 0 }
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
Expected: PASS, 10 tests.

- [ ] **Step 5: Commit**

```bash
git add src/context/
git commit -m "feat: add cart state with localStorage persistence"
```

---

## Task 2: Mount the provider and remove the accounts UI

**Files:**
- Modify: `src/App.jsx`
- Delete: `src/pages/Profile.jsx`
- Create: `src/pages/OrderConfirmed.jsx`

**Interfaces:**
- Consumes: `CartProvider` from Task 1
- Produces: every page can call `useCart()`; route `/order-confirmed` exists; `/profile` does not

- [ ] **Step 1: Create the confirmation page**

`src/pages/OrderConfirmed.jsx` — WooCommerce redirects here after payment, with the order key in the query string. Match the site's existing type and colour tokens; do not invent new ones.

```jsx
import { Link, useSearchParams } from 'react-router-dom'

export default function OrderConfirmed() {
  const [params] = useSearchParams()
  const orderNumber = params.get('order')

  return (
    <main className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-[24px] bg-cream px-[24px] py-[80px]">
      <p className="font-ligema text-[24px] uppercase text-cocoa lg:text-[32px]">
        Thank you!
      </p>
      <p className="text-center font-parkinsans text-[16px] text-clay lg:text-[20px]">
        Your order is confirmed. We&rsquo;ve sent your confirmation by email.
      </p>
      {orderNumber && (
        <p className="font-parkinsans text-[17px] font-semibold text-cocoa">
          Order #: {orderNumber}
        </p>
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

In `src/App.jsx`: import `CartProvider` and `OrderConfirmed`; delete the `Profile` import and its `<Route path="/profile" …>`; add `<Route path="/order-confirmed" element={<OrderConfirmed />} />` inside the `Layout` route; wrap the whole `<Routes>` in `<CartProvider>`.

- [ ] **Step 3: Delete the Profile page**

```bash
git rm src/pages/Profile.jsx
```

- [ ] **Step 4: Check for dangling references**

```bash
grep -rn "Profile\|/profile" src/
```

Expected: nothing outside `Navbar.jsx`. **`Navbar.jsx` is off-limits** — a colleague is editing it. If it links to `/profile`, leave the link; a dead link is a smaller problem than a merge conflict in someone else's file. Note it in your report so it can be removed later.

- [ ] **Step 5: Verify**

Run: `npm test && npm run lint && npm run build`
Expected: all pass. Open `/order-confirmed?order=1234` in `npm run dev` and confirm it renders.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: mount cart provider, add order confirmation, drop accounts UI"
```

---

## Task 3: The must-use plugin — `/quote`

**Files:**
- Create: `c:\Users\asus\Desktop\LilLoaves-backend\mu-plugins\lil-loaves-bridge.php`
- Create: `c:\Users\asus\Desktop\LilLoaves-backend\README.md`

**Interfaces:**
- Consumes: nothing
- Produces: `POST /wp-json/lilloaves/v1/quote` accepting `{ items: [{id, qty}], fulfilment, postcode, coupon }` and returning `{ subtotal, delivery, discount, tax, total, currency, errors }` in **minor units** to match the Store API.

The backend repo is at `c:\Users\asus\Desktop\LilLoaves-backend` and is a separate git repo. Its `.env` is gitignored and holds the SSH alias and object IDs. Deploy with:

```bash
scp mu-plugins/lil-loaves-bridge.php lilloaves-wp:/srv/htdocs/wp-content/mu-plugins/
ssh lilloaves-wp 'wp eval "echo defined(\"LL_BRIDGE\") ? \"loaded\" : \"NOT loaded\";"'
```

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
 */

define('LL_BRIDGE', '1');

add_action('rest_api_init', function () {
    register_rest_route('lilloaves/v1', '/quote', [
        'methods'             => 'POST',
        'permission_callback' => '__return_true', // public, like the Store API; it creates nothing
        'callback'            => 'll_quote',
    ]);
});

/**
 * Prices a prospective cart without creating a session or an order.
 */
function ll_quote(WP_REST_Request $request) {
    if (!function_exists('WC') || !WC()) {
        return new WP_REST_Response(['errors' => ['WooCommerce unavailable']], 503);
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
        if (!$product || !$product->is_purchasable()) {
            $errors[] = sprintf('Product %d is unavailable', $id);
            continue;
        }
        if (!$product->is_in_stock()) {
            $errors[] = sprintf('%s is sold out', $product->get_name());
            continue;
        }
        WC()->cart->add_to_cart($id, $qty);
    }

    ll_apply_fulfilment($fulfilment, $postcode);

    if ($coupon !== '') {
        if (!WC()->cart->apply_coupon($coupon)) {
            $errors[] = 'That coupon code is not valid';
        }
    }

    WC()->cart->calculate_totals();

    $minimum = (float) get_option('ll_delivery_minimum', 0);
    $subtotal = (float) WC()->cart->get_subtotal();
    if ($fulfilment === 'delivery' && $minimum > 0 && $subtotal < $minimum) {
        $errors[] = sprintf('Delivery orders have a %s minimum', wc_price($minimum));
    }

    $response = [
        'subtotal' => ll_minor(WC()->cart->get_subtotal()),
        'delivery' => ll_minor(WC()->cart->get_shipping_total()),
        'discount' => ll_minor(WC()->cart->get_discount_total()),
        'tax'      => ll_minor(WC()->cart->get_total_tax()),
        'total'    => ll_minor((float) WC()->cart->get_total('edit')),
        'currency' => get_woocommerce_currency(),
        'errors'   => $errors,
    ];

    WC()->cart->empty_cart();

    return new WP_REST_Response($response, 200);
}

function ll_empty_quote() {
    return [
        'subtotal' => 0, 'delivery' => 0, 'discount' => 0, 'tax' => 0,
        'total' => 0, 'currency' => get_woocommerce_currency(), 'errors' => [],
    ];
}

/** WooCommerce's cart and customer objects do not exist during a REST request. */
function ll_boot_cart() {
    if (null === WC()->session) {
        WC()->initialize_session();
    }
    if (null === WC()->customer) {
        WC()->customer = new WC_Customer(0, true);
    }
    if (null === WC()->cart) {
        WC()->initialize_cart();
    }
}

/**
 * Sets the shipping method server-side. The client's claim is a request, not an
 * instruction: a pickup claim can never yield a delivery rate, and a delivery
 * postcode outside the zone is rejected here rather than in the UI.
 */
function ll_apply_fulfilment($fulfilment, $postcode) {
    $country = WC()->countries->get_base_country();
    WC()->customer->set_shipping_country($country);
    WC()->customer->set_shipping_postcode($fulfilment === 'delivery' ? $postcode : '');

    $chosen = $fulfilment === 'pickup' ? 'local_pickup' : 'flat_rate';
    $rates  = [];
    foreach (WC()->shipping()->get_packages() as $package) {
        foreach ($package['rates'] as $key => $rate) {
            if ($rate->get_method_id() === $chosen) $rates[] = $key;
        }
    }
    WC()->session->set('chosen_shipping_methods', $rates ? [$rates[0]] : []);
}

/** WooCommerce works in decimal; the Store API and React work in minor units. */
function ll_minor($amount) {
    return (int) round(((float) $amount) * (10 ** wc_get_price_decimals()));
}
```

- [ ] **Step 2: Deploy and smoke test**

```bash
cd c:\Users\asus\Desktop\LilLoaves-backend
scp mu-plugins/lil-loaves-bridge.php lilloaves-wp:/srv/htdocs/wp-content/mu-plugins/
ssh lilloaves-wp 'wp eval "echo defined(\"LL_BRIDGE\") ? \"loaded\" : \"NOT loaded\";"'
```

Expected: `loaded`

Then quote two Sour Doughs (product `13`) from the server, avoiding the edge rate limiter:

```bash
ssh lilloaves-wp 'wp eval "
\$r = new WP_REST_Request(\"POST\", \"/lilloaves/v1/quote\");
\$r->set_body_params([\"items\" => [[\"id\" => 13, \"qty\" => 2]], \"fulfilment\" => \"pickup\"]);
echo wp_json_encode(rest_get_server()->response_to_data(rest_do_request(\$r), false));
"'
```

Expected: `subtotal` of `4226` (2 × $21.13), `delivery` of `0` for pickup, `currency` `USD`.

- [ ] **Step 3: Verify the tamper defences**

Quote the same two items as `delivery` and confirm `delivery` is non-zero. Then quote a nonexistent product id and confirm it appears in `errors` rather than crashing. Then quote an out-of-stock product (`16`, Japanese Milk Bread) and confirm it is rejected with a "sold out" error.

- [ ] **Step 4: Write the backend README**

Document: what the plugin does, the deploy command, how to verify it loaded, and the `/quote` request and response shapes. This repo has no README and the next person will need one.

- [ ] **Step 5: Commit in the backend repo**

```bash
cd c:\Users\asus\Desktop\LilLoaves-backend
git add -A && git commit -m "Add bridge plugin with server-side cart quoting"
git push
```

---

## Task 4: Let the proxy POST to `/quote`

**Files:**
- Modify: `api/store/[...path].js`
- Modify: `api/store/handler.test.js`

**Interfaces:**
- Consumes: the `/quote` route from Task 3
- Produces: `POST /api/store/quote` forwards a JSON body to `{WP_STORE_URL}/wp-json/lilloaves/v1/quote`

The proxy is currently GET-only with a path allowlist. `quote` is on a different REST namespace (`lilloaves/v1`, not `wc/store/v1`), so the upstream URL differs.

- [ ] **Step 1: Write the failing tests**

Add to `api/store/handler.test.js`: a POST to `quote` forwards the body to the `lilloaves/v1` namespace; a POST to any other path is rejected 405; a GET to `quote` is rejected 404; quote responses are **not** cached (a stale total is worse than a slow one); an upstream failure still returns 502.

- [ ] **Step 2: Implement**

Add a `POST` branch before the existing GET-only guard: accept only `path === 'quote'`, forward `req.body` as JSON to `${base}/wp-json/lilloaves/v1/quote`, set `Cache-Control: no-store`, and reuse the existing 502 and timeout handling. Leave every GET path and the existing allowlists exactly as they are.

- [ ] **Step 3: Verify and commit**

Run: `npm test -- handler`, then `npm run lint`.

```bash
git add api/
git commit -m "feat: proxy POST to the quote endpoint"
```

---

## Task 5: Quote client

**Files:**
- Create: `src/lib/quote.js`
- Create: `src/lib/quote.test.js`

**Interfaces:**
- Consumes: `POST /api/store/quote`; `formatPrice` from `./money.js`
- Produces: `fetchQuote({ lines, fulfilment, postcode, coupon }): Promise<Quote>` where `Quote` is `{ subtotalFormatted, deliveryFormatted, discountFormatted, taxFormatted, totalFormatted, errors, ok }`

Send `{id, qty}` only — strip the display snapshot. Format every returned minor-unit integer through `money.js`; construct the `prices`-shaped object it expects from the response's `currency`. On a network failure return `ok: false` with empty strings, so the Cart can show "calculated at checkout" rather than a wrong number.

- [ ] **Step 1: Write the failing tests**

Cover: posts only ids and quantities, never names or prices; formats minor units into currency strings; passes the coupon through; surfaces server `errors`; returns `ok: false` on a rejected fetch; returns a zeroed quote for an empty cart without hitting the network.

- [ ] **Step 2: Run, implement, run, commit**

Run: `npm test -- quote`

```bash
git add src/lib/quote.js src/lib/quote.test.js
git commit -m "feat: add quote client for server-computed totals"
```

---

## Task 6: Cart page — items and totals

**Files:**
- Modify: `src/pages/Cart.jsx`
- Create: `src/pages/Cart.test.jsx`

**Interfaces:**
- Consumes: `useCart` (Task 1), `fetchQuote` (Task 5)
- Produces: nothing consumed later

**Read the whole file before editing** — it is 543 lines and pixel-matched. Known facts, verified:

- `INITIAL_CART_ITEMS` (line 14) and `SUMMARY_ROWS` (line 36) are hardcoded and must go.
- `item.price.toFixed(2)` at lines 198 and 232 formats money in the component. This violates the Global Constraints. Render `line.priceFormatted` for the unit price; the **line total** must come from the quote, not from multiplying in React.
- `Total` is hardcoded `$39` at line 378.
- The pickup block (line 409) is `lg:hidden`; the delivery block is `hidden lg:block` when pickup is chosen. See Open Question 1 — do not invent a desktop pickup layout.
- Cart has its own `PICKUP_DATES` at line 522, duplicating `Pickup.jsx`. Leave it; Plan 3 owns pickup scheduling.

- [ ] **Step 1: Write the failing tests**

Cover: renders lines from the cart context; the items count reflects total quantity; increment, decrement and remove call the context; "Clear Cart" empties it; an empty cart renders an empty state rather than a broken panel; summary rows and Total render the quote's formatted strings; a quote error renders visibly; while a quote is in flight the previous total is not replaced by a wrong one.

- [ ] **Step 2: Run, implement, run**

Replace `INITIAL_CART_ITEMS` with `useCart()`. Replace `SUMMARY_ROWS` and the hardcoded Total with quote values. Re-quote when lines, fulfilment mode or coupon change — **debounced by at least 300ms**, since quantity buttons fire rapidly and each quote is a real WordPress request. Wire "Apply Coupon" to re-quote with the code.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Cart.jsx src/pages/Cart.test.jsx
git commit -m "feat: cart page reads the real cart and server totals"
```

---

## Task 7: Checkout handoff

**Files:**
- Create: `src/lib/checkout.js`
- Create: `src/lib/checkout.test.js`
- Modify: `src/pages/Cart.jsx`
- Modify: `lil-loaves-bridge.php` (backend repo)
- Modify: `.env`, `.env.example`

**Interfaces:**
- Consumes: cart lines, form values
- Produces: `submitCheckout({ lines, fulfilment, contact, address, pickup, coupon })` — builds a hidden form and calls `form.submit()`

This is the load-bearing piece. It must be a **top-level form POST**, not `fetch()`. A `fetch()`-built cart lives in a third-party cookie from the React origin, which Safari and Firefox block by default — carts would empty at checkout, intermittently, for a large share of customers.

The form action needs the WordPress origin in the browser. That is the one sanctioned exception to the URL constraint, since it is a URL the browser navigates to by definition. Add `VITE_WP_CHECKOUT_URL=https://jessnix04-bvcul.wpcomstaging.com` to `.env` and `.env.example`, and note in the README that it is intentionally public.

- [ ] **Step 1: Client side**

`checkout.js` builds a `<form method="POST" action="{VITE_WP_CHECKOUT_URL}/wp-admin/admin-post.php">` with `action=ll_handoff`, a JSON payload of **ids and quantities only**, the fulfilment mode, contact and address fields, pickup store/date/slot, and the coupon. Append to `document.body`, submit, and leave it — the page is navigating away.

Tests: renders a form with the right method and action; the payload contains no prices; a `fetch` is never called.

- [ ] **Step 2: Server side**

Add to the plugin, registered on both `admin_post_ll_handoff` and `admin_post_nopriv_ll_handoff`:

1. Re-price every line from WooCommerce; ignore anything price-shaped in the POST.
2. Re-validate fulfilment against the shipping zone — reject a delivery ZIP outside it and a pickup claim that asks for a delivery rate.
3. Populate `WC()->cart`, prefill billing and shipping from the POST.
4. Store pickup store, date and slot as session data that carries onto the order.
5. `wp_safe_redirect(wc_get_checkout_url())`.
6. Enforce the delivery minimum server-side.

Rate-limit by IP. CSRF is not a meaningful threat — there is no authenticated session to abuse and the worst outcome is an attacker filling their own cart — but the endpoint must never trust a price, a rate or a total.

- [ ] **Step 3: Wire the button and verify end to end**

Wire "Proceed to Checkout" (`Cart.jsx:381`) to `submitCheckout`. Disable it when the cart is empty or the quote reports errors.

Enable **Cash on delivery** in `WooCommerce → Settings → Payments` (see Open Question 2), then place a real order start to finish: add items on `/menu`, open `/cart`, fill the form, click through, pay, and confirm the order appears in `wp-admin → WooCommerce → Orders` with the right total and the pickup meta.

- [ ] **Step 4: Verify the tamper defences by hand**

With DevTools, edit the POST body to halve a price and to claim `pickup` while sending a delivery ZIP. Confirm WooCommerce's totals are unchanged and the fulfilment claim is rejected. **Record the actual output in the report** — this is the security property the whole design rests on.

- [ ] **Step 5: Commit both repos**

---

## Task 8: Add to cart from Menu and Product

**Files:**
- Modify: `src/pages/Menu.jsx`
- Modify: `src/pages/Product.jsx`
- Modify: `src/pages/Menu.test.jsx`
- Modify: `src/pages/Product.test.jsx`

**Interfaces:**
- Consumes: `useCart`
- Produces: nothing consumed later

`Menu.jsx` already has per-card quantity controls in local state (`quantities` keyed by product name — note the ledger's finding that keying on an owner-editable name is fragile; key on `id` here). Point them at the cart instead of local state. `Product.jsx` has "Add to Cart" and "Buy Now" buttons which are currently dead, and which Plan 1 already gated behind `product.inStock`.

"Buy Now" should add to the cart and navigate straight to `/cart`.

- [ ] **Step 1: Tests, then implementation, then commit**

Cover: adding from a Menu card puts the line in the cart; adding twice increments; an out-of-stock product cannot be added from either page; "Add to Cart" on the product page adds one; "Buy Now" adds and navigates.

```bash
git add src/pages/
git commit -m "feat: add to cart from the menu and product pages"
```

---

## Definition of Done

- `npm test`, `npm run lint` and `npm run build` all pass.
- Adding an item on `/menu` shows it on `/cart` after a full page reload.
- Cart totals come from WooCommerce: changing a price in `wp-admin` changes the cart total within a minute.
- A coupon created in `wp-admin` applies and shows a real discount; an invalid code shows an error and does not break the total.
- "Proceed to Checkout" lands on WooCommerce's checkout with the cart and the customer's details prefilled.
- Completing payment creates an order in `wp-admin` with the correct total, and returns the customer to `/order-confirmed`.
- A pickup order carries its store, date and slot into the order's admin screen.
- **A tampered POST cannot change what is charged** — verified by hand, with the output recorded.
- `grep -rn "INITIAL_CART_ITEMS\|SUMMARY_ROWS" src/` returns nothing.
- `src/pages/Profile.jsx` is gone and no route serves `/profile`.
- `src/components/Navbar.jsx` is **unmodified** — `git diff origin/master -- src/components/Navbar.jsx` is empty.
