import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Product from './Product.jsx'
import * as woo from '../lib/woo.js'

const PRODUCT = {
  id: 13,
  slug: 'sour-dough',
  name: 'Sour Dough',
  type: 'simple',
  description: '<p>Slow-fermented.</p>',
  shortDescription: '<p>Crisp crust.</p>',
  price: 21.13,
  priceFormatted: '$21.13',
  inStock: true,
  purchasable: true,
  hasOptions: false,
  variationIds: [],
  images: [{ src: 'a.jpg', thumbnail: 't.jpg', srcset: '', sizes: '', alt: 'Loaf' }],
  categories: [],
  tags: [],
}

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/product/:slug" element={<Product />} />
      </Routes>
    </MemoryRouter>,
  )

afterEach(() => vi.restoreAllMocks())

describe('Product', () => {
  it('renders the product named in the URL', async () => {
    vi.spyOn(woo, 'fetchProductBySlug').mockResolvedValue(PRODUCT)
    renderAt('/product/sour-dough')
    await waitFor(() => expect(screen.getByText('Sour Dough')).toBeTruthy())
    expect(woo.fetchProductBySlug).toHaveBeenCalledWith('sour-dough')
    expect(screen.getAllByText('$21.13').length).toBeGreaterThan(0)
  })

  it('shows a not-found message for an unknown slug', async () => {
    vi.spyOn(woo, 'fetchProductBySlug').mockResolvedValue(null)
    renderAt('/product/nope')
    await waitFor(() => expect(screen.getByText(/couldn.t find/i)).toBeTruthy())
  })
})
