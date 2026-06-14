async function authenticate(req, reply) {
  try {
    await req.jwtVerify()
  } catch (err) {
    return reply.status(401).send({ error: 'Tidak terautentikasi' })
  }
}

module.exports = authenticate
