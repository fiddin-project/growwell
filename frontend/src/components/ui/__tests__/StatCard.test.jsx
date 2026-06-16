import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatCard from '../StatCard'

describe('StatCard', () => {
  it('renders value and label', () => {
    render(<StatCard value={42} label="Total Users" />)
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('Total Users')).toBeInTheDocument()
  })

  it('renders icon when provided', () => {
    const MockIcon = () => <svg data-testid="mock-icon" />
    render(<StatCard icon={MockIcon} value={10} label="Items" />)
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument()
  })

  it('does not render icon when not provided', () => {
    render(<StatCard value={10} label="Items" />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <StatCard value={1} label="Test" className="custom-class" />
    )
    expect(container.firstChild.className).toContain('custom-class')
  })

  it('renders with string value', () => {
    render(<StatCard value="75%" label="Score" />)
    expect(screen.getByText('75%')).toBeInTheDocument()
  })
})
