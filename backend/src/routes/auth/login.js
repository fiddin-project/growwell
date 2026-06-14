const prisma = require('../../lib/prisma')
const bcrypt = require('bcryptjs')

async function routes(fastify, opts) {
  fastify.post('/api/auth/login', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '5 minutes',
      },
    },
  }, async (req, reply) => {
    try {
      const { username, password } = req.body

      const user = await prisma.user.findUnique({ where: { username } })
      if (!user) {
        return reply.status(401).send({ error: 'Username atau password salah' })
      }

      const valid = await bcrypt.compare(password, user.password_hash)
      if (!valid) {
        return reply.status(401).send({ error: 'Username atau password salah' })
      }

      const token = fastify.jwt.sign(
        { id: user.id, role: user.role, nama_lengkap: user.nama_lengkap },
        { expiresIn: '8h' }
      )

      return reply.send({
        token,
        user: {
          id: user.id,
          username: user.username,
          nama_lengkap: user.nama_lengkap,
          role: user.role,
        },
      })
    } catch (err) {
      return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
    }
  })
}

module.exports = routes
