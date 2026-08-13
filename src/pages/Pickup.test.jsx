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

/* /pickup is a five-stage flow now (cart -> contact -> select -> confirm ->
   done), so the helpers below walk it the way a customer does: through the
   real buttons, never by poking state. That's the project's TDD note in
   practice - the Lunch Box bug shipped because tests exercised the cart's
   functions and the page's buttons separately. */

// Proceed to Pickup stays disabled until a quote has actually landed, so this
// waits for that rather than clicking a dead button.
const proceedToPickup = async () => {
  const button = await screen.findByText('Proceed to Pickup')
  await waitFor(() => expect(button.disabled).toBe(false))
  fireEvent.click(button)
}

const fillContact = ({ name = 'Jess', email = 'jess@example.com', phone = '714-555-0123' } = {}) => {
  fireEvent.change(screen.getByLabelText(/customer name/i), { target: { value: name } })
  fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: email } })
  fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: phone } })
  fireEvent.click(screen.getByText('Share Info with the Owner'))
}

// Renders with a stocked cart and stops on Step 01.
const startAtContact = async (config = PICKUP_CONFIG, lines = [MUFFIN]) => {
  vi.spyOn(pickupLib, 'fetchPickupConfig').mockResolvedValue(config)
  seedCart(lines)
  renderPickup()
  await proceedToPickup()
}

// ...and again, stopping on Step 02.
const startAtSelect = async (config = PICKUP_CONFIG) => {
  await startAtContact(config)
  fillContact()
}

