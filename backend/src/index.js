require('dotenv').config()

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set.')
  process.exit(1)
}

const fastify = require('fastify')({ logger: true })
const path = require('path')

fastify.register(require('@fastify/cors'), {
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173'],
  credentials: true,
})

fastify.register(require('@fastify/helmet'))

fastify.addHook('preHandler', require('./middleware/sanitize'))

fastify.register(require('@fastify/jwt'), {
  secret: process.env.JWT_SECRET,
})

fastify.register(require('@fastify/rate-limit'), {
  max: 100,
  timeWindow: '1 minute',
})

fastify.register(require('@fastify/multipart'), {
  limits: { fileSize: 10 * 1024 * 1024 },
})

fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads'),
  prefix: '/uploads/',
})

fastify.register(require('./routes/auth/login'))
fastify.register(require('./routes/auth/me'))
fastify.register(require('./routes/admin/users'))
fastify.register(require('./routes/admin/skala'))
fastify.register(require('./routes/admin/pertanyaan'))
fastify.register(require('./routes/admin/ambangBatas'))
fastify.register(require('./routes/admin/anak'))
fastify.register(require('./routes/admin/edukasi'))
fastify.register(require('./routes/admin/psikolog'))
fastify.register(require('./routes/admin/dashboard'))
fastify.register(require('./routes/pengasuh/anak'))
fastify.register(require('./routes/pengasuh/skala'))
fastify.register(require('./routes/pengasuh/pertanyaan'))
fastify.register(require('./routes/pengasuh/skrining'))
fastify.register(require('./routes/pengasuh/edukasi'))
fastify.register(require('./routes/pengasuh/psikolog'))
fastify.register(require('./routes/pengasuh/monitoring'))
fastify.register(require('./routes/pengasuh/dashboard'))

const PORT = process.env.PORT || 3001

fastify.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  console.log(`Server running on port ${PORT}`)
})
