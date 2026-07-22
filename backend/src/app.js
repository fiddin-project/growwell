const fastifyFactory = require('fastify')
const prisma = require('./lib/prisma')
const { MAX_UPLOAD_SIZE, getUploadRoot } = require('./lib/uploads')
const registerOpenApi = require('./plugins/openapi')
const errorEnvelope = require('./plugins/errorEnvelope')

const routePlugins = [
  require('./routes/health'),
  require('./routes/auth/login'),
  require('./routes/auth/session'),
  require('./routes/auth/me'),
  require('./routes/admin/users'),
  require('./routes/admin/skala'),
  require('./routes/admin/pertanyaan'),
  require('./routes/admin/ambangBatas'),
  require('./routes/admin/anak'),
  require('./routes/admin/edukasi'),
  require('./routes/admin/psikolog'),
  require('./routes/admin/dashboard'),
  require('./routes/pengasuh/anak'),
  require('./routes/pengasuh/skala'),
  require('./routes/pengasuh/pertanyaan'),
  require('./routes/pengasuh/screeningForm'),
  require('./routes/pengasuh/skrining'),
  require('./routes/pengasuh/edukasi'),
  require('./routes/pengasuh/psikolog'),
  require('./routes/pengasuh/monitoring'),
  require('./routes/pengasuh/dashboard'),
]

async function buildApp(options = {}) {
  const jwtSecret = options.jwtSecret || process.env.JWT_SECRET
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not set')
  }
  if (process.env.NODE_ENV === 'production' && !process.env.PUBLIC_BASE_URL) {
    throw new Error('PUBLIC_BASE_URL environment variable is not set')
  }

  const app = fastifyFactory({
    logger: options.logger ?? true,
    trustProxy: options.trustProxy ?? process.env.NODE_ENV === 'production',
  })

  await app.register(require('@fastify/cors'), {
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
      : ['http://localhost:5173'],
    credentials: true,
  })

  await app.register(require('@fastify/helmet'))
  await app.register(require('@fastify/cookie'))
  await registerOpenApi(app)
  app.addHook('onSend', errorEnvelope)
  app.addHook('preHandler', require('./middleware/sanitize'))
  await app.register(require('@fastify/jwt'), { secret: jwtSecret })
  await app.register(require('@fastify/rate-limit'), {
    max: 100,
    timeWindow: '1 minute',
  })
  await app.register(require('@fastify/multipart'), {
    limits: { fileSize: MAX_UPLOAD_SIZE },
  })
  await app.register(require('@fastify/static'), {
    root: options.uploadRoot || getUploadRoot(),
    prefix: '/uploads/',
  })

  for (const plugin of routePlugins) {
    await app.register(plugin, { prisma: options.prisma || prisma })
  }
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_API_DOCS !== 'true') {
    await app.register(require('./routes/documentation'))
  }

  await app.ready()
  return app
}

module.exports = { buildApp, routePlugins }
