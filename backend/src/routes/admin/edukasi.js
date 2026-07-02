const prisma = require('../../lib/prisma')
const authenticate = require('../../middleware/authenticate')
const requireRole = require('../../middleware/requireRole')
const validateIdParam = require('../../middleware/validateIdParam')
const ROLES = require('../../lib/roles')
const { getEducationUploadDir } = require('../../lib/uploads')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { pipeline } = require('stream/promises')

const ALLOWED_FIELDS = new Set([
  'judul',
  'judul_en',
  'deskripsi',
  'deskripsi_en',
  'tipe',
  'url_atau_file',
  'is_active',
])
const REQUIRED_FIELDS = ['judul', 'judul_en', 'deskripsi', 'deskripsi_en']
const ALLOWED_YT = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/

class EdukasiRequestError extends Error {
  constructor(statusCode, message) {
    super(message)
    this.statusCode = statusCode
  }
}

function ensureUploadDir(uploadDir) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

function parseIsActive(value) {
  return value === true || value === 'true' || value === 'active'
}

function validateYoutubeUrl(url) {
  return typeof url === 'string' && ALLOWED_YT.test(url.trim())
}

function validateFields(fields, existing = null) {
  for (const field of REQUIRED_FIELDS) {
    if (typeof fields[field] !== 'string' || !fields[field].trim()) {
      throw new EdukasiRequestError(400, 'Judul dan deskripsi dalam Bahasa Indonesia dan Inggris wajib diisi')
    }
    fields[field] = fields[field].trim()
  }

  if (!['pdf', 'youtube'].includes(fields.tipe)) {
    throw new EdukasiRequestError(400, 'Tipe edukasi tidak valid')
  }

  if (fields.tipe === 'youtube') {
    if (!validateYoutubeUrl(fields.url_atau_file)) {
      throw new EdukasiRequestError(400, 'URL YouTube tidak valid')
    }
    fields.url_atau_file = fields.url_atau_file.trim()
  } else if (!fields.uploadedFile && !(existing?.tipe === 'pdf' && existing.url_atau_file)) {
    throw new EdukasiRequestError(400, 'File PDF wajib dipilih')
  }

  fields.is_active = parseIsActive(fields.is_active)
}

async function saveUploadedFile(part, uploadDir) {
  const extension = path.extname(part.filename || '').toLowerCase()
  if (part.mimetype !== 'application/pdf' || extension !== '.pdf') {
    part.file.resume()
    throw new EdukasiRequestError(415, 'Hanya file PDF yang diizinkan')
  }

  ensureUploadDir(uploadDir)
  const filename = `${crypto.randomUUID()}.pdf`
  const filePath = path.join(uploadDir, filename)
  try {
    await pipeline(part.file, fs.createWriteStream(filePath, { flags: 'wx' }))
  } catch (err) {
    deleteFilePath(filePath)
    throw err
  }

  if (part.file.truncated) {
    deleteFilePath(filePath)
    throw new EdukasiRequestError(413, 'Ukuran file PDF maksimal 10 MB')
  }

  return {
    path: filePath,
    url: `/uploads/edukasi/${filename}`,
  }
}

async function parseMultipart(req, uploadDir) {
  if (!req.isMultipart()) {
    throw new EdukasiRequestError(400, 'Request harus menggunakan multipart/form-data')
  }

  const fields = {}
  let uploadedFile = null
  let fileCount = 0

  try {
    for await (const part of req.parts()) {
      if (part.type === 'file') {
        fileCount += 1
        if (fileCount > 1) {
          part.file.resume()
          throw new EdukasiRequestError(400, 'Hanya satu file PDF yang dapat diunggah')
        }
        uploadedFile = await saveUploadedFile(part, uploadDir)
      } else if (part.type === 'field' && ALLOWED_FIELDS.has(part.fieldname)) {
        fields[part.fieldname] = part.value
      }
    }
  } catch (err) {
    if (uploadedFile) deleteFilePath(uploadedFile.path)
    throw err
  }

  fields.uploadedFile = uploadedFile
  return fields
}

