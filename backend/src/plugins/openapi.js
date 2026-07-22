const swagger = require('@fastify/swagger')
const swaggerUi = require('@fastify/swagger-ui')
const { applyApiContract, registerApiSchemas } = require('./apiContract')

const PUBLIC_ROUTES = new Set([
  'GET /api/health',
  'POST /api/auth/login',
  'POST /api/auth/refresh',
  'POST /api/auth/logout',
])

function operationId(method, url) {
  const words = `${method.toLowerCase()} ${url}`
    .replace(/[:{}]/g, ' ')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
  return words[0] + words.slice(1).map((word) => word[0].toUpperCase() + word.slice(1)).join('')
}

function tagFor(url) {
  if (url === '/api/health') return ['Health']
  if (url.startsWith('/api/auth/')) return ['Auth']
  if (url.startsWith('/api/admin/')) return ['Admin']
  if (url.startsWith('/api/pengasuh/')) return ['Pengasuh']
  return ['Internal']
}

async function registerOpenApi(app) {
  registerApiSchemas(app)
  await app.register(swagger, {
    refResolver: {
      buildLocalReference(json, _baseUri, _fragment, index) {
        return json.$id || `def-${index}`
      },
    },
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'GrowWell API',
        description: 'API version 1 for GrowWell web and native Android clients.',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          refreshCookie: { type: 'apiKey', in: 'cookie', name: 'growwell_refresh' },
        },
      },
      tags: [
        { name: 'Health' },
        { name: 'Auth' },
        { name: 'Admin' },
        { name: 'Pengasuh' },
      ],
    },
  })

  app.addHook('onRoute', (routeOptions) => {
    const url = routeOptions.url
    if (!url?.startsWith('/api/')) return
    const method = Array.isArray(routeOptions.method) ? routeOptions.method[0] : routeOptions.method
    if (method === 'HEAD') return
    const key = `${method} ${url}`
    applyApiContract(app, routeOptions)
    routeOptions.schema ||= {}
    routeOptions.schema.operationId ||= operationId(method, url)
    routeOptions.schema.tags ||= tagFor(url)
    if (!PUBLIC_ROUTES.has(key)) routeOptions.schema.security ||= [{ bearerAuth: [] }]
  })

  if (process.env.ENABLE_API_DOCS === 'true' || process.env.NODE_ENV !== 'production') {
    await app.register(swaggerUi, {
      routePrefix: '/documentation',
      uiConfig: { docExpansion: 'list', deepLinking: true },
      staticCSP: true,
    })
  }
}

module.exports = registerOpenApi
