import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Menu from './Menu.jsx'
import * as woo from '../lib/woo.js'

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
  vi.spyOn(woo, 'fetchCategories').mockResolvedValue([
    { id: 1372, name: 'Breads', slug: 'breads', count: 2 },
    { id: 1373, name: 'Muffins', slug: 'muffins', count: 1 },
  ])
  vi.spyOn(woo, 'fetchFeatured').mockResolvedValue([])
  vi.spyOn(woo, 'fetchByTagSlug').mockResolvedValue([])
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

const renderMenu = () => render(<MemoryRouter><Menu /></MemoryRouter>)

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
})
