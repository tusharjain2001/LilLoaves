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

// WooCommerce descriptions are HTML. Card-style UI wants plain text; the
// product page wants the raw HTML (dangerouslySetInnerHTML), so this stays a
// separate field rather than mutating `description`. DOMParser (not a regex)
// so entities like &rsquo; decode correctly and `>` in prose isn't mistaken
// for a tag.
function toPlainText(html) {
  if (!html) return ''
  return new DOMParser().parseFromString(html, 'text/html').body.textContent.trim()
}

function cacheKey(path, params) {
  return `woo:${path}?${new URLSearchParams(params).toString()}`
}

async function get(path, params = {}) {
  const key = cacheKey(path, params)
  if (memory.has(key)) return memory.get(key)

  const query = new URLSearchParams(params).toString()
  const response = await fetch(`${BASE}/${path}${query ? `?${query}` : ''}`)
  if (!response.ok) throw new Error(`Store proxy returned ${response.status}`)
  const data = await response.json()

  memory.set(key, data)
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
    summary: toPlainText(raw.short_description || raw.description),
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
    const raw = await get('products/categories', { per_page: 100 })
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
    tags = await get('products/tags', { per_page: 100 })
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
