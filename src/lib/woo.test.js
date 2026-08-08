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
