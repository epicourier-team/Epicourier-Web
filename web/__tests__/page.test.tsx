import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import Page from '../src/app/page'

describe('Page', () => {
  it('renders a title', async () => {
    render(<Page />)

    const title = await screen.findByText(/EpiCourier/i)

    expect(title).toBeInTheDocument()
  })
})
