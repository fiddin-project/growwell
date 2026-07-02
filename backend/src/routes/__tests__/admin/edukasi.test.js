const fastify = require('fastify')
const jwt = require('@fastify/jwt')
const multipart = require('@fastify/multipart')
const fs = require('fs')
const os = require('os')
const path = require('path')
const edukasiRoutes = require('../../admin/edukasi')

function multipartPayload(fields, files = []) {
  const boundary = `----growwell-${Date.now()}-${Math.random()}`
  const chunks = []

  for (const [name, value] of Object.entries(fields)) {
    chunks.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`
    ))
  }

  for (const file of files) {
    chunks.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${file.filename}"\r\n` +
      `Content-Type: ${file.mimetype}\r\n\r\n`
    ))
    chunks.push(file.content)
    chunks.push(Buffer.from('\r\n'))
  }

  chunks.push(Buffer.from(`--${boundary}--\r\n`))
  const payload = Buffer.concat(chunks)
  return {
    payload,
    headers: {
      'content-type': `multipart/form-data; boundary=${boundary}`,
      'content-length': String(payload.length),
    },
  }
}

function validFields(overrides = {}) {
  return {
    judul: 'Panduan Anak',
    judul_en: 'Child Guide',
    deskripsi: 'Deskripsi Indonesia',
    deskripsi_en: 'English description',
    tipe: 'pdf',
    is_active: 'true',
    ...overrides,
  }
}

function pdfFile(content = Buffer.from('%PDF-1.4 test')) {
  return { filename: 'panduan.pdf', mimetype: 'application/pdf', content }
}

async function buildTestApp(db, uploadDir, fileSize = 10 * 1024 * 1024) {
  const app = fastify({ logger: false })
  await app.register(jwt, { secret: 'test-secret-key' })
  await app.register(multipart, { limits: { fileSize } })
  await app.register(edukasiRoutes, { prisma: db, uploadDir })
  await app.ready()
  return app
}

function createDb() {
  return {
    edukasi: {
      findMany: vi.fn(async () => []),
      findUnique: vi.fn(async () => null),
      create: vi.fn(async ({ data }) => ({ id: 1, ...data })),
      update: vi.fn(async ({ where, data }) => ({ id: where.id, ...data })),
      delete: vi.fn(async () => ({})),
    },
  }
}

function authHeaders(app, headers) {
  const token = app.jwt.sign({ id: 1, role: 'ADMIN' })
  return { ...headers, authorization: `Bearer ${token}` }
}

describe('Admin edukasi PDF upload', () => {
  let uploadDir
  let app
  let db

  beforeEach(async () => {
    uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'growwell-edukasi-'))
    db = createDb()
    app = await buildTestApp(db, uploadDir)
  })

  afterEach(async () => {
    await app.close()
    fs.rmSync(uploadDir, { recursive: true, force: true })
  })

  it('stores a valid PDF and all bilingual fields', async () => {
    const request = multipartPayload(validFields(), [pdfFile()])
    const response = await app.inject({
      method: 'POST',
      url: '/api/admin/edukasi',
      headers: authHeaders(app, request.headers),
      payload: request.payload,
    })

    expect(response.statusCode).toBe(201)
    const data = db.edukasi.create.mock.calls[0][0].data
    expect(data).toMatchObject({
      judul: 'Panduan Anak',
      judul_en: 'Child Guide',
      deskripsi: 'Deskripsi Indonesia',
      deskripsi_en: 'English description',
      tipe: 'pdf',
      is_active: true,
    })
    expect(data.url_atau_file).toMatch(/^\/uploads\/edukasi\/.+\.pdf$/)
    expect(fs.readdirSync(uploadDir)).toHaveLength(1)
  })

  it('rejects a PDF create request without a file', async () => {
    const request = multipartPayload(validFields())
    const response = await app.inject({
      method: 'POST',
      url: '/api/admin/edukasi',
      headers: authHeaders(app, request.headers),
      payload: request.payload,
    })

    expect(response.statusCode).toBe(400)
    expect(db.edukasi.create).not.toHaveBeenCalled()
  })

  it('rejects non-PDF files with 415', async () => {
    const request = multipartPayload(validFields(), [
      { filename: 'panduan.txt', mimetype: 'text/plain', content: Buffer.from('not pdf') },
    ])
    const response = await app.inject({
      method: 'POST',
      url: '/api/admin/edukasi',
      headers: authHeaders(app, request.headers),
      payload: request.payload,
    })

    expect(response.statusCode).toBe(415)
    expect(fs.readdirSync(uploadDir)).toHaveLength(0)
  })

  it('rejects files over the configured multipart limit with 413', async () => {
    await app.close()
    app = await buildTestApp(db, uploadDir, 16)
    const request = multipartPayload(validFields(), [pdfFile(Buffer.from('%PDF-' + 'x'.repeat(100)))])
    const response = await app.inject({
      method: 'POST',
      url: '/api/admin/edukasi',
      headers: authHeaders(app, request.headers),
      payload: request.payload,
    })

    expect(response.statusCode).toBe(413)
    expect(fs.readdirSync(uploadDir)).toHaveLength(0)
  })

  it('rejects multiple files and removes the first file', async () => {
    const request = multipartPayload(validFields(), [pdfFile(), pdfFile()])
    const response = await app.inject({
      method: 'POST',
      url: '/api/admin/edukasi',
      headers: authHeaders(app, request.headers),
      payload: request.payload,
    })

    expect(response.statusCode).toBe(400)
    expect(fs.readdirSync(uploadDir)).toHaveLength(0)
  })

  it('removes a new file when database creation fails', async () => {
    db.edukasi.create.mockRejectedValueOnce(new Error('database unavailable'))
    const request = multipartPayload(validFields(), [pdfFile()])
    const response = await app.inject({
      method: 'POST',
      url: '/api/admin/edukasi',
      headers: authHeaders(app, request.headers),
      payload: request.payload,
    })

    expect(response.statusCode).toBe(500)
    expect(fs.readdirSync(uploadDir)).toHaveLength(0)
  })

  it('keeps the old PDF and removes the new file when update fails', async () => {
    const oldName = 'old.pdf'
    fs.writeFileSync(path.join(uploadDir, oldName), 'old PDF')
    db.edukasi.findUnique.mockResolvedValueOnce({
      id: 7,
      tipe: 'pdf',
      url_atau_file: `/uploads/edukasi/${oldName}`,
    })
    db.edukasi.update.mockRejectedValueOnce(new Error('database unavailable'))
    const request = multipartPayload(validFields(), [pdfFile()])
    const response = await app.inject({
      method: 'PUT',
      url: '/api/admin/edukasi/7',
      headers: authHeaders(app, request.headers),
      payload: request.payload,
    })

    expect(response.statusCode).toBe(500)
    expect(fs.readdirSync(uploadDir)).toEqual([oldName])
  })

  it('replaces the old PDF only after a successful update', async () => {
    const oldName = 'old.pdf'
    fs.writeFileSync(path.join(uploadDir, oldName), 'old PDF')
    db.edukasi.findUnique.mockResolvedValueOnce({
      id: 7,
      tipe: 'pdf',
      url_atau_file: `/uploads/edukasi/${oldName}`,
    })
    const request = multipartPayload(validFields(), [pdfFile()])
    const response = await app.inject({
      method: 'PUT',
      url: '/api/admin/edukasi/7',
      headers: authHeaders(app, request.headers),
      payload: request.payload,
    })

    expect(response.statusCode).toBe(200)
    const files = fs.readdirSync(uploadDir)
    expect(files).toHaveLength(1)
    expect(files[0]).not.toBe(oldName)
  })
})
