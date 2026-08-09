/**
 * Hands the cart off to WordPress as a genuine top-level form POST, not a
 * fetch(). A fetch-built cart lives in a third-party cookie from the React
 * origin, which Safari and Firefox block by default — the cart would
 * intermittently come up empty at checkout. A top-level navigation is
 * always first-party, so this builds a <form>, appends it to the body,
 * submits it, and leaves it: the page is navigating away.
 *
 * The POST field contract is pinned against Task 7's handler
 * (LilLoaves-backend/mu-plugins/lil-loaves-bridge.php, ll_handoff()) — a
 * mismatched field name silently vanishes server-side instead of erroring.
 * Only {id, qty} ever leaves the browser for cart lines; no price, name or
 * image is ever in this payload, because the server re-prices everything
 * from its own product data regardless of what's sent.
 */

const HANDOFF_ACTION = 'll_handoff'

/** "Ada Marie Lovelace" -> { firstName: "Ada", lastName: "Marie Lovelace" } */
export function splitName(fullName = '') {
  const trimmed = (fullName ?? '').trim()
  if (!trimmed) return { firstName: '', lastName: '' }
  const [firstName, ...rest] = trimmed.split(/\s+/)
  return { firstName, lastName: rest.join(' ') }
}

/**
 * Derived once per cart state — item id:qty pairs, fulfilment, postcode and
 * coupon — not per click. Two clicks of a double-click on an unchanged cart
 * must carry the same token, or the server's "have I seen this token"
 * idempotency guard never fires. Callers must memoize this on those same
 * inputs (see Cart.jsx) rather than calling it fresh inside a click handler.
 *
 * A deterministic string is enough: the server only ever checks "have I
 * seen this exact token before" (it hashes it itself), so there is nothing
 * to gain from hashing client-side too.
 */
export function buildCheckoutToken({ lines, fulfilment, postcode, coupon }) {
  const itemsKey = lines.map((l) => `${l.id}:${l.qty}`).join(',')
  return [itemsKey, fulfilment, postcode || '', coupon || ''].join('|')
}

export function submitCheckout({
  lines,
  fulfilment,
  token,
  coupon,
  email,
  phone,
  fullName,
  address1,
  address2,
  city,
  state,
  postcode,
  pickupStore,
  pickupDate,
  pickupSlot,
}) {
  const { firstName, lastName } = splitName(fullName)

  const fields = {
    action: HANDOFF_ACTION,
    items: JSON.stringify(lines.map((l) => ({ id: l.id, qty: l.qty }))),
    fulfilment,
    token,
    coupon: coupon || '',
    email: email || '',
    phone: phone || '',
    first_name: firstName,
    last_name: lastName,
    ...(fulfilment === 'pickup'
      ? {
          pickup_store: pickupStore || '',
          pickup_date: pickupDate || '',
          pickup_slot: pickupSlot || '',
        }
      : {
          address_1: address1 || '',
          address_2: address2 || '',
          city: city || '',
          state: state || '',
          postcode: postcode || '',
        }),
  }

  const form = document.createElement('form')
  form.method = 'POST'
  form.action = `${import.meta.env.VITE_WP_CHECKOUT_URL}/wp-admin/admin-post.php`
  form.style.display = 'none'

  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = value
    form.appendChild(input)
  }

  document.body.appendChild(form)
  form.submit()
}
