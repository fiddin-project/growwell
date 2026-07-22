const { buildApp: buildProductionApp } = require('../src/app')

async function buildApp(opts = {}) {
  return buildProductionApp({
    ...opts,
    logger: opts.logger ?? false,
    jwtSecret: opts.jwtSecret || 'test-secret-key',
  })
}

function signToken(app, payload) {
  return app.jwt.sign({ ...payload, type: 'access' }, { expiresIn: '1h' })
}

module.exports = { buildApp, signToken }
