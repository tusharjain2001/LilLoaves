import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Menu from './Menu.jsx'
import { CartProvider } from '../context/CartContext.jsx'
import { clearCache } from '../lib/woo.js'

// Integration-style: does not mock `../lib/woo.js` itself, only the network.
// This is the scenario the plan promises and the unit tests around woo.js
// alone cannot catch: a real WordPress outage flowing all the way through
// fetchCategories/fetchProducts/fetchFeatured into what Menu renders.
beforeEach(() => {
  clearCache()
  global.fetch = vi.fn().mockRejectedValue(new Error('offline'))
})

describe('Menu fallback when the proxy and its cache both fail', () => {
  it('renders the committed snapshot products instead of "more treats coming soon"', async () => {
    render(
      <MemoryRouter>
        <CartProvider>
          <Menu />
        </CartProvider>
      </MemoryRouter>,
    )
    await waitFor(() => expect(screen.getByText('Sour Dough')).toBeTruthy())
    expect(screen.getByText('Danish Pastries')).toBeTruthy()
    expect(screen.queryByText('More treats coming soon!')).toBeNull()
  })

  it('does not show every snapshot product as a Seasonal Special', async () => {
    // The snapshot can't honour the featured filter, so an outage must show
    // no specials rather than falsely feature all four products.
    render(
      <MemoryRouter>
        <CartProvider>
          <Menu />
        </CartProvider>
      </MemoryRouter>,
    )
    await waitFor(() => expect(screen.getByText('Sour Dough')).toBeTruthy())
    expect(screen.queryByText('SEASONAL Specials')).toBeNull()
  })
})
