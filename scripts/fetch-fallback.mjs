/**
 * Refreshes the committed product snapshot at build time.
 *
 * This must never fail a deploy. If WordPress is throttling or down, the
 * previously committed snapshot is kept and the build continues.
 */
import { writeFileSync } from 'node:fs'

const OUT = 'src/data/products.fallback.json'
const base = process.env.WP_STORE_URL

/**
 * Strip product to only fields that normalizeProduct actually reads.
 * Use an allowlist to prevent leaking WooCommerce URLs and internal fields.
 */
function stripProduct(raw) {
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    type: raw.type,
    description: raw.description,
    short_description: raw.short_description,
    prices: raw.prices,
    is_in_stock: raw.is_in_stock,
    is_purchasable: raw.is_purchasable,
    has_options: raw.has_options,
    variations: (raw.variations ?? []).map((v) => ({ id: v.id })),
    images: (raw.images ?? []).map((i) => ({
      src: i.src,
      thumbnail: i.thumbnail,
      srcset: i.srcset,
      sizes: i.sizes,
      alt: i.alt,
    })),
    categories: (raw.categories ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
    })),
    tags: (raw.tags ?? []).map((t) => ({ id: t.id, name: t.name, slug: t.slug })),
  }
}

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

  const stripped = data.map(stripProduct)
  writeFileSync(OUT, `${JSON.stringify(stripped, null, 2)}\n`)
  console.log(`[fallback] wrote ${stripped.length} products to ${OUT}`)
}

main().catch((error) => {
  console.warn(`[fallback] keeping committed snapshot (${error.message})`)
})
