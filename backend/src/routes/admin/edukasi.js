const prisma = require('../../lib/prisma')
const authenticate = require('../../middleware/authenticate')
const requireRole = require('../../middleware/requireRole')
const validateIdParam = require('../../middleware/validateIdParam')
const ROLES = require('../../lib/roles')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const uploadDir = path.join(__dirname, '..', '..', '..', 'uploads', 'edukasi')

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
  const writeStream = fs.createWriteStream(filePath)
  await new Promise((resolve, reject) => {
    fileData.file.pipe(writeStream)
    fileData.file.on('end', resolve)
    fileData.file.on('error', reject)
  })
  return '/uploads/edukasi/' + filename
}

function deleteOldFile(existing) {
  if (existing.url_atau_file && existing.tipe === 'pdf') {
    const oldPath = path.join(__dirname, '..', '..', '..', existing.url_atau_file)
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath)
    }
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
      try {
        ensureUploadDir()

        const fields = {}
        let fileData = null
        const allowedFields = ['judul', 'deskripsi', 'tipe', 'url_atau_file', 'is_active']

        for await (const part of req.parts()) {
          if (part.type === 'file') {
            fileData = part
          } else if (part.type === 'field' && allowedFields.includes(part.fieldname)) {
            fields[part.fieldname] = part.value
          }
        }

        if (fileData) {
          fields.url_atau_file = await saveUploadedFile(fileData)
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
        return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
      }
    }
  )

  fastify.put(
    '/api/admin/edukasi/:id',
    { preHandler: [authenticate, requireRole(ROLES.ADMIN), validateIdParam] },
    async (req, reply) => {
      try {
        const id = req.params.id
        const existing = await prisma.edukasi.findUnique({ where: { id } })
        if (!existing) {
          return reply.status(404).send({ error: 'Data edukasi tidak ditemukan' })
        }

        ensureUploadDir()

        const data = {}
        let fileData = null
        const allowedFields = ['judul', 'deskripsi', 'tipe', 'url_atau_file', 'is_active']

        for await (const part of req.parts()) {
          if (part.type === 'file') {
            fileData = part
          } else if (part.type === 'field' && allowedFields.includes(part.fieldname)) {
            data[part.fieldname] = part.value
          }
        }

        if (fileData) {
          deleteOldFile(existing)
          data.url_atau_file = await saveUploadedFile(fileData)
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
        return reply.status(200).send(edukasi)
      } catch (err) {
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
