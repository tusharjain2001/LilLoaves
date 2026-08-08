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
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const endpoint = String(req.query.endpoint ?? '')

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
