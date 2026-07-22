const { buildApp, signToken } = require('../../../../tests/helper')

let app
let pengasuhToken
let pengasuh2Token
let crossCaregiverScreeningId

beforeAll(async () => {
  app = await buildApp()
  pengasuhToken = signToken(app, { id: 2, role: 'PENGASUH', nama_lengkap: 'Siti Nurhaliza' })
  pengasuh2Token = signToken(app, { id: 3, role: 'PENGASUH', nama_lengkap: 'Budi Santoso' })
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

  it('returns 404 when screening a missing child', async () => {
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

  it('allows any caregiver to screen any existing child', async () => {
    const questions = await app.inject({
      method: 'GET',
      url: '/api/pengasuh/pertanyaan',
      headers: { authorization: `Bearer ${pengasuh2Token}` },
    })
    const jawaban = questions.json().map((question) => ({
      id_pertanyaan: question.id,
      jawaban: 'tidak_benar',
    }))

    const response = await app.inject({
      method: 'POST',
      url: '/api/pengasuh/skrining',
      headers: { authorization: `Bearer ${pengasuh2Token}` },
      payload: { anak_id: 1, jawaban },
    })
    expect(response.statusCode).toBe(201)
    crossCaregiverScreeningId = response.json().id
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

  it('returns screenings performed by another caregiver', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/pengasuh/skrining/1',
      headers: { authorization: `Bearer ${pengasuhToken}` },
    })
    expect(response.statusCode).toBe(200)
    const screening = response.json().find((item) => item.id === crossCaregiverScreeningId)
    expect(screening.performer).toEqual({ id: 3, nama_lengkap: 'Budi Santoso' })
  })

  it('returns global monitoring history with performer audit data', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/pengasuh/monitoring/1',
      headers: { authorization: `Bearer ${pengasuhToken}` },
    })
    expect(response.statusCode).toBe(200)
    const screening = response.json().riwayat.find((item) => item.id === crossCaregiverScreeningId)
    expect(screening.performer).toEqual({ id: 3, nama_lengkap: 'Budi Santoso' })
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

  it('allows another caregiver to open screening detail', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/pengasuh/skrining/detail/${crossCaregiverScreeningId}`,
      headers: { authorization: `Bearer ${pengasuhToken}` },
    })
    expect(response.statusCode).toBe(200)
    expect(response.json().performer).toEqual({ id: 3, nama_lengkap: 'Budi Santoso' })
  })
})

describe('screening form integrity and idempotency', () => {
  async function loadForm() {
    const response = await app.inject({
      method: 'GET',
      url: '/api/pengasuh/screening-form',
      headers: { authorization: `Bearer ${pengasuhToken}` },
    })
    expect(response.statusCode).toBe(200)
    return response.json()
  }

  function answersFor(form, value = 'tidak_benar') {
    return form.questions.map((question) => ({ id_pertanyaan: question.id, jawaban: value }))
  }

  it('returns a deterministic revision and complete scoring inputs', async () => {
    const first = await loadForm()
    const second = await loadForm()
    expect(first.instrument_revision).toMatch(/^sha256:[a-f0-9]{64}$/)
    expect(first.instrument_revision).toBe(second.instrument_revision)
    expect(first.questions).toHaveLength(25)
    expect(first.answer_options).toEqual(['tidak_benar', 'agak_benar', 'selalu_benar'])
  })

  it('rejects duplicate or incomplete answers without writing a screening', async () => {
    const form = await loadForm()
    const answers = answersFor(form)
    answers[answers.length - 1].id_pertanyaan = answers[0].id_pertanyaan
    const response = await app.inject({
      method: 'POST',
      url: '/api/pengasuh/skrining',
      headers: { authorization: `Bearer ${pengasuhToken}` },
      payload: { anak_id: 1, instrument_revision: form.instrument_revision, jawaban: answers },
    })
    expect(response.statusCode).toBe(400)
    expect(response.json().code).toBe('ANSWERS_INCOMPLETE_OR_DUPLICATE')
  })

  it('rejects a stale instrument revision', async () => {
    const form = await loadForm()
    const response = await app.inject({
      method: 'POST',
      url: '/api/pengasuh/skrining',
      headers: { authorization: `Bearer ${pengasuhToken}` },
      payload: {
        anak_id: 1,
        client_submission_id: '11111111-1111-4111-8111-111111111111',
        instrument_revision: `sha256:${'0'.repeat(64)}`,
        jawaban: answersFor(form),
      },
    })
    expect(response.statusCode).toBe(409)
    expect(response.json().code).toBe('INSTRUMENT_REVISION_STALE')
  })

  it('replays the same submission once and rejects a changed payload', async () => {
    const form = await loadForm()
    const clientSubmissionId = '22222222-2222-4222-8222-222222222222'
    const payload = {
      anak_id: 1,
      client_submission_id: clientSubmissionId,
      instrument_revision: form.instrument_revision,
      jawaban: answersFor(form),
    }

    const created = await app.inject({
      method: 'POST', url: '/api/pengasuh/skrining',
      headers: { authorization: `Bearer ${pengasuhToken}` }, payload,
    })
    expect(created.statusCode).toBe(201)

    const replay = await app.inject({
      method: 'POST', url: '/api/pengasuh/skrining',
      headers: { authorization: `Bearer ${pengasuh2Token}` }, payload,
    })
    expect(replay.statusCode).toBe(200)
    expect(replay.json().id).toBe(created.json().id)
    expect(replay.json().replayed).toBe(true)

    const changedPayload = structuredClone(payload)
    changedPayload.jawaban[0].jawaban = 'selalu_benar'
    const conflict = await app.inject({
      method: 'POST', url: '/api/pengasuh/skrining',
      headers: { authorization: `Bearer ${pengasuhToken}` }, payload: changedPayload,
    })
    expect(conflict.statusCode).toBe(409)
    expect(conflict.json().code).toBe('IDEMPOTENCY_CONFLICT')
  })
})
