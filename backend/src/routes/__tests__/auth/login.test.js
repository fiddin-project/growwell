const { buildApp, signToken } = require('../../../../tests/helper')

let app

beforeAll(async () => {
  app = await buildApp()
})

afterAll(async () => {
  await app.close()
})

describe('POST /api/auth/login', () => {
  it('returns 401 for wrong credentials', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'nonexistent', password: 'wrong' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('returns 401 for wrong password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'admin', password: 'wrongpassword' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('returns error for missing body', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {},
    })
    expect([401, 500]).toContain(res.statusCode)
  })
})

describe('GET /api/auth/me', () => {
  it('returns 401 without token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
    })
    expect(res.statusCode).toBe(401)
  })

  it('returns 401 with invalid token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: 'Bearer invalid-token' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('returns user data with valid token', async () => {
    const token = signToken(app, { id: 1, role: 'ADMIN', nama_lengkap: 'Admin' })
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(200)
  })
})
