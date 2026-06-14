const prisma = require('../../lib/prisma')
const authenticate = require('../../middleware/authenticate')
const requireRole = require('../../middleware/requireRole')
const validateIdParam = require('../../middleware/validateIdParam')
const ROLES = require('../../lib/roles')

async function routes(fastify, opts) {
  fastify.get(
    '/api/admin/pertanyaan',
    { preHandler: [authenticate, requireRole(ROLES.ADMIN)] },
    async (req, reply) => {
      try {
        const where = {}
        if (req.query.id_skala) {
          where.id_skala = req.query.id_skala
        }
        const questions = await prisma.pertanyaan.findMany({
          where,
          orderBy: { urutan: 'asc' },
          include: { skala: { select: { nama_skala: true } } },
        })
        return reply.send(questions)
      } catch (err) {
        return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
      }
    }
  )

  fastify.post(
    '/api/admin/pertanyaan',
    { preHandler: [authenticate, requireRole(ROLES.ADMIN)] },
    async (req, reply) => {
      try {
        const { urutan, teks_pertanyaan, teks_pertanyaan_en, id_skala, skor_tidak_benar, skor_agak_benar, skor_selalu_benar } = req.body
        if (!teks_pertanyaan || !id_skala) {
          return reply.status(400).send({ error: 'teks_pertanyaan dan id_skala wajib diisi' })
        }
        const question = await prisma.pertanyaan.create({
          data: {
            urutan: urutan !== undefined ? parseInt(urutan) : 0,
            teks_pertanyaan,
            teks_pertanyaan_en,
            id_skala,
            skor_tidak_benar: parseInt(skor_tidak_benar),
            skor_agak_benar: parseInt(skor_agak_benar),
            skor_selalu_benar: parseInt(skor_selalu_benar),
          }
        })
        return reply.status(201).send(question)
      } catch (err) {
        return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
      }
    }
  )

  fastify.put(
    '/api/admin/pertanyaan/:id',
    { preHandler: [authenticate, requireRole(ROLES.ADMIN), validateIdParam] },
    async (req, reply) => {
      try {
        const { urutan, teks_pertanyaan, teks_pertanyaan_en, skor_tidak_benar, skor_agak_benar, skor_selalu_benar } = req.body
        const data = {}
        if (urutan !== undefined) data.urutan = parseInt(urutan)
        if (teks_pertanyaan !== undefined) data.teks_pertanyaan = teks_pertanyaan
        if (teks_pertanyaan_en !== undefined) data.teks_pertanyaan_en = teks_pertanyaan_en
        if (skor_tidak_benar !== undefined) data.skor_tidak_benar = parseInt(skor_tidak_benar)
        if (skor_agak_benar !== undefined) data.skor_agak_benar = parseInt(skor_agak_benar)
        if (skor_selalu_benar !== undefined) data.skor_selalu_benar = parseInt(skor_selalu_benar)

        const question = await prisma.pertanyaan.update({
          where: { id: req.params.id },
          data,
        })
        return reply.status(200).send(question)
      } catch (err) {
        return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
      }
    }
  )

  fastify.delete(
    '/api/admin/pertanyaan/:id',
    { preHandler: [authenticate, requireRole(ROLES.ADMIN), validateIdParam] },
    async (req, reply) => {
      try {
        await prisma.pertanyaan.delete({ where: { id: req.params.id } })
        return reply.send({ message: 'Pertanyaan berhasil dihapus' })
      } catch (err) {
        return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
      }
    }
  )
}

module.exports = routes
