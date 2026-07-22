async function routes(fastify) {
  fastify.get('/documentation/json', {
    schema: { hide: true },
  }, async () => fastify.swagger())
}

module.exports = routes
