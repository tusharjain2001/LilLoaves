import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Menu from './Menu.jsx'
import { CartProvider } from '../context/CartContext.jsx'
import * as woo from '../lib/woo.js'

const STORAGE_KEY = 'lilloaves:cart'

const product = (over = {}) => ({
  id: 13,
  slug: 'sour-dough',
  name: 'Sour Dough',
  type: 'simple',
  description: '<p>Slow-fermented.</p>',
  shortDescription: '',
  summary: 'Slow-fermented.',
  price: 21.13,
  priceFormatted: '$21.13',
  inStock: true,
  purchasable: true,
  hasOptions: false,
  variationIds: [],
  images: [{ src: 'a.jpg', thumbnail: 't.jpg', srcset: '', sizes: '', alt: 'Loaf' }],
  categories: [{ id: 1372, name: 'Breads', slug: 'breads' }],
  tags: [],
  ...over,
})

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(woo, 'fetchCategories').mockResolvedValue([
    { id: 1372, name: 'Breads', slug: 'breads', count: 2 },
    { id: 1373, name: 'Muffins', slug: 'muffins', count: 1 },
  ])
  vi.spyOn(woo, 'fetchFeatured').mockResolvedValue([])
  vi.spyOn(woo, 'fetchByTagSlug').mockResolvedValue([])
  vi.spyOn(woo, 'fetchProductBySlug').mockResolvedValue(null)
  vi.spyOn(woo, 'fetchProducts').mockResolvedValue([
    product(),
    product({
      id: 16,
      slug: 'japanese-milk-bread',
      name: 'Japanese Milk Bread',
      inStock: false,
      description: '<p>Soft and fluffy.</p>',
      summary: 'Soft and fluffy.',
    }),
  ])
})

afterEach(() => vi.restoreAllMocks())

const renderMenu = () =>
  render(
    <MemoryRouter>
      <CartProvider>
        <Menu />
      </CartProvider>
    </MemoryRouter>,
  )

describe('Menu', () => {
  it('renders a tab per category returned by the API', async () => {
    // Scoped to role: button, since CategoryStrip (a separate, unrelated
    // decorative component out of scope for this task) statically renders the
    // same four category names as plain text and would otherwise collide.
    renderMenu()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Breads' })).toBeTruthy(),
    )
    expect(screen.getByRole('button', { name: 'Muffins' })).toBeTruthy()
  })

  it('renders products with formatted prices', async () => {
    renderMenu()
    await waitFor(() => expect(screen.getByText('Sour Dough')).toBeTruthy())
    expect(screen.getAllByText('$21.13').length).toBeGreaterThan(0)
  })

  it('marks an out-of-stock product as sold out', async () => {
    renderMenu()
    await waitFor(() => expect(screen.getByText('Japanese Milk Bread')).toBeTruthy())
    expect(screen.getByText(/sold out/i)).toBeTruthy()
  })

  it('renders the plain-text description, not raw HTML tags', async () => {
    renderMenu()
    await waitFor(() => expect(screen.getByText('Slow-fermented.')).toBeTruthy())
    expect(screen.queryByText(/<p/)).toBeNull()
  })

  it('shows a placeholder image rather than a broken image when the product has none', async () => {
    woo.fetchProducts.mockResolvedValue([product({ images: [] })])
    renderMenu()
    await waitFor(() => expect(screen.getByAltText('Sour Dough')).toBeTruthy())
    expect(screen.getByAltText('Sour Dough').getAttribute('src')).not.toBe('')
  })

  it('does not flash the empty state before the first fetch resolves', async () => {
    let resolveProducts
    woo.fetchProducts.mockReturnValue(
      new Promise((resolve) => {
        resolveProducts = resolve
      }),
    )
    renderMenu()
    // Still loading: the empty-state copy must not appear yet, even though
    // there are (so far) zero visible products, same as the empty state.
    expect(screen.queryByText('More treats coming soon!')).toBeNull()
    resolveProducts([])
    await waitFor(() =>
      expect(screen.getByText('More treats coming soon!')).toBeTruthy(),
    )
  })
})

