import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import PageHeader from '../ui/PageHeader'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'id' },
  }),
}))

function renderWithRouter(ui) {
  return render(<BrowserRouter>{ui}</BrowserRouter>)
}

describe('PageHeader', () => {
  it('renders title', () => {
    renderWithRouter(<PageHeader title="Dashboard" />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    renderWithRouter(<PageHeader title="Test" subtitle="Subtitle text" />)
    expect(screen.getByText('Subtitle text')).toBeInTheDocument()
  })

  it('does not render subtitle when not provided', () => {
    renderWithRouter(<PageHeader title="Test" />)
    expect(screen.queryByText('Subtitle text')).not.toBeInTheDocument()
  })

  it('renders back button when backTo is provided', () => {
    renderWithRouter(<PageHeader title="Test" backTo="/previous" />)
    expect(screen.getByLabelText('go_back')).toBeInTheDocument()
  })

  it('does not render back button when backTo is not provided', () => {
    renderWithRouter(<PageHeader title="Test" />)
    expect(screen.queryByLabelText('go_back')).not.toBeInTheDocument()
  })

  it('renders icon when provided', () => {
    const MockIcon = () => <svg data-testid="mock-icon" />
    renderWithRouter(<PageHeader icon={MockIcon} title="Test" />)
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument()
  })

  it('applies gradient styles when gradient=true', () => {
    renderWithRouter(<PageHeader title="Test" gradient />)
    const h2 = screen.getByText('Test')
    expect(h2).toHaveStyle({ color: '#D4A843' })
  })

  it('does not apply gradient styles when gradient=false', () => {
    renderWithRouter(<PageHeader title="Test" />)
    const h2 = screen.getByText('Test')
    expect(h2.style.color).not.toBe('#D4A843')
  })

  it('renders action when provided', () => {
    renderWithRouter(
      <PageHeader title="Test" action={<button>Add</button>} />
    )
    expect(screen.getByText('Add')).toBeInTheDocument()
  })
})
