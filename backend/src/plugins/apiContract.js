const object = (properties = {}, required = []) => ({
  type: 'object',
  properties,
  required,
  additionalProperties: true,
})
const array = (items) => ({ type: 'array', items })
const ref = (name) => ({ $ref: `${name}#` })
const nullableString = { type: 'string', nullable: true }

const schemas = [
  { $id: 'ErrorResponse', ...object({ error: { type: 'string' }, code: { type: 'string' }, details: array({}), request_id: { type: 'string' } }, ['error']) },
  { $id: 'MessageResponse', ...object({ message: { type: 'string' } }, ['message']) },
  { $id: 'User', ...object({ id: { type: 'integer' }, username: { type: 'string' }, nama_lengkap: { type: 'string' }, role: { type: 'string', enum: ['ADMIN', 'PENGASUH'] }, created_at: { type: 'string' } }, ['id', 'username', 'nama_lengkap', 'role']) },
  { $id: 'Creator', ...object({ id: { type: 'integer' }, nama_lengkap: nullableString, role: nullableString }, ['id']) },
  { $id: 'Child', ...object({ id: { type: 'integer' }, nama: { type: 'string' }, tanggal_lahir: { type: 'string' }, jenis_kelamin: { type: 'string', enum: ['L', 'P'] }, created_by: { type: 'integer', nullable: true }, created_by_admin: { type: 'boolean' }, creator: { ...ref('Creator'), nullable: true } }, ['id', 'nama', 'tanggal_lahir', 'jenis_kelamin']) },
  { $id: 'Scale', ...object({ id_skala: { type: 'string' }, nama_skala: { type: 'string' }, nama_skala_en: { type: 'string' } }, ['id_skala', 'nama_skala', 'nama_skala_en']) },
  { $id: 'Question', ...object({ id: { type: 'integer' }, urutan: { type: 'integer' }, teks_pertanyaan: { type: 'string' }, teks_pertanyaan_en: { type: 'string' }, id_skala: { type: 'string' }, skor_tidak_benar: { type: 'integer' }, skor_agak_benar: { type: 'integer' }, skor_selalu_benar: { type: 'integer' } }, ['id', 'teks_pertanyaan', 'teks_pertanyaan_en', 'id_skala']) },
  { $id: 'Threshold', ...object({ id: { type: 'integer' }, id_skala: nullableString, batas_normal_max: { type: 'integer' }, batas_borderline_max: { type: 'integer' }, is_reversed: { type: 'boolean' } }, ['id', 'batas_normal_max', 'batas_borderline_max']) },
  { $id: 'Education', ...object({ id: { type: 'integer' }, judul: { type: 'string' }, judul_en: { type: 'string' }, deskripsi: { type: 'string' }, deskripsi_en: { type: 'string' }, tipe: { type: 'string', enum: ['pdf', 'gambar', 'youtube'] }, url_atau_file: { type: 'string' }, asset_url: nullableString, is_active: { type: 'boolean' } }, ['id', 'judul', 'judul_en', 'tipe']) },
  { $id: 'Psychologist', ...object({ id: { type: 'integer' }, nama: { type: 'string' }, spesialisasi: { type: 'string' }, spesialisasi_en: { type: 'string' }, nomor_whatsapp: { type: 'string' }, pesan_default: { type: 'string' }, pesan_default_en: { type: 'string' }, is_active: { type: 'boolean' } }, ['id', 'nama', 'spesialisasi', 'spesialisasi_en']) },
  { $id: 'ScaleResult', ...object({ id_skala: { type: 'string' }, skor: { type: 'integer' }, kategori: { type: 'string', enum: ['Normal', 'Borderline', 'Abnormal'] }, nama_skala: nullableString }, ['id_skala', 'skor', 'kategori']) },
  { $id: 'Screening', ...object({ id: { type: 'integer' }, anak_id: { type: 'integer' }, pengasuh_id: { type: 'integer' }, tanggal_skrining: { type: 'string' }, total_score: { type: 'integer' }, kategori_total: { type: 'string', enum: ['Normal', 'Borderline', 'Abnormal'] }, instrument_revision: nullableString, performer: { ...ref('Creator'), nullable: true }, per_skala: array(ref('ScaleResult')), replayed: { type: 'boolean' } }, ['id', 'total_score', 'kategori_total']) },
  { $id: 'ScreeningForm', ...object({ instrument_revision: { type: 'string' }, scales: array(ref('Scale')), questions: array(ref('Question')), thresholds: array(ref('Threshold')), answer_options: array({ type: 'string', enum: ['tidak_benar', 'agak_benar', 'selalu_benar'] }) }, ['instrument_revision', 'scales', 'questions', 'thresholds', 'answer_options']) },
  { $id: 'Monitoring', ...object({ anak: ref('Child'), threshold_total: { ...ref('Threshold'), nullable: true }, riwayat: array(ref('Screening')) }, ['anak', 'riwayat']) },
  { $id: 'Session', ...object({ token: { type: 'string' }, access_token: { type: 'string' }, refresh_token: nullableString, token_type: { type: 'string' }, expires_in: { type: 'integer' }, user: ref('User') }, ['access_token', 'token_type', 'expires_in', 'user']) },
  { $id: 'Health', ...object({ status: { type: 'string' }, database: { type: 'string' } }, ['status']) },
  { $id: 'Dashboard', ...object() },
  { $id: 'PaginatedUsers', ...object({ data: array(ref('User')), total: { type: 'integer' }, page: { type: 'integer' }, limit: { type: 'integer' } }, ['data', 'total', 'page', 'limit']) },
]

