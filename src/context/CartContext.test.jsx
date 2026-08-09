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

  it('setQty and remove without an options argument still target the plain (no-options) line by id, unchanged from before', () => {
    renderCart()
    act(() => cart.add(PRODUCT, 5))
    act(() => cart.setQty(13, 2))
    expect(cart.lines[0].qty).toBe(2)
    act(() => cart.remove(13))
    expect(cart.lines).toEqual([])
  })
})
