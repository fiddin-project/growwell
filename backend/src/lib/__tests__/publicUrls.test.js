const { educationResponse, resolvePublicUrl } = require('../publicUrls')

describe('public URL resolution', () => {
  const original = process.env.PUBLIC_BASE_URL

  beforeEach(() => {
    process.env.PUBLIC_BASE_URL = 'https://growwell.example.test'
  })

  afterAll(() => {
    if (original === undefined) delete process.env.PUBLIC_BASE_URL
    else process.env.PUBLIC_BASE_URL = original
  })

  it('resolves uploaded paths against the configured public origin', () => {
    expect(resolvePublicUrl('/uploads/edukasi/file.pdf')).toBe('https://growwell.example.test/uploads/edukasi/file.pdf')
  })

  it('preserves validated external HTTP URLs', () => {
    const item = educationResponse({ id: 1, url_atau_file: 'https://youtube.com/watch?v=test' })
    expect(item.asset_url).toBe('https://youtube.com/watch?v=test')
  })
})
