import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import Menu from './Menu.jsx'
import Cart from './Cart.jsx'
import { CartProvider } from '../context/CartContext.jsx'
import * as woo from '../lib/woo.js'
import * as quoteLib from '../lib/quote.js'
import * as pickupLib from '../lib/pickup.js'

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

const COOKIE_PACK_SIZES = [
  { id: 89, name: 'Single Cookie', slug: 'single-cookie', price: 5, priceFormatted: '$5.00', inStock: true, purchasable: true },
  { id: 90, name: 'Box of 6', slug: 'box-of-6', price: 20, priceFormatted: '$20.00', inStock: true, purchasable: true },
]

const cookieProduct = (over = {}) =>
  product({
    id: 88,
    slug: 'choco-chip-cookies',
    name: 'Choco Chip Cookies',
    priceFormatted: '$5.00',
    packSizes: COOKIE_PACK_SIZES,
    ...over,
  })

// The pill row sits over the card image (a sibling of the name/price/actions
// column below it), so `card` here goes one hop further up than the
// `.parentElement.parentElement` used in "Menu cart" above - to the column
// that holds both the image (with pills) and the info column.
function cardFor(name) {
  return screen.getByText(name).parentElement.parentElement.parentElement
}

describe('Menu pack-size pills', () => {
  it('renders a pill per pack size, in wp-admin order, and none for a product with no pack sizes', async () => {
    woo.fetchProducts.mockResolvedValue([cookieProduct(), product()])
    renderMenu()
    await waitFor(() => expect(screen.getByText('Choco Chip Cookies')).toBeTruthy())

    const cookieCard = cardFor('Choco Chip Cookies')
    expect(within(cookieCard).getByRole('button', { name: 'Single Cookie' })).toBeTruthy()
    expect(within(cookieCard).getByRole('button', { name: 'Box of 6' })).toBeTruthy()

    const breadCard = cardFor('Sour Dough')
    expect(within(breadCard).queryByRole('button', { name: /single|box of/i })).toBeNull()
  })

  it('defaults to the first pack size selected and shows its price', async () => {
    woo.fetchProducts.mockResolvedValue([cookieProduct()])
    renderMenu()
    await waitFor(() => expect(screen.getByText('Choco Chip Cookies')).toBeTruthy())

    const cookieCard = cardFor('Choco Chip Cookies')
    expect(within(cookieCard).getByRole('button', { name: 'Single Cookie' }).getAttribute('aria-pressed')).toBe('true')
    expect(within(cookieCard).getByText('$5.00')).toBeTruthy()
  })

  it('selecting a different pack size updates the displayed price', async () => {
    woo.fetchProducts.mockResolvedValue([cookieProduct()])
    renderMenu()
    await waitFor(() => expect(screen.getByText('Choco Chip Cookies')).toBeTruthy())

    const cookieCard = cardFor('Choco Chip Cookies')
    fireEvent.click(within(cookieCard).getByRole('button', { name: 'Box of 6' }))

    expect(within(cookieCard).getByText('$20.00')).toBeTruthy()
    expect(within(cookieCard).queryByText('$5.00')).toBeNull()
    expect(within(cookieCard).getByRole('button', { name: 'Box of 6' }).getAttribute('aria-pressed')).toBe('true')
    expect(within(cookieCard).getByRole('button', { name: 'Single Cookie' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('Add to Cart adds the selected pack size as its own line, carrying variationId and a size label', async () => {
    woo.fetchProducts.mockResolvedValue([cookieProduct()])
    renderMenu()
    await waitFor(() => expect(screen.getByText('Choco Chip Cookies')).toBeTruthy())

    const cookieCard = cardFor('Choco Chip Cookies')
    fireEvent.click(within(cookieCard).getByRole('button', { name: 'Box of 6' }))
    fireEvent.click(within(cookieCard).getByText('Add to Cart'))

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(stored).toEqual([
        {
          id: 88,
          qty: 1,
          name: 'Choco Chip Cookies',
          image: 'a.jpg',
          priceFormatted: '$20.00',
          options: { size: 'Box of 6' },
          variationId: 90,
        },
      ])
    })
  })

  it('two pack sizes of the same product become two separate, independently-addable cart lines', async () => {
    woo.fetchProducts.mockResolvedValue([cookieProduct()])
    renderMenu()
    await waitFor(() => expect(screen.getByText('Choco Chip Cookies')).toBeTruthy())

    const cookieCard = cardFor('Choco Chip Cookies')
    fireEvent.click(within(cookieCard).getByText('Add to Cart')) // Single Cookie (default)
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(stored).toHaveLength(1)
    })

    fireEvent.click(within(cookieCard).getByRole('button', { name: 'Box of 6' }))
    fireEvent.click(within(cookieCard).getByText('Add to Cart'))

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(stored).toHaveLength(2)
      expect(stored.map((l) => l.variationId).sort()).toEqual([89, 90])
    })
  })

  it('the qty stepper reflects only the currently selected pack size, not the product overall', async () => {
    woo.fetchProducts.mockResolvedValue([cookieProduct()])
    renderMenu()
    await waitFor(() => expect(screen.getByText('Choco Chip Cookies')).toBeTruthy())

    const cookieCard = cardFor('Choco Chip Cookies')
    fireEvent.click(within(cookieCard).getByText('Add to Cart')) // adds Single Cookie, qty 1
    await waitFor(() => expect(within(cookieCard).getByText('1')).toBeTruthy())

    // Box of 6 has never been added - switching to it must show "Add to
    // Cart" again, not a stepper carrying Single Cookie's quantity.
    fireEvent.click(within(cookieCard).getByRole('button', { name: 'Box of 6' }))
    expect(within(cookieCard).getByText('Add to Cart')).toBeTruthy()
  })
})