function deleteFilePath(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

function deleteUploadedUrl(url, uploadDir) {
  if (!url || !url.startsWith('/uploads/edukasi/')) return
  deleteFilePath(path.join(uploadDir, path.basename(url)))
}

function toDatabaseData(fields) {
  const data = {
    judul: fields.judul,
    judul_en: fields.judul_en,
    deskripsi: fields.deskripsi,
    deskripsi_en: fields.deskripsi_en,
    tipe: fields.tipe,
    is_active: fields.is_active,
  }

  if (fields.tipe === 'youtube') {
    data.url_atau_file = fields.url_atau_file
  } else if (fields.uploadedFile) {
    data.url_atau_file = fields.uploadedFile.url
  }

  return data
}

function sendError(req, reply, err, uploadedFile) {
  if (uploadedFile) deleteFilePath(uploadedFile.path)

  if (err instanceof EdukasiRequestError) {
    return reply.status(err.statusCode).send({ error: err.message })
  }

  if (err.code === 'FST_REQ_FILE_TOO_LARGE' || err.statusCode === 413) {
    return reply.status(413).send({ error: 'Ukuran file PDF maksimal 10 MB' })
  }

  req.log.error({ err }, 'Gagal memproses data edukasi')
  return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
}

async function routes(fastify, opts) {
  const db = opts.prisma || prisma
  const uploadDir = opts.uploadDir || getEducationUploadDir()

  fastify.get(
    '/api/admin/edukasi',
    { preHandler: [authenticate, requireRole(ROLES.ADMIN)] },
    async (req, reply) => {
      try {
        return reply.send(await db.edukasi.findMany())
      } catch (err) {
        req.log.error({ err }, 'Gagal mengambil data edukasi')
        return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
      }
    }
  )

  fastify.post(
    '/api/admin/edukasi',
    { preHandler: [authenticate, requireRole(ROLES.ADMIN)] },
    async (req, reply) => {
      let fields = null
      try {
        fields = await parseMultipart(req, uploadDir)
        validateFields(fields)
        const edukasi = await db.edukasi.create({ data: toDatabaseData(fields) })
        return reply.status(201).send(edukasi)
      } catch (err) {
        return sendError(req, reply, err, fields?.uploadedFile)
      }
    }
  )

  fastify.put(
    '/api/admin/edukasi/:id',
    { preHandler: [authenticate, requireRole(ROLES.ADMIN), validateIdParam] },
    async (req, reply) => {
      let fields = null
      try {
        const id = req.params.id
        const existing = await db.edukasi.findUnique({ where: { id } })
        if (!existing) {
          return reply.status(404).send({ error: 'Data edukasi tidak ditemukan' })
        }

        fields = await parseMultipart(req, uploadDir)
        validateFields(fields, existing)
        const edukasi = await db.edukasi.update({
          where: { id },
          data: toDatabaseData(fields),
        })

        if (existing.tipe === 'pdf' && (fields.uploadedFile || fields.tipe === 'youtube')) {
          deleteUploadedUrl(existing.url_atau_file, uploadDir)
        }
        return reply.send(edukasi)
      } catch (err) {
        return sendError(req, reply, err, fields?.uploadedFile)
      }
    }
  )

  fastify.delete(
    '/api/admin/edukasi/:id',
    { preHandler: [authenticate, requireRole(ROLES.ADMIN), validateIdParam] },
    async (req, reply) => {
      try {
        const id = req.params.id
        const existing = await db.edukasi.findUnique({ where: { id } })
        if (!existing) {
          return reply.status(404).send({ error: 'Data edukasi tidak ditemukan' })
        }

        await db.edukasi.delete({ where: { id } })
        if (existing.tipe === 'pdf') {
          deleteUploadedUrl(existing.url_atau_file, uploadDir)
        }
        return reply.send({ message: 'Data edukasi berhasil dihapus' })
      } catch (err) {
        req.log.error({ err }, 'Gagal menghapus data edukasi')
        return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
      }
    }
  )
}

module.exports = routes
