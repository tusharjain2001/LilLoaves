import { fetchQuote } from './quote.js'

const CURRENCY = {
  currency_code: 'USD',
  currency_symbol: '$',
  currency_minor_unit: 2,
  currency_decimal_separator: '.',
  currency_thousand_separator: ',',
  currency_prefix: '$',
  currency_suffix: '',
}

const LINES = [
  { id: 13, qty: 2, name: 'Sour Dough', image: 'a.jpg', priceFormatted: '$21.13' },
]

function quoteResponse(overrides = {}) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      lines: [{ id: 13, qty: 2, total: 4226, unit: 2113 }],
      subtotal: 4226,
      delivery: 500,
      discount: 653,
      tax: 0,
      total: 4073,
      currency: CURRENCY,
      errors: [],
      ...overrides,
    }),
  }
}

beforeEach(() => {
  global.fetch = vi.fn()
})

describe('fetchQuote', () => {
  it('posts only ids and quantities, never names or prices', async () => {
    global.fetch.mockResolvedValueOnce(quoteResponse())
    await fetchQuote({ lines: LINES, fulfilment: 'delivery' })

    const body = JSON.parse(global.fetch.mock.calls[0][1].body)
    expect(body.items).toEqual([{ id: 13, qty: 2 }])
    expect(JSON.stringify(body)).not.toMatch(/Sour Dough|a\.jpg|21\.13/)
  })

  it('includes variation_id for a pack-size line, and omits it for a plain line', async () => {
    global.fetch.mockResolvedValueOnce(quoteResponse())
    const lines = [
      { id: 88, qty: 1, variationId: 90, name: 'Choco Chip Cookies', priceFormatted: '$20.00' },
      LINES[0],
    ]
    await fetchQuote({ lines, fulfilment: 'delivery' })

    const body = JSON.parse(global.fetch.mock.calls[0][1].body)
    expect(body.items).toEqual([
      { id: 88, qty: 1, variation_id: 90 },
      { id: 13, qty: 2 },
    ])
  })

  it('returns variationId on each priced line, keyed alongside id (0 for a simple product)', async () => {
    global.fetch.mockResolvedValueOnce(
      quoteResponse({
        lines: [
          { id: 88, variation_id: 89, qty: 1, total: 500, unit: 500 },
          { id: 88, variation_id: 90, qty: 1, total: 2000, unit: 2000 },
          { id: 13, variation_id: 0, qty: 2, total: 4226, unit: 2113 },
        ],
      }),
    )
    const quote = await fetchQuote({ lines: LINES, fulfilment: 'delivery' })

    expect(quote.lines.map((l) => ({ id: l.id, variationId: l.variationId }))).toEqual([
      { id: 88, variationId: 89 },
      { id: 88, variationId: 90 },
      { id: 13, variationId: 0 },
    ])
  })

  it('posts to the quote proxy endpoint', async () => {
    global.fetch.mockResolvedValueOnce(quoteResponse())
    await fetchQuote({ lines: LINES, fulfilment: 'delivery' })

    expect(global.fetch.mock.calls[0][0]).toBe('/api/store?endpoint=quote')
    expect(global.fetch.mock.calls[0][1].method).toBe('POST')
  })

  it('passes fulfilment, postcode and coupon through in the body', async () => {
    global.fetch.mockResolvedValueOnce(quoteResponse())
    await fetchQuote({
      lines: LINES,
      fulfilment: 'delivery',
      postcode: '90210',
      coupon: 'WELCOME10',
    })

    const body = JSON.parse(global.fetch.mock.calls[0][1].body)
    expect(body.fulfilment).toBe('delivery')
    expect(body.postcode).toBe('90210')
    expect(body.coupon).toBe('WELCOME10')
  })

  it('formats every minor-unit total through the returned currency object', async () => {
    global.fetch.mockResolvedValueOnce(quoteResponse())
    const quote = await fetchQuote({ lines: LINES, fulfilment: 'delivery' })

    expect(quote.subtotalFormatted).toBe('$42.26')
    expect(quote.deliveryFormatted).toBe('$5.00')
    expect(quote.discountFormatted).toBe('$6.53')
    expect(quote.taxFormatted).toBe('$0.00')
    expect(quote.totalFormatted).toBe('$40.73')
  })

  it('formats per-line unit and total amounts using the currency object, not a hardcoded symbol', async () => {
    const kr = { ...CURRENCY, currency_prefix: '', currency_suffix: ' kr', currency_decimal_separator: ',' }
    global.fetch.mockResolvedValueOnce(
      quoteResponse({
        lines: [{ id: 13, qty: 2, total: 4226, unit: 2113 }],
        currency: kr,
      }),
    )
    const quote = await fetchQuote({ lines: LINES, fulfilment: 'delivery' })

    expect(quote.lines).toEqual([
      { id: 13, variationId: 0, qty: 2, totalFormatted: '42,26 kr', unitFormatted: '21,13 kr' },
    ])
  })

  it('surfaces the server errors array unchanged', async () => {
    global.fetch.mockResolvedValueOnce(quoteResponse({ errors: ['13 is out of stock'] }))
    const quote = await fetchQuote({ lines: LINES, fulfilment: 'delivery' })

    expect(quote.errors).toEqual(['13 is out of stock'])
  })

  it('returns ok: false with empty strings on a rejected fetch, without throwing', async () => {
    global.fetch.mockRejectedValueOnce(new Error('offline'))
    const quote = await fetchQuote({ lines: LINES, fulfilment: 'delivery' })

    expect(quote.ok).toBe(false)
    expect(quote.totalFormatted).toBe('')
    expect(quote.subtotalFormatted).toBe('')
    expect(quote.lines).toEqual([])
    expect(quote.errors).toEqual([])
  })

  it('returns ok: false on an aborted request without throwing', async () => {
    const controller = new AbortController()
    global.fetch.mockImplementation(
      (_url, opts) =>
        new Promise((_resolve, reject) => {
          opts.signal.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'))
          })
        }),
    )

    const promise = fetchQuote({ lines: LINES, fulfilment: 'delivery', signal: controller.signal })
    controller.abort()
    const quote = await promise

    expect(quote.ok).toBe(false)
    expect(global.fetch.mock.calls[0][1].signal).toBe(controller.signal)
  })

  it('returns a zeroed quote for an empty cart without hitting the network', async () => {
    const quote = await fetchQuote({ lines: [], fulfilment: 'delivery' })

    expect(global.fetch).not.toHaveBeenCalled()
    expect(quote).toEqual({
      ok: true,
      lines: [],
      subtotalFormatted: '',
      deliveryFormatted: '',
      discountFormatted: '',
      taxFormatted: '',
      totalFormatted: '',
      errors: [],
    })
  })

  it('handles a non-200 response instead of parsing it as a quote', async () => {
    const json = vi.fn()
    global.fetch.mockResolvedValueOnce({ ok: false, status: 502, json })
    const quote = await fetchQuote({ lines: LINES, fulfilment: 'delivery' })

    expect(quote.ok).toBe(false)
    expect(quote.totalFormatted).toBe('')
    expect(quote.lines).toEqual([])
    expect(json).not.toHaveBeenCalled()
  })
})
