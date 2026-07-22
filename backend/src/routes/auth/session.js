const prisma = require('../../lib/prisma')
const authenticate = require('../../middleware/authenticate')
const { signAccessToken } = require('../../lib/authTokens')
const {
  clearRefreshCookie,
  getPresentedRefreshToken,
  isAndroidClient,
  setRefreshCookie,
} = require('../../lib/authCookies')
const {
  revokePresentedSession,
  rotateRefreshSession,
} = require('../../services/authSessions')

function userPayload(user) {
  return {
    id: user.id,
    username: user.username,
    nama_lengkap: user.nama_lengkap,
    role: user.role,
  }
}

async function routes(fastify) {
  fastify.post('/api/auth/refresh', async (req, reply) => {
    const presentedToken = getPresentedRefreshToken(req)
    if (!presentedToken) {
      clearRefreshCookie(reply)
      return reply.status(401).send({ error: 'Sesi tidak valid', code: 'REFRESH_TOKEN_MISSING' })
    }

    try {
      const rotated = await rotateRefreshSession(prisma, presentedToken, req)
      if (rotated.error) {
        clearRefreshCookie(reply)
        return reply.status(401).send({ error: 'Sesi tidak valid atau telah berakhir', code: `REFRESH_TOKEN_${rotated.error}` })
      }

      const { token, expiresIn } = signAccessToken(fastify, rotated.user)
      const android = isAndroidClient(req)
      if (!android) setRefreshCookie(reply, rotated.refreshToken)

      const response = {
        token,
        access_token: token,
        token_type: 'Bearer',
        expires_in: expiresIn,
        user: userPayload(rotated.user),
      }
      if (android) response.refresh_token = rotated.refreshToken
      return reply.send(response)
    } catch (err) {
      req.log.error({ err }, 'Refresh session failed')
      return reply.status(500).send({ error: 'Terjadi kesalahan pada server', code: 'INTERNAL_ERROR' })
    }
  })

  fastify.post('/api/auth/logout', async (req, reply) => {
    try {
      await revokePresentedSession(prisma, getPresentedRefreshToken(req))
    } catch (err) {
      req.log.error({ err }, 'Logout revoke failed')
    } finally {
      clearRefreshCookie(reply)
    }
    return reply.status(204).send()
  })

  fastify.post('/api/auth/logout-all', { preHandler: [authenticate] }, async (req, reply) => {
    try {
      await prisma.refreshSession.updateMany({
        where: { user_id: req.user.id, revoked_at: null },
        data: { revoked_at: new Date() },
      })
      clearRefreshCookie(reply)
      return reply.status(204).send()
    } catch (err) {
      req.log.error({ err }, 'Logout all failed')
      return reply.status(500).send({ error: 'Terjadi kesalahan pada server', code: 'INTERNAL_ERROR' })
    }
  })
}

module.exports = routes
