const prisma = require('../../lib/prisma')
const authenticate = require('../../middleware/authenticate')
const requireRole = require('../../middleware/requireRole')
const ROLES = require('../../lib/roles')

async function routes(fastify, opts) {
  fastify.get('/api/pengasuh/skala', { preHandler: [authenticate, requireRole(ROLES.PENGASUH)] }, async (req, reply) => {
    try {
      const skala = await prisma.skala.findMany()
      return reply.send(skala)
    } catch (err) {
      return reply.status(500).send({ error: 'Gagal mengambil data skala' })
    }
  })
}

module.exports = routes
