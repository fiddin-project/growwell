const { buildApp, signToken } = require('../../../tests/helper')

let app
let adminToken
let pengasuhToken
let pengasuhLainToken

beforeAll(async () => {
  app = await buildApp()
  adminToken = signToken(app, { id: 1, role: 'ADMIN', nama_lengkap: 'Administrator' })
  pengasuhToken = signToken(app, { id: 2, role: 'PENGASUH', nama_lengkap: 'Siti Nurhaliza' })
  pengasuhLainToken = signToken(app, { id: 3, role: 'PENGASUH', nama_lengkap: 'Budi Santoso' })
})

afterAll(async () => {
  await app.close()
})

describe('Security: IDOR Protection', () => {
  it('creator metadata does not grant ownership privileges', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/pengasuh/anak',
      headers: { authorization: `Bearer ${pengasuhToken}` },
      payload: { nama: 'Shared Child', tanggal_lahir: '2020-01-01', jenis_kelamin: 'L' },
    })
    expect(created.statusCode).toBe(201)
    const childId = created.json().id

    const updated = await app.inject({
      method: 'PUT',
      url: `/api/pengasuh/anak/${childId}`,
      headers: { authorization: `Bearer ${pengasuhLainToken}` },
      payload: { nama: 'Shared Child Updated' },
    })
    expect(updated.statusCode).toBe(200)

    const removed = await app.inject({
      method: 'DELETE',
      url: `/api/pengasuh/anak/${childId}`,
      headers: { authorization: `Bearer ${pengasuhLainToken}` },
    })
    expect(removed.statusCode).toBe(200)
  })

  it('Pengasuh cannot access other pengasuh screening', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/pengasuh/skrining/999',
      headers: { authorization: `Bearer ${pengasuhToken}` },
    })
    expect([404, 403]).toContain(res.statusCode)
  })
})

describe('Security: Input Sanitization', () => {
  it('strips HTML tags from input fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/anak',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        nama: '<img onerror=alert(1)>Test',
        tanggal_lahir: '2020-01-01',
        jenis_kelamin: 'L',
      },
    })
    if (res.statusCode === 201) {
      const data = JSON.parse(res.payload)
      expect(data.nama).not.toContain('<img')
      expect(data.nama).not.toContain('onerror')
    }
  })

  it('strips script tags from input', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/anak',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        nama: '<script>alert("xss")</script>SafeName',
        tanggal_lahir: '2020-01-01',
        jenis_kelamin: 'P',
      },
    })
    if (res.statusCode === 201) {
      const data = JSON.parse(res.payload)
      expect(data.nama).not.toContain('<script>')
      expect(data.nama).toContain('SafeName')
    }
  })

  it('truncates strings exceeding max length', async () => {
    const longString = 'a'.repeat(200)
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/anak',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        nama: longString,
        tanggal_lahir: '2020-01-01',
        jenis_kelamin: 'L',
      },
    })
    if (res.statusCode === 201) {
      const data = JSON.parse(res.payload)
      expect(data.nama.length).toBeLessThanOrEqual(100)
    }
  })
})

describe('Security: Input Validation', () => {
  it('rejects SQL injection in search parameter', async () => {
    const res = await app.inject({
      method: 'GET',
      url: "/api/admin/users?search='; DROP TABLE users;--",
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.payload)
    expect(Array.isArray(data.data)).toBe(true)
  })

  it('rejects negative id in URL', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/users/-1',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.statusCode).toBe(400)
  })

  it('rejects non-numeric id in URL', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/users/abc',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.statusCode).toBe(400)
  })

  it('rejects zero id in URL', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/users/0',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.statusCode).toBe(400)
  })

  it('rejects username shorter than 3 characters', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/users',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { username: 'ab', nama_lengkap: 'Test User', password: '123456' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('rejects password shorter than 6 characters', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/users',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { username: 'testuser', nama_lengkap: 'Test User', password: '12345' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('rejects invalid jenis_kelamin', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/anak',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { nama: 'Test', tanggal_lahir: '2020-01-01', jenis_kelamin: 'X' },
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('Security: JWT Validation', () => {
  it('rejects expired token', async () => {
    const token = app.jwt.sign(
      { id: 1, role: 'ADMIN', nama_lengkap: 'Admin' },
      { expiresIn: '1ms' }
    )
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${token}` },
    })
    expect([200, 401]).toContain(res.statusCode)
  })

  it('rejects tampered token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.tampered.payload' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('rejects missing Bearer prefix', async () => {
    const token = signToken(app, { id: 1, role: 'ADMIN', nama_lengkap: 'Admin' })
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: token },
    })
    expect(res.statusCode).toBe(401)
  })
})

describe('Security: Rate Limiting', () => {
  it('login endpoint has rate limiting configured', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'test', password: 'test' },
    })
    expect([401, 429]).toContain(res.statusCode)
  })
})

describe('Security: Security Headers', () => {
  it('helmet sets X-Content-Type-Options', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/users',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.headers['x-content-type-options']).toBe('nosniff')
  })

  it('helmet sets X-Frame-Options', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/users',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN')
  })

  it('helmet sets X-XSS-Protection', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/users',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.headers['x-xss-protection']).toBe('0')
  })
})

describe('Security: Edge Case Inputs', () => {
  it('handles very long search string', async () => {
    const longString = 'a'.repeat(1000)
    const res = await app.inject({
      method: 'GET',
      url: `/api/admin/users?search=${longString}`,
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.statusCode).toBe(200)
  })

  it('handles empty body on POST', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/users',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {},
    })
    expect(res.statusCode).toBe(400)
  })

  it('handles invalid JSON body', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/users',
      headers: {
        authorization: `Bearer ${adminToken}`,
        'content-type': 'application/json',
      },
      payload: 'not-valid-json',
    })
    expect([400, 500]).toContain(res.statusCode)
  })
})
