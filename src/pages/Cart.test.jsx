import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CartProvider } from '../context/CartContext.jsx'
import Cart from './Cart.jsx'
import * as quoteLib from '../lib/quote.js'
import * as checkoutLib from '../lib/checkout.js'

const STORAGE_KEY = 'lilloaves:cart'

function seedCart(lines) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
}

const MUFFIN = { id: 1, qty: 2, name: 'Blueberry Muffin', image: 'blueberry.png', priceFormatted: '$21.13' }
const BREAD = { id: 2, qty: 1, name: 'Japanese Milk Bread', image: 'bread.png', priceFormatted: '$18.00' }

function makeQuote(overrides = {}) {
  return {
    ok: true,
    lines: [{ id: 1, qty: 2, totalFormatted: '$42.26', unitFormatted: '$21.13' }],
    subtotalFormatted: '$42.26',
    deliveryFormatted: '$5.00',
    discountFormatted: '$0.00',
    taxFormatted: '$0.00',
    totalFormatted: '$47.26',
    errors: [],
    ...overrides,
  }
}

const renderCart = (route = '/cart') =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <CartProvider>
        <Cart />
      </CartProvider>
    </MemoryRouter>,
  )

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Cart items', () => {
  it('renders lines from the cart context', async () => {
    seedCart([MUFFIN, BREAD])
    vi.spyOn(quoteLib, 'fetchQuote').mockResolvedValue(makeQuote())
    renderCart()

    expect(screen.getByText('Blueberry Muffin')).toBeTruthy()
    expect(screen.getByText('Japanese Milk Bread')).toBeTruthy()
    expect(screen.getByText('$21.13')).toBeTruthy()
    expect(screen.getByText('$18.00')).toBeTruthy()
  })

  it('shows the total quantity, not the number of distinct lines, as the item count', async () => {
    seedCart([MUFFIN, BREAD]) // qty 2 + qty 1 = 3, across 2 lines
    vi.spyOn(quoteLib, 'fetchQuote').mockResolvedValue(makeQuote())
    renderCart()

    expect(screen.getByText('Cart Items (3)')).toBeTruthy()
  })

  it('increment calls the cart context and persists the new quantity', async () => {
    seedCart([MUFFIN])
    vi.spyOn(quoteLib, 'fetchQuote').mockResolvedValue(makeQuote())
    renderCart()

    fireEvent.click(screen.getByLabelText('Increase Blueberry Muffin quantity'))

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(stored.find((l) => l.id === 1).qty).toBe(3)
    })
  })

  it('decrement calls the cart context but never drops below quantity 1', async () => {
    seedCart([{ ...MUFFIN, qty: 1 }])
    vi.spyOn(quoteLib, 'fetchQuote').mockResolvedValue(makeQuote())
    renderCart()

    fireEvent.click(screen.getByLabelText('Decrease Blueberry Muffin quantity'))

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(stored.find((l) => l.id === 1).qty).toBe(1)
    })
  })

  it('remove calls the cart context and drops the line', async () => {
    seedCart([MUFFIN, BREAD])
    vi.spyOn(quoteLib, 'fetchQuote').mockResolvedValue(makeQuote())
    renderCart()

    fireEvent.click(screen.getByLabelText('Remove Blueberry Muffin from cart'))

    await waitFor(() => expect(screen.queryByText('Blueberry Muffin')).toBeNull())
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(stored.map((l) => l.id)).toEqual([2])
  })

  it('Clear Cart empties the cart', async () => {
    seedCart([MUFFIN, BREAD])
    vi.spyOn(quoteLib, 'fetchQuote').mockResolvedValue(makeQuote())
    renderCart()

    fireEvent.click(screen.getByText('Clear Cart'))

    await waitFor(() => expect(screen.queryByText('Blueberry Muffin')).toBeNull())
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual([])
  })
})

describe('Empty cart', () => {
  it('renders an empty state without any blank money rows and disables checkout', async () => {
    // The effect still fires fetchQuote({ lines: [], ... }) after the debounce -
    // the empty-cart short-circuit lives inside fetchQuote itself, not here.
    // What's asserted below is that whatever this mock resolves with never
    // reaches the DOM: rendering is gated on cart.isEmpty, not on quote content.
    vi.spyOn(quoteLib, 'fetchQuote').mockResolvedValue(makeQuote())
    renderCart()

    expect(await screen.findByText(/cart is empty/i)).toBeTruthy()
    expect(screen.queryByText('Subtotal')).toBeNull()
    expect(screen.queryByText('Total')).toBeNull()
    expect(screen.getByText('Proceed to Checkout').closest('button').disabled).toBe(true)
  })
})

