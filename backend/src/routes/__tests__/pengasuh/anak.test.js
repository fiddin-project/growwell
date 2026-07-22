const { buildApp, signToken } = require('../../../../tests/helper')

let app
let pengasuhToken
let pengasuh2Token
let sharedChildId

beforeAll(async () => {
  app = await buildApp()
  pengasuhToken = signToken(app, { id: 2, role: 'PENGASUH', nama_lengkap: 'Siti Nurhaliza' })
  pengasuh2Token = signToken(app, { id: 3, role: 'PENGASUH', nama_lengkap: 'Budi Santoso' })
})

afterAll(async () => {
  await app.close()
})

describe('GET /api/pengasuh/anak', () => {
  it('returns 401 without token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/pengasuh/anak' })
    expect(res.statusCode).toBe(401)
  })

  it('returns 403 for ADMIN role', async () => {
    const adminToken = signToken(app, { id: 1, role: 'ADMIN', nama_lengkap: 'Admin' })
    const res = await app.inject({
      method: 'GET',
      url: '/api/pengasuh/anak',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.statusCode).toBe(403)
  })

  it('returns every child for a caregiver', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/pengasuh/anak',
      headers: { authorization: `Bearer ${pengasuhToken}` },
    })
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.payload)
    expect(Array.isArray(data)).toBe(true)
  })

  it('returns the same child IDs for different caregivers', async () => {
    const res1 = await app.inject({
      method: 'GET',
      url: '/api/pengasuh/anak',
      headers: { authorization: `Bearer ${pengasuhToken}` },
    })
    const res2 = await app.inject({
      method: 'GET',
      url: '/api/pengasuh/anak',
      headers: { authorization: `Bearer ${pengasuh2Token}` },
    })
    expect(res1.statusCode).toBe(200)
    expect(res2.statusCode).toBe(200)
    const ids1 = res1.json().map((item) => item.id).sort((a, b) => a - b)
    const ids2 = res2.json().map((item) => item.id).sort((a, b) => a - b)
    expect(ids1).toEqual(ids2)
  })
})

describe('POST /api/pengasuh/anak', () => {
  it('returns 401 without token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/pengasuh/anak',
      payload: { nama: 'Test', tanggal_lahir: '2020-01-01', jenis_kelamin: 'L' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('creates child for pengasuh', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/pengasuh/anak',
      headers: { authorization: `Bearer ${pengasuhToken}` },
      payload: { nama: 'Anak Test', tanggal_lahir: '2020-01-01', jenis_kelamin: 'L' },
    })
    expect(res.statusCode).toBe(201)
    const data = JSON.parse(res.payload)
    expect(data.nama).toBe('Anak Test')
    expect(data.created_by_admin).toBe(false)
    sharedChildId = data.id
  })

  it('returns 400 for missing fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/pengasuh/anak',
      headers: { authorization: `Bearer ${pengasuhToken}` },
      payload: { nama: 'Test' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns 400 for invalid jenis_kelamin', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/pengasuh/anak',
      headers: { authorization: `Bearer ${pengasuhToken}` },
      payload: { nama: 'Test', tanggal_lahir: '2020-01-01', jenis_kelamin: 'X' },
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('PUT /api/pengasuh/anak/:id', () => {
  it('allows another caregiver to update a child', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/pengasuh/anak/${sharedChildId}`,
      headers: { authorization: `Bearer ${pengasuh2Token}` },
      payload: { nama: 'Hacked' },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().nama).toBe('Hacked')
  })
})

describe('DELETE /api/pengasuh/anak/:id', () => {
  it('allows another caregiver to delete a history-free child', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/pengasuh/anak/${sharedChildId}`,
      headers: { authorization: `Bearer ${pengasuh2Token}` },
    })
    expect(res.statusCode).toBe(200)
  })

  it('returns 400 for invalid id', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/pengasuh/anak/0',
      headers: { authorization: `Bearer ${pengasuhToken}` },
    })
    expect(res.statusCode).toBe(400)
  })
})
