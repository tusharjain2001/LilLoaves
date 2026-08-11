import { formatPrice } from './money.js'

/**
 * The client for /api/store?endpoint=quote — the only place a cart's line
 * items become a priced total. WooCommerce does the pricing; this module
 * only formats what it's told. No arithmetic on money happens here.
 *
 * The cart's display snapshot (name, image, priceFormatted) is never sent —
 * only {id, qty}. The server re-prices from its own product data regardless,
 * so a tampered snapshot buys nothing, but sending it invites someone to
 * think it matters.
 */

const ENDPOINT = '/api/store?endpoint=quote'

function blankQuote(ok) {
  return {
    ok,
    lines: [],
    subtotalFormatted: '',
    deliveryFormatted: '',
    discountFormatted: '',
    taxFormatted: '',
    totalFormatted: '',
    errors: [],
  }
}

export async function fetchQuote({ lines, fulfilment, postcode, coupon, signal }) {
  // Nothing to price, and nothing to ask the server about. This is a real
  // zero, not a failure, so ok stays true.
  if (!lines?.length) return blankQuote(true)

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // variation_id selects a pack size (Muffins/Cookies/Crackers); a
        // plain product (bread) has no variationId on its cart line, and
        // omitting the field entirely is exactly the pre-pack-size contract.
        items: lines.map((l) =>
          l.variationId ? { id: l.id, qty: l.qty, variation_id: l.variationId } : { id: l.id, qty: l.qty },
        ),
        fulfilment,
        postcode,
        coupon,
      }),
      signal,
    })
    // A non-200 body is a proxy/upstream error shape, not a quote — do not
    // parse it as one.
    if (!response.ok) return blankQuote(false)

    const data = await response.json()
    return {
      ok: true,
      // (id, variationId) is the line's real key once pack sizes exist - id
      // alone can't tell "1 x Single Cookie" from "1 x Box of 6" of the same
      // product apart, since both share the same parent id. variationId is 0
      // for a simple product (bread), matching the backend's own contract.
      lines: data.lines.map((l) => ({
        id: l.id,
        variationId: l.variation_id ?? 0,
        qty: l.qty,
        totalFormatted: formatPrice(data.currency, l.total),
        unitFormatted: formatPrice(data.currency, l.unit),
      })),
      subtotalFormatted: formatPrice(data.currency, data.subtotal),
      deliveryFormatted: formatPrice(data.currency, data.delivery),
      discountFormatted: formatPrice(data.currency, data.discount),
      taxFormatted: formatPrice(data.currency, data.tax),
      totalFormatted: formatPrice(data.currency, data.total),
      errors: data.errors ?? [],
    }
  } catch {
    // Network failure or an aborted signal both land here. Either way the
    // caller must not see a stale or wrong number — never throw, just say
    // "calculated at checkout".
    return blankQuote(false)
  }
}