// The card is a link with the cart controls sitting on top of it, so these
// drive the real card rather than asserting on an href: the two paths have to
// cross, or "Add to Cart" silently navigates away instead of adding.
function ProductStub() {
  const { slug } = useParams()
  return <p>PRODUCT PAGE {slug}</p>
}

const renderMenuRouted = () =>
  render(
    <MemoryRouter initialEntries={['/menu']}>
      <CartProvider>
        <Routes>
          <Route path="/menu" element={<Menu />} />
          <Route path="/product/:slug" element={<ProductStub />} />
        </Routes>
      </CartProvider>
    </MemoryRouter>,
  )

describe('Menu product links', () => {
  it('opens the product page for the card that was clicked', async () => {
    renderMenuRouted()
    await waitFor(() => expect(screen.getByText('Japanese Milk Bread')).toBeTruthy())

    fireEvent.click(screen.getByRole('link', { name: 'Japanese Milk Bread' }))

    await waitFor(() =>
      expect(screen.getByText(/PRODUCT PAGE japanese-milk-bread/)).toBeTruthy(),
    )
  })

  it('links a sold-out product to its page too', async () => {
    renderMenuRouted()
    await waitFor(() => expect(screen.getByText(/sold out/i)).toBeTruthy())
    expect(screen.getByRole('link', { name: 'Japanese Milk Bread' })).toBeTruthy()
  })

  it('adds to the cart without navigating when Add to Cart is clicked', async () => {
    renderMenuRouted()
    await waitFor(() => expect(screen.getByText('Sour Dough')).toBeTruthy())
    const card = screen.getByText('Sour Dough').parentElement.parentElement

    fireEvent.click(within(card).getByText('Add to Cart'))

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
      expect(stored.map((l) => l.id)).toEqual([13])
    })
    expect(screen.queryByText(/PRODUCT PAGE/)).toBeNull()
  })
})

describe('Menu lunch box', () => {
  it('builds each column from its tag, including Dessert', async () => {
    woo.fetchByTagSlug.mockImplementation(async (slug) =>
      slug === 'lunchbox-bread'
        ? [product(), product({ id: 16, slug: 'japanese-milk-bread', name: 'Japanese Milk Bread' })]
        : [],
    )
    renderMenu()
    await waitFor(() => expect(woo.fetchByTagSlug).toHaveBeenCalledWith('lunchbox-bread'))
    expect(woo.fetchByTagSlug).toHaveBeenCalledWith('lunchbox-cracker')
    // The Lunch Box has three choosers - Bread, Crackers and Dessert - so the
    // dessert column is customer-selected too, built from its own tag.
    expect(woo.fetchByTagSlug).toHaveBeenCalledWith('lunchbox-dessert')
  })

  it('renders three choosers for the Lunch Box - Bread, Crackers and Dessert', async () => {
    renderMenu()
    await waitFor(() => expect(screen.getByText('CHoose your Bread')).toBeTruthy())
    expect(screen.getByText('CHoose your Crackers')).toBeTruthy()
    expect(screen.getByText('CHoose your Dessert')).toBeTruthy()
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
    // Only the bread column has an option to select; crackers have none.
    // "CHoose your Crackers" renders synchronously on first paint regardless
    // of the tag fetch, so it is not a reliable proxy for "the async
    // selection has landed" - wait on the actual selected marker.
    await waitFor(() => expect(screen.getAllByAltText('Selected')).toHaveLength(1))
  })
})

