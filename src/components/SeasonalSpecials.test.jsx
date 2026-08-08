import { render, screen } from '@testing-library/react'
import SeasonalSpecials from './SeasonalSpecials.jsx'

const ITEMS = [
  { name: 'Danish Pastries', price: '$23.00', img: 'danish.jpg' },
  { name: 'Croissants', price: '$23.00', img: 'croissants.jpg' },
]

describe('SeasonalSpecials', () => {
  it('renders the items it is given', () => {
    render(<SeasonalSpecials specials={ITEMS} />)
    expect(screen.getByText('Danish Pastries')).toBeTruthy()
    expect(screen.getByText('Croissants')).toBeTruthy()
  })

  it('renders nothing when there are no specials', () => {
    const { container } = render(<SeasonalSpecials specials={[]} />)
    expect(container.textContent).not.toContain('Danish')
  })
})
