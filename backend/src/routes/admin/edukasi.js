const prisma = require('../../lib/prisma')
const authenticate = require('../../middleware/authenticate')
const requireRole = require('../../middleware/requireRole')
const validateIdParam = require('../../middleware/validateIdParam')
const ROLES = require('../../lib/roles')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { pipeline } = require('stream/promises')

const uploadDir = path.join(__dirname, '..', '..', '..', 'uploads', 'edukasi')
const ALLOWED_FIELDS = [
  'judul',
  'judul_en',
  'deskripsi',
  'deskripsi_en',
  'tipe',
  'url_atau_file',
  'is_active',
]

function ensureUploadDir() {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }
}

function parseIsActive(value) {
  return value === 'true' || value === 'active'
}

async function saveUploadedFile(fileData) {
  if (fileData.mimetype !== 'application/pdf') {
    throw new Error('Hanya file PDF yang diizinkan')
  }
  const ext = path.extname(fileData.filename) || '.pdf'
  const filename = crypto.randomUUID() + ext
  const filePath = path.join(uploadDir, filename)
  await pipeline(fileData.file, fs.createWriteStream(filePath))
  return '/uploads/edukasi/' + filename
}

function deleteUploadedFile(url) {
  if (!url || !url.startsWith('/uploads/edukasi/')) return
  const filePath = path.join(uploadDir, path.basename(url))
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

function deleteOldFile(existing) {
  if (existing.url_atau_file && existing.tipe === 'pdf') {
    deleteUploadedFile(existing.url_atau_file)
  }
}

const ALLOWED_YT = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/

function validateEdukasiUrl(url, tipe) {
  if (!url) return true
  if (tipe === 'pdf') return true
  if (tipe === 'youtube') return ALLOWED_YT.test(url)
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

async function routes(fastify, opts) {
  fastify.get(
    '/api/admin/edukasi',
    { preHandler: [authenticate, requireRole(ROLES.ADMIN)] },
    async (req, reply) => {
      try {
        const edukasiList = await prisma.edukasi.findMany()
        return reply.send(edukasiList)
      } catch (err) {
        return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
      }
    }
  )

  fastify.post(
    '/api/admin/edukasi',
    { preHandler: [authenticate, requireRole(ROLES.ADMIN)] },
    async (req, reply) => {
      let uploadedFile = null
      try {
        ensureUploadDir()

        const fields = {}

        for await (const part of req.parts()) {
          if (part.type === 'file') {
            uploadedFile = await saveUploadedFile(part)
          } else if (part.type === 'field' && ALLOWED_FIELDS.includes(part.fieldname)) {
            fields[part.fieldname] = part.value
          }
        }

        if (uploadedFile) {
          fields.url_atau_file = uploadedFile
          fields.tipe = 'pdf'
        }

        if (fields.url_atau_file && !validateEdukasiUrl(fields.url_atau_file, fields.tipe)) {
          return reply.status(400).send({ error: 'URL tidak valid' })
        }

        if (fields.is_active !== undefined) {
          fields.is_active = parseIsActive(fields.is_active)
        }

        const edukasi = await prisma.edukasi.create({
          data: fields,
        })
        return reply.status(201).send(edukasi)
      } catch (err) {
        if (uploadedFile) {
          deleteUploadedFile(uploadedFile)
        }
        return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
      }
    }
  )

  fastify.put(
    '/api/admin/edukasi/:id',
    { preHandler: [authenticate, requireRole(ROLES.ADMIN), validateIdParam] },
    async (req, reply) => {
      let uploadedFile = null
      try {
        const id = req.params.id
        const existing = await prisma.edukasi.findUnique({ where: { id } })
        if (!existing) {
          return reply.status(404).send({ error: 'Data edukasi tidak ditemukan' })
        }

        ensureUploadDir()

        const data = {}

        for await (const part of req.parts()) {
          if (part.type === 'file') {
            uploadedFile = await saveUploadedFile(part)
          } else if (part.type === 'field' && ALLOWED_FIELDS.includes(part.fieldname)) {
            data[part.fieldname] = part.value
          }
        }

        if (uploadedFile) {
          data.url_atau_file = uploadedFile
          data.tipe = 'pdf'
        }

        const finalTipe = data.tipe || existing.tipe
        const finalUrl = data.url_atau_file || existing.url_atau_file
        if (!validateEdukasiUrl(finalUrl, finalTipe)) {
          return reply.status(400).send({ error: 'URL tidak valid' })
        }

        if (data.is_active !== undefined) {
          data.is_active = parseIsActive(data.is_active)
        }

        const edukasi = await prisma.edukasi.update({
          where: { id },
          data,
        })
        if (uploadedFile) {
          deleteOldFile(existing)
        }
        return reply.status(200).send(edukasi)
      } catch (err) {
        if (uploadedFile) {
          deleteUploadedFile(uploadedFile)
        }
        return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
      }
    }
  )

  fastify.delete(
    '/api/admin/edukasi/:id',
    { preHandler: [authenticate, requireRole(ROLES.ADMIN), validateIdParam] },
    async (req, reply) => {
      try {
        const id = req.params.id
        const existing = await prisma.edukasi.findUnique({ where: { id } })
        if (!existing) {
          return reply.status(404).send({ error: 'Data edukasi tidak ditemukan' })
        }

        deleteOldFile(existing)

        await prisma.edukasi.delete({ where: { id } })
        return reply.send({ message: 'Data edukasi berhasil dihapus' })
      } catch (err) {
        return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
      }
    }
  )
}

module.exports = routes
