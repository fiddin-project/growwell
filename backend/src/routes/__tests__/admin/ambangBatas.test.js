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

describe('GET /api/admin/ambang-batas', () => {
  it('returns 401 without token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/admin/ambang-batas' })
    expect(res.statusCode).toBe(401)
  })

  it('returns thresholds for ADMIN', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/ambang-batas',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.payload)
    expect(Array.isArray(data)).toBe(true)
  })
})

describe('POST /api/admin/ambang-batas/reset', () => {
  it('returns 401 without token', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/admin/ambang-batas/reset' })
    expect(res.statusCode).toBe(401)
  })

  it('resets thresholds for ADMIN', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/ambang-batas/reset',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.payload)
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBe(6)
  })
})

describe('PUT /api/admin/ambang-batas/:id', () => {
  it('returns 400 for invalid id', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/admin/ambang-batas/abc',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { batas_normal_max: 10, batas_borderline_max: 15 },
    })
    expect(res.statusCode).toBe(400)
  })
})
