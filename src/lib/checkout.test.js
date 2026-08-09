import { splitName, buildCheckoutToken, submitCheckout, checkoutUrl } from './checkout.js'

/**
 * submitCheckout does a top-level form POST straight to WordPress, not a
 * fetch() — a fetch-built cart lives in a third-party cookie from the React
 * origin, which Safari/Firefox block by default. Every test here asserts
 * against the real <form> DOM submitCheckout builds, and that fetch is
 * never touched.
 */

const LINES = [
  { id: 13, qty: 2, name: 'Sour Dough', image: 'a.jpg', priceFormatted: '$21.13' },
]

const DELIVERY_ARGS = {
  lines: LINES,
  fulfilment: 'delivery',
  token: 'tok-1',
  coupon: '',
  email: 'ada@example.com',
  phone: '5551234567',
  fullName: 'Ada Lovelace',
  address1: '123 Main St',
  address2: 'Apt 4',
  city: 'Orange',
  state: 'CA',
  postcode: '92868',
}

const PICKUP_ARGS = {
  lines: LINES,
  fulfilment: 'pickup',
  token: 'tok-2',
  coupon: 'LOAF10',
  email: 'ada@example.com',
  phone: '5551234567',
  fullName: 'Ada Lovelace',
  pickupStore: 'Orange County Store',
  pickupDate: '9 Aug',
  pickupSlot: '10:00 AM',
}

function getForm() {
  return document.querySelector('form')
}

function fieldValue(form, name) {
  return form.querySelector(`input[name="${name}"]`)?.value
}

