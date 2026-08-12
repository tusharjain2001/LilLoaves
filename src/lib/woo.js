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

/**
 * WooCommerce returns product and term names HTML-encoded — an apostrophe
 * arrives as `&#8217;`, so "Doc's Crackers" comes through as
 * "Doc&#8217;s Crackers". React renders text literally, so that entity would
 * appear on the page exactly as written. The bakery types apostrophes
 * constantly, so decode once here at the boundary rather than in each
 * component.
 */
function decodeName(value) {
  return toPlainText(value ?? '')
}

function cacheKey(path, params) {
  return `woo:${path}?${new URLSearchParams(params).toString()}`
}

async function get(path, params = {}) {
  const key = cacheKey(path, params)
  if (memory.has(key)) return memory.get(key)

  const search = new URLSearchParams({ endpoint: path, ...params }).toString()
  const response = await fetch(`${BASE}?${search}`)
  if (!response.ok) throw new Error(`Store proxy returned ${response.status}`)
  const data = await response.json()

  memory.set(key, data)
  return data
}

export function normalizeProduct(raw) {
  return {
    id: raw.id,
    slug: raw.slug,
    name: decodeName(raw.name),
    type: raw.type,
    description: raw.description ?? '',
    shortDescription: raw.short_description ?? '',
    summary: toPlainText(raw.short_description || raw.description),
    price: minorToMajor(raw.prices.price, raw.prices.currency_minor_unit),
    priceFormatted: formatPrice(raw.prices),
    regularPriceFormatted: formatPrice(raw.prices, raw.prices.regular_price),
    onSale: raw.prices.sale_price !== raw.prices.regular_price,
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
      name: decodeName(c.name),
      slug: c.slug,
    })),
    tags: (raw.tags ?? []).map((t) => ({ id: t.id, name: decodeName(t.name), slug: t.slug })),
    customAttributes: extractCustomAttributes(raw.attributes),
  }
}

// Ingredients/Allergens (or whatever else the owner adds in wp-admin) arrive
// as custom product attributes - `taxonomy: null` and `has_variations: false`
// is what tells one apart from a real taxonomy attribute like pa_pack-size
// (`taxonomy: "pa_pack-size"`, `has_variations: true`), which is a live
// selling feature and must never be parsed as ingredient text. A term-less
// attribute is dropped rather than shown empty - load-bearing for allergens,
// a food-safety field that must never render as a blank or placeholder box.
function extractCustomAttributes(attributes) {
  return (attributes ?? [])
    .filter((a) => !a.taxonomy && !a.has_variations)
    .map((a) => ({
      id: a.id,
      name: decodeName(a.name),
      value: (a.terms ?? []).map((t) => decodeName(t.name)).join(', '),
    }))
    .filter((a) => a.name && a.value)
}

// The committed snapshot is an unfiltered product dump. It cannot honour a
// featured/tag/slug/category filter, and the Store API doesn't even expose
// `is_featured` for us to filter on locally, so a filtered fetch that fails
// must return empty rather than silently ignore the filter and hand back
// every product.
const FILTER_PARAMS = ['featured', 'tag', 'slug', 'category']

// Muffins/Cookies/Crackers are WooCommerce *variable* products - the Store
// API's own product list carries no per-variation price (verified live), so
// pack-size prices come from this separate bridge endpoint and get merged
// onto the matching product by id below. A simple product (bread) is never a
// key in `products`, so it comes back from `attachPackSizes` untouched - no
// `packSizes` field at all, which is what lets the menu/product page render
// it exactly as before pack sizes existed.
async function fetchVariationsData() {
  try {
    return await get('variations', {})
  } catch {
    // A price lookup failing must degrade to base prices, not break the menu.
    return null
  }
}

function attachPackSizes(product, variationsData) {
  const list = variationsData.products?.[product.id]
  if (!list?.length) return product
  const currency = variationsData.currency
  return {
    ...product,
    packSizes: list.map((v) => ({
      id: v.id,
      name: decodeName(v.name),
      slug: v.slug,
      price: minorToMajor(v.price, currency.currency_minor_unit),
      priceFormatted: formatPrice(currency, v.price),
      inStock: v.in_stock,
      purchasable: v.purchasable,
    })),
  }
}

export async function fetchProducts(params = {}) {
  try {
    const raw = await get('products', { per_page: 100, ...params })
    const products = raw.map(normalizeProduct)
    const variationsData = await fetchVariationsData()
    return variationsData ? products.map((p) => attachPackSizes(p, variationsData)) : products
  } catch {
    // A WordPress outage must still render a bakery, just with stale stock.
    if (FILTER_PARAMS.some((key) => params[key] !== undefined)) return []
    return fallbackProducts.map(normalizeProduct)
  }
}

export async function fetchCategories() {
  try {
    const raw = await get('products/categories', { per_page: 100 })
    return raw.map((c) => ({ id: c.id, name: decodeName(c.name), slug: c.slug, count: c.count }))
  } catch {
    // Derive categories from the snapshot so the menu tabs still render
    // during an outage instead of leaving activeCategory stuck at null.
    const bySlug = new Map()
    for (const raw of fallbackProducts) {
      for (const c of raw.categories ?? []) {
        const existing = bySlug.get(c.slug)
        if (existing) existing.count += 1
        else bySlug.set(c.slug, { id: c.id, name: decodeName(c.name), slug: c.slug, count: 1 })
      }
    }
    return [...bySlug.values()]
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
  return products.find((p) => p.slug === slug) ?? null
}
