/* eslint-disable react-hooks/globals */
import { act, render, screen } from '@testing-library/react'
import { CartProvider, useCart } from './CartContext.jsx'

const PRODUCT = { id: 13, name: 'Sour Dough', priceFormatted: '$21.13', images: [{ src: 'a.jpg' }] }
const OTHER = { id: 14, name: 'Danish Pastries', priceFormatted: '$23.00', images: [] }

let cart
function Probe() {
  cart = useCart()
  return <span data-testid="count">{cart.count}</span>
}

const renderCart = () => render(<CartProvider><Probe /></CartProvider>)

beforeEach(() => {
  localStorage.clear()
  cart = null
})

describe('CartContext', () => {
  it('starts empty', () => {
    renderCart()
    expect(cart.lines).toEqual([])
    expect(cart.isEmpty).toBe(true)
    expect(cart.count).toBe(0)
  })

  it('adds a product with its display snapshot', () => {
    renderCart()
    act(() => cart.add(PRODUCT))
    expect(cart.lines).toEqual([
      { id: 13, qty: 1, name: 'Sour Dough', image: 'a.jpg', priceFormatted: '$21.13' },
    ])
  })

  it('increments instead of duplicating', () => {
    renderCart()
    act(() => cart.add(PRODUCT))
    act(() => cart.add(PRODUCT, 2))
    expect(cart.lines).toHaveLength(1)
    expect(cart.lines[0].qty).toBe(3)
  })

  it('counts total quantity, not line count', () => {
    renderCart()
    act(() => cart.add(PRODUCT, 2))
    act(() => cart.add(OTHER, 3))
    expect(cart.count).toBe(5)
  })

  it('tolerates a product with no image', () => {
    renderCart()
    act(() => cart.add(OTHER))
    expect(cart.lines[0].image).toBe('')
  })

  it('sets a quantity and removes the line at zero', () => {
    renderCart()
    act(() => cart.add(PRODUCT, 5))
    act(() => cart.setQty(13, 2))
    expect(cart.lines[0].qty).toBe(2)
    act(() => cart.setQty(13, 0))
    expect(cart.lines).toEqual([])
  })

  it('removes and clears', () => {
    renderCart()
    act(() => cart.add(PRODUCT))
    act(() => cart.add(OTHER))
    act(() => cart.remove(13))
    expect(cart.lines.map((l) => l.id)).toEqual([14])
    act(() => cart.clear())
    expect(cart.isEmpty).toBe(true)
  })

  it('refreshes a stale display price without touching quantity', () => {
    renderCart()
    act(() => cart.add(PRODUCT, 3))
    act(() => cart.syncSnapshot(13, '$25.00'))
    expect(cart.lines[0].priceFormatted).toBe('$25.00')
    expect(cart.lines[0].qty).toBe(3)
  })

  it('persists across a remount', () => {
    const first = renderCart()
    act(() => cart.add(PRODUCT, 2))
    first.unmount()
    renderCart()
    expect(cart.lines[0]).toMatchObject({ id: 13, qty: 2 })
  })

  it('survives corrupt localStorage', () => {
    localStorage.setItem('lilloaves:cart', '{not json')
    renderCart()
    expect(cart.lines).toEqual([])
  })

  it('discards malformed persisted lines', () => {
    localStorage.setItem('lilloaves:cart', JSON.stringify([{ nope: true }, { id: 13, qty: 2 }]))
    renderCart()
    expect(cart.lines).toHaveLength(1)
    expect(cart.lines[0].id).toBe(13)
  })

  it('renders the count into the tree', () => {
    renderCart()
    act(() => cart.add(PRODUCT, 4))
    expect(screen.getByTestId('count').textContent).toBe('4')
  })
})

const LUNCH_BOX = { id: 15, name: 'Lunch Box', priceFormatted: '$39.00', images: [] }

describe('CartContext line options (e.g. Lunch Box picks)', () => {
  it('does not add an options field to a line added without one', () => {
    renderCart()
    act(() => cart.add(PRODUCT))
    expect(cart.lines[0]).toEqual({
      id: 13,
      qty: 1,
      name: 'Sour Dough',
      image: 'a.jpg',
      priceFormatted: '$21.13',
    })
  })

  it('stores the options object on the line', () => {
    renderCart()
    act(() => cart.add(LUNCH_BOX, 1, { bread: 'Sour Dough', cracker: '', dessert: '' }))
    expect(cart.lines[0].options).toEqual({ bread: 'Sour Dough', cracker: '', dessert: '' })
  })

  it('keeps two lines with the same product id but different options separate, not collapsed', () => {
    renderCart()
    act(() => cart.add(LUNCH_BOX, 1, { bread: 'Sour Dough', cracker: '', dessert: '' }))
    act(() => cart.add(LUNCH_BOX, 1, { bread: 'Japanese Milk Bread', cracker: '', dessert: '' }))
    expect(cart.lines).toHaveLength(2)
    expect(cart.count).toBe(2)
  })

  it('increments qty instead of duplicating when the same product is added with identical options', () => {
    renderCart()
    act(() => cart.add(LUNCH_BOX, 1, { bread: 'Sour Dough', cracker: '', dessert: '' }))
    act(() => cart.add(LUNCH_BOX, 2, { bread: 'Sour Dough', cracker: '', dessert: '' }))
    expect(cart.lines).toHaveLength(1)
    expect(cart.lines[0].qty).toBe(3)
  })

  it('setQty updates only the line matching both id and options', () => {
    renderCart()
    act(() => cart.add(LUNCH_BOX, 1, { bread: 'Sour Dough' }))
    act(() => cart.add(LUNCH_BOX, 1, { bread: 'Japanese Milk Bread' }))
    act(() => cart.setQty(15, 5, { bread: 'Sour Dough' }))

    const sourDough = cart.lines.find((l) => l.options.bread === 'Sour Dough')
    const milkBread = cart.lines.find((l) => l.options.bread === 'Japanese Milk Bread')
    expect(sourDough.qty).toBe(5)
    expect(milkBread.qty).toBe(1)
  })

  it('remove drops only the line matching both id and options', () => {
    renderCart()
    act(() => cart.add(LUNCH_BOX, 1, { bread: 'Sour Dough' }))
    act(() => cart.add(LUNCH_BOX, 1, { bread: 'Japanese Milk Bread' }))
    act(() => cart.remove(15, { bread: 'Sour Dough' }))

    expect(cart.lines).toHaveLength(1)
    expect(cart.lines[0].options.bread).toBe('Japanese Milk Bread')
  })

  it('syncSnapshot refreshes every line sharing a product id regardless of options - price never varies by option', () => {
    renderCart()
    act(() => cart.add(LUNCH_BOX, 1, { bread: 'Sour Dough' }))
    act(() => cart.add(LUNCH_BOX, 1, { bread: 'Japanese Milk Bread' }))
    act(() => cart.syncSnapshot(15, '$42.00'))
    expect(cart.lines.every((l) => l.priceFormatted === '$42.00')).toBe(true)
  })

  it('setQty and remove without an options argument still target the plain (no-options) line by id, unchanged from before', () => {
    renderCart()
    act(() => cart.add(PRODUCT, 5))
    act(() => cart.setQty(13, 2))
    expect(cart.lines[0].qty).toBe(2)
    act(() => cart.remove(13))
    expect(cart.lines).toEqual([])
  })
})