// LunchboxGroup lays its options out on ONE line, each taking a basis of
// about half the row, and scrolls sideways past two rather than wrapping.
// Wrapping is what turned Dessert's five options into three stacked rows
// and a lone centred orphan, tripling that card's height and breaking the
// three cards' alignment. jsdom computes no real flexbox layout, so these
// assert the mechanism is wired up - no flex-wrap, overflow-x-auto on the
// row, and shrink-0 plus a shared basis on every option so the browser
// scrolls instead of compressing them - rather than pixel positions.
describe('Menu lunch box options stay on one line', () => {
  const breadOptions = (count) =>
    Array.from({ length: count }, (_, i) =>
      product({ id: 100 + i, slug: `bread-${i}`, name: `Bread ${i}` }),
    )

  it('two options keep their original full-width layout unchanged', async () => {
    woo.fetchByTagSlug.mockImplementation(async (slug) =>
      slug === 'lunchbox-bread' ? breadOptions(2) : [],
    )
    renderMenu()
    await waitFor(() => expect(screen.getByText('Bread 1')).toBeTruthy())

    const buttons = [0, 1].map((i) => screen.getByText(`Bread ${i}`).closest('button'))
    const row = buttons[0].parentElement;
    expect(row).toBe(buttons[1].parentElement)
    // Two options fit exactly, so nothing scrolls and nothing has moved.
    expect(row.className).not.toMatch(/flex-wrap/)
    expect(row.className).toMatch(/overflow-x-auto/)
    buttons.forEach((btn) => {
      expect(btn.className).toMatch(/basis-\[calc\(50%-6px\)\]/)
      expect(btn.className).not.toMatch(/\bflex-1\b/)
    })
  })

  it('keeps a third option on the same line, reachable by scrolling', async () => {
    woo.fetchByTagSlug.mockImplementation(async (slug) =>
      slug === 'lunchbox-bread' ? breadOptions(3) : [],
    )
    renderMenu()
    await waitFor(() => expect(screen.getByText('Bread 2')).toBeTruthy())

    expect(screen.getByText('Bread 0')).toBeTruthy()
    expect(screen.getByText('Bread 1')).toBeTruthy()
    const buttons = [0, 1, 2].map((i) => screen.getByText(`Bread ${i}`).closest('button'))
    const row = buttons[0].parentElement
    expect(row.className).not.toMatch(/flex-wrap/)
    expect(row.className).toMatch(/overflow-x-auto/)
    buttons.forEach((btn) => {
      expect(btn.parentElement).toBe(row)
      expect(btn.className).toMatch(/basis-\[calc\(50%-6px\)\]/)
      // Without shrink-0 the browser squeezes three options thinner to fit
      // instead of scrolling.
      expect(btn.className).toMatch(/shrink-0/)
    })
  })

  it('keeps four options on the line without dropping any of them', async () => {
    woo.fetchByTagSlug.mockImplementation(async (slug) =>
      slug === 'lunchbox-bread' ? breadOptions(4) : [],
    )
    renderMenu()
    await waitFor(() => expect(screen.getByText('Bread 3')).toBeTruthy())

    ;[0, 1, 2, 3].forEach((i) => expect(screen.getByText(`Bread ${i}`)).toBeTruthy())
  })

  // Dessert is the group with a real 5-option catalogue today (5 products
  // tagged lunchbox-dessert), and the one the client flagged: wrapping put
  // it on three lines with a lone centred orphan. Exercised on the Dessert
  // column specifically rather than only ever on Bread.
  it('keeps all five dessert options on one scrolling line, none dropped', async () => {
    const dessertOptions = Array.from({ length: 5 }, (_, i) =>
      product({ id: 200 + i, slug: `dessert-${i}`, name: `Dessert ${i}` }),
    )
    woo.fetchByTagSlug.mockImplementation(async (slug) =>
      slug === 'lunchbox-dessert' ? dessertOptions : [],
    )
    renderMenu()
    await waitFor(() => expect(screen.getByText('Dessert 4')).toBeTruthy())

    const buttons = [0, 1, 2, 3, 4].map((i) => screen.getByText(`Dessert ${i}`).closest('button'))
    const row = buttons[0].parentElement
    expect(row.className).not.toMatch(/flex-wrap/)
    expect(row.className).toMatch(/overflow-x-auto/)
    buttons.forEach((btn) => {
      expect(btn.parentElement).toBe(row)
      expect(btn.className).toMatch(/basis-\[calc\(50%-6px\)\]/)
      expect(btn.className).toMatch(/shrink-0/)
    })
  })
})

