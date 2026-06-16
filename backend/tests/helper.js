const fastify = require('fastify')
const jwt = require('@fastify/jwt')

async function buildApp(opts = {}) {
  const app = fastify({ logger: false })

  await app.register(jwt, { secret: 'test-secret-key' })

  await app.register(require('@fastify/cors'), {
    origin: true,
    credentials: true,
  })

  await app.register(require('@fastify/helmet'))

  await app.addHook('preHandler', require('../src/middleware/sanitize'))

  await app.register(require('@fastify/rate-limit'), {
    max: 100,
    timeWindow: '1 minute',
  })

  await app.register(require('../src/routes/auth/login'))
  await app.register(require('../src/routes/auth/me'))
  await app.register(require('../src/routes/admin/users'))
  await app.register(require('../src/routes/admin/anak'))
  await app.register(require('../src/routes/admin/skala'))
  await app.register(require('../src/routes/admin/pertanyaan'))
  await app.register(require('../src/routes/admin/ambangBatas'))
  await app.register(require('../src/routes/admin/edukasi'))
  await app.register(require('../src/routes/admin/psikolog'))
  await app.register(require('../src/routes/admin/dashboard'))
  await app.register(require('../src/routes/pengasuh/anak'))
  await app.register(require('../src/routes/pengasuh/skala'))
  await app.register(require('../src/routes/pengasuh/pertanyaan'))
  await app.register(require('../src/routes/pengasuh/skrining'))
  await app.register(require('../src/routes/pengasuh/edukasi'))
  await app.register(require('../src/routes/pengasuh/psikolog'))
  await app.register(require('../src/routes/pengasuh/monitoring'))
  await app.register(require('../src/routes/pengasuh/dashboard'))

  await app.ready()
  return app
}

function signToken(app, payload) {
  return app.jwt.sign(payload, { expiresIn: '1h' })
}

module.exports = { buildApp, signToken }
