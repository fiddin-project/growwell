const prisma = require('../../lib/prisma')
const authenticate = require('../../middleware/authenticate')
const requireRole = require('../../middleware/requireRole')
const ROLES = require('../../lib/roles')

async function routes(fastify, opts) {
  fastify.get(
    '/api/admin/skala',
    { preHandler: [authenticate, requireRole(ROLES.ADMIN)] },
    async (req, reply) => {
      try {
        const { search } = req.query
        const where = search
          ? {
              OR: [
                { id_skala: { contains: search } },
                { nama_skala: { contains: search } },
                { nama_skala_en: { contains: search } },
              ],
            }
          : {}
        const scales = await prisma.skala.findMany({ where })
        return reply.send(scales)
      } catch (err) {
        return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
      }
    }
  )

  fastify.post(
    '/api/admin/skala',
    { preHandler: [authenticate, requireRole(ROLES.ADMIN)] },
    async (req, reply) => {
      try {
        const { id_skala, nama_skala, nama_skala_en } = req.body
        const scale = await prisma.skala.create({
          data: { id_skala, nama_skala, nama_skala_en },
        })
        return reply.status(201).send(scale)
      } catch (err) {
        return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
      }
    }
  )

  fastify.put(
    '/api/admin/skala/:id',
    { preHandler: [authenticate, requireRole(ROLES.ADMIN)] },
    async (req, reply) => {
      try {
        const { nama_skala, nama_skala_en } = req.body
        const scale = await prisma.skala.update({
          where: { id_skala: req.params.id },
          data: { nama_skala, nama_skala_en },
        })
        return reply.status(200).send(scale)
      } catch (err) {
        return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
      }
    }
  )

  fastify.delete(
    '/api/admin/skala/:id',
    { preHandler: [authenticate, requireRole(ROLES.ADMIN)] },
    async (req, reply) => {
      try {
        const pertanyaanCount = await prisma.pertanyaan.count({
          where: { id_skala: req.params.id },
        })
        if (pertanyaanCount > 0) {
          return reply.status(400).send({ error: 'Tidak dapat menghapus skala yang masih memiliki pertanyaan' })
        }

        await prisma.skala.delete({ where: { id_skala: req.params.id } })
        return reply.send({ message: 'Skala berhasil dihapus' })
      } catch (err) {
        return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
      }
    }
  )
}

module.exports = routes