const idParams = object({ id: { type: 'integer', minimum: 1 } }, ['id'])
const scaleIdParams = object({ id: { type: 'string', minLength: 1, maxLength: 10 } }, ['id'])
const childIdParams = object({ anakId: { type: 'integer', minimum: 1 } }, ['anakId'])

const bodies = {
  'POST /api/auth/login': object({ username: { type: 'string', minLength: 1, maxLength: 50 }, password: { type: 'string', minLength: 1, maxLength: 128 }, client_type: { type: 'string', enum: ['web', 'android'] } }, ['username', 'password']),
  'POST /api/auth/refresh': object({ client_type: { type: 'string', enum: ['web', 'android'] }, refresh_token: { type: 'string' } }),
  'POST /api/auth/logout': object({ client_type: { type: 'string', enum: ['web', 'android'] }, refresh_token: { type: 'string' } }),
  'POST /api/admin/users': object({ username: { type: 'string', minLength: 3, maxLength: 50 }, nama_lengkap: { type: 'string', minLength: 2, maxLength: 100 }, password: { type: 'string', minLength: 6, maxLength: 128 } }, ['username', 'nama_lengkap', 'password']),
  'PUT /api/admin/users/:id': object({ username: { type: 'string', minLength: 3, maxLength: 50 }, nama_lengkap: { type: 'string', minLength: 2, maxLength: 100 }, password: { type: 'string', minLength: 6, maxLength: 128 } }),
  'POST /api/admin/skala': object({ id_skala: { type: 'string', minLength: 1, maxLength: 10 }, nama_skala: { type: 'string', minLength: 1, maxLength: 100 }, nama_skala_en: { type: 'string', minLength: 1, maxLength: 100 } }, ['id_skala', 'nama_skala', 'nama_skala_en']),
  'PUT /api/admin/skala/:id': object({ nama_skala: { type: 'string', minLength: 1, maxLength: 100 }, nama_skala_en: { type: 'string', minLength: 1, maxLength: 100 } }),
  'POST /api/admin/pertanyaan': object({ urutan: { type: 'integer', minimum: 0 }, teks_pertanyaan: { type: 'string', minLength: 1, maxLength: 500 }, teks_pertanyaan_en: { type: 'string', minLength: 1, maxLength: 500 }, id_skala: { type: 'string', minLength: 1, maxLength: 10 }, skor_tidak_benar: { type: 'integer' }, skor_agak_benar: { type: 'integer' }, skor_selalu_benar: { type: 'integer' } }, ['teks_pertanyaan', 'teks_pertanyaan_en', 'id_skala', 'skor_tidak_benar', 'skor_agak_benar', 'skor_selalu_benar']),
  'PUT /api/admin/pertanyaan/:id': object({ urutan: { type: 'integer', minimum: 0 }, teks_pertanyaan: { type: 'string', minLength: 1, maxLength: 500 }, teks_pertanyaan_en: { type: 'string', minLength: 1, maxLength: 500 }, skor_tidak_benar: { type: 'integer' }, skor_agak_benar: { type: 'integer' }, skor_selalu_benar: { type: 'integer' } }),
  'PUT /api/admin/ambang-batas/:id': object({ batas_normal_max: { type: 'integer', minimum: 0 }, batas_borderline_max: { type: 'integer', minimum: 0 } }, ['batas_normal_max', 'batas_borderline_max']),
  'POST /api/admin/anak': childBody(true),
  'PUT /api/admin/anak/:id': childBody(false),
  'POST /api/pengasuh/anak': childBody(true),
  'PUT /api/pengasuh/anak/:id': childBody(false),
  'POST /api/admin/psikolog': psychologistBody(true),
  'PUT /api/admin/psikolog/:id': psychologistBody(false),
  'POST /api/admin/edukasi': educationBody(),
  'PUT /api/admin/edukasi/:id': educationBody(),
  'POST /api/pengasuh/skrining': object({ anak_id: { type: 'integer', minimum: 1 }, client_submission_id: { type: 'string', format: 'uuid' }, instrument_revision: { type: 'string', maxLength: 80 }, jawaban: array(object({ id_pertanyaan: { type: 'integer', minimum: 1 }, jawaban: { type: 'string', enum: ['tidak_benar', 'agak_benar', 'selalu_benar'] } }, ['id_pertanyaan', 'jawaban'])) }, ['anak_id', 'jawaban']),
}