describe('Menu group cards wrapping', () => {
  it('lets the Bread/Crackers/Dessert group-card row wrap on desktop instead of overflowing', async () => {
    renderMenu()
    await waitFor(() => expect(screen.getByText('CHoose your Bread')).toBeTruthy())

    const row = screen.getByText('CHoose your Bread').closest('.lg\\:flex-row')
    expect(row).toBeTruthy()
    expect(row.className).toMatch(/lg:flex-wrap/)
    expect(row.className).toMatch(/lg:justify-center/)
  })

  // The three cards' natural heights differ by however many lines the
  // longest product name wraps to - "Chief's White Cheddar Cayenne
  // Crackers" is four lines where "Sourdough Bread" is two - which left the
  // row visibly ragged. jsdom computes no layout, so this asserts the
  // stretch is wired up rather than measuring pixels.
  it('makes all three group cards the same height, with the radio dots aligned', async () => {
    woo.fetchByTagSlug.mockImplementation(async (slug) =>
      slug === 'lunchbox-bread'
        ? [product({ id: 100, slug: 'bread-0', name: 'Bread 0' })]
        : [],
    )
    renderMenu()
    await waitFor(() => expect(screen.getByText('Bread 0')).toBeTruthy())

    const row = screen.getByText('CHoose your Bread').closest('.lg\\:flex-row')
    expect(row.className).toMatch(/lg:items-stretch/)
    // ...and not the old top-alignment, which let them end at different y.
    expect(row.className).not.toMatch(/lg:items-start/)

    // The card must NOT set its own height: a flex item only stretches while
    // its height is auto, so an lg:h-full here resolved to 100% of an
    // auto-height row - back to content height - and cancelled the stretch.
    const card = row.firstElementChild
    expect(card.className).toMatch(/lg:w-\[393\.65px\]/)
    expect(card.className).not.toMatch(/h-full/)

    // Each option fills its card's height and pins its radio to the bottom,
    // so the dots line up within a card and between cards.
    const option = screen.getByText('Bread 0').closest('button')
    expect(option.className).toMatch(/justify-between/)
    expect(option.parentElement.className).toMatch(/items-stretch/)
  })

  // The native scrollbar only appeared in the card that overflowed, and ate
  // height from that card alone - which is what knocked its radio dots out
  // of line with the other two. Hiding it keeps every card identical.
  it('hides the native scrollbar so it cannot eat height from one card only', async () => {
    renderMenu()
    await waitFor(() => expect(screen.getByText('CHoose your Bread')).toBeTruthy())

    const row = screen.getByText('CHoose your Bread').closest('.lg\\:flex-row')
    const scroller = row.querySelector('.overflow-x-auto')
    expect(scroller.className).toMatch(/\[scrollbar-width:none\]/)
    expect(scroller.className).toMatch(/webkit-scrollbar/)
  })

  it('outlines the chosen option, and reserves that border when unselected', async () => {
    woo.fetchByTagSlug.mockImplementation(async (slug) =>
      slug === 'lunchbox-bread'
        ? [
            product({ id: 100, slug: 'bread-0', name: 'Bread 0' }),
            product({ id: 101, slug: 'bread-1', name: 'Bread 1' }),
          ]
        : [],
    )
    renderMenu()
    await waitFor(() => expect(screen.getByText('Bread 1')).toBeTruthy())

    const first = screen.getByText('Bread 0').closest('button')
    const second = screen.getByText('Bread 1').closest('button')

    // Figma outlines the selection (nodes 379:306 / 379:309 / 379:310).
    expect(first.className).toMatch(/border-terracotta/)
    // The unselected one carries the same border width in transparent, so
    // choosing never nudges the row by a pixel.
    expect(second.className).toMatch(/border-transparent/)
    expect(second.className).toMatch(/rounded-\[17px\]/)

    fireEvent.click(second)
    expect(second.className).toMatch(/border-terracotta/)
    expect(screen.getByText('Bread 0').closest('button').className).toMatch(/border-transparent/)
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

describe('Menu lunch box add to cart', () => {
  const LUNCH_BOX_PRODUCT = product({
    id: 15,
    slug: 'lunch-box',
    name: 'Lunch Box',
    priceFormatted: '$39.00',
    categories: [],
  })

  it('adds product 15 to the cart carrying the selected bread/cracker/dessert options', async () => {
    woo.fetchProductBySlug.mockResolvedValue(LUNCH_BOX_PRODUCT)
    woo.fetchByTagSlug.mockImplementation(async (slug) =>
      slug === 'lunchbox-bread'
        ? [product(), product({ id: 16, slug: 'japanese-milk-bread', name: 'Japanese Milk Bread' })]
        : slug === 'lunchbox-dessert'
          ? [product({ id: 17, slug: 'cookies', name: 'Cookies' })]
          : [],
    )
    renderMenu()
    // Both Bread and Dessert have a default selection now, so two "Selected"
    // markers land - assert both, rather than getByAltText which only
    // tolerates exactly one match.
    await waitFor(() => expect(screen.getAllByAltText('Selected')).toHaveLength(2))
    // The bread selection and the Lunch Box product itself resolve from two
    // separate effects - wait for both to have actually landed in state
    // before clicking, not just for the selection marker.
    await waitFor(() => expect(screen.getByText('$39.00')).toBeTruthy())

    fireEvent.click(screen.getByLabelText('Add Lunch Box to Cart'))

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
      const line = stored.find((l) => l.id === 15)
      expect(line).toBeTruthy()
      expect(line.qty).toBe(1)
      // The Lunch Box has three choosers - Bread, Crackers and Dessert - so
      // all three selections reach the cart's options.
      expect(line.options).toEqual({ bread: 'Sour Dough', cracker: '', dessert: 'Cookies' })
    })
  })

  it('respects the lunch box quantity stepper when adding', async () => {
    woo.fetchProductBySlug.mockResolvedValue(LUNCH_BOX_PRODUCT)
    renderMenu()
    // Waiting for the price to render (not just for the mock to have been
    // called) is load-bearing: the click below no-ops until the resolved
    // product has actually landed in state, and merely having been called
    // races that under load.
    await waitFor(() => expect(screen.getByText('$39.00')).toBeTruthy())

    fireEvent.click(screen.getByText('+'))
    fireEvent.click(screen.getByLabelText('Add Lunch Box to Cart'))

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(stored.find((l) => l.id === 15).qty).toBe(2)
    })
  })

  it('adds without crashing when the cracker/dessert columns have no options available yet', async () => {
    // Default beforeEach mocks fetchByTagSlug to resolve [] for every tag,
    // so bread/cracker/dessert all have no selection - this is today's real
    // catalogue state (only lunchbox-bread is tagged).
    woo.fetchProductBySlug.mockResolvedValue(LUNCH_BOX_PRODUCT)
    renderMenu()
    // See the comment on the quantity-stepper test above: wait for the
    // resolved product to actually be in state, not just for the fetch to
    // have been called.
    await waitFor(() => expect(screen.getByText('$39.00')).toBeTruthy())

    fireEvent.click(screen.getByLabelText('Add Lunch Box to Cart'))

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(stored.find((l) => l.id === 15).options).toEqual({ bread: '', cracker: '', dessert: '' })
    })
  })

  it('does nothing when clicked before the Lunch Box product has loaded', async () => {
    woo.fetchProductBySlug.mockResolvedValue(null)
    renderMenu()
    await waitFor(() => expect(woo.fetchProductBySlug).toHaveBeenCalledWith('lunch-box'))

    fireEvent.click(screen.getByLabelText('Add Lunch Box to Cart'))

    // CartProvider persists its (empty) initial state on mount regardless,
    // so assert on cart contents rather than localStorage presence.
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    expect(stored.find((l) => l.id === 15)).toBeUndefined()
  })
})

