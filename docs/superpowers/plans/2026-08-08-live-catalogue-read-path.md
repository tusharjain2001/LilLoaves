# Live Catalogue Read Path Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menu, Product and Home render real WooCommerce data fetched through a cached Vercel proxy, replacing every hardcoded product array.

**Architecture:** React never calls WordPress directly — WordPress.com's load balancer throttles unauthenticated REST traffic and omits `Access-Control-Allow-Origin`. A Vercel serverless function at `/api/store/*` forwards to the WooCommerce Store API and edge-caches for 60s, collapsing all customer traffic into roughly one upstream request per minute. `src/lib/woo.js` is the only module that talks to that proxy; `src/lib/money.js` is the only module that converts money.

**Tech Stack:** React 19, Vite 8, React Router 7, Tailwind 4, Vitest + Testing Library, Vercel serverless functions, WooCommerce 11 Store API.

## Global Constraints

- **Money is never computed in components.** The Store API returns minor-unit strings (`"2113"` with `currency_minor_unit: 2` means $21.13). Only `src/lib/money.js` converts or formats it.
- **No WooCommerce admin API.** `/wp-json/wc/v3/` and consumer keys are forbidden everywhere, including server-side. Only the public Store API at `/wp-json/wc/store/v1/`.
- **The WordPress URL must not reach the browser.** It lives in the server-only env var `WP_STORE_URL`. Never `VITE_`-prefixed.
- **Products do not expose `is_featured`.** Featured products come from the `?featured=true` filter only.
- **Tag filtering takes term IDs, not slugs.** `?tag=1376` works, `?tag=lunchbox-bread` does not.
- **Empty categories and tags are omitted** from their endpoints. Code must tolerate a category being absent.
- **Never fail a build on a WordPress outage.** The fallback script warns and exits 0.
- Existing visual code is pixel-matched to Figma. Change data sources and props; do not restyle.
- `WP_STORE_URL` for this project is `https://jessnix04-bvcul.wpcomstaging.com`.

---

## Scope Note

The design spec covers more than one deliverable. It is split into three plans so
each produces working, testable software:

1. **This plan — live catalogue read path.** Menu, Product, Home on real data.
2. **Cart and checkout handoff.** `CartContext`, Cart page, the `lil-loaves-bridge` mu-plugin, `/quote` endpoint, WooCommerce checkout handoff, `OrderConfirmed` page, live cart count in `Navbar`, and deleting `Profile.jsx` and its `/profile` route (the spec has no accounts).
3. **Pickup slots and emails.** Fulfilment settings screen, slot generation, branded WooCommerce emails, SMTP.

Plan 1 is standalone: at the end the bakery's real catalogue is on the site, and the client can change it. Nothing in it depends on Plans 2 or 3.

---

## File Structure

| File | Responsibility |
|---|---|
| `api/store/[...path].js` | **Create.** Vercel serverless proxy. Allowlists paths and params, forwards to the Store API, sets cache headers. The only code that knows the WordPress URL at runtime. |
| `src/lib/money.js` | **Create.** Minor-unit conversion and currency formatting. No other module formats money. |
| `src/lib/money.test.js` | **Create.** |
| `src/lib/woo.js` | **Create.** Proxy client: fetch, normalise, `sessionStorage` cache, tag slug→ID map, fallback. The only module that fetches. |
| `src/lib/woo.test.js` | **Create.** |
| `api/store/handler.test.js` | **Create.** Unit tests for the proxy handler. |
| `scripts/fetch-fallback.mjs` | **Create.** Build-time snapshot generator. Never fails the build. |
| `src/data/products.fallback.json` | **Create.** Committed snapshot. |
| `vite.config.js` | **Modify.** Dev proxy so `npm run dev` works without `vercel dev`. |
| `package.json` | **Modify.** Test deps, `test` script, `prebuild` hook. |
| `src/pages/Home.jsx` | **Modify.** `SPECIALS` → featured products. |
| `src/components/SeasonalSpecials.jsx` | **Modify.** Accept items as props. |
| `src/pages/Menu.jsx` | **Modify.** Categories, products and Lunch Box columns from the API. |
| `src/pages/Product.jsx` | **Modify.** Route `/product/:slug`, real product data. |
| `src/App.jsx` | **Modify.** `/product/:slug` route. |

`money.js` is separate from `woo.js` deliberately: money formatting is pure and heavily tested, fetching is impure and mocked. Mixing them would make both harder to test.

---

## Task 1: Test harness

**Files:**
- Modify: `package.json`
- Create: `src/lib/smoke.test.js`

**Interfaces:**
- Consumes: nothing
- Produces: `npm test` runs Vitest; `describe`/`it`/`expect` available globally; jsdom environment for component tests in later tasks.

- [ ] **Step 1: Install test dependencies**

```bash
npm install -D vitest@^3 jsdom@^26 @testing-library/react@^16 @testing-library/jest-dom@^6
```

- [ ] **Step 2: Add test config to `vite.config.js`**

Replace the whole file:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

- [ ] **Step 3: Add the test script to `package.json`**

In `"scripts"`, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Write a smoke test**

`src/lib/smoke.test.js`:

```js
describe('test harness', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })

  it('has a DOM', () => {
    expect(typeof document).toBe('object')
  })
})
```

- [ ] **Step 5: Run it**

Run: `npm test`
Expected: PASS, 2 tests.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.js src/lib/smoke.test.js
git commit -m "test: add vitest harness"
```

---

## Task 2: Money conversion

**Files:**
- Create: `src/lib/money.js`
- Create: `src/lib/money.test.js`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `minorToMajor(minorString: string, minorUnit: number): number`
  - `formatPrice(prices: object, minorString?: string): string` where `prices` is the Store API `prices` object

- [ ] **Step 1: Write the failing tests**

`src/lib/money.test.js`:

```js
import { minorToMajor, formatPrice } from './money.js'