describe('Before the first quote lands', () => {
  it('shows a placeholder instead of a blank money row on a populated cart\'s first render', () => {
    // A returning customer's cart loads from localStorage instantly, but the
    // quote is still 300ms + a network round trip away. Assert synchronously,
    // right after render and before that timer has any chance to fire, so
    // fetchQuote is never even called yet - this is the window the bug lived in.
    seedCart([MUFFIN])
    vi.spyOn(quoteLib, 'fetchQuote').mockImplementation(() => new Promise(() => {}))
    renderCart()

    expect(quoteLib.fetchQuote).not.toHaveBeenCalled()
    // Labels are already on screen... ("Shipping" also names a checkout
    // stepper step elsewhere on the page, hence getAllByText there.
    expect(screen.getByText('Subtotal')).toBeTruthy()
    expect(screen.getAllByText('Shipping').length).toBeGreaterThan(0)
    expect(screen.getByText('Discount')).toBeTruthy()
    expect(screen.getByText('Total')).toBeTruthy()
    // ...but nothing beside them is an empty string. Every pending figure -
    // subtotal, shipping, discount, Total, and the per-line total - renders
    // the same placeholder instead of "".
    expect(screen.getAllByText('—')).toHaveLength(5)
    expect(screen.getByText('Proceed to Checkout').closest('button').disabled).toBe(true)
  })
})

describe('Order summary and totals', () => {
  it('renders summary rows, per-line totals and the Total from the quote, never computed locally', async () => {
    seedCart([MUFFIN])
    vi.spyOn(quoteLib, 'fetchQuote').mockResolvedValue(
      makeQuote({
        lines: [{ id: 1, qty: 2, totalFormatted: '$42.26', unitFormatted: '$21.13' }],
        subtotalFormatted: '$42.26',
        deliveryFormatted: '$5.00',
        discountFormatted: '$1.00',
        totalFormatted: '$46.26',
      }),
    )
    renderCart()

    await waitFor(() => expect(screen.getByText('$46.26')).toBeTruthy())
    // subtotal and the per-line total legitimately share this figure (one line, no delivery/discount netted in)
    expect(screen.getAllByText('$42.26').length).toBe(2)
    expect(screen.getByText('$5.00')).toBeTruthy()
    expect(screen.getByText('$1.00')).toBeTruthy()
  })

  it('renders a quote error visibly and disables checkout', async () => {
    seedCart([MUFFIN])
    vi.spyOn(quoteLib, 'fetchQuote').mockResolvedValue(
      makeQuote({ errors: ['We do not deliver to that postcode yet'] }),
    )
    renderCart()

    expect(await screen.findByText('We do not deliver to that postcode yet')).toBeTruthy()
    expect(screen.getByText('Proceed to Checkout').closest('button').disabled).toBe(true)
  })

  it('does not let a superseded quote overwrite a newer one', async () => {
    seedCart([{ ...MUFFIN, qty: 1 }])
    const resolvers = []
    vi.spyOn(quoteLib, 'fetchQuote').mockImplementation(
      () => new Promise((resolve) => resolvers.push(resolve)),
    )
    renderCart()

    await waitFor(() => expect(resolvers.length).toBe(1), { timeout: 1000 })

    fireEvent.click(screen.getByLabelText('Increase Blueberry Muffin quantity'))
    await waitFor(() => expect(resolvers.length).toBe(2), { timeout: 1000 })

    // The newer (second) request resolves first with the fresh total...
    await act(async () => resolvers[1](makeQuote({ totalFormatted: '$99.00' })))
    await waitFor(() => expect(screen.getByText('$99.00')).toBeTruthy())

    // ...then the stale first request resolves late and must be ignored.
    await act(async () => resolvers[0](makeQuote({ totalFormatted: '$1.00' })))
    expect(screen.queryByText('$1.00')).toBeNull()
    expect(screen.getByText('$99.00')).toBeTruthy()
  })
})

describe('Contact and address form', () => {
  it('controls the contact and address inputs from state', async () => {
    seedCart([MUFFIN])
    vi.spyOn(quoteLib, 'fetchQuote').mockResolvedValue(makeQuote())
    const { container } = renderCart()

    const email = container.querySelector('input[name="email"]')
    const fullName = container.querySelector('input[name="fullName"]')

    fireEvent.change(email, { target: { value: 'baker@example.com' } })
    fireEvent.change(fullName, { target: { value: 'Ada Lovelace' } })

    expect(email.value).toBe('baker@example.com')
    expect(fullName.value).toBe('Ada Lovelace')

    // Controlled inputs stay put across an unrelated re-render (e.g. a quote landing).
    await waitFor(() => expect(quoteLib.fetchQuote).toHaveBeenCalled())
    expect(email.value).toBe('baker@example.com')
  })
})

