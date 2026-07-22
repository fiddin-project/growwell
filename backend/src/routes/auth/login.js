const prisma = require('../../lib/prisma')
const bcrypt = require('bcryptjs')
const { signAccessToken } = require('../../lib/authTokens')
const { setRefreshCookie } = require('../../lib/authCookies')
const { createRefreshSession } = require('../../services/authSessions')

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
      const { username, password, client_type = 'web' } = req.body || {}

      if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
        return reply.status(400).send({ error: 'Username dan password wajib diisi', code: 'INVALID_LOGIN_REQUEST' })
      }
      if (!['web', 'android'].includes(client_type)) {
        return reply.status(400).send({ error: 'client_type tidak valid', code: 'INVALID_CLIENT_TYPE' })
      }

      const user = await prisma.user.findUnique({ where: { username } })
      if (!user) {
        return reply.status(401).send({ error: 'Username atau password salah' })
      }

      const valid = await bcrypt.compare(password, user.password_hash)
      if (!valid) {
        return reply.status(401).send({ error: 'Username atau password salah' })
      }

      const { token, expiresIn } = signAccessToken(fastify, user)
      const { refreshToken } = await createRefreshSession(prisma, user.id, req)

      if (client_type === 'web') {
        setRefreshCookie(reply, refreshToken)
      }

      const response = {
        token,
        access_token: token,
        token_type: 'Bearer',
        expires_in: expiresIn,
        user: {
          id: user.id,
          username: user.username,
          nama_lengkap: user.nama_lengkap,
          role: user.role,
        },
      }
      if (client_type === 'android') response.refresh_token = refreshToken
      return reply.send(response)
    } catch (err) {
      req.log.error({ err }, 'Login failed')
      return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
    }
  })
}

module.exports = routes
