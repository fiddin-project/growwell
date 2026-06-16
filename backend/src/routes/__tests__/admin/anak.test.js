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

describe('GET /api/admin/anak', () => {
  it('returns 401 without token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/admin/anak' })
    expect(res.statusCode).toBe(401)
  })

  it('returns 403 for PENGASUH role', async () => {
    const token = signToken(app, { id: 2, role: 'PENGASUH', nama_lengkap: 'Test' })
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/anak',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(403)
  })

  it('returns anak list for ADMIN', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/anak',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.payload)
    expect(Array.isArray(data)).toBe(true)
  })

  it('filters by nama query', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/anak?nama=Andi',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.payload)
    expect(Array.isArray(data)).toBe(true)
  })
})

describe('POST /api/admin/anak', () => {
  it('returns 401 without token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/anak',
      payload: { nama: 'Test', tanggal_lahir: '2020-01-01', jenis_kelamin: 'L' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('creates anak for ADMIN', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/anak',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { nama: 'Test Anak', tanggal_lahir: '2020-01-01', jenis_kelamin: 'L' },
    })
    expect(res.statusCode).toBe(201)
    const data = JSON.parse(res.payload)
    expect(data.nama).toBe('Test Anak')
    expect(data.created_by_admin).toBe(true)
  })
})

describe('DELETE /api/admin/anak/:id', () => {
  it('returns 401 without token', async () => {
    const res = await app.inject({ method: 'DELETE', url: '/api/admin/anak/1' })
    expect(res.statusCode).toBe(401)
  })

  it('returns 400 for invalid id', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/admin/anak/abc',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns 400 for zero id', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/admin/anak/0',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.statusCode).toBe(400)
  })
})
