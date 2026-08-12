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

// fetchProducts now always fetches /variations too (see 'fetchProducts pack
// sizes' below), so the mock routes that call to its own default rather than
// consuming a slot every other test's jsonOnce(...) calls queue for the
// products/tags/categories request they actually care about. Tests that want
// to control the variations response use mockVariations/failVariations
// instead of jsonOnce for it.
let queue = []
let variationsImpl = () =>
  Promise.resolve({ ok: true, json: async () => ({ products: {}, currency: null }) })

function jsonOnce(payload) {
  queue.push({ ok: true, json: async () => payload })
}

function mockVariations(payload) {
  variationsImpl = () => Promise.resolve({ ok: true, json: async () => payload })
}

function failVariations() {
  variationsImpl = () => Promise.reject(new Error('offline'))
}

beforeEach(() => {
  clearCache()
  queue = []
  variationsImpl = () =>
    Promise.resolve({ ok: true, json: async () => ({ products: {}, currency: null }) })
  global.fetch = vi.fn((url) => {
    if (String(url).includes('endpoint=variations')) return variationsImpl()
    const next = queue.shift()
    return next ? Promise.resolve(next) : Promise.reject(new Error(`unmocked fetch call: ${url}`))
  })
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

  it('strips HTML from short_description into a plain-text summary', () => {
    const p = normalizeProduct(RAW)
    expect(p.summary).toBe('Crisp crust.')
    expect(p.description).toBe('<p>Slow-fermented.</p>')
  })

  it('falls back to description when short_description is empty', () => {
    const p = normalizeProduct({ ...RAW, short_description: '' })
    expect(p.summary).toBe('Slow-fermented.')
  })

  it('decodes HTML entities', () => {
    const p = normalizeProduct({ ...RAW, short_description: '<p>Doc&rsquo;s Crackers</p>' })
    expect(p.summary).toBe('Doc’s Crackers')
  })

  it('returns an empty string when both descriptions are empty', () => {
    const p = normalizeProduct({ ...RAW, short_description: '', description: '' })
    expect(p.summary).toBe('')
  })

  it('is not on sale when sale_price equals regular_price', () => {
    const p = normalizeProduct(RAW)
    expect(p.onSale).toBe(false)
    expect(p.regularPriceFormatted).toBe('$21.13')
  })

  it('is on sale when sale_price differs from regular_price', () => {
    const onSaleRaw = {
      ...RAW,
      prices: { ...PRICES, price: '1800', sale_price: '1800', regular_price: '2113' },
    }
    const p = normalizeProduct(onSaleRaw)
    expect(p.onSale).toBe(true)
    expect(p.priceFormatted).toBe('$18.00')
    expect(p.regularPriceFormatted).toBe('$21.13')
  })
})

// Ingredients/Allergens arrive as custom (non-taxonomy) product attributes,
// distinguished from a real taxonomy attribute like pa_pack-size by
// `taxonomy: null` and `has_variations: false` - pa_pack-size is a live
// selling feature (Menu/Product's pack-size pills) and must never be parsed
// as ingredient text.
describe('normalizeProduct customAttributes', () => {
  const PACK_SIZE_ATTR = {
    id: 3, name: 'Pack Size', taxonomy: 'pa_pack-size', has_variations: true,
    terms: [{ id: 10, name: 'Pack of 4', slug: 'pack-of-4' }],
  }
  const INGREDIENTS_ATTR = {
    id: 0, name: 'Ingredients', taxonomy: null, has_variations: false,
    terms: [{ id: 0, name: 'Flour, water, sourdough starter, and sea salt.', slug: 'flour-water' }],
  }
  // WooCommerce gives every custom (non-taxonomy) attribute id 0 - it is
  // only global/taxonomy attributes (like pa_pack-size) that get a real
  // attribute_id. Confirmed live: Ingredients and Allergens both arrived
  // with id 0, which is why nothing downstream (React keys included) may
  // treat id as unique.
  const ALLERGENS_ATTR = {
    id: 0, name: 'Allergens', taxonomy: null, has_variations: false,
    terms: [{ id: 0, name: 'Contains wheat and gluten.', slug: 'contains-wheat' }],
  }

  it('extracts custom attributes as name/value pairs', () => {
    const p = normalizeProduct({ ...RAW, attributes: [INGREDIENTS_ATTR, ALLERGENS_ATTR] })
    expect(p.customAttributes).toEqual([
      { id: 0, name: 'Ingredients', value: 'Flour, water, sourdough starter, and sea salt.' },
      { id: 0, name: 'Allergens', value: 'Contains wheat and gluten.' },
    ])
  })

  it('excludes a taxonomy attribute like pa_pack-size', () => {
    const p = normalizeProduct({ ...RAW, attributes: [PACK_SIZE_ATTR, INGREDIENTS_ATTR] })
    expect(p.customAttributes.map((a) => a.name)).toEqual(['Ingredients'])
  })

  it('excludes a custom attribute with no term value (food-safety: never render an empty allergen box)', () => {
    const p = normalizeProduct({ ...RAW, attributes: [{ ...ALLERGENS_ATTR, terms: [] }] })
    expect(p.customAttributes).toEqual([])
  })

  it('defaults to an empty array when the product has no attributes', () => {
    const p = normalizeProduct(RAW)
    expect(p.customAttributes).toEqual([])
  })

  it('decodes HTML entities in a custom attribute value', () => {
    const p = normalizeProduct({
      ...RAW,
      attributes: [{ ...INGREDIENTS_ATTR, terms: [{ id: 0, name: 'Doc&#8217;s recipe.', slug: 'x' }] }],
    })
    expect(p.customAttributes[0].value).toBe('Doc’s recipe.')
  })
})

