import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CartProvider } from '../context/CartContext.jsx'
import OrderConfirmed from './OrderConfirmed.jsx'

const STORAGE_KEY = 'lilloaves:cart'

const MUFFIN = { id: 1, qty: 2, name: 'Blueberry Muffin', image: 'blueberry.png', priceFormatted: '$21.13' }

const renderConfirmed = (route) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <CartProvider>
        <OrderConfirmed />
      </CartProvider>
    </MemoryRouter>,
  )

describe('OrderConfirmed', () => {
  beforeEach(() => localStorage.clear())

  // A real paid order lands here with ?order=<n> because WooCommerce's own
  // redirect filter sends it (see ll_handoff()'s
  // woocommerce_get_checkout_order_received_url hook) - the server-side cart
  // is already empty by then, but this app's own localStorage cart never
  // heard about it, so a customer who then opens /cart would still see (and
  // could re-submit) the items they already paid for.
  it('empties the cart once a real order number is present', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([MUFFIN]))
    renderConfirmed('/order-confirmed?order=113')
    expect(screen.getByText('Order #: 113')).toBeTruthy()
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual([])
  })

  // No ?order= means this was never reached via a real WooCommerce redirect
  // (a stray/direct visit) - the cart must survive that, not just any visit
  // to the URL.
  it('leaves the cart untouched without an order number', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([MUFFIN]))
    renderConfirmed('/order-confirmed')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual([MUFFIN])
  })
})