describe('Proceed to Checkout', () => {
  it('disables the button synchronously on click, before the form is built', async () => {
    seedCart([MUFFIN])
    vi.spyOn(quoteLib, 'fetchQuote').mockResolvedValue(makeQuote())
    vi.spyOn(checkoutLib, 'submitCheckout').mockImplementation(() => {})
    renderCart()

    const button = () => screen.getByText('Proceed to Checkout').closest('button')
    await waitFor(() => expect(button().disabled).toBe(false))

    fireEvent.click(button())

    expect(button().disabled).toBe(true)
  })

  it('submits the memoized token, cart lines (ids/qty only) and delivery contact fields', async () => {
    seedCart([MUFFIN])
    vi.spyOn(quoteLib, 'fetchQuote').mockResolvedValue(makeQuote())
    vi.spyOn(checkoutLib, 'submitCheckout').mockImplementation(() => {})
    const { container } = renderCart()

    const button = () => screen.getByText('Proceed to Checkout').closest('button')
    await waitFor(() => expect(button().disabled).toBe(false))

    fireEvent.change(container.querySelector('input[name="email"]'), { target: { value: 'ada@example.com' } })
    fireEvent.change(container.querySelector('input[name="fullName"]'), { target: { value: 'Ada Lovelace' } })

    fireEvent.click(button())

    expect(checkoutLib.submitCheckout).toHaveBeenCalledTimes(1)
    const args = checkoutLib.submitCheckout.mock.calls[0][0]
    expect(args.fulfilment).toBe('delivery')
    expect(args.lines.map((l) => ({ id: l.id, qty: l.qty }))).toEqual([{ id: 1, qty: 2 }])
    expect(args.email).toBe('ada@example.com')
    expect(args.fullName).toBe('Ada Lovelace')
    expect(typeof args.token).toBe('string')
    expect(args.token.length).toBeGreaterThan(0)
  })

  it('submits pickup contact and store/date fields, not address fields, in pickup mode', async () => {
    seedCart([MUFFIN])
    vi.spyOn(quoteLib, 'fetchQuote').mockResolvedValue(makeQuote())
    vi.spyOn(checkoutLib, 'submitCheckout').mockImplementation(() => {})
    const { container } = renderCart()

    fireEvent.click(screen.getByText('Pickup Cart'))
    fireEvent.change(container.querySelector('input[name="customerName"]'), {
      target: { value: 'Ada Lovelace' },
    })
    fireEvent.change(container.querySelector('input[name="pickupPhone"]'), {
      target: { value: '5551234567' },
    })
    fireEvent.click(screen.getByText('9 Aug'))

    const button = () => screen.getByText('Proceed to Checkout').closest('button')
    await waitFor(() => expect(button().disabled).toBe(false))
    fireEvent.click(button())

    const args = checkoutLib.submitCheckout.mock.calls[0][0]
    expect(args.fulfilment).toBe('pickup')
    expect(args.fullName).toBe('Ada Lovelace')
    expect(args.phone).toBe('5551234567')
    expect(args.pickupStore).toBe('Orange County Store')
    expect(args.pickupDate).toBe('9 Aug')
  })

  it('recomputes the token from cart state (buildCheckoutToken), not a fresh value per click', async () => {
    // The token itself must be a pure function of {lines, fulfilment,
    // postcode, coupon} - see checkout.test.js for exhaustive same/changed
    // coverage. Here: confirm Cart.jsx actually passes the memoized value
    // through rather than, say, Math.random() or Date.now() in the handler.
    seedCart([MUFFIN])
    vi.spyOn(quoteLib, 'fetchQuote').mockResolvedValue(makeQuote())
    vi.spyOn(checkoutLib, 'submitCheckout').mockImplementation(() => {})
    renderCart()

    const button = () => screen.getByText('Proceed to Checkout').closest('button')
    await waitFor(() => expect(button().disabled).toBe(false))
    fireEvent.click(button())

    const sentToken = checkoutLib.submitCheckout.mock.calls[0][0].token
    const expectedToken = checkoutLib.buildCheckoutToken({
      lines: [{ id: 1, qty: 2 }],
      fulfilment: 'delivery',
      postcode: '',
      coupon: '',
    })
    expect(sentToken).toBe(expectedToken)
  })
})

describe('Checkout error banner', () => {
  it('renders a message for every documented ?error= code', async () => {
    const cases = {
      out_of_area: /deliver to that postcode/i,
      below_minimum: /delivery minimum/i,
      unavailable: /temporarily unavailable/i,
      origin: /couldn't verify/i,
      throttled: /too many attempts/i,
      coupon: /coupon code/i,
    }

    for (const [code, expected] of Object.entries(cases)) {
      vi.spyOn(quoteLib, 'fetchQuote').mockResolvedValue(makeQuote())
      const { unmount } = renderCart(`/cart?error=${code}`)
      expect((await screen.findByRole('alert')).textContent).toMatch(expected)
      unmount()
      vi.restoreAllMocks()
    }
  })

  it('renders no error banner when there is no ?error= param', async () => {
    vi.spyOn(quoteLib, 'fetchQuote').mockResolvedValue(makeQuote())
    renderCart('/cart')

    expect(screen.queryByRole('alert')).toBeNull()
  })
})
