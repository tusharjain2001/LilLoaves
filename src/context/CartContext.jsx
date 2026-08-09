/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

/**
 * The cart holds product ids and quantities. Name, image and formatted price
 * are a display snapshot so the cart renders instantly without a fetch — they
 * are never sent to the server. WooCommerce re-prices everything from its own
 * data at quote and at checkout, so a tampered snapshot buys nothing.
 *
 * The snapshot can go stale: a cart persists for days and the bakery may
 * change a price meanwhile. syncSnapshot lets the Cart page refresh the
 * displayed unit price from the authoritative quote rather than showing a
 * stale figure beside a fresh total.
 */

const STORAGE_KEY = 'lilloaves:cart'
const CartContext = createContext(null)

// Two lines of the same product id are the same line only if their options
// also match (e.g. two Lunch Boxes with different bread/cracker/dessert
// picks must stay separate). `Object.keys(...).sort()` as the JSON.stringify
// replacer pins key order so two equal-but-differently-ordered option
// objects still hash the same.
function lineKey(id, options) {
  return options ? `${id}:${JSON.stringify(options, Object.keys(options).sort())}` : id
}

function isValidLine(line) {
  return (
    line &&
    typeof line === 'object' &&
    Number.isFinite(line.id) &&
    Number.isFinite(line.qty) &&
    line.qty > 0
  )
}

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter(isValidLine) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [lines, setLines] = useState(readStored)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
    } catch {
      // Private mode or quota exceeded. The cart still works for this session.
    }
  }, [lines])

  const value = useMemo(() => {
    const add = (product, qty = 1, options) =>
      setLines((prev) => {
        const key = lineKey(product.id, options)
        const existing = prev.find((l) => lineKey(l.id, l.options) === key)
        if (existing) {
          return prev.map((l) => (lineKey(l.id, l.options) === key ? { ...l, qty: l.qty + qty } : l))
        }
        return [
          ...prev,
          {
            id: product.id,
            qty,
            name: product.name,
            image: product.images?.[0]?.src ?? '',
            priceFormatted: product.priceFormatted,
            ...(options ? { options } : {}),
          },
        ]
      })

    const setQty = (id, qty, options) =>
      setLines((prev) => {
        const key = lineKey(id, options)
        return qty <= 0
          ? prev.filter((l) => lineKey(l.id, l.options) !== key)
          : prev.map((l) => (lineKey(l.id, l.options) === key ? { ...l, qty } : l))
      })

    const syncSnapshot = (id, priceFormatted) =>
      setLines((prev) =>
        prev.map((l) => (l.id === id ? { ...l, priceFormatted } : l)),
      )

    const remove = (id, options) => {
      const key = lineKey(id, options)
      setLines((prev) => prev.filter((l) => lineKey(l.id, l.options) !== key))
    }
    const clear = () => setLines([])
    const count = lines.reduce((sum, l) => sum + l.qty, 0)

    return { lines, add, setQty, remove, clear, syncSnapshot, count, isEmpty: lines.length === 0 }
  }, [lines])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside a CartProvider')
  return context
}
