/**
 * The client for /api/store?endpoint=pickup — the WooCommerce > Fulfilment
 * config (stores, their upcoming collection dates and time slots), so Cart.jsx
 * and Pickup.jsx render real data instead of hardcoded dates.
 *
 * The server (ll_pickup_config / ll_store_upcoming_dates / ll_store_slots in
 * the backend bridge plugin) is the only place dates and slots get computed —
 * every date's `label` and every slot's `label` arrive pre-formatted exactly
 * as the design wants them shown. No date maths happens here or in any caller.
 */

const ENDPOINT = '/api/store?endpoint=pickup'

function blankConfig(ok) {
  return { ok, stores: [] }
}

function normalizeStore(raw) {
  return {
    id: raw.id,
    name: raw.name,
    address: raw.address ?? '',
    slots: raw.slots ?? [],
    dates: raw.dates ?? [],
  }
}

export async function fetchPickupConfig({ signal } = {}) {
  try {
    const response = await fetch(ENDPOINT, { signal })
    // A non-200 body is a proxy/upstream error shape, not real config - do
    // not parse it as one. Same "fail to empty, never throw" contract as
    // fetchQuote: the caller must be able to show "pickup unavailable"
    // rather than crash.
    if (!response.ok) return blankConfig(false)

    const data = await response.json()
    return { ok: true, stores: (data.stores ?? []).map(normalizeStore) }
  } catch {
    return blankConfig(false)
  }
}

/**
 * The exact string the backend's ll_pickup_slot_valid() checks a chosen slot
 * against (`$s['start'] . '-' . $s['end'] === $slot`). Always send this
 * machine value at checkout - never the display label.
 */
export function slotValue(slot) {
  return `${slot.start}-${slot.end}`
}

/**
 * "Choose a Sunday to pick up your order" when every upcoming date falls on
 * the same weekday - the common case, and the only one Figma drew copy for.
 * Falls back to a generic sentence if the store is ever configured with more
 * than one collection weekday, so this never claims a single day that isn't
 * true of every date on offer. Reads `weekday` straight off the server's
 * data; no day-of-week is ever computed here.
 */
export function pickupDayCopy(dates) {
  const weekdays = [...new Set(dates.map((d) => d.weekday))]
  return weekdays.length === 1
    ? `Choose a ${weekdays[0]} to pick up your order`
    : 'Choose a date to pick up your order'
}
