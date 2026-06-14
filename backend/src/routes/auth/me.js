const prisma = require('../../lib/prisma')
const authenticate = require('../../middleware/authenticate')

async function routes(fastify, opts) {
  fastify.get('/api/auth/me', { preHandler: [authenticate] }, async (req, reply) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, username: true, nama_lengkap: true, role: true, created_at: true },
      })
      return reply.send(user)
    } catch (err) {
      return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
    }
  })
}

module.exports = routes
