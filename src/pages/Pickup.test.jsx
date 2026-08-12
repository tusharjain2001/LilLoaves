import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Pickup from './Pickup.jsx'
import { CartProvider } from '../context/CartContext.jsx'
import * as pickupLib from '../lib/pickup.js'
import * as quoteLib from '../lib/quote.js'

const STORAGE_KEY = 'lilloaves:cart'

function seedCart(lines) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
}

const MUFFIN = { id: 1, qty: 2, name: 'Blueberry Muffin', image: 'blueberry.png', priceFormatted: '$21.13' }
const LUNCH_BOX = {
  id: 15,
  qty: 1,
  name: 'Lunch Box',
  image: '',
  priceFormatted: '$39.00',
  options: { bread: 'Sour Dough', cracker: '', dessert: '' },
}

function makeQuote(overrides = {}) {
  return {
    ok: true,
    lines: [{ id: 1, qty: 2, totalFormatted: '$42.26', unitFormatted: '$21.13' }],
    subtotalFormatted: '$42.26',
    deliveryFormatted: '$0.00',
    discountFormatted: '$0.00',
    taxFormatted: '$0.00',
    totalFormatted: '$42.26',
    errors: [],
    ...overrides,
  }
}

const PICKUP_STORE = {
  id: 'orange-county-store',
  name: 'Orange County Store',
  address: '1234 Example Ave, Orange County, CA',
  slots: [
    { start: '14:00', end: '14:30', label: '2:00 PM - 2:30 PM' },
    { start: '14:30', end: '15:00', label: '2:30 PM - 3:00 PM' },
  ],
  dates: [
    { date: '2026-08-09', weekday: 'Sunday', label: '9 Aug' },
    { date: '2026-08-16', weekday: 'Sunday', label: '16 Aug' },
  ],
}
const PICKUP_CONFIG = { ok: true, stores: [PICKUP_STORE] }

const renderPickup = () =>
  render(
    <MemoryRouter>
      <CartProvider>
        <Pickup />
      </CartProvider>
    </MemoryRouter>,
  )

beforeEach(() => {
  localStorage.clear()
  // Every render of Pickup now fetches a quote for whatever's in the cart -
  // default it to a real, working response so tests below that don't care
  // about pricing aren't forced to mock it too.
  vi.spyOn(quoteLib, 'fetchQuote').mockResolvedValue(makeQuote())
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Pickup page - wired to the same /pickup config as the cart', () => {
  it('shows the real store name from config, not a hardcoded one', async () => {
    vi.spyOn(pickupLib, 'fetchPickupConfig').mockResolvedValue(PICKUP_CONFIG)
    renderPickup()

    expect(await screen.findByText('Orange County Store')).toBeTruthy()
  })

  it('renders real upcoming dates as pills and defaults to the first one selected', async () => {
    vi.spyOn(pickupLib, 'fetchPickupConfig').mockResolvedValue(PICKUP_CONFIG)
    renderPickup()

    const firstDate = await screen.findByText('9 Aug')
    expect(firstDate.closest('button').className).toMatch(/bg-taupe/)
    expect(screen.getByText('16 Aug')).toBeTruthy()
  })

  it('picking a date updates the selection', async () => {
    vi.spyOn(pickupLib, 'fetchPickupConfig').mockResolvedValue(PICKUP_CONFIG)
    renderPickup()

    const secondDate = await screen.findByText('16 Aug')
    fireEvent.click(secondDate)

    expect(secondDate.closest('button').className).toMatch(/bg-taupe/)
    expect(screen.getByText('9 Aug').closest('button').className).not.toMatch(/bg-taupe/)
  })

  it('the Pick Up Time tab shows real slot labels from config and defaults to the first one', async () => {
    vi.spyOn(pickupLib, 'fetchPickupConfig').mockResolvedValue(PICKUP_CONFIG)
    renderPickup()

    await screen.findByText('9 Aug')
    fireEvent.click(screen.getByText('Pick Up Time'))

    const firstSlot = await screen.findByText('2:00 PM - 2:30 PM')
    expect(firstSlot.closest('button').className).toMatch(/bg-taupe/)
    expect(screen.getByText('2:30 PM - 3:00 PM')).toBeTruthy()
  })

  it('the Pick Up Time header shows the chosen date\'s display label, never the raw machine date', async () => {
    vi.spyOn(pickupLib, 'fetchPickupConfig').mockResolvedValue(PICKUP_CONFIG)
    renderPickup()

    fireEvent.click(await screen.findByText('16 Aug'))
    fireEvent.click(screen.getByText('Pick Up Time'))

    // The label is styled uppercase via CSS (text-transform), so the actual
    // text node content is still "16 Aug" - assert that, and that the raw
    // ISO value never leaks into the DOM.
    expect(await screen.findAllByText('16 Aug')).not.toHaveLength(0)
    expect(screen.queryByText('2026-08-16')).toBeNull()
  })

  it('does not crash and shows pickup as unavailable when the owner has configured no stores', async () => {
    vi.spyOn(pickupLib, 'fetchPickupConfig').mockResolvedValue({ ok: true, stores: [] })
    renderPickup()

    expect(await screen.findByText(/not available/i)).toBeTruthy()
  })

  it('does not crash and shows pickup as unavailable when the configured store has no dates', async () => {
    vi.spyOn(pickupLib, 'fetchPickupConfig').mockResolvedValue({
      ok: true,
      stores: [{ ...PICKUP_STORE, dates: [] }],
    })
    renderPickup()

    expect(await screen.findByText(/not available/i)).toBeTruthy()
  })
})

