const defaultPrisma = require('../lib/prisma')

async function routes(fastify, options) {
  const prisma = options.prisma || defaultPrisma

  fastify.get('/api/health', async (req, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`
      return reply.send({ status: 'ok', database: 'ok' })
    } catch (error) {
      req.log.error({ err: error }, 'Health database check failed')
      return reply.status(503).send({ status: 'error', database: 'unavailable' })
    }
  })
}

module.exports = routes