const USD = {
  price: '2113',
  regular_price: '2113',
  sale_price: '2113',
  price_range: null,
  currency_code: 'USD',
  currency_symbol: '$',
  currency_minor_unit: 2,
  currency_decimal_separator: '.',
  currency_thousand_separator: ',',
  currency_prefix: '$',
  currency_suffix: '',
}

describe('minorToMajor', () => {
  it('converts a minor-unit string to major units', () => {
    expect(minorToMajor('2113', 2)).toBe(21.13)
  })

  it('handles zero-decimal currencies', () => {
    expect(minorToMajor('500', 0)).toBe(500)
  })

  it('returns 0 for junk rather than NaN', () => {
    expect(minorToMajor('', 2)).toBe(0)
    expect(minorToMajor(null, 2)).toBe(0)
    expect(minorToMajor('abc', 2)).toBe(0)
  })
})

describe('formatPrice', () => {
  it('formats a simple price', () => {
    expect(formatPrice(USD)).toBe('$21.13')
  })

  it('groups thousands', () => {
    expect(formatPrice({ ...USD, price: '123456' })).toBe('$1,234.56')
    expect(formatPrice({ ...USD, price: '123456789' })).toBe('$1,234,567.89')
  })

  it('formats a whole amount with trailing zeros', () => {
    expect(formatPrice({ ...USD, price: '3900' })).toBe('$39.00')
  })

  it('accepts an explicit minor string, so regular_price can be formatted', () => {
    expect(formatPrice(USD, '2300')).toBe('$23.00')
  })

  it('honours a suffix currency', () => {
    const kr = { ...USD, currency_prefix: '', currency_suffix: ' kr', currency_decimal_separator: ',' }
    expect(formatPrice({ ...kr, price: '2113' })).toBe('21,13 kr')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- money`
Expected: FAIL — "Failed to resolve import ./money.js".

- [ ] **Step 3: Implement**

`src/lib/money.js`:

```js
/**
 * The WooCommerce Store API returns money as a minor-unit string ("2113")
 * alongside the currency's minor-unit count (2), meaning $21.13.
 *
 * This module is the only place in the app that converts or formats money.
 * Components receive already-formatted strings.
 */

export function minorToMajor(minorString, minorUnit) {
  const n = Number(minorString)
  if (minorString === '' || minorString === null || !Number.isFinite(n)) return 0
  return n / 10 ** minorUnit
}

export function formatPrice(prices, minorString = prices.price) {
  const unit = prices.currency_minor_unit
  const amount = minorToMajor(minorString, unit)
  const [whole, fraction] = Math.abs(amount).toFixed(unit).split('.')
  const grouped = whole.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    prices.currency_thousand_separator,
  )
  const body = fraction
    ? `${grouped}${prices.currency_decimal_separator}${fraction}`
    : grouped
  const sign = amount < 0 ? '-' : ''
  return `${sign}${prices.currency_prefix}${body}${prices.currency_suffix}`
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- money`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/money.js src/lib/money.test.js
git commit -m "feat: add minor-unit money conversion and formatting"
```

---

## Task 3: Vercel Store API proxy

**Files:**
- Create: `api/store/[...path].js`
- Create: `api/store/handler.test.js`
- Modify: `vite.config.js`

**Interfaces:**
- Consumes: env var `WP_STORE_URL`
- Produces: HTTP endpoints `GET /api/store/products`, `GET /api/store/products/categories`, `GET /api/store/products/tags`, each returning the Store API's JSON verbatim with `Cache-Control: public, s-maxage=60, stale-while-revalidate=600`. Default export is the handler `(req, res) => Promise<void>`.

- [ ] **Step 1: Write the failing tests**

`api/store/handler.test.js`:

```js
import handler from './[...path].js'

function mockRes() {
  const res = {
    statusCode: null,
    body: null,
    headers: {},
    status(code) { this.statusCode = code; return this },
    json(payload) { this.body = payload; return this },
    setHeader(k, v) { this.headers[k.toLowerCase()] = v },
  }
  return res
}

beforeEach(() => {
  process.env.WP_STORE_URL = 'https://wp.example.com'
  global.fetch = vi.fn()
})

describe('store proxy', () => {
  it('rejects non-GET methods', async () => {
    const res = mockRes()
    await handler({ method: 'POST', query: { path: ['products'] } }, res)
    expect(res.statusCode).toBe(405)
  })

  it('rejects paths outside the allowlist', async () => {
    const res = mockRes()
    await handler({ method: 'GET', query: { path: ['orders'] } }, res)
    expect(res.statusCode).toBe(404)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('forwards an allowed path and returns the payload', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => [{ id: 13 }] })
    const res = mockRes()
    await handler({ method: 'GET', query: { path: ['products'] } }, res)
    expect(global.fetch).toHaveBeenCalledWith(
      'https://wp.example.com/wp-json/wc/store/v1/products?',
      expect.anything(),
    )
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual([{ id: 13 }])
  })

  it('forwards a nested allowed path', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => [] })
    const res = mockRes()
    await handler({ method: 'GET', query: { path: ['products', 'categories'] } }, res)
    expect(global.fetch.mock.calls[0][0]).toContain('/wc/store/v1/products/categories')
  })

  it('passes allowlisted query params through and drops others', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => [] })
    const res = mockRes()
    await handler(
      { method: 'GET', query: { path: ['products'], featured: 'true', evil: 'x' } },
      res,
    )
    const url = global.fetch.mock.calls[0][0]
    expect(url).toContain('featured=true')
    expect(url).not.toContain('evil')
  })

  it('sets an edge cache header so upstream sees one request a minute', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => [] })
    const res = mockRes()
    await handler({ method: 'GET', query: { path: ['products'] } }, res)
    expect(res.headers['cache-control']).toBe(
      'public, s-maxage=60, stale-while-revalidate=600',
    )
  })

  it('returns 502 when upstream throttles', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 429, json: async () => ({}) })
    const res = mockRes()
    await handler({ method: 'GET', query: { path: ['products'] } }, res)
    expect(res.statusCode).toBe(502)
  })

  it('returns 502 when upstream is unreachable', async () => {
    global.fetch.mockRejectedValue(new Error('ECONNREFUSED'))
    const res = mockRes()
    await handler({ method: 'GET', query: { path: ['products'] } }, res)
    expect(res.statusCode).toBe(502)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- handler`
Expected: FAIL — cannot resolve `./[...path].js`.

- [ ] **Step 3: Implement the proxy**

`api/store/[...path].js`:

```js
/**
 * Caching proxy in front of the WooCommerce Store API.
 *
 * WordPress.com throttles unauthenticated REST traffic at its load balancer
 * (429, `_error = '429-lb'`) and does not send Access-Control-Allow-Origin,
 * so the browser cannot call it directly. Everything goes through here.
 *
 * s-maxage=60 collapses all customer traffic into roughly one upstream
 * request per minute. stale-while-revalidate keeps the menu rendering from
 * the last good response for ten minutes if WordPress is throttling or down.
 */

const ALLOWED_PATHS = new Set([
  'products',
  'products/categories',
  'products/tags',
])

const ALLOWED_PARAMS = new Set([
  'per_page',
  'page',
  'featured',
  'tag',
  'category',
  'slug',
  'orderby',
  'order',
  'include',
])

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const raw = req.query.path
  const segments = Array.isArray(raw) ? raw : [raw]
  const path = segments.filter(Boolean).join('/')

  if (!ALLOWED_PATHS.has(path)) {
    return res.status(404).json({ error: 'Unknown endpoint' })
  }

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(req.query)) {
    if (key !== 'path' && ALLOWED_PARAMS.has(key)) params.set(key, String(value))
  }

  const base = process.env.WP_STORE_URL
  if (!base) return res.status(500).json({ error: 'WP_STORE_URL is not set' })

  const upstream = `${base}/wp-json/wc/store/v1/${path}?${params}`

  try {
    const response = await fetch(upstream, {
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) {
      return res.status(502).json({ error: 'Upstream error', status: response.status })
    }
    const data = await response.json()
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=600')
    return res.status(200).json(data)
  } catch {
    return res.status(502).json({ error: 'Upstream unreachable' })
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- handler`
Expected: PASS, 8 tests.

- [ ] **Step 5: Add the dev proxy so `npm run dev` works**

`vite.config.js` — replace the whole file:

```js
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        // In production this path is served by api/store/[...path].js on Vercel.
        // The dev server has no serverless runtime, so forward straight to
        // WordPress. Run `vercel dev` instead if you need the real cache.
        '/api/store': {
          target: env.WP_STORE_URL,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/store/, '/wp-json/wc/store/v1'),
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
    },
  }
})
```

- [ ] **Step 6: Ignore `.env`, then create it**

The repo's `.gitignore` has `*.local` but **not** `.env`, so `.env` would be
committed. Fix that first, in this order:

```bash
printf '\n# Local env\n.env\n.env.local\n' >> .gitignore
echo "WP_STORE_URL=https://jessnix04-bvcul.wpcomstaging.com" > .env
git check-ignore -v .env
```

Expected: `.gitignore:<line>:.env	.env`

Then confirm it is invisible to git:

```bash
git status --short
```

Expected: `.gitignore` is listed as modified; `.env` is **not** listed at all.
If `.env` appears, stop — do not continue until it is ignored.

- [ ] **Step 7: Set the same variable in Vercel**

Vercel dashboard → Project → Settings → Environment Variables → add
`WP_STORE_URL = https://jessnix04-bvcul.wpcomstaging.com` for Production, Preview and Development.

- [ ] **Step 8: Commit**

```bash
git add api/store vite.config.js .gitignore
git commit -m "feat: add caching Store API proxy"
```

---

## Task 4: Store API client

**Files:**
- Create: `src/lib/woo.js`
- Create: `src/lib/woo.test.js`

**Interfaces:**
- Consumes: `minorToMajor`, `formatPrice` from `./money.js`; `GET /api/store/*` from Task 3
- Produces:
  - `normalizeProduct(raw): Product`
  - `fetchProducts(params?): Promise<Product[]>`
  - `fetchCategories(): Promise<Category[]>`
  - `fetchFeatured(): Promise<Product[]>`
  - `fetchByTagSlug(slug): Promise<Product[]>`
  - `fetchProductBySlug(slug): Promise<Product | null>`
  - `clearCache(): void` (tests only)

  `Product` = `{ id, slug, name, type, description, shortDescription, price, priceFormatted, inStock, purchasable, hasOptions, variationIds, images, categories, tags }`
  `Category` = `{ id, name, slug, count }`

- [ ] **Step 1: Write the failing tests**

`src/lib/woo.test.js`:

```js
import {
  normalizeProduct,
  fetchProducts,
  fetchCategories,
  fetchFeatured,
  fetchByTagSlug,
  fetchProductBySlug,
  clearCache,
} from './woo.js'

const PRICES = {
  price: '2113',
  regular_price: '2113',
  sale_price: '2113',
  price_range: null,
  currency_code: 'USD',
  currency_symbol: '$',
  currency_minor_unit: 2,
  currency_decimal_separator: '.',
  currency_thousand_separator: ',',
  currency_prefix: '$',
  currency_suffix: '',
}

const RAW = {
  id: 13,
  name: 'Sour Dough',
  slug: 'sour-dough',
  type: 'simple',
  description: '<p>Slow-fermented.</p>',
  short_description: '<p>Crisp crust.</p>',
  prices: PRICES,
  images: [{ id: 1, src: 'a.jpg', thumbnail: 't.jpg', srcset: 'a.jpg 1x', sizes: '100vw', alt: 'Loaf' }],
  categories: [{ id: 1372, name: 'Breads', slug: 'breads' }],
  tags: [{ id: 1376, name: 'lunchbox-bread', slug: 'lunchbox-bread' }],
  variations: [],
  has_options: false,
  is_in_stock: true,
  is_purchasable: true,
}

function jsonOnce(payload) {
  global.fetch.mockResolvedValueOnce({ ok: true, json: async () => payload })
}

beforeEach(() => {
  clearCache()
  sessionStorage.clear()
  global.fetch = vi.fn()
})

describe('normalizeProduct', () => {
  it('converts prices to major units and a formatted string', () => {
    const p = normalizeProduct(RAW)
    expect(p.price).toBe(21.13)
    expect(p.priceFormatted).toBe('$21.13')
  })

  it('maps identity, stock and options flags', () => {
    const p = normalizeProduct(RAW)
    expect(p.id).toBe(13)
    expect(p.slug).toBe('sour-dough')
    expect(p.name).toBe('Sour Dough')
    expect(p.inStock).toBe(true)
    expect(p.hasOptions).toBe(false)
  })

  it('flattens categories, tags and images', () => {
    const p = normalizeProduct(RAW)
    expect(p.categories).toEqual([{ id: 1372, name: 'Breads', slug: 'breads' }])
    expect(p.tags.map((t) => t.slug)).toEqual(['lunchbox-bread'])
    expect(p.images[0].src).toBe('a.jpg')
  })

  it('tolerates missing collections', () => {
    const p = normalizeProduct({ ...RAW, images: undefined, tags: undefined, variations: undefined })
    expect(p.images).toEqual([])
    expect(p.tags).toEqual([])
    expect(p.variationIds).toEqual([])
  })
})

describe('fetchProducts', () => {
  it('calls the proxy, not WordPress', async () => {
    jsonOnce([RAW])
    await fetchProducts()
    expect(global.fetch.mock.calls[0][0]).toMatch(/^\/api\/store\/products/)
  })

  it('returns normalised products', async () => {
    jsonOnce([RAW])
    const products = await fetchProducts()
    expect(products[0].priceFormatted).toBe('$21.13')
  })

  it('serves a second identical call from cache without refetching', async () => {
    jsonOnce([RAW])
    await fetchProducts()
    await fetchProducts()
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('treats different params as different cache entries', async () => {
    jsonOnce([RAW])
    jsonOnce([])
    await fetchProducts()
    await fetchProducts({ category: '1372' })
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('falls back to the committed snapshot when the proxy fails', async () => {
    global.fetch.mockRejectedValue(new Error('offline'))
    const products = await fetchProducts()
    expect(Array.isArray(products)).toBe(true)
  })
})

describe('fetchFeatured', () => {
  it('uses the featured filter, since products carry no is_featured flag', async () => {
    jsonOnce([RAW])
    await fetchFeatured()
    expect(global.fetch.mock.calls[0][0]).toContain('featured=true')
  })
})

describe('fetchByTagSlug', () => {
  it('resolves the slug to a term id before filtering', async () => {
    jsonOnce([{ id: 1376, name: 'lunchbox-bread', slug: 'lunchbox-bread', count: 2 }])
    jsonOnce([RAW])
    await fetchByTagSlug('lunchbox-bread')
    expect(global.fetch.mock.calls[0][0]).toContain('/api/store/products/tags')
    expect(global.fetch.mock.calls[1][0]).toContain('tag=1376')
  })

  it('returns an empty list for a tag that does not exist yet', async () => {
    jsonOnce([])
    const products = await fetchByTagSlug('lunchbox-cracker')
    expect(products).toEqual([])
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })
})

describe('fetchCategories', () => {
  it('returns categories with their counts', async () => {
    jsonOnce([{ id: 1372, name: 'Breads', slug: 'breads', count: 3 }])
    const cats = await fetchCategories()
    expect(cats).toEqual([{ id: 1372, name: 'Breads', slug: 'breads', count: 3 }])
  })
})

describe('fetchProductBySlug', () => {
  it('returns the single matching product', async () => {
    jsonOnce([RAW])
    const p = await fetchProductBySlug('sour-dough')
    expect(p.name).toBe('Sour Dough')
  })

  it('returns null when nothing matches', async () => {
    jsonOnce([])
    expect(await fetchProductBySlug('nope')).toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- woo`
Expected: FAIL — cannot resolve `./woo.js`.

- [ ] **Step 3: Create the fallback snapshot placeholder**

`src/data/products.fallback.json`:

```json
[]
```

- [ ] **Step 4: Implement the client**

`src/lib/woo.js`:

```js
import { minorToMajor, formatPrice } from './money.js'
import fallbackProducts from '../data/products.fallback.json'

/**
 * The only module that talks to the store.
 *
 * Everything goes through /api/store, the Vercel proxy — WordPress.com
 * throttles direct browser traffic at its load balancer and omits
 * Access-Control-Allow-Origin, so direct calls fail under any real load.
 */

const BASE = '/api/store'
const memory = new Map()

export function clearCache() {
  memory.clear()
}

function cacheKey(path, params) {
  return `woo:${path}?${new URLSearchParams(params).toString()}`
}

function readSession(key) {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeSession(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Private mode or quota exceeded. The in-memory cache still applies.
  }
}

async function get(path, params = {}) {
  const key = cacheKey(path, params)
  if (memory.has(key)) return memory.get(key)

  const stored = readSession(key)
  if (stored) {
    memory.set(key, stored)
    return stored
  }

  const query = new URLSearchParams(params).toString()
  const response = await fetch(`${BASE}/${path}${query ? `?${query}` : ''}`)
  if (!response.ok) throw new Error(`Store proxy returned ${response.status}`)
  const data = await response.json()

  memory.set(key, data)
  writeSession(key, data)
  return data
}

export function normalizeProduct(raw) {
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    type: raw.type,
    description: raw.description ?? '',
    shortDescription: raw.short_description ?? '',
    price: minorToMajor(raw.prices.price, raw.prices.currency_minor_unit),
    priceFormatted: formatPrice(raw.prices),
    inStock: raw.is_in_stock,
    purchasable: raw.is_purchasable,
    hasOptions: raw.has_options ?? false,
    variationIds: (raw.variations ?? []).map((v) => v.id),
    images: (raw.images ?? []).map((i) => ({
      src: i.src,
      thumbnail: i.thumbnail,
      srcset: i.srcset,
      sizes: i.sizes,
      alt: i.alt || raw.name,
    })),
    categories: (raw.categories ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
    })),
    tags: (raw.tags ?? []).map((t) => ({ id: t.id, name: t.name, slug: t.slug })),
  }
}

export async function fetchProducts(params = {}) {
  try {
    const raw = await get('products', { per_page: 100, ...params })
    return raw.map(normalizeProduct)
  } catch {
    // A WordPress outage must still render a bakery, just with stale stock.
    return fallbackProducts.map(normalizeProduct)
  }
}

export async function fetchCategories() {
  try {
    const raw = await get('products/categories')
    return raw.map((c) => ({ id: c.id, name: c.name, slug: c.slug, count: c.count }))
  } catch {
    return []
  }
}

export function fetchFeatured() {
  return fetchProducts({ featured: 'true' })
}

export async function fetchByTagSlug(slug) {
  // The Store API filters tags by term id, not slug, so resolve it first.
  // Tags with no products are omitted from the endpoint entirely.
  let tags
  try {
    tags = await get('products/tags')
  } catch {
    return []
  }
  const match = tags.find((t) => t.slug === slug)
  if (!match) return []
  return fetchProducts({ tag: String(match.id) })
}

export async function fetchProductBySlug(slug) {
  const products = await fetchProducts({ slug })
  return products.find((p) => p.slug === slug) ?? products[0] ?? null
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm test -- woo`
Expected: PASS, 15 tests.

- [ ] **Step 6: Commit**

```bash
git add src/lib/woo.js src/lib/woo.test.js src/data/products.fallback.json
git commit -m "feat: add Store API client with caching and fallback"
```

---

## Task 5: Build-time fallback snapshot

**Files:**
- Create: `scripts/fetch-fallback.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: env var `WP_STORE_URL`
- Produces: refreshes `src/data/products.fallback.json` during `npm run build`. Always exits 0.

- [ ] **Step 1: Write the script**

`scripts/fetch-fallback.mjs`:

```js
/**
 * Refreshes the committed product snapshot at build time.
 *
 * This must never fail a deploy. If WordPress is throttling or down, the
 * previously committed snapshot is kept and the build continues.
 */
import { writeFileSync } from 'node:fs'

const OUT = 'src/data/products.fallback.json'
const base = process.env.WP_STORE_URL

async function main() {
  if (!base) {
    console.warn('[fallback] WP_STORE_URL not set, keeping committed snapshot')
    return
  }

  const response = await fetch(`${base}/wp-json/wc/store/v1/products?per_page=100`, {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  const data = await response.json()
  if (!Array.isArray(data)) throw new Error('response was not an array')
  if (data.length === 0) throw new Error('no products returned')

  writeFileSync(OUT, `${JSON.stringify(data, null, 2)}\n`)
  console.log(`[fallback] wrote ${data.length} products to ${OUT}`)
}

main().catch((error) => {
  console.warn(`[fallback] keeping committed snapshot (${error.message})`)
})
```

- [ ] **Step 2: Hook it into the build**

In `package.json` `"scripts"`, add:

```json
"prebuild": "node scripts/fetch-fallback.mjs"
```

- [ ] **Step 3: Verify it succeeds against the live store**

Run: `node scripts/fetch-fallback.mjs`
Expected: `[fallback] wrote 4 products to src/data/products.fallback.json`

- [ ] **Step 4: Verify it degrades instead of failing**

Run: `WP_STORE_URL=https://not-a-real-host.invalid node scripts/fetch-fallback.mjs; echo "exit=$?"`
Expected: a `[fallback] keeping committed snapshot (...)` warning and `exit=0`.

- [ ] **Step 5: Verify the build still works**

Run: `npm run build`
Expected: prebuild runs, then Vite build succeeds.

- [ ] **Step 6: Commit**

```bash
git add scripts/fetch-fallback.mjs package.json src/data/products.fallback.json
git commit -m "feat: refresh product snapshot at build time"
```

---

## Task 6: Home page Seasonal Specials from live data

**Files:**
- Modify: `src/components/SeasonalSpecials.jsx`
- Modify: `src/pages/Home.jsx`
- Create: `src/components/SeasonalSpecials.test.jsx`

**Interfaces:**
- Consumes: `fetchFeatured` from `src/lib/woo.js`
- Produces: `<SeasonalSpecials items={[{ name, price, img }]} />` — a presentational component with no fetching of its own, reusable by Menu in Task 7.

- [ ] **Step 1: Write the failing test**

`src/components/SeasonalSpecials.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import SeasonalSpecials from './SeasonalSpecials.jsx'

const ITEMS = [
  { name: 'Danish Pastries', price: '$23.00', img: 'danish.jpg' },
  { name: 'Croissants', price: '$23.00', img: 'croissants.jpg' },
]

describe('SeasonalSpecials', () => {
  it('renders the items it is given', () => {
    render(<SeasonalSpecials items={ITEMS} />)
    expect(screen.getByText('Danish Pastries')).toBeTruthy()
    expect(screen.getByText('Croissants')).toBeTruthy()
  })

  it('renders nothing when there are no specials', () => {
    const { container } = render(<SeasonalSpecials items={[]} />)
    expect(container.textContent).not.toContain('Danish')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- SeasonalSpecials`
Expected: FAIL — the component currently imports its own hardcoded array and ignores props.

- [ ] **Step 3: Make the component presentational**

In `src/components/SeasonalSpecials.jsx`: delete the hardcoded specials array and its image imports, and take `items` as a prop with a default of `[]`. Change the signature to:

```jsx
export default function SeasonalSpecials({ items = [] }) {
```

Then replace the internal array reference in the map with `items`. Leave every class name, wrapper element and layout value exactly as it is — this task changes the data source only.

If `items` is empty, return `null` before the markup:

```jsx
  if (items.length === 0) return null
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- SeasonalSpecials`
Expected: PASS, 2 tests.

- [ ] **Step 5: Wire Home to the API**

In `src/pages/Home.jsx`, delete the `SPECIALS` array and its `special*` image imports. Add:

```jsx
import { useEffect, useState } from 'react'
import { fetchFeatured } from '../lib/woo.js'
```

Inside the component:

```jsx
  const [specials, setSpecials] = useState([])

  useEffect(() => {
    let active = true
    fetchFeatured().then((products) => {
      if (!active) return
      setSpecials(
        products.slice(0, 4).map((p) => ({
          name: p.name,
          price: p.priceFormatted,
          img: p.images[0]?.src ?? '',
        })),
      )
    })
    return () => {
      active = false
    }
  }, [])
```

Pass it down where `SeasonalSpecials` is rendered:

```jsx
        <SeasonalSpecials items={specials} />
```

- [ ] **Step 6: Verify in the browser**

Run: `npm run dev`
Open `http://localhost:5173/`. Expected: the Seasonal Specials section shows **Danish Pastries at $23.00** — the one product starred as Featured in WooCommerce. Untick the star in `wp-admin`, hard-reload, and it disappears.

- [ ] **Step 7: Commit**

```bash
git add src/components/SeasonalSpecials.jsx src/components/SeasonalSpecials.test.jsx src/pages/Home.jsx
git commit -m "feat: render seasonal specials from featured products"
```

---

## Task 7: Menu page categories and products from live data

**Files:**
- Modify: `src/pages/Menu.jsx`
- Create: `src/pages/Menu.test.jsx`

**Interfaces:**
- Consumes: `fetchCategories`, `fetchProducts`, `fetchFeatured` from `src/lib/woo.js`
- Produces: nothing consumed by later tasks

- [ ] **Step 1: Write the failing test**

`src/pages/Menu.test.jsx`:

```jsx
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Menu from './Menu.jsx'
import * as woo from '../lib/woo.js'

const product = (over = {}) => ({
  id: 13,
  slug: 'sour-dough',
  name: 'Sour Dough',
  type: 'simple',
  description: 'Slow-fermented.',
  shortDescription: '',
  price: 21.13,
  priceFormatted: '$21.13',
  inStock: true,
  purchasable: true,
  hasOptions: false,
  variationIds: [],
  images: [{ src: 'a.jpg', thumbnail: 't.jpg', srcset: '', sizes: '', alt: 'Loaf' }],
  categories: [{ id: 1372, name: 'Breads', slug: 'breads' }],
  tags: [],
  ...over,
})

beforeEach(() => {
  vi.spyOn(woo, 'fetchCategories').mockResolvedValue([
    { id: 1372, name: 'Breads', slug: 'breads', count: 2 },
    { id: 1373, name: 'Muffins', slug: 'muffins', count: 1 },
  ])
  vi.spyOn(woo, 'fetchFeatured').mockResolvedValue([])
  vi.spyOn(woo, 'fetchByTagSlug').mockResolvedValue([])
  vi.spyOn(woo, 'fetchProducts').mockResolvedValue([
    product(),
    product({ id: 16, slug: 'japanese-milk-bread', name: 'Japanese Milk Bread', inStock: false }),
  ])
})

afterEach(() => vi.restoreAllMocks())

const renderMenu = () => render(<MemoryRouter><Menu /></MemoryRouter>)

describe('Menu', () => {
  it('renders a tab per category returned by the API', async () => {
    renderMenu()
    await waitFor(() => expect(screen.getByText('Breads')).toBeTruthy())
    expect(screen.getByText('Muffins')).toBeTruthy()
  })

  it('renders products with formatted prices', async () => {
    renderMenu()
    await waitFor(() => expect(screen.getByText('Sour Dough')).toBeTruthy())
    expect(screen.getAllByText('$21.13').length).toBeGreaterThan(0)
  })

  it('marks an out-of-stock product as sold out', async () => {
    renderMenu()
    await waitFor(() => expect(screen.getByText('Japanese Milk Bread')).toBeTruthy())
    expect(screen.getByText(/sold out/i)).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- Menu`
Expected: FAIL — Menu renders the hardcoded `CATEGORIES` and `BREADS_ITEMS`.

- [ ] **Step 3: Replace the hardcoded data**

In `src/pages/Menu.jsx`:

Delete `SPECIALS`, `CATEGORIES`, `BREADS_ITEMS`, `MENU_ITEMS`, and the `special*` and `bread*` image imports. Keep every layout constant (`HERO_STRIPES`, `CHECKERBOARD_BG`, `SCALLOP_DESKTOP`, `SCALLOP_MOBILE`, `HERO_FLOWERS_*`) exactly as is.

Add:

```jsx
import { useEffect, useState } from 'react'
import { fetchCategories, fetchProducts, fetchFeatured } from '../lib/woo.js'
```

Inside the component:

```jsx
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [specials, setSpecials] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)

  useEffect(() => {
    let active = true
    Promise.all([fetchCategories(), fetchProducts(), fetchFeatured()]).then(
      ([cats, prods, feat]) => {
        if (!active) return
        setCategories(cats)
        setProducts(prods)
        setActiveCategory((current) => current ?? cats[0]?.slug ?? null)
        setSpecials(
          feat.slice(0, 4).map((p) => ({
            name: p.name,
            price: p.priceFormatted,
            img: p.images[0]?.src ?? '',
          })),
        )
      },
    )
    return () => {
      active = false
    }
  }, [])

  const visibleProducts = products.filter((p) =>
    p.categories.some((c) => c.slug === activeCategory),
  )
```

Render the tabs from `categories` (using `c.slug` as the key and `c.name` as the label, `setActiveCategory(c.slug)` on click), and the cards from `visibleProducts`.

`BreadCard` keeps its markup; feed it `{ name: p.name, desc: p.shortDescription || p.description, price: p.priceFormatted, img: p.images[0]?.src }`. The Figma-pinned pill widths keyed off `CATEGORIES[].w` no longer apply — let the pills size to their own content with horizontal padding, since category names now come from the client.

For out-of-stock products, render a `Sold out` label in place of the add control:

```jsx
            {!item.inStock ? (
              <span className="font-parkinsans text-[13px] font-semibold text-taupe">
                Sold out
              </span>
            ) : qty > 0 ? (
```

Pass the specials through to the existing `SeasonalSpecials` usage:

```jsx
        <SeasonalSpecials items={specials} />
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- Menu`
Expected: PASS, 3 tests.

- [ ] **Step 5: Verify in the browser**

Run: `npm run dev`
Open `http://localhost:5173/menu`. Expected: one **Breads** tab containing Sour Dough, Danish Pastries and Japanese Milk Bread; Japanese Milk Bread shows **Sold out**. Muffins, Cookies and Crackers are absent because they have no products — add one in `wp-admin` and its tab appears on reload.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Menu.jsx src/pages/Menu.test.jsx
git commit -m "feat: render menu categories and products from the store"
```

---

## Task 8: Product page on a real slug

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/pages/Product.jsx`
- Create: `src/pages/Product.test.jsx`

**Interfaces:**
- Consumes: `fetchProductBySlug` from `src/lib/woo.js`; `useParams` from `react-router-dom`
- Produces: route `/product/:slug`

- [ ] **Step 1: Write the failing test**

`src/pages/Product.test.jsx`:

```jsx
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Product from './Product.jsx'
import * as woo from '../lib/woo.js'

const PRODUCT = {
  id: 13,
  slug: 'sour-dough',
  name: 'Sour Dough',
  type: 'simple',
  description: '<p>Slow-fermented.</p>',
  shortDescription: '<p>Crisp crust.</p>',
  price: 21.13,
  priceFormatted: '$21.13',
  inStock: true,
  purchasable: true,
  hasOptions: false,
  variationIds: [],
  images: [{ src: 'a.jpg', thumbnail: 't.jpg', srcset: '', sizes: '', alt: 'Loaf' }],
  categories: [],
  tags: [],
}

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/product/:slug" element={<Product />} />
      </Routes>
    </MemoryRouter>,
  )

afterEach(() => vi.restoreAllMocks())

describe('Product', () => {
  it('renders the product named in the URL', async () => {
    vi.spyOn(woo, 'fetchProductBySlug').mockResolvedValue(PRODUCT)
    renderAt('/product/sour-dough')
    await waitFor(() => expect(screen.getByText('Sour Dough')).toBeTruthy())
    expect(woo.fetchProductBySlug).toHaveBeenCalledWith('sour-dough')
    expect(screen.getAllByText('$21.13').length).toBeGreaterThan(0)
  })

  it('shows a not-found message for an unknown slug', async () => {
    vi.spyOn(woo, 'fetchProductBySlug').mockResolvedValue(null)
    renderAt('/product/nope')
    await waitFor(() => expect(screen.getByText(/couldn.t find/i)).toBeTruthy())
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- Product`
Expected: FAIL — Product ignores the route param and renders hardcoded content.

- [ ] **Step 3: Add the route**

In `src/App.jsx`, replace:

```jsx
        <Route path="/product" element={<Product />} />
```

with:

```jsx
        <Route path="/product/:slug" element={<Product />} />
```

- [ ] **Step 4: Wire the page**

In `src/pages/Product.jsx`, add:

```jsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchProductBySlug } from '../lib/woo.js'
```

Inside the component:

```jsx
  const { slug } = useParams()
  const [product, setProduct] = useState(undefined)

  useEffect(() => {
    let active = true
    fetchProductBySlug(slug).then((p) => {
      if (active) setProduct(p)
    })
    return () => {
      active = false
    }
  }, [slug])

  if (product === undefined) return null
  if (product === null) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center px-[24px]">
        <p className="font-parkinsans text-[18px] text-cocoa">
          We couldn&rsquo;t find that bake. Try the menu.
        </p>
      </main>
    )
  }
```

Replace the hardcoded name, price and description with `product.name`, `product.priceFormatted` and `product.description` (rendered with `dangerouslySetInnerHTML` since the Store API returns HTML). Feed `GALLERY_IMAGES` from `product.images.map((i) => i.src)`, falling back to the existing placeholder import when `product.images` is empty so the layout never collapses.

Leave `PACK_OPTIONS` in place for now — variable products arrive with the Blueberry Muffin in Task 9 of the next plan. Hide the pack selector when `!product.hasOptions`.

- [ ] **Step 5: Run to verify it passes**

Run: `npm test -- Product`
Expected: PASS, 2 tests.

- [ ] **Step 6: Update the links that point at the old route**

Search for `to="/product"`:

```bash
grep -rn 'to="/product"' src/
```

Replace each with a slug-bearing link, e.g. `` to={`/product/${p.slug}`} `` in Menu cards and related-item tiles.

- [ ] **Step 7: Verify in the browser**

Run: `npm run dev`
Open `http://localhost:5173/product/sour-dough`. Expected: Sour Dough at $21.13 with its real description. `/product/nope` shows the not-found message.

- [ ] **Step 8: Commit**

```bash
git add src/App.jsx src/pages/Product.jsx src/pages/Product.test.jsx src/pages/Menu.jsx
git commit -m "feat: render product page from route slug"
```

---

## Task 9: Lunch Box options from tagged products

**Files:**
- Modify: `src/pages/Menu.jsx`
- Modify: `src/pages/Menu.test.jsx`

**Interfaces:**
- Consumes: `fetchByTagSlug` from `src/lib/woo.js`
- Produces: nothing consumed by later tasks

- [ ] **Step 1: Write the failing test**

Append to `src/pages/Menu.test.jsx`:

```jsx
describe('Menu lunch box', () => {
  it('builds each column from its tag', async () => {
    woo.fetchByTagSlug.mockImplementation(async (slug) =>
      slug === 'lunchbox-bread'
        ? [product(), product({ id: 16, slug: 'japanese-milk-bread', name: 'Japanese Milk Bread' })]
        : [],
    )
    renderMenu()
    await waitFor(() => expect(woo.fetchByTagSlug).toHaveBeenCalledWith('lunchbox-bread'))
    expect(woo.fetchByTagSlug).toHaveBeenCalledWith('lunchbox-cracker')
    expect(woo.fetchByTagSlug).toHaveBeenCalledWith('lunchbox-dessert')
  })

  it('renders no options for a tag with no products yet', async () => {
    woo.fetchByTagSlug.mockResolvedValue([])
    renderMenu()
    await waitFor(() => expect(woo.fetchByTagSlug).toHaveBeenCalled())
    expect(screen.queryByText('Chief’s Crackers (5oz)')).toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- Menu`
Expected: FAIL — `fetchByTagSlug` is never called; the columns come from `BREAD_OPTIONS`, `CRACKER_OPTIONS`, `DESSERT_OPTIONS`.

- [ ] **Step 3: Replace the hardcoded option arrays**

In `src/pages/Menu.jsx`, delete `BREAD_OPTIONS`, `CRACKER_OPTIONS`, `DESSERT_OPTIONS` and their `lunchbox*` image imports. Keep `LUNCHBOX_INSIDE` — those are the static "what's inside" descriptions, not products.

Add to the existing import from `../lib/woo.js`: `fetchByTagSlug`.

Inside the component:

```jsx
  const [lunchbox, setLunchbox] = useState({ bread: [], cracker: [], dessert: [] })

  useEffect(() => {
    let active = true
    Promise.all([
      fetchByTagSlug('lunchbox-bread'),
      fetchByTagSlug('lunchbox-cracker'),
      fetchByTagSlug('lunchbox-dessert'),
    ]).then(([bread, cracker, dessert]) => {
      if (!active) return
      const toOption = (p) => ({ name: p.name, img: p.images[0]?.src ?? '' })
      setLunchbox({
        bread: bread.map(toOption),
        cracker: cracker.map(toOption),
        dessert: dessert.map(toOption),
      })
    })
    return () => {
      active = false
    }
  }, [])
```

Render each column from `lunchbox.bread`, `lunchbox.cracker` and `lunchbox.dessert`. Drop the `nameW` pinned widths — those were Figma text-box widths for known strings, and the names are now the client's to choose. Let the labels wrap naturally within the existing card width.

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- Menu`
Expected: PASS, 5 tests.

- [ ] **Step 5: Verify in the browser**

Run: `npm run dev`
Open `http://localhost:5173/menu`. Expected: the Bread column offers **Sour Dough** and **Japanese Milk Bread** (both tagged `lunchbox-bread` in WooCommerce); the Crackers and Dessert columns are empty because nothing carries those tags yet. Add `lunchbox-cracker` to a product in `wp-admin`, reload, and it appears.

- [ ] **Step 6: Run the whole suite**

Run: `npm test`
Expected: PASS, all tests.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Menu.jsx src/pages/Menu.test.jsx
git commit -m "feat: build lunch box options from tagged products"
```

---

## Definition of Done

- `npm test` passes.
- `npm run build` succeeds, including with `WP_STORE_URL` pointing at an unreachable host.
- `/`, `/menu` and `/product/sour-dough` render live WooCommerce data on the deployed Vercel site.
- Renaming a product in `wp-admin` changes the site within about a minute (the proxy's `s-maxage`).
- Starring a product as Featured puts it in Seasonal Specials.
- Adding `lunchbox-cracker` to a product puts it in the Lunch Box builder.
- Marking a product out of stock shows **Sold out**.
- `grep -rn "BREADS_ITEMS\|MENU_ITEMS\|SPECIALS\|BREAD_OPTIONS\|CRACKER_OPTIONS\|DESSERT_OPTIONS" src/` returns nothing.
- No `VITE_`-prefixed variable contains the WordPress URL, and no WooCommerce consumer key exists anywhere in the repo.
