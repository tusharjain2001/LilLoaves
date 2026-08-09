import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Pickup from './Pickup.jsx'
import * as pickupLib from '../lib/pickup.js'

const PICKUP_STORE = {
  id: 'orange-county-store',
  name: 'Orange County Store',
  address: '1234 Example Ave, Orange County, CA',
  slots: [
    { start: '14:00', end: '14:30', label: '2:00 PM - 2:30 PM' },
    { start: '14:30', end: '15:00', label: '2:30 PM - 3:00 PM' },
  ],
  dates: [
    { date: '2026-08-09', weekday: 'Sunday', label: '9 Aug' },
    { date: '2026-08-16', weekday: 'Sunday', label: '16 Aug' },
  ],
}
const PICKUP_CONFIG = { ok: true, stores: [PICKUP_STORE] }

const renderPickup = () =>
  render(
    <MemoryRouter>
      <Pickup />
    </MemoryRouter>,
  )

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Pickup page - wired to the same /pickup config as the cart', () => {
  it('shows the real store name from config, not a hardcoded one', async () => {
    vi.spyOn(pickupLib, 'fetchPickupConfig').mockResolvedValue(PICKUP_CONFIG)
    renderPickup()

    expect(await screen.findByText('Orange County Store')).toBeTruthy()
  })

  it('renders real upcoming dates as pills and defaults to the first one selected', async () => {
    vi.spyOn(pickupLib, 'fetchPickupConfig').mockResolvedValue(PICKUP_CONFIG)
    renderPickup()

    const firstDate = await screen.findByText('9 Aug')
    expect(firstDate.closest('button').className).toMatch(/bg-taupe/)
    expect(screen.getByText('16 Aug')).toBeTruthy()
  })

  it('picking a date updates the selection', async () => {
    vi.spyOn(pickupLib, 'fetchPickupConfig').mockResolvedValue(PICKUP_CONFIG)
    renderPickup()

    const secondDate = await screen.findByText('16 Aug')
    fireEvent.click(secondDate)

    expect(secondDate.closest('button').className).toMatch(/bg-taupe/)
    expect(screen.getByText('9 Aug').closest('button').className).not.toMatch(/bg-taupe/)
  })

  it('the Pick Up Time tab shows real slot labels from config and defaults to the first one', async () => {
    vi.spyOn(pickupLib, 'fetchPickupConfig').mockResolvedValue(PICKUP_CONFIG)
    renderPickup()

    await screen.findByText('9 Aug')
    fireEvent.click(screen.getByText('Pick Up Time'))

    const firstSlot = await screen.findByText('2:00 PM - 2:30 PM')
    expect(firstSlot.closest('button').className).toMatch(/bg-taupe/)
    expect(screen.getByText('2:30 PM - 3:00 PM')).toBeTruthy()
  })

  it('the Pick Up Time header shows the chosen date\'s display label, never the raw machine date', async () => {
    vi.spyOn(pickupLib, 'fetchPickupConfig').mockResolvedValue(PICKUP_CONFIG)
    renderPickup()

    fireEvent.click(await screen.findByText('16 Aug'))
    fireEvent.click(screen.getByText('Pick Up Time'))

    // The label is styled uppercase via CSS (text-transform), so the actual
    // text node content is still "16 Aug" - assert that, and that the raw
    // ISO value never leaks into the DOM.
    expect(await screen.findAllByText('16 Aug')).not.toHaveLength(0)
    expect(screen.queryByText('2026-08-16')).toBeNull()
  })

  it('does not crash and shows pickup as unavailable when the owner has configured no stores', async () => {
    vi.spyOn(pickupLib, 'fetchPickupConfig').mockResolvedValue({ ok: true, stores: [] })
    renderPickup()

    expect(await screen.findByText(/not available/i)).toBeTruthy()
  })

  it('does not crash and shows pickup as unavailable when the configured store has no dates', async () => {
    vi.spyOn(pickupLib, 'fetchPickupConfig').mockResolvedValue({
      ok: true,
      stores: [{ ...PICKUP_STORE, dates: [] }],
    })
    renderPickup()

    expect(await screen.findByText(/not available/i)).toBeTruthy()
  })
})