// The Lunch Box section is now a two-panel carousel (Lunch Box, Sampler
// Box). At rest only the current panel is mounted at all - the two
// off-screen slots stay empty until a transition is actually under way -
// so these queries never have to disambiguate duplicate content the way a
// permanently-3-mounted carousel would.
describe('Menu carousel', () => {
  it('slides forward and backward with visibly different transforms', async () => {
    renderMenu()
    await waitFor(() => expect(screen.getByLabelText('Add Lunch Box to Cart')).toBeTruthy())
    const track = screen.getByTestId('menu-carousel-track')

    fireEvent.click(screen.getByLabelText('Next: Sampler Box'))
    // Forward travel slides the track past its resting -100% towards -200%.
    expect(track.style.transform).toBe('translateX(-200%)')

    fireEvent.transitionEnd(track)
    await waitFor(() => expect(screen.getByLabelText('Add Sampler Box to Cart')).toBeTruthy())
    expect(screen.queryByLabelText('Add Lunch Box to Cart')).toBeNull()

    fireEvent.click(screen.getByLabelText('Previous: Lunch Box'))
    // Backward travel goes the other way, towards 0% - not a mirror of the
    // same -200% value forward travel used.
    expect(track.style.transform).toBe('translateX(0%)')
  })

  it('loops forward past the last panel back to the first', async () => {
    renderMenu()
    await waitFor(() => expect(screen.getByLabelText('Add Lunch Box to Cart')).toBeTruthy())
    const track = screen.getByTestId('menu-carousel-track')

    fireEvent.click(screen.getByLabelText('Next: Sampler Box'))
    fireEvent.transitionEnd(track)
    await waitFor(() => expect(screen.getByLabelText('Add Sampler Box to Cart')).toBeTruthy())

    fireEvent.click(screen.getByLabelText('Next: Lunch Box'))
    fireEvent.transitionEnd(track)
    await waitFor(() => expect(screen.getByLabelText('Add Lunch Box to Cart')).toBeTruthy())
    expect(screen.queryByLabelText('Add Sampler Box to Cart')).toBeNull()
  })

  it('loops backward past the first panel to the last', async () => {
    renderMenu()
    await waitFor(() => expect(screen.getByLabelText('Add Lunch Box to Cart')).toBeTruthy())
    const track = screen.getByTestId('menu-carousel-track')

    fireEvent.click(screen.getByLabelText('Previous: Sampler Box'))
    fireEvent.transitionEnd(track)
    await waitFor(() => expect(screen.getByLabelText('Add Sampler Box to Cart')).toBeTruthy())
  })

  it('gives the arrows real, keyboard-reachable buttons labelled with their destination', async () => {
    renderMenu()
    await waitFor(() => expect(screen.getByLabelText('Add Lunch Box to Cart')).toBeTruthy())

    const prev = screen.getByLabelText('Previous: Sampler Box')
    const next = screen.getByLabelText('Next: Sampler Box')
    expect(prev.tagName).toBe('BUTTON')
    expect(next.tagName).toBe('BUTTON')
  })

  it('swipes: a touch drag left advances to the next panel', async () => {
    renderMenu()
    await waitFor(() => expect(screen.getByLabelText('Add Lunch Box to Cart')).toBeTruthy())
    const track = screen.getByTestId('menu-carousel-track')
    const swipeArea = screen.getByTestId('menu-carousel')

    fireEvent.touchStart(swipeArea, { touches: [{ clientX: 300 }] })
    fireEvent.touchEnd(swipeArea, { changedTouches: [{ clientX: 100 }] })
    expect(track.style.transform).toBe('translateX(-200%)')

    fireEvent.transitionEnd(track)
    await waitFor(() => expect(screen.getByLabelText('Add Sampler Box to Cart')).toBeTruthy())
  })

  it('honours prefers-reduced-motion by swapping panels without any sliding transform', async () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    renderMenu()
    await waitFor(() => expect(screen.getByLabelText('Add Lunch Box to Cart')).toBeTruthy())
    const track = screen.getByTestId('menu-carousel-track')

    fireEvent.click(screen.getByLabelText('Next: Sampler Box'))

    // No transitionend to wait out - the swap already happened, and the
    // track never left its resting transform/transition.
    expect(track.style.transition).toBe('none')
    expect(track.style.transform).toBe('translateX(-100%)')
    await waitFor(() => expect(screen.getByLabelText('Add Sampler Box to Cart')).toBeTruthy())
  })

  afterEach(() => {
    delete window.matchMedia
  })
})