function childBody(required) {
  return object({ nama: { type: 'string', minLength: 1, maxLength: 100 }, tanggal_lahir: { type: 'string', format: 'date' }, jenis_kelamin: { type: 'string', enum: ['L', 'P'] } }, required ? ['nama', 'tanggal_lahir', 'jenis_kelamin'] : [])
}

function psychologistBody(required) {
  const properties = { nama: { type: 'string', minLength: 1, maxLength: 100 }, spesialisasi: { type: 'string', minLength: 1, maxLength: 200 }, spesialisasi_en: { type: 'string', minLength: 1, maxLength: 200 }, nomor_whatsapp: { type: 'string', minLength: 8, maxLength: 20 }, pesan_default: { type: 'string', maxLength: 500 }, pesan_default_en: { type: 'string', maxLength: 500 }, is_active: { type: 'boolean' } }
  return object(properties, required ? ['nama', 'spesialisasi', 'spesialisasi_en', 'nomor_whatsapp'] : [])
}

function educationBody() {
  return object({ judul: { type: 'string', maxLength: 255 }, judul_en: { type: 'string', maxLength: 255 }, deskripsi: { type: 'string', maxLength: 5000 }, deskripsi_en: { type: 'string', maxLength: 5000 }, tipe: { type: 'string', enum: ['pdf', 'gambar', 'youtube'] }, url_atau_file: { type: 'string', maxLength: 500 }, is_active: { type: 'boolean' } })
}

const queries = {
  'GET /api/admin/users': object({ search: { type: 'string' }, role: { type: 'string', enum: ['ADMIN', 'PENGASUH'] }, page: { anyOf: [{ type: 'integer' }, { type: 'string' }], description: 'Positive integer; defaults to 1.' }, limit: { anyOf: [{ type: 'integer' }, { type: 'string' }], description: 'Integer from 1 through 100; defaults to 100.' } }),
  'GET /api/admin/skala': object({ search: { type: 'string' } }),
  'GET /api/admin/pertanyaan': object({ id_skala: { type: 'string', maxLength: 10 } }),
  'GET /api/admin/anak': object({ nama: { type: 'string', maxLength: 100 } }),
  'GET /api/pengasuh/pertanyaan': object({ id_skala: { type: 'string', maxLength: 10 } }),
}

