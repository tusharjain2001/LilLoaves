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
  } catch (error) {
    console.error('store proxy fetch failed', error)
    return res.status(502).json({ error: 'Upstream unreachable' })
  }
}