describe('Menu sampler box', () => {
  const SAMPLER_BOX_PRODUCT = product({
    id: 50,
    slug: 'sampler-box',
    name: 'Sampler Box',
    priceFormatted: '$50.00',
    categories: [],
  })
  const BREAD_OPTION = product({ id: 60, slug: 'sourdough-mini', name: 'Sourdough Mini Loaf' })
  const CRACKER_OPTION = product({ id: 61, slug: 'docs-mini', name: 'Docs Mini Crackers' })
  const ADDON = product({
    id: 70,
    slug: 'sourdough-mini-loaf-addon',
    name: 'Sourdough Mini Loaf',
    priceFormatted: '$6.00',
  })

  function mockSamplerTags({ addonsBread = [], addonsCracker = [] } = {}) {
    woo.fetchByTagSlug.mockImplementation(async (slug) => {
      if (slug === 'sampler-bread-choice') return [BREAD_OPTION]
      if (slug === 'sampler-cracker-choice') return [CRACKER_OPTION]
      if (slug === 'sampler-bread-addon') return addonsBread
      if (slug === 'sampler-cracker-addon') return addonsCracker
      return []
    })
  }

  async function openSamplerBox() {
    await waitFor(() => expect(screen.getByLabelText('Add Lunch Box to Cart')).toBeTruthy())
    const track = screen.getByTestId('menu-carousel-track')
    fireEvent.click(screen.getByLabelText('Next: Sampler Box'))
    fireEvent.transitionEnd(track)
    await waitFor(() => expect(screen.getByLabelText('Add Sampler Box to Cart')).toBeTruthy())
  }

  it('builds both choosers and both add-on slots from their own sampler-*-choice/-addon tags', async () => {
    mockSamplerTags()
    renderMenu()
    await waitFor(() => expect(woo.fetchByTagSlug).toHaveBeenCalledWith('sampler-bread-choice'))
    expect(woo.fetchByTagSlug).toHaveBeenCalledWith('sampler-cracker-choice')
    expect(woo.fetchByTagSlug).toHaveBeenCalledWith('sampler-bread-addon')
    expect(woo.fetchByTagSlug).toHaveBeenCalledWith('sampler-cracker-addon')
    expect(woo.fetchProductBySlug).toHaveBeenCalledWith('sampler-box')
  })

  it('renders nothing for an add-on slot with no tagged products, without crashing the panel', async () => {
    mockSamplerTags() // both add-on slots default to []
    renderMenu()
    await openSamplerBox()

    expect(screen.getByText('Sourdough Mini Loaf')).toBeTruthy()
    expect(screen.getByText('Docs Mini Crackers')).toBeTruthy()
    expect(screen.queryByText(/^Add \(1\)/)).toBeNull()
  })

  it('toggling an add-on on and back off restores the pill', async () => {
    mockSamplerTags({ addonsBread: [ADDON] })
    renderMenu()
    await openSamplerBox()

    fireEvent.click(screen.getByLabelText('Add Sourdough Mini Loaf, +$6.00'))
    await waitFor(() =>
      expect(screen.getByLabelText('Decrease Sourdough Mini Loaf quantity')).toBeTruthy(),
    )

    fireEvent.click(screen.getByLabelText('Decrease Sourdough Mini Loaf quantity'))
    await waitFor(() =>
      expect(screen.getByLabelText('Add Sourdough Mini Loaf, +$6.00')).toBeTruthy(),
    )
  })

  it('choosing a bread and a cracker and adding an add-on adds the box and the add-on to the cart with the server-quoted total shown', async () => {
    mockSamplerTags({ addonsBread: [ADDON] })
    woo.fetchProductBySlug.mockImplementation(async (slug) =>
      slug === 'sampler-box' ? SAMPLER_BOX_PRODUCT : null,
    )
    vi.spyOn(quoteLib, 'fetchQuote').mockResolvedValue({
      ok: true,
      lines: [],
      subtotalFormatted: '$56.00',
      deliveryFormatted: '',
      discountFormatted: '',
      taxFormatted: '',
      totalFormatted: '$56.00',
      errors: [],
    })

    renderMenu()
    await openSamplerBox()

    fireEvent.click(screen.getByText('Sourdough Mini Loaf'))
    fireEvent.click(screen.getByText('Docs Mini Crackers'))
    fireEvent.click(screen.getByLabelText('Add Sourdough Mini Loaf, +$6.00'))

    // The bottom bar's figure is whatever the server quoted - never summed
    // in React - for exactly the staged box + add-on lines.
    await waitFor(() => expect(screen.getByText('$56.00')).toBeTruthy())
    expect(quoteLib.fetchQuote).toHaveBeenLastCalledWith(
      expect.objectContaining({
        lines: [
          { id: 50, qty: 1 },
          { id: 70, qty: 1 },
        ],
      }),
    )

    fireEvent.click(screen.getByLabelText('Add Sampler Box to Cart'))

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
      const boxLine = stored.find((l) => l.id === 50)
      const addonLine = stored.find((l) => l.id === 70)
      expect(boxLine).toBeTruthy()
      expect(boxLine.qty).toBe(1)
      expect(boxLine.options).toEqual({ bread: 'Sourdough Mini Loaf', cracker: 'Docs Mini Crackers' })
      // An add-on is an ordinary product line - bare id/qty, no options,
      // exactly like adding it stand-alone from a menu card would be.
      expect(addonLine).toBeTruthy()
      expect(addonLine.qty).toBe(1)
      expect(addonLine.options).toBeUndefined()
    })
  })

  it('a variable add-on (real catalogue: the crackers) prices from its first pack size and carries a variation id and size tag into the cart', async () => {
    const CRACKER_ADDON = product({
      id: 80,
      slug: 'docs-crackers',
      name: 'Docs Crackers',
      priceFormatted: '$7.00',
      packSizes: [
        { id: 81, name: '5oz', slug: '5oz', price: 7, priceFormatted: '$7.00', inStock: true, purchasable: true },
        { id: 82, name: '10oz', slug: '10oz', price: 12, priceFormatted: '$12.00', inStock: true, purchasable: true },
      ],
    })
    mockSamplerTags({ addonsCracker: [CRACKER_ADDON] })
    woo.fetchProductBySlug.mockImplementation(async (slug) =>
      slug === 'sampler-box' ? SAMPLER_BOX_PRODUCT : null,
    )
    vi.spyOn(quoteLib, 'fetchQuote').mockResolvedValue({
      ok: true,
      lines: [],
      subtotalFormatted: '$57.00',
      deliveryFormatted: '',
      discountFormatted: '',
      taxFormatted: '',
      totalFormatted: '$57.00',
      errors: [],
    })

    renderMenu()
    await openSamplerBox()

    // Prices from packSizes[0], not the parent's own priceFormatted.
    expect(screen.getByLabelText('Add Docs Crackers, +$7.00')).toBeTruthy()
    fireEvent.click(screen.getByLabelText('Add Docs Crackers, +$7.00'))
    await waitFor(() => expect(screen.getByLabelText('Decrease Docs Crackers quantity')).toBeTruthy())

    await waitFor(() =>
      expect(quoteLib.fetchQuote).toHaveBeenLastCalledWith(
        expect.objectContaining({
          lines: [
            { id: 50, qty: 1 },
            { id: 80, qty: 1, variationId: 81 },
          ],
        }),
      ),
    )

    fireEvent.click(screen.getByLabelText('Add Sampler Box to Cart'))

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
      const addonLine = stored.find((l) => l.id === 80)
      expect(addonLine).toBeTruthy()
      expect(addonLine.qty).toBe(1)
      expect(addonLine.variationId).toBe(81)
      // Same guard as the pack-size pills: an options.size tag so this can
      // never silently merge its quantity into a different pack size of the
      // same crackers already in the cart from the main menu.
      expect(addonLine.options).toEqual({ size: '5oz' })
    })
  })

  it('an add-on cart line can be removed again like any ordinary line', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { id: 50, qty: 1, name: 'Sampler Box', image: '', priceFormatted: '$50.00', options: { bread: 'Sourdough Mini Loaf', cracker: 'Docs Mini Crackers' } },
        { id: 70, qty: 1, name: 'Sourdough Mini Loaf', image: '', priceFormatted: '$6.00' },
      ]),
    )
    vi.spyOn(pickupLib, 'fetchPickupConfig').mockResolvedValue({ ok: true, stores: [] })
    vi.spyOn(quoteLib, 'fetchQuote').mockResolvedValue({
      ok: true,
      lines: [],
      subtotalFormatted: '$56.00',
      deliveryFormatted: '$0.00',
      discountFormatted: '$0.00',
      taxFormatted: '$0.00',
      totalFormatted: '$56.00',
      errors: [],
    })

    render(
      <MemoryRouter>
        <CartProvider>
          <Cart />
        </CartProvider>
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Sourdough Mini Loaf')).toBeTruthy())
    fireEvent.click(screen.getByLabelText('Remove Sourdough Mini Loaf from cart'))

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(stored.find((l) => l.id === 70)).toBeUndefined()
      expect(stored.find((l) => l.id === 50)).toBeTruthy()
    })
  })
})
