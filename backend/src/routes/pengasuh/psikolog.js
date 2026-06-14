const prisma = require('../../lib/prisma')
const authenticate = require('../../middleware/authenticate')
const requireRole = require('../../middleware/requireRole')
const ROLES = require('../../lib/roles')

async function routes(fastify, opts) {
  fastify.get('/api/pengasuh/psikolog', { preHandler: [authenticate, requireRole(ROLES.PENGASUH)] }, async (req, reply) => {
    try {
      const psikolog = await prisma.psikolog.findMany({
        where: { is_active: true },
      })
      return reply.send(psikolog)
    } catch (err) {
      return reply.status(500).send({ error: 'Gagal mengambil data psikolog' })
    }
  })
}

module.exports = routes
