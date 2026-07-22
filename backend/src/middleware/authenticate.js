async function authenticate(req, reply) {
  try {
    await req.jwtVerify()
    if (req.user.type !== 'access') {
      return reply.status(401).send({ error: 'Token tidak valid', code: 'INVALID_TOKEN_TYPE' })
    }
  } catch (err) {
    return reply.status(401).send({ error: 'Tidak terautentikasi' })
  }
}

module.exports = authenticate
