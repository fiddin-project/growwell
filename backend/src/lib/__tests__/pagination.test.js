const { parsePagination } = require('../pagination')

describe('parsePagination', () => {
  it('uses safe defaults', () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 100, skip: 0 })
  })

  it('calculates an offset for valid integers', () => {
    expect(parsePagination({ page: '3', limit: '25' })).toEqual({ page: 3, limit: 25, skip: 50 })
  })

  it.each([
    { page: '0' }, { page: 'abc' }, { page: '1.5' },
    { limit: '0' }, { limit: '101' }, { limit: 'abc' },
  ])('rejects invalid values: %j', (query) => {
    expect(parsePagination(query)).toBeNull()
  })
})