// Pack sizes (Muffins/Cookies/Crackers) reuse the same options mechanism the
// Lunch Box already exercises above - a pack size's name lives in `options`
// (so the existing lineKey/optionSummary machinery separates and displays
// the lines with zero new code), and its numeric variation id rides along as
// its own field, used only for pricing (/quote, checkout), never for keying.
const COOKIES = { id: 88, name: 'Choco Chip Cookies', priceFormatted: '$5.00', images: [] }

describe('CartContext pack-size lines (variationId)', () => {
  it('stores variationId on the line alongside its display options', () => {
    renderCart()
    act(() => cart.add(COOKIES, 1, { size: 'Single Cookie' }, 89))
    expect(cart.lines[0]).toMatchObject({
      id: 88,
      variationId: 89,
      options: { size: 'Single Cookie' },
      priceFormatted: '$5.00',
    })
  })

  it('does not add a variationId field when none is given (breads, Lunch Box unaffected)', () => {
    renderCart()
    act(() => cart.add(PRODUCT))
    expect(cart.lines[0].variationId).toBeUndefined()
  })

  it('keeps two pack sizes of the same product as separate, independently removable lines', () => {
    renderCart()
    act(() => cart.add(COOKIES, 1, { size: 'Single Cookie' }, 89))
    act(() => cart.add({ ...COOKIES, priceFormatted: '$20.00' }, 1, { size: 'Box of 6' }, 90))
    expect(cart.lines).toHaveLength(2)
    expect(cart.count).toBe(2)

    act(() => cart.remove(88, { size: 'Single Cookie' }))
    expect(cart.lines).toHaveLength(1)
    expect(cart.lines[0].variationId).toBe(90)
  })

  it('setQty preserves variationId on the updated line', () => {
    renderCart()
    act(() => cart.add(COOKIES, 1, { size: 'Box of 6' }, 90))
    act(() => cart.setQty(88, 3, { size: 'Box of 6' }))
    expect(cart.lines[0]).toMatchObject({ qty: 3, variationId: 90 })
  })

  it('adding the same pack size again increments qty rather than duplicating', () => {
    renderCart()
    act(() => cart.add(COOKIES, 1, { size: 'Single Cookie' }, 89))
    act(() => cart.add(COOKIES, 2, { size: 'Single Cookie' }, 89))
    expect(cart.lines).toHaveLength(1)
    expect(cart.lines[0].qty).toBe(3)
    expect(cart.lines[0].variationId).toBe(89)
  })

  // Regression: found live in the browser, not by reading code. syncSnapshot
  // used to match by bare id only (correct for the Lunch Box, whose price
  // never varies by option), so quoting a Single Cookie line overwrote a
  // Box of 6 line's displayed price too, since both share product id 88.
  it('syncSnapshot updates only the line matching (id, variationId), not every pack size of the product', () => {
    renderCart()
    act(() => cart.add(COOKIES, 1, { size: 'Single Cookie' }, 89))
    act(() => cart.add({ ...COOKIES, priceFormatted: '$20.00' }, 1, { size: 'Box of 6' }, 90))

    act(() => cart.syncSnapshot(88, '$5.00', 89))

    const single = cart.lines.find((l) => l.variationId === 89)
    const box = cart.lines.find((l) => l.variationId === 90)
    expect(single.priceFormatted).toBe('$5.00')
    expect(box.priceFormatted).toBe('$20.00')
  })

  it('syncSnapshot still refreshes every options-variant of a plain (no-variationId) line, e.g. the Lunch Box', () => {
    const LUNCH_BOX = { id: 15, name: 'Lunch Box', priceFormatted: '$39.00', images: [] }
    renderCart()
    act(() => cart.add(LUNCH_BOX, 1, { bread: 'Sour Dough' }))
    act(() => cart.add(LUNCH_BOX, 1, { bread: 'Japanese Milk Bread' }))
    act(() => cart.syncSnapshot(15, '$42.00'))
    expect(cart.lines.every((l) => l.priceFormatted === '$42.00')).toBe(true)
  })
})
