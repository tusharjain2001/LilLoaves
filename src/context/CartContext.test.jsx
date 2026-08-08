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
