import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DataTable from '../DataTable'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'id' },
  }),
}))

const columns = [
  { header: 'Name', accessor: 'name' },
  { header: 'Age', accessor: 'age' },
]

const data = [
  { id: 1, name: 'Alice', age: 30 },
  { id: 2, name: 'Bob', age: 25 },
  { id: 3, name: 'Charlie', age: 35 },
]

describe('DataTable', () => {
  it('renders all rows', () => {
    render(<DataTable columns={columns} data={data} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
  })

  it('renders column headers', () => {
    render(<DataTable columns={columns} data={data} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Age')).toBeInTheDocument()
  })

  it('shows empty state when data is empty', () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="No items found" />)
    expect(screen.getByText('No items found')).toBeInTheDocument()
  })

  it('shows default empty message', () => {
    render(<DataTable columns={columns} data={[]} />)
    expect(screen.getByText('no_data')).toBeInTheDocument()
  })

  it('searches data', () => {
    render(<DataTable columns={columns} data={data} />)
    const searchInput = screen.getByPlaceholderText('search')
    fireEvent.change(searchInput, { target: { value: 'Bob' } })
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.queryByText('Alice')).not.toBeInTheDocument()
    expect(screen.queryByText('Charlie')).not.toBeInTheDocument()
  })

  it('paginates data with pageSize', () => {
    render(<DataTable columns={columns} data={data} pageSize={2} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.queryByText('Charlie')).not.toBeInTheDocument()
  })

  it('renders actions when provided', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        actions={(row) => <button>Edit {row.name}</button>}
      />
    )
    expect(screen.getByText('Edit Alice')).toBeInTheDocument()
  })

  it('disables search in serverMode', () => {
    render(<DataTable columns={columns} data={data} serverMode />)
    expect(screen.queryByPlaceholderText('search')).not.toBeInTheDocument()
  })
})
