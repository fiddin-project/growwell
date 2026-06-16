const { buildApp, signToken } = require('../../../tests/helper')

let app
let adminToken
let pengasuhToken

beforeAll(async () => {
  app = await buildApp()
  adminToken = signToken(app, { id: 1, role: 'ADMIN', nama_lengkap: 'Administrator' })
  pengasuhToken = signToken(app, { id: 2, role: 'PENGASUH', nama_lengkap: 'Siti Nurhaliza' })
})

afterAll(async () => {
  await app.close()
})

describe('E2E: Admin CRUD User Flow', () => {
  let createdUserId

  it('1. Admin creates a new pengasuh user', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/users',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { username: 'e2e_pengasuh', nama_lengkap: 'E2E Test User', password: 'test123' },
    })
    expect(res.statusCode).toBe(201)
    const data = JSON.parse(res.payload)
    expect(data.username).toBe('e2e_pengasuh')
    expect(data.role).toBe('PENGASUH')
    createdUserId = data.id
  })

  it('2. Admin sees the new user in list', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/users?search=e2e_pengasuh',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.payload)
    expect(data.data.some(u => u.username === 'e2e_pengasuh')).toBe(true)
  })

  it('3. Admin updates the user', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/admin/users/${createdUserId}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { nama_lengkap: 'E2E Updated User' },
    })
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.payload)
    expect(data.nama_lengkap).toBe('E2E Updated User')
  })

  it('4. Admin deletes the user', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/admin/users/${createdUserId}`,
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.statusCode).toBe(200)
  })

  it('5. Deleted user is no longer found', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/admin/users/${createdUserId}`,
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.statusCode).toBe(404)
  })
})

describe('E2E: Admin CRUD Anak Flow', () => {
  let createdAnakId

  it('1. Admin creates a child', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/anak',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { nama: 'E2E Anak', tanggal_lahir: '2018-05-15', jenis_kelamin: 'P' },
    })
    expect(res.statusCode).toBe(201)
    const data = JSON.parse(res.payload)
    expect(data.nama).toBe('E2E Anak')
    expect(data.created_by_admin).toBe(true)
    createdAnakId = data.id
  })

  it('2. Admin sees child in list', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/anak?nama=E2E',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.payload)
    expect(data.some(a => a.nama === 'E2E Anak')).toBe(true)
  })

  it('3. Admin updates the child', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/admin/anak/${createdAnakId}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { nama: 'E2E Anak Updated' },
    })
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.payload)
    expect(data.nama).toBe('E2E Anak Updated')
  })

  it('4. Pengasuh can see admin-created child', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/pengasuh/anak',
      headers: { authorization: `Bearer ${pengasuhToken}` },
    })
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.payload)
    expect(data.some(a => a.nama === 'E2E Anak Updated')).toBe(true)
  })

  it('5. Admin deletes the child (no screenings)', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/admin/anak/${createdAnakId}`,
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.statusCode).toBe(200)
  })
})

describe('E2E: Threshold Reset Flow', () => {
  it('1. Admin modifies a threshold', async () => {
    const list = await app.inject({
      method: 'GET',
      url: '/api/admin/ambang-batas',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    const thresholds = JSON.parse(list.payload)
    const firstId = thresholds[0].id

    const res = await app.inject({
      method: 'PUT',
      url: `/api/admin/ambang-batas/${firstId}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { batas_normal_max: 99, batas_borderline_max: 99 },
    })
    expect(res.statusCode).toBe(200)
  })

  it('2. Admin resets to defaults', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/ambang-batas/reset',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.payload)
    expect(data.length).toBe(6)
  })
})

describe('E2E: Authorization Guard', () => {
  it('Pengasuh cannot access admin routes', async () => {
    const routes = [
      { method: 'GET', url: '/api/admin/users' },
      { method: 'GET', url: '/api/admin/anak' },
      { method: 'GET', url: '/api/admin/skala' },
      { method: 'GET', url: '/api/admin/ambang-batas' },
      { method: 'GET', url: '/api/admin/dashboard' },
    ]
    for (const route of routes) {
      const res = await app.inject({
        method: route.method,
        url: route.url,
        headers: { authorization: `Bearer ${pengasuhToken}` },
      })
      expect(res.statusCode).toBe(403)
    }
  })

  it('Admin cannot access pengasuh routes', async () => {
    const routes = [
      { method: 'GET', url: '/api/pengasuh/anak' },
      { method: 'GET', url: '/api/pengasuh/skala' },
      { method: 'GET', url: '/api/pengasuh/edukasi' },
      { method: 'GET', url: '/api/pengasuh/psikolog' },
      { method: 'GET', url: '/api/pengasuh/dashboard' },
    ]
    for (const route of routes) {
      const res = await app.inject({
        method: route.method,
        url: route.url,
        headers: { authorization: `Bearer ${adminToken}` },
      })
      expect(res.statusCode).toBe(403)
    }
  })

  it('Unauthenticated requests are rejected', async () => {
    const routes = [
      { method: 'GET', url: '/api/admin/users' },
      { method: 'GET', url: '/api/pengasuh/anak' },
      { method: 'GET', url: '/api/auth/me' },
    ]
    for (const route of routes) {
      const res = await app.inject({ method: route.method, url: route.url })
      expect(res.statusCode).toBe(401)
    }
  })
})
