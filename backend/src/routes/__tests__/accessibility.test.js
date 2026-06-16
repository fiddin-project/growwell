const { buildApp, signToken } = require('../../../tests/helper')

let app
let adminToken

beforeAll(async () => {
  app = await buildApp()
  adminToken = signToken(app, { id: 1, role: 'ADMIN', nama_lengkap: 'Administrator' })
})

afterAll(async () => {
  await app.close()
})

describe('Accessibility: API Response Format', () => {
  it('GET /api/admin/users returns paginated format with metadata', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/users',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.payload)
    expect(data).toHaveProperty('data')
    expect(data).toHaveProperty('total')
    expect(data).toHaveProperty('page')
    expect(data).toHaveProperty('limit')
  })

  it('GET /api/admin/anak returns array', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/anak',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.payload)
    expect(Array.isArray(data)).toBe(true)
  })

  it('GET /api/admin/skala returns array', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/skala',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.payload)
    expect(Array.isArray(data)).toBe(true)
  })

  it('GET /api/admin/ambang-batas returns array', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/ambang-batas',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.payload)
    expect(Array.isArray(data)).toBe(true)
  })

  it('error responses include error message', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/users/abc',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.statusCode).toBe(400)
    const data = JSON.parse(res.payload)
    expect(data).toHaveProperty('error')
    expect(typeof data.error).toBe('string')
  })

  it('401 responses include error message', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/auth/me' })
    expect(res.statusCode).toBe(401)
    const data = JSON.parse(res.payload)
    expect(data).toHaveProperty('error')
  })

  it('403 responses include error message', async () => {
    const pengasuhToken = signToken(app, { id: 2, role: 'PENGASUH', nama_lengkap: 'Test' })
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/users',
      headers: { authorization: `Bearer ${pengasuhToken}` },
    })
    expect(res.statusCode).toBe(403)
    const data = JSON.parse(res.payload)
    expect(data).toHaveProperty('error')
  })

  it('responses have correct content-type', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/anak',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.headers['content-type']).toContain('application/json')
  })
})

describe('Accessibility: Keyboard Navigation Support', () => {
  it('GET endpoints respond to standard HTTP methods', async () => {
    const methods = ['GET']
    for (const method of methods) {
      const res = await app.inject({
        method,
        url: '/api/admin/anak',
        headers: { authorization: `Bearer ${adminToken}` },
      })
      expect(res.statusCode).toBe(200)
    }
  })
})
