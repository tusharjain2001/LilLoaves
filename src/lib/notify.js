/**
 * The client for the order-notification service — the two confirmation emails
 * sent when a collection customer presses Place Order on /pickup.
 *
 * That service is its own Vercel deployment, built from the LilLoaves-backend
 * repo (`server.js`, `POST /api/notify`). It is a separate origin, not a
 * function under /api on this domain, so the request is genuinely
 * cross-origin: the service allowlists this storefront's origin by name in
 * its own ALLOWED_ORIGINS, and returns 403 to anything else.
 *
 * Like lib/quote.js, this sends product ids and quantities only. It sends no
 * prices, no product names and no display labels: the service re-prices the
 * basket through the bridge plugin's /quote and reads the catalogue's own
 * names back from WordPress, so nothing here decides what the bakery is told
 * they sold.
 *
 * Unlike fetchQuote, this does NOT fail silently to a blank result. There is
 * no WooCommerce order behind the /pickup flow yet, so these two emails are
 * the only record the order happened — if they don't send, the customer must
 * be told, not shown a confirmation screen for an order nobody received.
 */

/**
 * Hardcoded on purpose, not read from a VITE_ variable.
 *
 * The URL is public either way — the browser has to reach it, and nothing
 * secret lives there (the mailbox credentials and the bridge secret are
 * environment variables on that service's own Vercel project). And a VITE_
 * var would buy nothing: Vite bakes those in at build time too, so changing
 * one still needs a redeploy. A constant just removes the failure mode where
 * an unset variable interpolates to the literal string "undefined" and the
 * app posts to "undefined/api/notify" — which VITE_WP_CHECKOUT_URL shipped
 * once. Same module-level ENDPOINT shape as lib/quote.js and lib/pickup.js.
 */
const ENDPOINT = 'https://lil-loaves-backend.vercel.app/api/notify'

export async function sendOrderNotification({ lines, contact, pickup, coupon = '', signal }) {
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Same item shape lib/quote.js sends - variation_id selects a pack
        // size, and is omitted entirely for a simple product.
        items: lines.map((l) =>
          l.variationId ? { id: l.id, qty: l.qty, variation_id: l.variationId } : { id: l.id, qty: l.qty },
        ),
        contact,
        // The store's id and the date's/slot's machine values - what the
        // backend validates against, never a display label.
        pickup,
        coupon,
      }),
      signal,
    })

    const data = await response.json().catch(() => null)
    if (!response.ok) return { ok: false, error: data?.error ?? '' }
    return { ok: true, error: '' }
  } catch {
    return { ok: false, error: '' }
  }
}