// The Lunch Box "Price / cart bar" also renders its own unconditional Add to
// Cart / +/- controls, so every card-level assertion below is scoped with
// within() to the specific BreadCard rather than querying the whole screen.
describe('Menu cart', () => {
  it('adds a product to the cart when Add to Cart is clicked', async () => {
    renderMenu()
    await waitFor(() => expect(screen.getByText('Sour Dough')).toBeTruthy())
    const card = screen.getByText('Sour Dough').parentElement.parentElement

    fireEvent.click(within(card).getByText('Add to Cart'))

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(stored).toEqual([
        { id: 13, qty: 1, name: 'Sour Dough', image: 'a.jpg', priceFormatted: '$21.13' },
      ])
    })
  })

  it('increments the same line instead of duplicating when clicked again', async () => {
    renderMenu()
    await waitFor(() => expect(screen.getByText('Sour Dough')).toBeTruthy())
    const card = screen.getByText('Sour Dough').parentElement.parentElement

    fireEvent.click(within(card).getByText('Add to Cart'))
    await waitFor(() => expect(within(card).getByText('1')).toBeTruthy())
    fireEvent.click(within(card).getByRole('button', { name: '+' }))

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(stored).toHaveLength(1)
      expect(stored[0].qty).toBe(2)
    })
  })

  it('cannot add an out-of-stock product from the menu card', async () => {
    renderMenu()
    await waitFor(() => expect(screen.getByText('Japanese Milk Bread')).toBeTruthy())

    const soldOutRow = screen.getByText(/sold out/i).parentElement
    expect(soldOutRow.querySelector('button')).toBeNull()

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
      expect(stored.find((l) => l.id === 16)).toBeUndefined()
    })
  })

  it('keeps two products with the same name as distinct cart lines', async () => {
    woo.fetchProducts.mockResolvedValue([
      product({ id: 20, name: 'Sourdough Loaf' }),
      product({ id: 21, name: 'Sourdough Loaf' }),
    ])
    renderMenu()
    await waitFor(() => expect(screen.getAllByText('Sourdough Loaf')).toHaveLength(2))

    const cards = screen
      .getAllByText('Sourdough Loaf')
      .map((el) => el.parentElement.parentElement)
    fireEvent.click(within(cards[0]).getByText('Add to Cart'))
    fireEvent.click(within(cards[1]).getByText('Add to Cart'))

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(stored.map((l) => l.id).sort()).toEqual([20, 21])
      expect(stored.every((l) => l.qty === 1)).toBe(true)
    })
  })
})

describe('Menu lunch box', () => {
  it('builds each column from its tag', async () => {
    woo.fetchByTagSlug.mockImplementation(async (slug) =>
      slug === 'lunchbox-bread'
        ? [product(), product({ id: 16, slug: 'japanese-milk-bread', name: 'Japanese Milk Bread' })]
        : [],
    )
    renderMenu()
    await waitFor(() => expect(woo.fetchByTagSlug).toHaveBeenCalledWith('lunchbox-bread'))
    expect(woo.fetchByTagSlug).toHaveBeenCalledWith('lunchbox-cracker')
    expect(woo.fetchByTagSlug).toHaveBeenCalledWith('lunchbox-dessert')
  })

  it('renders no options for a tag with no products yet', async () => {
    woo.fetchByTagSlug.mockResolvedValue([])
    renderMenu()
    await waitFor(() => expect(woo.fetchByTagSlug).toHaveBeenCalled())
    expect(screen.queryByText('Chief’s Crackers (5oz)')).toBeNull()
  })

  it('selects the first bread option once loaded', async () => {
    woo.fetchByTagSlug.mockImplementation(async (slug) =>
      slug === 'lunchbox-bread' ? [product()] : [],
    )
    renderMenu()
    await waitFor(() => expect(screen.getByAltText('Selected')).toBeTruthy())
    expect(screen.getByAltText('Selected').closest('button').textContent).toContain('Sour Dough')
  })

  it('leaves a column with no options unselected but still renders its card', async () => {
    woo.fetchByTagSlug.mockImplementation(async (slug) =>
      slug === 'lunchbox-bread' ? [product()] : [],
    )
    renderMenu()
    expect(screen.getByText('CHoose your Crackers')).toBeTruthy()
    expect(screen.getByText('CHoose your Dessert')).toBeTruthy()
    // Only the bread column has an option to select; crackers/dessert have
    // none. "CHoose your Crackers" renders synchronously on first paint
    // regardless of the tag fetch, so it is not a reliable proxy for "the
    // async selection has landed" - wait on the actual selected marker.
    await waitFor(() => expect(screen.getAllByAltText('Selected')).toHaveLength(1))
  })
})

describe('Menu lunch box price', () => {
  it('renders the live Lunch Box price instead of a hardcoded number', async () => {
    woo.fetchProductBySlug.mockResolvedValue(
      product({ id: 15, slug: 'lunch-box', name: 'Lunch Box', priceFormatted: '$39.00', categories: [] }),
    )
    renderMenu()
    await waitFor(() => expect(woo.fetchProductBySlug).toHaveBeenCalledWith('lunch-box'))
    await waitFor(() => expect(screen.getByText('$39.00')).toBeTruthy())
    expect(screen.queryByText('$33.50')).toBeNull()
  })

  it('renders nothing rather than a stale number when the Lunch Box product is missing', async () => {
    woo.fetchProductBySlug.mockResolvedValue(null)
    renderMenu()
    await waitFor(() => expect(woo.fetchProductBySlug).toHaveBeenCalledWith('lunch-box'))
    expect(screen.queryByText('$33.50')).toBeNull()
  })
})
