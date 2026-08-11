import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Product from './Product.jsx'
import { CartProvider } from '../context/CartContext.jsx'
import * as woo from '../lib/woo.js'

const STORAGE_KEY = 'lilloaves:cart'

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
  regularPriceFormatted: '$21.13',
  onSale: false,
}

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <CartProvider>
        <Routes>
          <Route path="/product/:slug" element={<Product />} />
          <Route path="/cart" element={<p>CART PAGE</p>} />
        </Routes>
      </CartProvider>
    </MemoryRouter>,
  )

beforeEach(() => localStorage.clear())
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

  it('replaces the purchase actions with Sold out when the product is out of stock', async () => {
    // "Add to Cart" also appears in the unrelated, out-of-scope RELATED_ITEMS
    // tiles, so assert on "Buy Now" (unique to the main purchase row) and the
    // Sold out replacement rather than a global "Add to Cart" text query.
    vi.spyOn(woo, 'fetchProductBySlug').mockResolvedValue({ ...PRODUCT, inStock: false })
    renderAt('/product/sour-dough')
    await waitFor(() => expect(screen.getByText('Sour Dough')).toBeTruthy())
    expect(screen.getByText('Sold out')).toBeTruthy()
    expect(screen.queryByText('Buy Now')).toBeNull()

    // No purchase control exists to click, so this can only ever no-op - that
    // absence, not a click handler's behaviour, is what keeps it out of the cart.
    fireEvent.click(screen.getByText('Sold out'))
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')).toEqual([])
  })

  it('offers the purchase actions when the product is in stock', async () => {
    vi.spyOn(woo, 'fetchProductBySlug').mockResolvedValue(PRODUCT)
    renderAt('/product/sour-dough')
    await waitFor(() => expect(screen.getByText('Sour Dough')).toBeTruthy())
    expect(screen.getByText('Buy Now')).toBeTruthy()
    expect(screen.getAllByText('Add to Cart').length).toBeGreaterThan(0)
    expect(screen.queryByText('Sold out')).toBeNull()
  })

  it('does not render a struck-through "was" price when the product is not on sale', async () => {
    // $21.13 also appears in the unrelated, out-of-scope RELATED_ITEMS
    // tiles, so query the struck-through element directly rather than
    // counting text occurrences across the whole page.
    vi.spyOn(woo, 'fetchProductBySlug').mockResolvedValue(PRODUCT)
    const { container } = renderAt('/product/sour-dough')
    await waitFor(() => expect(screen.getByText('Sour Dough')).toBeTruthy())
    expect(container.querySelector('.line-through')).toBeNull()
  })

  it('renders the struck-through regular price when the product is on sale', async () => {
    vi.spyOn(woo, 'fetchProductBySlug').mockResolvedValue({
      ...PRODUCT,
      priceFormatted: '$18.00',
      regularPriceFormatted: '$21.13',
      onSale: true,
    })
    const { container } = renderAt('/product/sour-dough')
    await waitFor(() => expect(screen.getByText('Sour Dough')).toBeTruthy())
    expect(screen.getByText('$18.00')).toBeTruthy()
    expect(container.querySelector('.line-through')?.textContent).toBe('$21.13')
  })
})

describe('Product cart', () => {
  it('adds one to the cart when Add to Cart is clicked', async () => {
    vi.spyOn(woo, 'fetchProductBySlug').mockResolvedValue(PRODUCT)
    renderAt('/product/sour-dough')
    await waitFor(() => expect(screen.getByText('Sour Dough')).toBeTruthy())
    // "Add to Cart" also appears in the unrelated RELATED_ITEMS tiles, so
    // scope to the main purchase row (shared parent of Add to Cart / Buy Now).
    const purchaseRow = screen.getByText('Buy Now').parentElement

    fireEvent.click(within(purchaseRow).getByText('Add to Cart'))

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(stored).toEqual([
        { id: 13, qty: 1, name: 'Sour Dough', image: 'a.jpg', priceFormatted: '$21.13' },
      ])
    })
  })

  it('Buy Now adds one to the cart and navigates to /cart', async () => {
    vi.spyOn(woo, 'fetchProductBySlug').mockResolvedValue(PRODUCT)
    renderAt('/product/sour-dough')
    await waitFor(() => expect(screen.getByText('Sour Dough')).toBeTruthy())

    fireEvent.click(screen.getByText('Buy Now'))

    await waitFor(() => expect(screen.getByText('CART PAGE')).toBeTruthy())
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(stored).toEqual([
      { id: 13, qty: 1, name: 'Sour Dough', image: 'a.jpg', priceFormatted: '$21.13' },
    ])
  })
})

