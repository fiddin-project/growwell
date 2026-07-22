const prisma = require('../../lib/prisma')
const authenticate = require('../../middleware/authenticate')
const requireRole = require('../../middleware/requireRole')
const ROLES = require('../../lib/roles')
const { getScreeningForm } = require('../../services/screeningForm')

async function routes(fastify) {
  fastify.get('/api/pengasuh/screening-form', {
    preHandler: [authenticate, requireRole(ROLES.PENGASUH)],
  }, async (req, reply) => {
    try {
      return reply.send(await getScreeningForm(prisma))
    } catch (err) {
      req.log.error({ err }, 'Gagal mengambil formulir skrining')
      return reply.status(500).send({ error: 'Gagal mengambil formulir skrining' })
    }
  })
}

module.exports = routes
