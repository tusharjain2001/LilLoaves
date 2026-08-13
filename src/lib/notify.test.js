import { sendOrderNotification } from './notify.js'

const ENDPOINT = 'https://lil-loaves-backend.vercel.app/api/notify'

const LINES = [
  { id: 1, qty: 2, name: 'Blueberry Muffin', priceFormatted: '$21.13', image: 'x.png' },
  { id: 88, qty: 1, variationId: 90, name: 'Cookies', priceFormatted: '$20.00' },
]
const CONTACT = { name: 'Jess', email: 'jess@example.com', phone: '714-555-0123' }
const PICKUP = { store: 'orange-county-store', date: '2026-08-09', slot: '14:00-14:30' }

afterEach(() => {
  vi.restoreAllMocks()
})

describe('sendOrderNotification', () => {
  it('posts to the order-mail service, not to this origin', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })

    await sendOrderNotification({ lines: LINES, contact: CONTACT, pickup: PICKUP })

    // Hardcoded rather than read from a VITE_ var - so it can never resolve
    // to "undefined/api/notify" against our own origin, the way
    // VITE_WP_CHECKOUT_URL once did.
    expect(global.fetch.mock.calls[0][0]).toBe(ENDPOINT)
  })

  it('sends ids and quantities only - no price, name or image leaves the browser', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })

    await sendOrderNotification({ lines: LINES, contact: CONTACT, pickup: PICKUP, coupon: 'LOAF10' })

    const [, init] = global.fetch.mock.calls[0]
    const body = JSON.parse(init.body)
    expect(body.items).toEqual([
      { id: 1, qty: 2 },
      { id: 88, qty: 1, variation_id: 90 },
    ])
    expect(body.contact).toEqual(CONTACT)
    expect(body.pickup).toEqual(PICKUP)
    expect(body.coupon).toBe('LOAF10')
    expect(init.body).not.toContain('$21.13')
    expect(init.body).not.toContain('Blueberry Muffin')
  })

  it("surfaces the service's own error message", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ ok: false, error: 'That collection slot is no longer available' }),
    })

    const result = await sendOrderNotification({ lines: LINES, contact: CONTACT, pickup: PICKUP })
    expect(result).toEqual({ ok: false, error: 'That collection slot is no longer available' })
  })

  it('never throws on a network failure - the caller decides what to show', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('offline'))

    await expect(
      sendOrderNotification({ lines: LINES, contact: CONTACT, pickup: PICKUP }),
    ).resolves.toEqual({ ok: false, error: '' })
  })
})
