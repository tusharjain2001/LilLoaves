describe('test harness', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })

  it('has a DOM', () => {
    expect(typeof document).toBe('object')
  })
})
