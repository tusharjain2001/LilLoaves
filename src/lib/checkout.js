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

/**
 * Vite bakes VITE_ variables in at build time. If VITE_WP_CHECKOUT_URL is not
 * set in the deploy environment, template interpolation yields the literal
 * string "undefined" and the browser resolves "undefined/wp-admin/admin-post.php"
 * against our own origin — the customer lands on a 405 with no idea why.
 * That shipped once. Fail here instead, so the Cart can say something useful
 * and the cart survives.
 */
export function checkoutUrl() {
  const base = import.meta.env.VITE_WP_CHECKOUT_URL
  if (!base || base === 'undefined') return null
  return `${base.replace(/\/$/, '')}/wp-admin/admin-post.php`
}

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
  // variationId folded in: id:qty alone can't tell two pack sizes of one
  // product apart (both share the same parent id), so without it a Single
  // Cookie and a Box of 6 in the same cart state would collapse onto the
  // same token.
  const itemsKey = lines.map((l) => `${l.id}:${l.variationId ?? 0}:${l.qty}`).join(',')
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
  const action = checkoutUrl()
  if (!action) return false

  const { firstName, lastName } = splitName(fullName)

  const fields = {
    action: HANDOFF_ACTION,
    // `variation_id` selects a pack size and is read/validated server-side
    // (ll_validate_variation()) exactly like `id`/`qty`. `options` is a
    // separate, display-only field the handler still only reads `id`/`qty`/
    // `variation_id` from (see the Lunch Box note this comment replaces) -
    // it's sent anyway so that follow-up work has real data to read.
    items: JSON.stringify(
      lines.map((l) => ({
        id: l.id,
        qty: l.qty,
        ...(l.options ? { options: l.options } : {}),
        ...(l.variationId ? { variation_id: l.variationId } : {}),
      })),
    ),
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
  form.action = action
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
  return true
}