beforeEach(() => {
  localStorage.clear()
  // Every render of Pickup fetches a quote for whatever's in the cart -
  // default it to a real, working response so tests that don't care about
  // pricing aren't forced to mock it too.
  vi.spyOn(quoteLib, 'fetchQuote').mockResolvedValue(makeQuote())
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Pickup stage 1 - the cart, same shape as the delivery cart', () => {
  it('shows cart lines with working quantity and remove controls, including a Lunch Box line', async () => {
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

  it('renders every order summary figure from the server quote, never computed here', async () => {
    vi.spyOn(pickupLib, 'fetchPickupConfig').mockResolvedValue(PICKUP_CONFIG)
    quoteLib.fetchQuote.mockResolvedValue(
      makeQuote({ subtotalFormatted: '$42.26', deliveryFormatted: '$5.00', discountFormatted: '$6.00', totalFormatted: '$41.26' }),
    )
    seedCart([MUFFIN])
    renderPickup()

    expect(screen.getByText('Order Summary')).toBeTruthy()
    await waitFor(() => expect(screen.getByText('$41.26')).toBeTruthy())
    expect(screen.getByText('$5.00')).toBeTruthy()
    expect(screen.getByText('$6.00')).toBeTruthy()
    // Subtotal and the per-line total, both from the same quote.
    expect(screen.getAllByText('$42.26').length).toBe(2)
  })

  it('carries no delivery form and no checkout button - pickup proceeds instead', async () => {
    vi.spyOn(pickupLib, 'fetchPickupConfig').mockResolvedValue(PICKUP_CONFIG)
    seedCart([MUFFIN])
    renderPickup()

    expect(screen.queryByText('Delivery Information')).toBeNull()
    expect(screen.queryByText('Shipping Address')).toBeNull()
    expect(screen.queryByText('Proceed to Checkout')).toBeNull()
    expect(screen.getByText('Proceed to Pickup')).toBeTruthy()
    // The PICK UP FROM band belongs to the later stages, not this one.
    expect(screen.queryByText('Pick up from')).toBeNull()
  })

  it('will not proceed on an empty cart', async () => {
    vi.spyOn(pickupLib, 'fetchPickupConfig').mockResolvedValue(PICKUP_CONFIG)
    renderPickup()

    const button = await screen.findByText('Proceed to Pickup')
    await waitFor(() => expect(quoteLib.fetchQuote).toHaveBeenCalled())
    expect(button.disabled).toBe(true)

    fireEvent.click(button)
    expect(screen.queryByText('Contact Information')).toBeNull()
  })

  it('applying a coupon re-quotes through the same /quote call, not a new endpoint', async () => {
    vi.spyOn(pickupLib, 'fetchPickupConfig').mockResolvedValue(PICKUP_CONFIG)
    seedCart([MUFFIN])
    renderPickup()

    fireEvent.change(screen.getByLabelText('Coupon code'), { target: { value: 'LOAF10' } })
    fireEvent.click(screen.getByText('Apply Coupon'))

    await waitFor(() =>
      expect(quoteLib.fetchQuote).toHaveBeenCalledWith(
        expect.objectContaining({ coupon: 'LOAF10', fulfilment: 'pickup' }),
      ),
    )
  })
})

describe('Pickup stage 2 - Step 01, the contact form', () => {
  it('shows the real store name from config, not a hardcoded one', async () => {
    await startAtContact()

    expect(await screen.findByText('Orange County Store')).toBeTruthy()
    expect(screen.getByText('Step 01')).toBeTruthy()
  })

  it('takes the cart off screen so the order cannot change underneath a slot', async () => {
    await startAtContact()

    // Really unmounted, not just visually hidden - the quantity and remove
    // controls must not be in the DOM at all.
    expect(screen.queryByText('Blueberry Muffin')).toBeNull()
    expect(screen.queryByText(/Cart Items/)).toBeNull()
    expect(screen.queryByLabelText('Increase Blueberry Muffin quantity')).toBeNull()
    expect(screen.queryByLabelText('Remove Blueberry Muffin from cart')).toBeNull()
    expect(screen.queryByText('Order Summary')).toBeNull()
  })

  it('treats the email address as mandatory, not optional', async () => {
    await startAtContact()

    expect(screen.queryByText(/optional/i)).toBeNull()
    fillContact({ email: '' })

    expect(screen.getByRole('alert').textContent).toMatch(/valid email address/i)
    // Still on Step 01.
    expect(screen.queryByText('please select')).toBeNull()
  })

  it('will not advance on a blank phone number either', async () => {
    await startAtContact()
    fillContact({ phone: '   ' })

    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.queryByText('please select')).toBeNull()
  })

  it('offers a way back to the cart', async () => {
    await startAtContact()
    fireEvent.click(screen.getByText('Go Back to Cart'))

    expect(screen.getByText('Blueberry Muffin')).toBeTruthy()
    expect(screen.getByText('Proceed to Pickup')).toBeTruthy()
  })
})

describe('Pickup stage 3 - Step 02, date and time', () => {
  it('renders real upcoming dates as pills and defaults to the first one selected', async () => {
    await startAtSelect()

    const firstDate = await screen.findByText('9 Aug')
    expect(firstDate.closest('button').className).toMatch(/bg-taupe/)
    expect(screen.getByText('16 Aug')).toBeTruthy()
    expect(screen.getByText('Step 02')).toBeTruthy()
  })

  it('picking a date updates the selection', async () => {
    await startAtSelect()

    const secondDate = await screen.findByText('16 Aug')
    fireEvent.click(secondDate)

    expect(secondDate.closest('button').className).toMatch(/bg-taupe/)
    expect(screen.getByText('9 Aug').closest('button').className).not.toMatch(/bg-taupe/)
  })

  it('the Pick Up Time tab shows real slot labels from config and defaults to the first one', async () => {
    await startAtSelect()
    fireEvent.click(screen.getByText('Pick Up Time'))

    const firstSlot = await screen.findByText('2:00 PM - 2:30 PM')
    expect(firstSlot.closest('button').className).toMatch(/bg-taupe/)
    expect(screen.getByText('2:30 PM - 3:00 PM')).toBeTruthy()
  })

  it("the Pick Up Time header shows the chosen date's display label, never the raw machine date", async () => {
    await startAtSelect()

    fireEvent.click(await screen.findByText('16 Aug'))
    fireEvent.click(screen.getByText('Pick Up Time'))

    // The label is styled uppercase via CSS (text-transform), so the actual
    // text node content is still "16 Aug" - assert that, and that the raw
    // ISO value never leaks into the DOM.
    expect(await screen.findAllByText('16 Aug')).not.toHaveLength(0)
    expect(screen.queryByText('2026-08-16')).toBeNull()
  })

  it('defaulting to the first slot must not skip the customer past the picker', async () => {
    await startAtSelect()
    fireEvent.click(screen.getByText('Pick Up Time'))

    // The first slot renders pre-selected, but the confirm state is only
    // reachable by an actual click - otherwise merely opening the tab would
    // jump straight to "Place Order".
    expect(await screen.findByText('2:00 PM - 2:30 PM')).toBeTruthy()
    expect(screen.queryByText('confirm order')).toBeNull()
  })

  it('goes back to Step 01 with the form still filled in', async () => {
    await startAtSelect()
    fireEvent.click(screen.getByText('Go Back to Step 01'))

    expect(screen.getByText('Contact Information')).toBeTruthy()
    expect(screen.getByLabelText(/customer name/i).value).toBe('Jess')
    expect(screen.queryByText('please select')).toBeNull()
  })

  it('does not crash and shows pickup as unavailable when the owner has configured no stores', async () => {
    await startAtSelect({ ok: true, stores: [] })

    expect(await screen.findByText(/not available/i)).toBeTruthy()
  })

  it('does not crash and shows pickup as unavailable when the configured store has no dates', async () => {
    await startAtSelect({ ok: true, stores: [{ ...PICKUP_STORE, dates: [] }] })

    expect(await screen.findByText(/not available/i)).toBeTruthy()
  })
})

describe('Pickup stages 4 and 5 - confirm, then confirmed', () => {
  it('picking a time shows the confirm order state', async () => {
    await startAtSelect()
    fireEvent.click(screen.getByText('Pick Up Time'))
    fireEvent.click(await screen.findByText('2:30 PM - 3:00 PM'))

    expect(screen.getByText('confirm order')).toBeTruthy()
    expect(screen.getByText('Place Order')).toBeTruthy()
    // The picker itself is replaced, not stacked underneath.
    expect(screen.queryByText('please select')).toBeNull()
  })

  it('placing the order shows the confirmation state with a way back home', async () => {
    await startAtSelect()
    fireEvent.click(screen.getByText('Pick Up Time'))
    fireEvent.click(await screen.findByText('2:00 PM - 2:30 PM'))
    fireEvent.click(screen.getByText('Place Order'))

    expect(screen.getByText('Hurray! Order Confirmed')).toBeTruthy()
    expect(screen.getByText('Return to Homepage').closest('a').getAttribute('href')).toBe('/')
    expect(screen.queryByText('Place Order')).toBeNull()
  })

  it('keeps the cart off screen all the way through to the confirmation', async () => {
    await startAtSelect()
    fireEvent.click(screen.getByText('Pick Up Time'))
    fireEvent.click(await screen.findByText('2:00 PM - 2:30 PM'))
    fireEvent.click(screen.getByText('Place Order'))

    expect(screen.queryByText('Blueberry Muffin')).toBeNull()
    expect(screen.queryByText('Proceed to Pickup')).toBeNull()
    // No going back once the order is placed.
    expect(screen.queryByText('Go Back to Step 01')).toBeNull()
  })
})
