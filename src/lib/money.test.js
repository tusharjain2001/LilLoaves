import { minorToMajor, formatPrice } from './money.js'

const USD = {
  price: '2113',
  regular_price: '2113',
  sale_price: '2113',
  price_range: null,
  currency_code: 'USD',
  currency_symbol: '$',
  currency_minor_unit: 2,
  currency_decimal_separator: '.',
  currency_thousand_separator: ',',
  currency_prefix: '$',
  currency_suffix: '',
}

describe('minorToMajor', () => {
  it('converts a minor-unit string to major units', () => {
    expect(minorToMajor('2113', 2)).toBe(21.13)
  })

  it('handles zero-decimal currencies', () => {
    expect(minorToMajor('500', 0)).toBe(500)
  })

  it('returns 0 for junk rather than NaN', () => {
    expect(minorToMajor('', 2)).toBe(0)
    expect(minorToMajor(null, 2)).toBe(0)
    expect(minorToMajor('abc', 2)).toBe(0)
  })

  it('handles negative amounts', () => {
    expect(minorToMajor('-2113', 2)).toBe(-21.13)
    expect(minorToMajor('-500', 0)).toBe(-500)
  })
})

describe('formatPrice', () => {
  it('formats a simple price', () => {
    expect(formatPrice(USD)).toBe('$21.13')
  })

  it('groups thousands', () => {
    expect(formatPrice({ ...USD, price: '123456' })).toBe('$1,234.56')
    expect(formatPrice({ ...USD, price: '123456789' })).toBe('$1,234,567.89')
  })

  it('formats a whole amount with trailing zeros', () => {
    expect(formatPrice({ ...USD, price: '3900' })).toBe('$39.00')
  })

  it('accepts an explicit minor string, so regular_price can be formatted', () => {
    expect(formatPrice(USD, '2300')).toBe('$23.00')
  })

  it('honours a suffix currency', () => {
    const kr = { ...USD, currency_prefix: '', currency_suffix: ' kr', currency_decimal_separator: ',' }
    expect(formatPrice({ ...kr, price: '2113' })).toBe('21,13 kr')
  })

  it('formats zero-decimal currencies without fractional part', () => {
    expect(formatPrice({ ...USD, currency_minor_unit: 0, price: '500' })).toBe('$500')
    expect(formatPrice({ ...USD, currency_minor_unit: 0, price: '123456' })).toBe('$123,456')
  })

  it('formats negative prices with sign', () => {
    expect(formatPrice({ ...USD, price: '-2113' })).toBe('-$21.13')
  })
})
