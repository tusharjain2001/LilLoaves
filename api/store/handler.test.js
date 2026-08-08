import handler from './[...path].js'

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
  global.fetch = vi.fn()
})

describe('store proxy', () => {
  it('rejects non-GET methods', async () => {
    const res = mockRes()
    await handler({ method: 'POST', query: { path: ['products'] } }, res)
    expect(res.statusCode).toBe(405)
  })

  it('rejects paths outside the allowlist', async () => {
    const res = mockRes()
    await handler({ method: 'GET', query: { path: ['orders'] } }, res)
    expect(res.statusCode).toBe(404)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('forwards an allowed path and returns the payload', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => [{ id: 13 }] })
    const res = mockRes()
    await handler({ method: 'GET', query: { path: ['products'] } }, res)
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
    await handler({ method: 'GET', query: { path: ['products', 'categories'] } }, res)
    expect(global.fetch.mock.calls[0][0]).toContain('/wc/store/v1/products/categories')
  })

  it('passes allowlisted query params through and drops others', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => [] })
    const res = mockRes()
    await handler(
      { method: 'GET', query: { path: ['products'], featured: 'true', evil: 'x' } },
      res,
    )
    const url = global.fetch.mock.calls[0][0]
    expect(url).toContain('featured=true')
    expect(url).not.toContain('evil')
  })

  it('sets an edge cache header so upstream sees one request a minute', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => [] })
    const res = mockRes()
    await handler({ method: 'GET', query: { path: ['products'] } }, res)
    expect(res.headers['cache-control']).toBe(
      'public, s-maxage=60, stale-while-revalidate=600',
    )
  })

  it('returns 502 when upstream throttles', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 429, json: async () => ({}) })
    const res = mockRes()
    await handler({ method: 'GET', query: { path: ['products'] } }, res)
    expect(res.statusCode).toBe(502)
  })

  it('returns 502 when upstream is unreachable', async () => {
    global.fetch.mockRejectedValue(new Error('ECONNREFUSED'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = mockRes()
    await handler({ method: 'GET', query: { path: ['products'] } }, res)
    expect(res.statusCode).toBe(502)
    expect(consoleSpy).toHaveBeenCalledWith('store proxy fetch failed', expect.any(Error))
    consoleSpy.mockRestore()
  })

  it('caches a throttled 502 so a 429 storm does not fan out on every retry', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 429, json: async () => ({}) })
    const res = mockRes()
    await handler({ method: 'GET', query: { path: ['products'] } }, res)
    expect(res.headers['cache-control']).toBe('public, s-maxage=10')
  })

  it('caches a 502 from an unreachable upstream too', async () => {
    global.fetch.mockRejectedValue(new Error('ECONNREFUSED'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = mockRes()
    await handler({ method: 'GET', query: { path: ['products'] } }, res)
    expect(res.headers['cache-control']).toBe('public, s-maxage=10')
    consoleSpy.mockRestore()
  })

  it('applies a fetch timeout so a hanging upstream fails fast into the 502 path', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => [] })
    const res = mockRes()
    await handler({ method: 'GET', query: { path: ['products'] } }, res)
    const options = global.fetch.mock.calls[0][1]
    expect(options.signal).toBeInstanceOf(AbortSignal)
  })
})
