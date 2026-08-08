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