describe('fetchProducts', () => {
  it('calls the proxy, not WordPress', async () => {
    jsonOnce([RAW])
    await fetchProducts()
    expect(global.fetch.mock.calls[0][0]).toMatch(/^\/api\/store\?endpoint=products/)
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
    // 1 products fetch + 1 variations fetch, each cached independently -
    // the second fetchProducts() call hits both caches.
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('treats different params as different cache entries', async () => {
    jsonOnce([RAW])
    jsonOnce([])
    await fetchProducts()
    await fetchProducts({ category: '1372' })
    // 2 distinct products fetches (different params) + 1 variations fetch,
    // shared/cached across both since it takes no params.
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })

  it('falls back to the committed snapshot when the proxy fails', async () => {
    global.fetch.mockRejectedValue(new Error('offline'))
    const products = await fetchProducts()
    expect(products.map((p) => p.slug)).toContain('sour-dough')
  })

  it('does not serve the unfiltered snapshot for a filtered fetch it cannot honour', async () => {
    global.fetch.mockRejectedValue(new Error('offline'))
    const products = await fetchProducts({ featured: 'true' })
    expect(products).toEqual([])
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
    expect(global.fetch.mock.calls[0][0]).toContain('endpoint=products%2Ftags')
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

  it('derives categories from the committed snapshot when the proxy fails', async () => {
    global.fetch.mockRejectedValue(new Error('offline'))
    const cats = await fetchCategories()
    expect(cats.map((c) => c.slug)).toContain('breads')
  })
})

const VARIATIONS = {
  products: {
    88: [
      { id: 89, name: 'Single Cookie', slug: 'single-cookie', price: 500, in_stock: true, purchasable: true },
      { id: 90, name: 'Box of 6', slug: 'box-of-6', price: 2000, in_stock: true, purchasable: true },
    ],
  },
  currency: PRICES,
}

describe('fetchProducts pack sizes', () => {
  it('attaches packSizes to a product present in the variations map, prices formatted via money.js', async () => {
    jsonOnce([{ ...RAW, id: 88 }])
    mockVariations(VARIATIONS)
    const [p] = await fetchProducts()
    expect(p.packSizes).toEqual([
      { id: 89, name: 'Single Cookie', slug: 'single-cookie', price: 5, priceFormatted: '$5.00', inStock: true, purchasable: true },
      { id: 90, name: 'Box of 6', slug: 'box-of-6', price: 20, priceFormatted: '$20.00', inStock: true, purchasable: true },
    ])
  })

  it('preserves the wp-admin ordering instead of sorting', async () => {
    jsonOnce([{ ...RAW, id: 88 }])
    mockVariations(VARIATIONS)
    const [p] = await fetchProducts()
    expect(p.packSizes.map((s) => s.name)).toEqual(['Single Cookie', 'Box of 6'])
  })

  it('does not attach packSizes to a product absent from the variations map (e.g. a bread)', async () => {
    jsonOnce([RAW]) // RAW is product id 13, not a key in VARIATIONS
    mockVariations(VARIATIONS)
    const [p] = await fetchProducts()
    expect(p.packSizes).toBeUndefined()
  })

  it('still returns products, with no packSizes on any of them, when the variations endpoint fails', async () => {
    jsonOnce([{ ...RAW, id: 88 }])
    failVariations()
    const products = await fetchProducts()
    expect(products[0].slug).toBe('sour-dough')
    expect(products[0].packSizes).toBeUndefined()
  })

  it('decodes an HTML-encoded pack size name', async () => {
    jsonOnce([{ ...RAW, id: 88 }])
    mockVariations({
      products: { 88: [{ id: 89, name: 'Doc&#8217;s Size', slug: 'docs-size', price: 500, in_stock: true, purchasable: true }] },
      currency: PRICES,
    })
    const [p] = await fetchProducts()
    expect(p.packSizes[0].name).toBe('Doc’s Size')
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

  it('does not guess a different product when the proxy fails on an unknown slug', async () => {
    global.fetch.mockRejectedValue(new Error('offline'))
    expect(await fetchProductBySlug('definitely-not-a-real-product')).toBeNull()
  })
})

describe('HTML-encoded names from WooCommerce', () => {
  // WooCommerce encodes apostrophes as &#8217;. React renders text literally,
  // so an undecoded name shows the raw entity on the page. The bakery types
  // apostrophes constantly — "Doc's Crackers", "Chief's Crackers".
  it('decodes an apostrophe in a product name', () => {
    const p = normalizeProduct({ ...RAW, name: 'Doc&#8217;s Crackers (5oz)' })
    expect(p.name).toBe('Doc’s Crackers (5oz)')
  })

  it('decodes an ampersand', () => {
    const p = normalizeProduct({ ...RAW, name: 'Bread &amp; Butter' })
    expect(p.name).toBe('Bread & Butter')
  })

  it('decodes category and tag names too', () => {
    const p = normalizeProduct({
      ...RAW,
      categories: [{ id: 1, name: 'Doc&#8217;s Picks', slug: 'docs-picks' }],
      tags: [{ id: 2, name: 'Chief&#8217;s', slug: 'chiefs' }],
    })
    expect(p.categories[0].name).toBe('Doc’s Picks')
    expect(p.tags[0].name).toBe('Chief’s')
  })

  it('leaves a plain name untouched', () => {
    const p = normalizeProduct({ ...RAW, name: 'Sour Dough' })
    expect(p.name).toBe('Sour Dough')
  })
})
