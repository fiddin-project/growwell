import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Badge from '../Badge'

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>Normal</Badge>)
    expect(screen.getByText('Normal')).toBeInTheDocument()
  })

  it('applies Normal variant class', () => {
    render(<Badge variant="Normal">Normal</Badge>)
    const badge = screen.getByText('Normal')
    expect(badge.className).toContain('badge-normal')
  })

  it('applies Borderline variant class', () => {
    render(<Badge variant="Borderline">Borderline</Badge>)
    const badge = screen.getByText('Borderline')
    expect(badge.className).toContain('badge-borderline')
  })

  it('applies Abnormal variant class', () => {
    render(<Badge variant="Abnormal">Abnormal</Badge>)
    const badge = screen.getByText('Abnormal')
    expect(badge.className).toContain('badge-abnormal')
  })

  it('defaults to Normal variant for unknown variant', () => {
    render(<Badge variant="Unknown">Test</Badge>)
    const badge = screen.getByText('Test')
    expect(badge.className).toContain('badge-normal')
  })

  it('has role=status for accessibility', () => {
    render(<Badge>Test</Badge>)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<Badge className="custom-class">Test</Badge>)
    const badge = screen.getByText('Test')
    expect(badge.className).toContain('custom-class')
  })
})