const responseRefs = {
  'GET /api/health': ref('Health'),
  'POST /api/auth/login': ref('Session'), 'POST /api/auth/refresh': ref('Session'),
  'GET /api/auth/me': ref('User'),
  'GET /api/admin/users': ref('PaginatedUsers'), 'GET /api/admin/users/:id': ref('User'), 'POST /api/admin/users': ref('User'), 'PUT /api/admin/users/:id': ref('User'), 'DELETE /api/admin/users/:id': ref('MessageResponse'),
  'GET /api/admin/skala': array(ref('Scale')), 'POST /api/admin/skala': ref('Scale'), 'PUT /api/admin/skala/:id': ref('Scale'), 'DELETE /api/admin/skala/:id': ref('MessageResponse'),
  'GET /api/admin/pertanyaan': array(ref('Question')), 'POST /api/admin/pertanyaan': ref('Question'), 'PUT /api/admin/pertanyaan/:id': ref('Question'), 'DELETE /api/admin/pertanyaan/:id': ref('MessageResponse'),
  'GET /api/admin/ambang-batas': array(ref('Threshold')), 'PUT /api/admin/ambang-batas/:id': ref('Threshold'), 'POST /api/admin/ambang-batas/reset': array(ref('Threshold')),
  'GET /api/admin/anak': array(ref('Child')), 'POST /api/admin/anak': ref('Child'), 'PUT /api/admin/anak/:id': ref('Child'), 'DELETE /api/admin/anak/:id': ref('MessageResponse'),
  'GET /api/admin/edukasi': array(ref('Education')), 'POST /api/admin/edukasi': ref('Education'), 'PUT /api/admin/edukasi/:id': ref('Education'), 'DELETE /api/admin/edukasi/:id': ref('MessageResponse'),
  'GET /api/admin/psikolog': array(ref('Psychologist')), 'POST /api/admin/psikolog': ref('Psychologist'), 'PUT /api/admin/psikolog/:id': ref('Psychologist'), 'DELETE /api/admin/psikolog/:id': ref('MessageResponse'),
  'GET /api/admin/dashboard': ref('Dashboard'),
  'GET /api/pengasuh/anak': array(ref('Child')), 'POST /api/pengasuh/anak': ref('Child'), 'PUT /api/pengasuh/anak/:id': ref('Child'), 'DELETE /api/pengasuh/anak/:id': ref('MessageResponse'),
  'GET /api/pengasuh/skala': array(ref('Scale')), 'GET /api/pengasuh/pertanyaan': array(ref('Question')), 'GET /api/pengasuh/screening-form': ref('ScreeningForm'),
  'GET /api/pengasuh/skrining/:anakId': array(ref('Screening')), 'GET /api/pengasuh/skrining/detail/:id': ref('Screening'), 'POST /api/pengasuh/skrining': ref('Screening'),
  'GET /api/pengasuh/edukasi': array(ref('Education')), 'GET /api/pengasuh/psikolog': array(ref('Psychologist')), 'GET /api/pengasuh/monitoring/:anakId': ref('Monitoring'), 'GET /api/pengasuh/dashboard': ref('Dashboard'),
}

function successResponses(key, method, success) {
  if (['POST /api/auth/logout', 'POST /api/auth/logout-all'].includes(key)) {
    return { 204: { type: 'null', description: 'No content' } }
  }
  if (key === 'GET /api/health') return { 200: success, 503: success }
  if (['POST /api/auth/login', 'POST /api/auth/refresh', 'POST /api/admin/ambang-batas/reset'].includes(key)) {
    return { 200: success }
  }
  if (key === 'POST /api/pengasuh/skrining') return { 200: success, 201: success }
  return { [method === 'POST' ? 201 : 200]: success }
}

function applyApiContract(app, routeOptions) {
  const method = Array.isArray(routeOptions.method) ? routeOptions.method[0] : routeOptions.method
  const key = `${method} ${routeOptions.url}`
  const success = responseRefs[key]
  if (!success && !['POST /api/auth/logout', 'POST /api/auth/logout-all'].includes(key)) {
    throw new Error(`Missing API response contract for ${key}`)
  }

  routeOptions.schema ||= {}
  if (bodies[key]) routeOptions.schema.body ||= bodies[key]
  if (queries[key]) routeOptions.schema.querystring ||= queries[key]
  if (routeOptions.url.includes('/:anakId')) routeOptions.schema.params ||= childIdParams
  else if (routeOptions.url === '/api/admin/skala/:id') routeOptions.schema.params ||= scaleIdParams
  else if (routeOptions.url.includes('/:id')) routeOptions.schema.params ||= idParams

  routeOptions.schema.response ||= {}
  Object.assign(routeOptions.schema.response, successResponses(key, method, success))
  routeOptions.schema.response.default ||= ref('ErrorResponse')
}

function registerApiSchemas(app) {
  schemas.forEach((schema) => app.addSchema(schema))
}

module.exports = { applyApiContract, bodies, queries, registerApiSchemas, responseRefs, schemas }
