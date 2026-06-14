async function validateIdParam(req, reply) {
  const id = parseInt(req.params.id)
  if (isNaN(id) || id <= 0) {
    return reply.status(400).send({ error: 'ID tidak valid' })
  }
  req.params.id = id
}

module.exports = validateIdParam
