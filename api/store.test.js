import handler from './store.js'

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
  process.env.LL_BRIDGE_SECRET = 'shh-secret'
  global.fetch = vi.fn()
})

describe('store proxy', () => {
  it('rejects non-GET methods', async () => {
    const res = mockRes()
    await handler({ method: 'POST', query: { endpoint: 'products' } }, res)
    expect(res.statusCode).toBe(405)
  })

  it('rejects paths outside the allowlist', async () => {
    const res = mockRes()
    await handler({ method: 'GET', query: { endpoint: 'orders' } }, res)
    expect(res.statusCode).toBe(404)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('forwards an allowed path and returns the payload', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => [{ id: 13 }] })
    const res = mockRes()
    await handler({ method: 'GET', query: { endpoint: 'products' } }, res)
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
    await handler({ method: 'GET', query: { endpoint: 'products/categories' } }, res)
    expect(global.fetch.mock.calls[0][0]).toContain('/wc/store/v1/products/categories')
  })

  it('passes allowlisted query params through and drops others', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => [] })
    const res = mockRes()
    await handler(
      { method: 'GET', query: { endpoint: 'products', featured: 'true', evil: 'x' } },
      res,
    )
    const url = global.fetch.mock.calls[0][0]
    expect(url).toContain('featured=true')
    expect(url).not.toContain('evil')
  })

  it('sets an edge cache header so upstream sees one request a minute', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => [] })
    const res = mockRes()
    await handler({ method: 'GET', query: { endpoint: 'products' } }, res)
    expect(res.headers['vercel-cdn-cache-control']).toBe(
      'public, s-maxage=60, stale-while-revalidate=600',
    )
    expect(res.headers['cdn-cache-control']).toBe(
      'public, s-maxage=60, stale-while-revalidate=600',
    )
    expect(res.headers['cache-control']).toBe('public, max-age=0, must-revalidate')
  })

  it('returns 502 when upstream throttles', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 429, json: async () => ({}) })
    const res = mockRes()
    await handler({ method: 'GET', query: { endpoint: 'products' } }, res)
    expect(res.statusCode).toBe(502)
  })

  it('returns 502 when upstream is unreachable', async () => {
    global.fetch.mockRejectedValue(new Error('ECONNREFUSED'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = mockRes()
    await handler({ method: 'GET', query: { endpoint: 'products' } }, res)
    expect(res.statusCode).toBe(502)
    expect(consoleSpy).toHaveBeenCalledWith('store proxy fetch failed', expect.any(Error))
    consoleSpy.mockRestore()
  })

  it('caches a throttled 502 so a 429 storm does not fan out on every retry', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 429, json: async () => ({}) })
    const res = mockRes()
    await handler({ method: 'GET', query: { endpoint: 'products' } }, res)
    expect(res.headers['vercel-cdn-cache-control']).toBe('public, s-maxage=10')
  })

  it('caches a 502 from an unreachable upstream too', async () => {
    global.fetch.mockRejectedValue(new Error('ECONNREFUSED'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = mockRes()
    await handler({ method: 'GET', query: { endpoint: 'products' } }, res)
    expect(res.headers['vercel-cdn-cache-control']).toBe('public, s-maxage=10')
    consoleSpy.mockRestore()
  })

  it('applies a fetch timeout so a hanging upstream fails fast into the 502 path', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => [] })
    const res = mockRes()
    await handler({ method: 'GET', query: { endpoint: 'products' } }, res)
    const options = global.fetch.mock.calls[0][1]
    expect(options.signal).toBeInstanceOf(AbortSignal)
  })
})

describe('POST /quote', () => {
  const quoteBody = { items: [{ id: 13, qty: 2 }], fulfilment: 'pickup', postcode: '', coupon: '' }

  it('forwards the body to the lilloaves/v1 namespace, not wc/store/v1', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({ total: 4226 }) })
    const res = mockRes()
    await handler(
      { method: 'POST', query: { endpoint: 'quote' }, headers: {}, body: quoteBody },
      res,
    )
    expect(global.fetch).toHaveBeenCalledWith(
      'https://wp.example.com/wp-json/lilloaves/v1/quote',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(quoteBody) }),
    )
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ total: 4226 })
  })

  it('rejects POST to any endpoint other than quote', async () => {
    const res = mockRes()
    await handler({ method: 'POST', query: { endpoint: 'products' }, headers: {}, body: {} }, res)
    expect(res.statusCode).toBe(405)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('rejects GET to quote', async () => {
    const res = mockRes()
    await handler({ method: 'GET', query: { endpoint: 'quote' } }, res)
    expect(res.statusCode).toBe(404)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('forwards the shared secret from the env var as X-LL-Secret', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({}) })
    const res = mockRes()
    await handler(
      { method: 'POST', query: { endpoint: 'quote' }, headers: {}, body: quoteBody },
      res,
    )
    const options = global.fetch.mock.calls[0][1]
    expect(options.headers['X-LL-Secret']).toBe('shh-secret')
  })

  it('forwards the real client IP as X-LL-Client from x-forwarded-for', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({}) })
    const res = mockRes()
    await handler(
      {
        method: 'POST',
        query: { endpoint: 'quote' },
        headers: { 'x-forwarded-for': '203.0.113.7, 10.0.0.1' },
        body: quoteBody,
      },
      res,
    )
    const options = global.fetch.mock.calls[0][1]
    expect(options.headers['X-LL-Client']).toBe('203.0.113.7')
  })

  it('sets Cache-Control: no-store on the response', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({}) })
    const res = mockRes()
    await handler(
      { method: 'POST', query: { endpoint: 'quote' }, headers: {}, body: quoteBody },
      res,
    )
    expect(res.headers['cache-control']).toBe('no-store')
  })

  it('returns 500 without calling upstream when LL_BRIDGE_SECRET is unset', async () => {
    delete process.env.LL_BRIDGE_SECRET
    const res = mockRes()
    await handler(
      { method: 'POST', query: { endpoint: 'quote' }, headers: {}, body: quoteBody },
      res,
    )
    expect(res.statusCode).toBe(500)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('returns 502 when upstream fails', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })
    const res = mockRes()
    await handler(
      { method: 'POST', query: { endpoint: 'quote' }, headers: {}, body: quoteBody },
      res,
    )
    expect(res.statusCode).toBe(502)
  })

  it('applies the fetch timeout to the quote request too', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({}) })
    const res = mockRes()
    await handler(
      { method: 'POST', query: { endpoint: 'quote' }, headers: {}, body: quoteBody },
      res,
    )
    const options = global.fetch.mock.calls[0][1]
    expect(options.signal).toBeInstanceOf(AbortSignal)
  })
})

