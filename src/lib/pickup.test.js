import { fetchPickupConfig, slotValue, pickupDayCopy } from './pickup.js'

const RAW_STORE = {
  id: 'orange-county-store',
  name: 'Orange County Store',
  address: '1234 Example Ave, Orange County, CA',
  slot_minutes: 30,
  slots: [
    { start: '14:00', end: '14:30', label: '2:00 PM - 2:30 PM' },
    { start: '14:30', end: '15:00', label: '2:30 PM - 3:00 PM' },
  ],
  dates: [
    { date: '2026-08-09', weekday: 'Sunday', label: '9 Aug' },
    { date: '2026-08-16', weekday: 'Sunday', label: '16 Aug' },
  ],
}

function pickupResponse(overrides = {}) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      stores: [RAW_STORE],
      delivery_minimum: 0,
      currency: {},
      ...overrides,
    }),
  }
}

beforeEach(() => {
  global.fetch = vi.fn()
})

describe('fetchPickupConfig', () => {
  it('fetches the pickup proxy endpoint with GET', async () => {
    global.fetch.mockResolvedValueOnce(pickupResponse())
    await fetchPickupConfig()

    expect(global.fetch.mock.calls[0][0]).toBe('/api/store?endpoint=pickup')
  })

  it('returns the stores with dates/slots passed through unchanged - no date maths', async () => {
    global.fetch.mockResolvedValueOnce(pickupResponse())
    const config = await fetchPickupConfig()

    expect(config.ok).toBe(true)
    expect(config.stores).toEqual([
      {
        id: 'orange-county-store',
        name: 'Orange County Store',
        address: '1234 Example Ave, Orange County, CA',
        slots: RAW_STORE.slots,
        dates: RAW_STORE.dates,
      },
    ])
  })

  it('defaults a store missing dates/slots/address to safe empty values, without throwing', async () => {
    global.fetch.mockResolvedValueOnce(
      pickupResponse({ stores: [{ id: 'a', name: 'A Store' }] }),
    )
    const config = await fetchPickupConfig()

    expect(config.stores).toEqual([
      { id: 'a', name: 'A Store', address: '', slots: [], dates: [] },
    ])
  })

  it('returns ok:true with an empty stores array when the owner has configured none', async () => {
    global.fetch.mockResolvedValueOnce(pickupResponse({ stores: [] }))
    const config = await fetchPickupConfig()

    expect(config).toEqual({ ok: true, stores: [] })
  })

  it('returns ok:false with an empty stores array on a non-200 response, without parsing it', async () => {
    const json = vi.fn()
    global.fetch.mockResolvedValueOnce({ ok: false, status: 502, json })
    const config = await fetchPickupConfig()

    expect(config).toEqual({ ok: false, stores: [] })
    expect(json).not.toHaveBeenCalled()
  })

  it('returns ok:false with an empty stores array on a network failure, without throwing', async () => {
    global.fetch.mockRejectedValueOnce(new Error('offline'))
    const config = await fetchPickupConfig()

    expect(config).toEqual({ ok: false, stores: [] })
  })

  it('forwards an abort signal and resolves ok:false rather than throwing', async () => {
    const controller = new AbortController()
    global.fetch.mockImplementation(
      (_url, opts) =>
        new Promise((_resolve, reject) => {
          opts.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
        }),
    )

    const promise = fetchPickupConfig({ signal: controller.signal })
    controller.abort()
    const config = await promise

    expect(config.ok).toBe(false)
    expect(global.fetch.mock.calls[0][1].signal).toBe(controller.signal)
  })
})

describe('slotValue', () => {
  it('builds the exact "{start}-{end}" string the backend validates a slot against', () => {
    expect(slotValue({ start: '14:00', end: '14:30', label: '2:00 PM - 2:30 PM' })).toBe('14:00-14:30')
  })
})

describe('pickupDayCopy', () => {
  it('names the single weekday when every upcoming date shares one', () => {
    expect(pickupDayCopy(RAW_STORE.dates)).toBe('Choose a Sunday to pick up your order')
  })

  it('falls back to a generic sentence when dates span more than one weekday', () => {
    const mixed = [
      { date: '2026-08-09', weekday: 'Sunday', label: '9 Aug' },
      { date: '2026-08-10', weekday: 'Monday', label: '10 Aug' },
    ]
    expect(pickupDayCopy(mixed)).toBe('Choose a date to pick up your order')
  })

  it('falls back to the generic sentence for an empty dates list, without throwing', () => {
    expect(pickupDayCopy([])).toBe('Choose a date to pick up your order')
  })
})