beforeEach(() => {
  vi.stubEnv('VITE_WP_CHECKOUT_URL', 'https://wp.test')
  document.body.innerHTML = ''
  global.fetch = vi.fn()
  HTMLFormElement.prototype.submit = vi.fn()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('submitCheckout', () => {
  it('builds a top-level form POST to the WordPress admin-post endpoint', () => {
    submitCheckout(DELIVERY_ARGS)

    const form = getForm()
    expect(form).toBeTruthy()
    expect(form.method.toUpperCase()).toBe('POST')
    expect(form.action).toBe('https://wp.test/wp-admin/admin-post.php')
  })

  it('appends the form to the body and submits it, never calling fetch', () => {
    submitCheckout(DELIVERY_ARGS)

    const form = getForm()
    expect(document.body.contains(form)).toBe(true)
    expect(form.submit).toHaveBeenCalledTimes(1)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('includes every contracted field for a delivery order, with ids/qty only in items', () => {
    submitCheckout(DELIVERY_ARGS)
    const form = getForm()

    expect(fieldValue(form, 'action')).toBe('ll_handoff')
    expect(JSON.parse(fieldValue(form, 'items'))).toEqual([{ id: 13, qty: 2 }])
    expect(fieldValue(form, 'fulfilment')).toBe('delivery')
    expect(fieldValue(form, 'token')).toBe('tok-1')
    expect(fieldValue(form, 'coupon')).toBe('')
    expect(fieldValue(form, 'email')).toBe('ada@example.com')
    expect(fieldValue(form, 'phone')).toBe('5551234567')
    expect(fieldValue(form, 'first_name')).toBe('Ada')
    expect(fieldValue(form, 'last_name')).toBe('Lovelace')
    expect(fieldValue(form, 'address_1')).toBe('123 Main St')
    expect(fieldValue(form, 'address_2')).toBe('Apt 4')
    expect(fieldValue(form, 'city')).toBe('Orange')
    expect(fieldValue(form, 'state')).toBe('CA')
    expect(fieldValue(form, 'postcode')).toBe('92868')
  })

  it('includes pickup fields, not address fields, for a pickup order', () => {
    submitCheckout(PICKUP_ARGS)
    const form = getForm()

    expect(fieldValue(form, 'fulfilment')).toBe('pickup')
    expect(fieldValue(form, 'pickup_store')).toBe('Orange County Store')
    expect(fieldValue(form, 'pickup_date')).toBe('9 Aug')
    expect(fieldValue(form, 'pickup_slot')).toBe('10:00 AM')
    expect(fieldValue(form, 'coupon')).toBe('LOAF10')
    expect(form.querySelector('input[name="address_1"]')).toBeNull()
    expect(form.querySelector('input[name="city"]')).toBeNull()
    expect(form.querySelector('input[name="postcode"]')).toBeNull()
  })

  it('never sends a price, product name, or image', () => {
    submitCheckout(DELIVERY_ARGS)
    const form = getForm()

    const payload = [...form.querySelectorAll('input')].map((i) => i.value).join(' ')
    expect(payload).not.toMatch(/Sour Dough|a\.jpg|21\.13/)
  })

  it('carries a line-level options object (e.g. Lunch Box picks) in the items payload', () => {
    const linesWithOptions = [
      {
        id: 15,
        qty: 1,
        name: 'Lunch Box',
        priceFormatted: '$39.00',
        options: { bread: 'Sour Dough', cracker: '', dessert: '' },
      },
      { id: 13, qty: 2, name: 'Sour Dough', image: 'a.jpg', priceFormatted: '$21.13' },
    ]
    submitCheckout({ ...DELIVERY_ARGS, lines: linesWithOptions })
    const form = getForm()

    expect(JSON.parse(fieldValue(form, 'items'))).toEqual([
      { id: 15, qty: 1, options: { bread: 'Sour Dough', cracker: '', dessert: '' } },
      { id: 13, qty: 2 },
    ])
  })
})

describe('buildCheckoutToken', () => {
  const base = { lines: LINES, fulfilment: 'delivery', postcode: '92868', coupon: '' }

  it('is the same for an unchanged cart state across repeated calls', () => {
    expect(buildCheckoutToken(base)).toBe(buildCheckoutToken({ ...base }))
  })

  it('changes when an item quantity changes', () => {
    const changed = { ...base, lines: [{ ...LINES[0], qty: 3 }] }
    expect(buildCheckoutToken(base)).not.toBe(buildCheckoutToken(changed))
  })

  it('changes when fulfilment changes', () => {
    expect(buildCheckoutToken(base)).not.toBe(buildCheckoutToken({ ...base, fulfilment: 'pickup' }))
  })

  it('changes when postcode changes', () => {
    expect(buildCheckoutToken(base)).not.toBe(buildCheckoutToken({ ...base, postcode: '90210' }))
  })

  it('changes when the coupon changes', () => {
    expect(buildCheckoutToken(base)).not.toBe(buildCheckoutToken({ ...base, coupon: 'LOAF10' }))
  })
})

describe('splitName', () => {
  it('splits the first word as first name and the remainder as last name', () => {
    expect(splitName('Ada Lovelace')).toEqual({ firstName: 'Ada', lastName: 'Lovelace' })
  })

  it('handles a middle name as part of the last name', () => {
    expect(splitName('Ada Marie Lovelace')).toEqual({ firstName: 'Ada', lastName: 'Marie Lovelace' })
  })

  it('leaves last name empty for a single-word name', () => {
    expect(splitName('Cher')).toEqual({ firstName: 'Cher', lastName: '' })
  })

  it('handles empty or missing input without throwing', () => {
    expect(splitName('')).toEqual({ firstName: '', lastName: '' })
    expect(splitName()).toEqual({ firstName: '', lastName: '' })
  })
})

describe('checkoutUrl', () => {
  const original = import.meta.env.VITE_WP_CHECKOUT_URL

  afterEach(() => {
    import.meta.env.VITE_WP_CHECKOUT_URL = original
  })

  it('builds the handoff URL from the configured origin', () => {
    import.meta.env.VITE_WP_CHECKOUT_URL = 'https://shop.example.com'
    expect(checkoutUrl()).toBe('https://shop.example.com/wp-admin/admin-post.php')
  })

  it('tolerates a trailing slash rather than doubling it', () => {
    import.meta.env.VITE_WP_CHECKOUT_URL = 'https://shop.example.com/'
    expect(checkoutUrl()).toBe('https://shop.example.com/wp-admin/admin-post.php')
  })

  it('returns null when the variable is missing from the build', () => {
    import.meta.env.VITE_WP_CHECKOUT_URL = ''
    expect(checkoutUrl()).toBeNull()
  })

  // Vite interpolates an unset VITE_ var into the literal string "undefined".
  // That shipped once and navigated customers to /undefined/wp-admin/admin-post.php.
  it('returns null for the literal string "undefined"', () => {
    import.meta.env.VITE_WP_CHECKOUT_URL = 'undefined'
    expect(checkoutUrl()).toBeNull()
  })

  it('does not submit a form when the URL is unusable', () => {
    import.meta.env.VITE_WP_CHECKOUT_URL = ''
    const before = document.querySelectorAll('form').length
    const sent = submitCheckout({ lines: [{ id: 13, qty: 1 }], fulfilment: 'pickup', token: 't' })
    expect(sent).toBe(false)
    expect(document.querySelectorAll('form').length).toBe(before)
  })
})
