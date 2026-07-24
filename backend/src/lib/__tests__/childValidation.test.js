const { parseBirthDate } = require('../childValidation')

describe('parseBirthDate', () => {
  it('accepts a real ISO calendar date', () => {
    expect(parseBirthDate('2024-02-29')?.toISOString()).toBe('2024-02-29T00:00:00.000Z')
  })

  it.each([
    null,
    '',
    '2024-2-9',
    '2023-02-29',
    '2024-13-01',
    '2024-04-31',
    'not-a-date',
  ])('rejects invalid date %s', (value) => {
    expect(parseBirthDate(value)).toBeNull()
  })
})
