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
 *
 * The endpoint arrives as a query parameter rather than a path segment. This
 * started life as `api/store/[...path].js`, but Vercel did not populate
 * `req.query.path` from that catch-all on this project: a single segment
 * reached the function with no `path` at all, and a two-segment path never
 * reached it. One flat file with an explicit `?endpoint=` has no routing
 * behaviour to get wrong.
 */

const ALLOWED_ENDPOINTS = new Set([
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

/**
 * Cache at the CDN, never in the browser.
 *
 * A plain `Cache-Control: s-maxage=...` did not reach Vercel's edge on this
 * project — every request came back `X-Vercel-Cache: MISS`, `Age: 0`, with
 * Vercel's default `max-age=0, must-revalidate` on the wire, so every page
 * load was hitting WordPress directly and the 429 throttle this proxy exists
 * to avoid was fully exposed. `Vercel-CDN-Cache-Control` is the header Vercel
 * documents for controlling its own edge; `CDN-Cache-Control` covers any
 * other CDN in front. Browsers keep revalidating so a price change is never
 * stuck in someone's tab.
 */
function setCache(res, seconds, staleSeconds) {
  const stale = staleSeconds ? `, stale-while-revalidate=${staleSeconds}` : ''
  res.setHeader('Vercel-CDN-Cache-Control', `public, s-maxage=${seconds}${stale}`)
  res.setHeader('CDN-Cache-Control', `public, s-maxage=${seconds}${stale}`)
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate')
}

export default async function handler(req, res) {
  const endpoint = String(req.query.endpoint ?? '')

  // The only POST-capable endpoint. Anything else (including POST to a GET
  // endpoint) falls through to the GET-only guard below and gets a 405.
  if (req.method === 'POST' && endpoint === 'quote') {
    return handleQuote(req, res)
  }

  // Both live on the lilloaves/v1 namespace, like /quote, but are GET and
  // public (no secret) - a store's name/hours and a pack size's price are
  // no more sensitive than the product prices the wc/store/v1 allowlist
  // below already serves unauthenticated. Handled before that allowlist
  // since neither is on the wc/store/v1 namespace at all.
  if (req.method === 'GET' && (endpoint === 'pickup' || endpoint === 'variations')) {
    return handleBridgeGet(req, res, endpoint)
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!ALLOWED_ENDPOINTS.has(endpoint)) {
    return res.status(404).json({ error: 'Unknown endpoint' })
  }

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(req.query)) {
    if (key !== 'endpoint' && ALLOWED_PARAMS.has(key)) params.set(key, String(value))
  }

  const base = process.env.WP_STORE_URL
  if (!base) return res.status(500).json({ error: 'WP_STORE_URL is not set' })

  const upstream = `${base}/wp-json/wc/store/v1/${endpoint}?${params}`

  try {
    const response = await fetch(upstream, {
      headers: { Accept: 'application/json' },
      // A hanging upstream during a WordPress.com throttle storm must fail
      // fast into the 502 path rather than pinning the function until
      // Vercel's own platform timeout.
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) {
      // Still cacheable: during a 429 storm this is the exact case the
      // proxy exists for, and an uncached 502 fans out a fresh invocation
      // at the throttled origin on every single page load.
      setCache(res, 10, 0)
      return res.status(502).json({ error: 'Upstream error', status: response.status })
    }
    const data = await response.json()
    setCache(res, 60, 600)
    return res.status(200).json(data)
  } catch (error) {
    console.error('store proxy fetch failed', error)
    setCache(res, 10, 0)
    return res.status(502).json({ error: 'Upstream unreachable' })
  }
}

/**
 * `/quote` returns a live cart total, so it must never be cached anywhere
 * (CDN, browser, or otherwise) and it carries a customer's postcode in the
 * body — never logged, unlike the GET paths above which log fetch errors
 * only (no body to leak).
 *
 * It lives on a different upstream namespace (`lilloaves/v1`, a custom
 * bridge plugin) than the GET paths (`wc/store/v1`, WooCommerce's own Store
 * API) and requires a shared secret the GET paths don't need.
 */
async function handleQuote(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  const base = process.env.WP_STORE_URL
  if (!base) return res.status(500).json({ error: 'WP_STORE_URL is not set' })

  const secret = process.env.LL_BRIDGE_SECRET
  if (!secret) return res.status(500).json({ error: 'LL_BRIDGE_SECRET is not set' })

  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim()

  const headers = { 'Content-Type': 'application/json', 'X-LL-Secret': secret }
  if (clientIp) headers['X-LL-Client'] = clientIp

  try {
    const response = await fetch(`${base}/wp-json/lilloaves/v1/quote`, {
      method: 'POST',
      headers,
      body: JSON.stringify(req.body),
      // Same fail-fast budget as the GET paths.
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) {
      return res.status(502).json({ error: 'Upstream error', status: response.status })
    }
    const data = await response.json()
    return res.status(200).json(data)
  } catch (error) {
    console.error('store proxy fetch failed', error)
    return res.status(502).json({ error: 'Upstream unreachable' })
  }
}

/**
 * Shared by /pickup (store/collection dates/time slots) and /variations
 * (pack-size prices) - both live on the lilloaves/v1 namespace, are
 * read-only and identical for every customer, so both are cached at the
 * edge exactly like the wc/store/v1 GET paths above - unlike /quote, which
 * is a live per-cart total and must never be cached.
 */
async function handleBridgeGet(req, res, endpoint) {
  const base = process.env.WP_STORE_URL
  if (!base) return res.status(500).json({ error: 'WP_STORE_URL is not set' })

  try {
    const response = await fetch(`${base}/wp-json/lilloaves/v1/${endpoint}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) {
      setCache(res, 10, 0)
      return res.status(502).json({ error: 'Upstream error', status: response.status })
    }
    const data = await response.json()
    setCache(res, 60, 600)
    return res.status(200).json(data)
  } catch (error) {
    console.error('store proxy fetch failed', error)
    setCache(res, 10, 0)
    return res.status(502).json({ error: 'Upstream unreachable' })
  }
}