describe('Pickup page shows the cart items panel', () => {
  // The bug: Pickup.jsx had no cart code at all, so a collection customer who
  // followed OrderHero's Pickup link never saw what they were buying. This
  // reuses the exact same CartItemsPanel component Cart.jsx renders (see
  // Cart.test.jsx's own "Pickup mode shows cart items" coverage), so
  // asserting it works here is really asserting the two pages share one
  // definition and cannot drift apart.
  it('renders cart lines with working quantity and remove controls, including a Lunch Box line', async () => {
    vi.spyOn(pickupLib, 'fetchPickupConfig').mockResolvedValue(PICKUP_CONFIG)
    quoteLib.fetchQuote.mockResolvedValue(
      makeQuote({
        lines: [
          { id: 1, qty: 2, totalFormatted: '$42.26', unitFormatted: '$21.13' },
          { id: 15, qty: 1, totalFormatted: '$39.00', unitFormatted: '$39.00' },
        ],
      }),
    )
    seedCart([MUFFIN, LUNCH_BOX])
    renderPickup()

    expect(screen.getByText('Blueberry Muffin')).toBeTruthy()
    expect(screen.getByText('Cart Items (3)')).toBeTruthy()

    fireEvent.click(screen.getByLabelText('Increase Lunch Box quantity'))
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(stored.find((l) => l.id === 15).qty).toBe(2)
    })

    fireEvent.click(screen.getByLabelText('Remove Lunch Box from cart'))
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(stored.find((l) => l.id === 15)).toBeUndefined()
    })
  })

  it('decrementing a line at quantity 1 removes it, same as Cart.jsx', async () => {
    vi.spyOn(pickupLib, 'fetchPickupConfig').mockResolvedValue(PICKUP_CONFIG)
    seedCart([{ ...MUFFIN, qty: 1 }])
    renderPickup()

    fireEvent.click(screen.getByLabelText('Decrease Blueberry Muffin quantity'))

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(stored.find((l) => l.id === 1)).toBeUndefined()
    })
  })

  it('shows a sensible empty-cart message rather than a bare empty box', async () => {
    vi.spyOn(pickupLib, 'fetchPickupConfig').mockResolvedValue(PICKUP_CONFIG)
    renderPickup()

    expect(await screen.findByText(/cart is empty/i)).toBeTruthy()
    expect(screen.getByText('Cart Items (0)')).toBeTruthy()
  })

  it('renders the real quoted per-line total, never computed locally', async () => {
    vi.spyOn(pickupLib, 'fetchPickupConfig').mockResolvedValue(PICKUP_CONFIG)
    quoteLib.fetchQuote.mockResolvedValue(makeQuote())
    seedCart([MUFFIN])
    renderPickup()

    await waitFor(() => expect(screen.getByText('$42.26')).toBeTruthy())
  })
})
