const { buildApp, signToken } = require('../../../../tests/helper')

let app
let pengasuhToken

beforeAll(async () => {
  app = await buildApp()
  pengasuhToken = signToken(app, { id: 2, role: 'PENGASUH', nama_lengkap: 'Siti Nurhaliza' })
})

afterAll(async () => {
  await app.close()
})

describe('POST /api/pengasuh/skrining', () => {
  it('returns 401 without token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/pengasuh/skrining',
      payload: { anak_id: 1, jawaban: [] },
    })
    expect(res.statusCode).toBe(401)
  })

  it('returns 400 for missing anak_id', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/pengasuh/skrining',
      headers: { authorization: `Bearer ${pengasuhToken}` },
      payload: { jawaban: [] },
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns 400 for empty jawaban', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/pengasuh/skrining',
      headers: { authorization: `Bearer ${pengasuhToken}` },
      payload: { anak_id: 1, jawaban: [] },
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns 400 for non-array jawaban', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/pengasuh/skrining',
      headers: { authorization: `Bearer ${pengasuhToken}` },
      payload: { anak_id: 1, jawaban: 'not-array' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns 403 when screening other pengasuh child', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/pengasuh/skrining',
      headers: { authorization: `Bearer ${pengasuhToken}` },
      payload: {
        anak_id: 999,
        jawaban: [{ id_pertanyaan: 1, jawaban: 'tidak_benar' }],
      },
    })
    expect(res.statusCode).toBe(404)
  })
})

describe('GET /api/pengasuh/skrining/:anakId', () => {
  it('returns 401 without token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/pengasuh/skrining/1' })
    expect(res.statusCode).toBe(401)
  })

  it('returns 404 for non-existent child', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/pengasuh/skrining/999',
      headers: { authorization: `Bearer ${pengasuhToken}` },
    })
    expect(res.statusCode).toBe(404)
  })
})

describe('GET /api/pengasuh/skrining/detail/:id', () => {
  it('returns 401 without token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/pengasuh/skrining/detail/1' })
    expect(res.statusCode).toBe(401)
  })

  it('returns 400 for invalid id', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/pengasuh/skrining/detail/abc',
      headers: { authorization: `Bearer ${pengasuhToken}` },
    })
    expect(res.statusCode).toBe(400)
  })
})
