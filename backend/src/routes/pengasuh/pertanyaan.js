const prisma = require('../../lib/prisma')
const authenticate = require('../../middleware/authenticate')
const requireRole = require('../../middleware/requireRole')
const ROLES = require('../../lib/roles')

async function routes(fastify, opts) {
  fastify.get('/api/pengasuh/pertanyaan', { preHandler: [authenticate, requireRole(ROLES.PENGASUH)] }, async (req, reply) => {
    try {
      const where = {}
      if (req.query.id_skala) {
        where.id_skala = req.query.id_skala
      }
      const questions = await prisma.pertanyaan.findMany({
        where,
        orderBy: { urutan: 'asc' },
        include: { skala: { select: { nama_skala: true, nama_skala_en: true } } },
      })
      return reply.send(questions)
    } catch (err) {
      return reply.status(500).send({ error: 'Gagal mengambil data pertanyaan' })
    }
  })
}

module.exports = routes