const COOKIE_PACK_SIZES = [
  { id: 89, name: 'Single Cookie', slug: 'single-cookie', price: 5, priceFormatted: '$5.00', inStock: true, purchasable: true },
  { id: 90, name: 'Box of 6', slug: 'box-of-6', price: 20, priceFormatted: '$20.00', inStock: true, purchasable: true },
]

describe('Product pack sizes', () => {
  it('renders no pill for a product without pack sizes (unchanged layout)', async () => {
    vi.spyOn(woo, 'fetchProductBySlug').mockResolvedValue(PRODUCT)
    renderAt('/product/sour-dough')
    await waitFor(() => expect(screen.getByText('Sour Dough')).toBeTruthy())
    expect(screen.queryByRole('button', { name: 'Single Cookie' })).toBeNull()
  })

  it('renders a pill per pack size, defaulting to the first, with its price shown', async () => {
    vi.spyOn(woo, 'fetchProductBySlug').mockResolvedValue({
      ...PRODUCT,
      id: 88,
      name: 'Choco Chip Cookies',
      priceFormatted: '$5.00',
      packSizes: COOKIE_PACK_SIZES,
    })
    renderAt('/product/sour-dough')
    await waitFor(() => expect(screen.getByText('Choco Chip Cookies')).toBeTruthy())

    expect(screen.getByRole('button', { name: 'Single Cookie' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Box of 6' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Single Cookie' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByText('$5.00')).toBeTruthy()
  })

  it('selecting a different pack size updates the displayed price', async () => {
    vi.spyOn(woo, 'fetchProductBySlug').mockResolvedValue({
      ...PRODUCT,
      id: 88,
      name: 'Choco Chip Cookies',
      priceFormatted: '$5.00',
      packSizes: COOKIE_PACK_SIZES,
    })
    renderAt('/product/sour-dough')
    await waitFor(() => expect(screen.getByText('Choco Chip Cookies')).toBeTruthy())

    fireEvent.click(screen.getByRole('button', { name: 'Box of 6' }))

    expect(screen.getByText('$20.00')).toBeTruthy()
    expect(screen.queryByText('$5.00')).toBeNull()
  })

  it('Add to Cart sends the selected pack size as a line with variationId and a size option', async () => {
    vi.spyOn(woo, 'fetchProductBySlug').mockResolvedValue({
      ...PRODUCT,
      id: 88,
      name: 'Choco Chip Cookies',
      priceFormatted: '$5.00',
      images: [],
      packSizes: COOKIE_PACK_SIZES,
    })
    renderAt('/product/sour-dough')
    await waitFor(() => expect(screen.getByText('Choco Chip Cookies')).toBeTruthy())

    fireEvent.click(screen.getByRole('button', { name: 'Box of 6' }))
    const purchaseRow = screen.getByText('Buy Now').parentElement
    fireEvent.click(within(purchaseRow).getByText('Add to Cart'))

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(stored).toEqual([
        {
          id: 88,
          qty: 1,
          name: 'Choco Chip Cookies',
          image: '',
          priceFormatted: '$20.00',
          options: { size: 'Box of 6' },
          variationId: 90,
        },
      ])
    })
  })
})

describe('Product gallery', () => {
  it('fills empty gallery slots with placeholders when only one photo exists, without an undefined src', async () => {
    vi.spyOn(woo, 'fetchProductBySlug').mockResolvedValue({
      ...PRODUCT,
      images: [{ src: 'only-photo.jpg', thumbnail: '', srcset: '', sizes: '', alt: 'Loaf' }],
    })
    const { container } = renderAt('/product/sour-dough')
    await waitFor(() => expect(screen.getByText('Sour Dough')).toBeTruthy())
    const galleryImages = container.querySelectorAll('img')
    galleryImages.forEach((img) => {
      expect(img.getAttribute('src')).toBeTruthy()
    })
  })
})
