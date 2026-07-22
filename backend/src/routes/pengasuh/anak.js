const prisma = require('../../lib/prisma')
const authenticate = require('../../middleware/authenticate')
const requireRole = require('../../middleware/requireRole')
const validateIdParam = require('../../middleware/validateIdParam')
const ROLES = require('../../lib/roles')

async function routes(fastify, opts) {
  fastify.get('/api/pengasuh/anak', { preHandler: [authenticate, requireRole(ROLES.PENGASUH)] }, async (req, reply) => {
    try {
      const anak = await prisma.anak.findMany({
        include: {
          pembuat: {
            select: { id: true, nama_lengkap: true, role: true },
          },
        },
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      })
      return reply.send(anak.map(({ pembuat, ...item }) => ({ ...item, creator: pembuat })))
    } catch (err) {
      return reply.status(500).send({ error: 'Gagal mengambil data anak' })
    }
  })

  fastify.post('/api/pengasuh/anak', { preHandler: [authenticate, requireRole(ROLES.PENGASUH)] }, async (req, reply) => {
    try {
      const { nama, tanggal_lahir, jenis_kelamin } = req.body

      if (!nama || !tanggal_lahir || !jenis_kelamin) {
        return reply.status(400).send({ error: 'nama, tanggal_lahir, dan jenis_kelamin wajib diisi' })
      }

      if (typeof nama !== 'string' || nama.length < 1 || nama.length > 100) {
        return reply.status(400).send({ error: 'nama harus 1-100 karakter' })
      }

      if (!['L', 'P'].includes(jenis_kelamin)) {
        return reply.status(400).send({ error: 'jenis_kelamin harus L atau P' })
      }

      const anak = await prisma.anak.create({
        data: {
          nama,
          tanggal_lahir: new Date(tanggal_lahir),
          jenis_kelamin,
          created_by: req.user.id,
          created_by_admin: false,
        },
      })

      return reply.status(201).send(anak)
    } catch (err) {
      return reply.status(500).send({ error: 'Gagal menambahkan data anak' })
    }
  })

  fastify.put('/api/pengasuh/anak/:id', { preHandler: [authenticate, requireRole(ROLES.PENGASUH), validateIdParam] }, async (req, reply) => {
    try {
      const { id } = req.params
      const { nama, tanggal_lahir, jenis_kelamin } = req.body

      const existing = await prisma.anak.findUnique({ where: { id: parseInt(id) } })
      if (!existing) {
        return reply.status(404).send({ error: 'Data anak tidak ditemukan' })
      }
      const updateData = {}
      if (nama !== undefined) updateData.nama = nama
      if (tanggal_lahir !== undefined) updateData.tanggal_lahir = new Date(tanggal_lahir)
      if (jenis_kelamin !== undefined) {
        if (!['L', 'P'].includes(jenis_kelamin)) {
          return reply.status(400).send({ error: 'jenis_kelamin harus L atau P' })
        }
        updateData.jenis_kelamin = jenis_kelamin
      }

      const anak = await prisma.anak.update({
        where: { id: parseInt(id) },
        data: updateData,
      })

      return reply.send(anak)
    } catch (err) {
      return reply.status(500).send({ error: 'Gagal memperbarui data anak' })
    }
  })

  fastify.delete('/api/pengasuh/anak/:id', { preHandler: [authenticate, requireRole(ROLES.PENGASUH), validateIdParam] }, async (req, reply) => {
    try {
      const { id } = req.params

      const existing = await prisma.anak.findUnique({ where: { id: parseInt(id) } })
      if (!existing) {
        return reply.status(404).send({ error: 'Data anak tidak ditemukan' })
      }
      const skriningCount = await prisma.skrining.count({ where: { anak_id: parseInt(id) } })
      if (skriningCount > 0) {
        return reply.status(400).send({ error: 'Tidak dapat menghapus data anak yang sudah memiliki riwayat skrining' })
      }

      await prisma.anak.delete({ where: { id: parseInt(id) } })
      return reply.send({ message: 'Data anak berhasil dihapus' })
    } catch (err) {
      return reply.status(500).send({ error: 'Gagal menghapus data anak' })
    }
  })
}

module.exports = routes
