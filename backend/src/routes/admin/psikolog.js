const prisma = require('../../lib/prisma')
const authenticate = require('../../middleware/authenticate')
const requireRole = require('../../middleware/requireRole')
const validateIdParam = require('../../middleware/validateIdParam')
const ROLES = require('../../lib/roles')

async function routes(fastify, opts) {
  fastify.get(
    '/api/admin/psikolog',
    { preHandler: [authenticate, requireRole(ROLES.ADMIN)] },
    async (req, reply) => {
      try {
        const psikologList = await prisma.psikolog.findMany()
        return reply.send(psikologList)
      } catch (err) {
        return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
      }
    }
  )

  fastify.post(
    '/api/admin/psikolog',
    { preHandler: [authenticate, requireRole(ROLES.ADMIN)] },
    async (req, reply) => {
      try {
        const { nama, spesialisasi, spesialisasi_en, nomor_whatsapp, pesan_default, pesan_default_en, is_active } = req.body
        if (!nama || !spesialisasi || !nomor_whatsapp) {
          return reply.status(400).send({ error: 'nama, spesialisasi, dan nomor_whatsapp wajib diisi' })
        }
        if (typeof nama !== 'string' || nama.length < 2 || nama.length > 100) {
          return reply.status(400).send({ error: 'nama harus 2-100 karakter' })
        }
        if (typeof spesialisasi !== 'string' || spesialisasi.length < 2 || spesialisasi.length > 200) {
          return reply.status(400).send({ error: 'spesialisasi harus 2-200 karakter' })
        }
        if (typeof nomor_whatsapp !== 'string' || !/^\+?\d{8,20}$/.test(nomor_whatsapp)) {
          return reply.status(400).send({ error: 'nomor_whatsapp tidak valid' })
        }
        const psikolog = await prisma.psikolog.create({
          data: {
            nama,
            spesialisasi,
            spesialisasi_en,
            nomor_whatsapp,
            pesan_default,
            pesan_default_en,
            is_active: is_active ?? true,
          }
        })
        return reply.status(201).send(psikolog)
      } catch (err) {
        return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
      }
    }
  )

  fastify.put(
    '/api/admin/psikolog/:id',
    { preHandler: [authenticate, requireRole(ROLES.ADMIN), validateIdParam] },
    async (req, reply) => {
      try {
        const { nama, spesialisasi, spesialisasi_en, nomor_whatsapp, pesan_default, pesan_default_en, is_active } = req.body
        const data = {}
        if (nama !== undefined) data.nama = nama
        if (spesialisasi !== undefined) data.spesialisasi = spesialisasi
        if (spesialisasi_en !== undefined) data.spesialisasi_en = spesialisasi_en
        if (nomor_whatsapp !== undefined) data.nomor_whatsapp = nomor_whatsapp
        if (pesan_default !== undefined) data.pesan_default = pesan_default
        if (pesan_default_en !== undefined) data.pesan_default_en = pesan_default_en
        if (is_active !== undefined) data.is_active = is_active

        const psikolog = await prisma.psikolog.update({
          where: { id: req.params.id },
          data,
        })
        return reply.status(200).send(psikolog)
      } catch (err) {
        return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
      }
    }
  )

  fastify.delete(
    '/api/admin/psikolog/:id',
    { preHandler: [authenticate, requireRole(ROLES.ADMIN), validateIdParam] },
    async (req, reply) => {
      try {
        await prisma.psikolog.delete({ where: { id: req.params.id } })
        return reply.send({ message: 'Data psikolog berhasil dihapus' })
      } catch (err) {
        return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
      }
    }
  )
}

module.exports = routes
