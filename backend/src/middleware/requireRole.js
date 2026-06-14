function requireRole(role) {
  return async function (req, reply) {
    if (req.user.role !== role) {
      return reply.status(403).send({ error: 'Akses ditolak: hak akses tidak cukup' })
    }
  }
}

module.exports = requireRole
