const prisma = require('../../lib/prisma')
const authenticate = require('../../middleware/authenticate')
const requireRole = require('../../middleware/requireRole')
const validateIdParam = require('../../middleware/validateIdParam')
const ROLES = require('../../lib/roles')

async function routes(fastify, opts) {
  fastify.get(
    '/api/admin/anak',
    { preHandler: [authenticate, requireRole(ROLES.ADMIN)] },
    async (req, reply) => {
      try {
        const where = {}
        if (req.query.nama) {
          where.nama = { contains: req.query.nama }
        }
        const anakList = await prisma.anak.findMany({
          where,
        })
        return reply.send(anakList)
      } catch (err) {
        return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
      }
    }
  )

  fastify.post(
    '/api/admin/anak',
    { preHandler: [authenticate, requireRole(ROLES.ADMIN)] },
    async (req, reply) => {
      try {
        const { nama, tanggal_lahir, jenis_kelamin } = req.body
        const anak = await prisma.anak.create({
          data: {
            nama,
            tanggal_lahir: new Date(tanggal_lahir),
            jenis_kelamin,
            created_by: req.user.id,
            created_by_admin: true,
          },
        })
        return reply.status(201).send(anak)
      } catch (err) {
        return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
      }
    }
  )

  fastify.put(
    '/api/admin/anak/:id',
    { preHandler: [authenticate, requireRole(ROLES.ADMIN), validateIdParam] },
    async (req, reply) => {
      try {
        const id = req.params.id
        const data = {}
        if (req.body.nama) data.nama = req.body.nama
        if (req.body.tanggal_lahir) data.tanggal_lahir = new Date(req.body.tanggal_lahir)
        if (req.body.jenis_kelamin) data.jenis_kelamin = req.body.jenis_kelamin

        const anak = await prisma.anak.update({
          where: { id },
          data,
        })
        return reply.status(200).send(anak)
      } catch (err) {
        return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
      }
    }
  )

  fastify.delete(
    '/api/admin/anak/:id',
    { preHandler: [authenticate, requireRole(ROLES.ADMIN), validateIdParam] },
    async (req, reply) => {
      try {
        const id = req.params.id

        const skriningCount = await prisma.skrining.count({ where: { anak_id: id } })
        if (skriningCount > 0) {
          return reply.status(400).send({ error: 'Tidak dapat menghapus data anak yang sudah memiliki riwayat skrining' })
        }

        await prisma.anak.delete({ where: { id } })
        return reply.send({ message: 'Data anak berhasil dihapus' })
      } catch (err) {
        return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
      }
    }
  )
}

module.exports = routes
