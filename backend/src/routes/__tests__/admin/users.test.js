const { buildApp, signToken } = require('../../../../tests/helper')

let app
let adminToken

beforeAll(async () => {
  app = await buildApp()
  adminToken = signToken(app, { id: 1, role: 'ADMIN', nama_lengkap: 'Administrator' })
})

afterAll(async () => {
  await app.close()
})

describe('GET /api/admin/users', () => {
  it('returns 401 without token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/admin/users' })
    expect(res.statusCode).toBe(401)
  })

  it('returns 403 for PENGASUH', async () => {
    const token = signToken(app, { id: 2, role: 'PENGASUH', nama_lengkap: 'Test' })
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/users',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(403)
  })

  it('returns users list for ADMIN', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/users',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.payload)
    expect(data).toHaveProperty('data')
    expect(Array.isArray(data.data)).toBe(true)
  })

  it('supports search query', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/users?search=admin',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.statusCode).toBe(200)
  })

  it('supports role filter', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/users?role=PENGASUH',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.statusCode).toBe(200)
  })
})

describe('GET /api/admin/users/:id', () => {
  it('returns 400 for invalid id', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/users/abc',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns 400 for zero id', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/users/0',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('POST /api/admin/users', () => {
  it('returns 401 without token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/users',
      payload: { username: 'new', nama_lengkap: 'New User', password: 'pass123' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('returns 400 for missing fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/users',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { username: 'new' },
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('DELETE /api/admin/users/:id', () => {
  it('prevents self-deletion', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/admin/users/1',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.statusCode).toBe(400)
    const data = JSON.parse(res.payload)
    expect(data.error).toContain('sendiri')
  })
})
