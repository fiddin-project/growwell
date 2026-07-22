const prisma = require('../../lib/prisma')
const authenticate = require('../../middleware/authenticate')
const requireRole = require('../../middleware/requireRole')
const ROLES = require('../../lib/roles')
const { educationResponse } = require('../../lib/publicUrls')

async function routes(fastify, opts) {
  fastify.get('/api/pengasuh/edukasi', { preHandler: [authenticate, requireRole(ROLES.PENGASUH)] }, async (req, reply) => {
    try {
      const edukasi = await prisma.edukasi.findMany({
        where: { is_active: true },
        orderBy: { created_at: 'desc' },
      })
      return reply.send(edukasi.map(educationResponse))
    } catch (err) {
      return reply.status(500).send({ error: 'Gagal mengambil data edukasi' })
    }
  })
}

module.exports = routes