describe('GET /pickup', () => {
  const pickupBody = { stores: [{ id: 'orange-county-store', name: 'Orange County Store' }] }

  it('forwards to the lilloaves/v1 namespace, not wc/store/v1', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => pickupBody })
    const res = mockRes()
    await handler({ method: 'GET', query: { endpoint: 'pickup' }, headers: {} }, res)

    expect(global.fetch).toHaveBeenCalledWith(
      'https://wp.example.com/wp-json/lilloaves/v1/pickup',
      expect.anything(),
    )
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual(pickupBody)
  })

  it('does not require or send a shared secret - the endpoint is public', async () => {
    delete process.env.LL_BRIDGE_SECRET
    global.fetch.mockResolvedValue({ ok: true, json: async () => pickupBody })
    const res = mockRes()
    await handler({ method: 'GET', query: { endpoint: 'pickup' }, headers: {} }, res)

    expect(res.statusCode).toBe(200)
    const options = global.fetch.mock.calls[0][1]
    expect(options.headers?.['X-LL-Secret']).toBeUndefined()
  })

  it('caches it at the edge like the other read-only endpoints', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => pickupBody })
    const res = mockRes()
    await handler({ method: 'GET', query: { endpoint: 'pickup' }, headers: {} }, res)

    expect(res.headers['vercel-cdn-cache-control']).toBe(
      'public, s-maxage=60, stale-while-revalidate=600',
    )
  })

  it('rejects POST to /pickup', async () => {
    const res = mockRes()
    await handler({ method: 'POST', query: { endpoint: 'pickup' }, headers: {}, body: {} }, res)

    expect(res.statusCode).toBe(405)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('returns 502 when upstream is unreachable', async () => {
    global.fetch.mockRejectedValue(new Error('ECONNREFUSED'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = mockRes()
    await handler({ method: 'GET', query: { endpoint: 'pickup' }, headers: {} }, res)

    expect(res.statusCode).toBe(502)
    consoleSpy.mockRestore()
  })

  it('returns 502 when upstream errors', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })
    const res = mockRes()
    await handler({ method: 'GET', query: { endpoint: 'pickup' }, headers: {} }, res)

    expect(res.statusCode).toBe(502)
  })
})

describe('GET /variations', () => {
  const variationsBody = { products: { 88: [{ id: 89, name: 'Single Cookie', price: 500 }] }, currency: {} }

  it('forwards to the lilloaves/v1 namespace, not wc/store/v1', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => variationsBody })
    const res = mockRes()
    await handler({ method: 'GET', query: { endpoint: 'variations' }, headers: {} }, res)

    expect(global.fetch).toHaveBeenCalledWith(
      'https://wp.example.com/wp-json/lilloaves/v1/variations',
      expect.anything(),
    )
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual(variationsBody)
  })

  it('does not require or send a shared secret - the endpoint is public', async () => {
    delete process.env.LL_BRIDGE_SECRET
    global.fetch.mockResolvedValue({ ok: true, json: async () => variationsBody })
    const res = mockRes()
    await handler({ method: 'GET', query: { endpoint: 'variations' }, headers: {} }, res)

    expect(res.statusCode).toBe(200)
    const options = global.fetch.mock.calls[0][1]
    expect(options.headers?.['X-LL-Secret']).toBeUndefined()
  })

  it('caches it at the edge like the other read-only endpoints', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => variationsBody })
    const res = mockRes()
    await handler({ method: 'GET', query: { endpoint: 'variations' }, headers: {} }, res)

    expect(res.headers['vercel-cdn-cache-control']).toBe(
      'public, s-maxage=60, stale-while-revalidate=600',
    )
  })

  it('rejects POST to /variations', async () => {
    const res = mockRes()
    await handler({ method: 'POST', query: { endpoint: 'variations' }, headers: {}, body: {} }, res)

    expect(res.statusCode).toBe(405)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('returns 502 when upstream is unreachable', async () => {
    global.fetch.mockRejectedValue(new Error('ECONNREFUSED'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = mockRes()
    await handler({ method: 'GET', query: { endpoint: 'variations' }, headers: {} }, res)

    expect(res.statusCode).toBe(502)
    consoleSpy.mockRestore()
  })
})
