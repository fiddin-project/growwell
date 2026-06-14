const prisma = require('../../lib/prisma')
const authenticate = require('../../middleware/authenticate')
const requireRole = require('../../middleware/requireRole')
const validateIdParam = require('../../middleware/validateIdParam')
const ROLES = require('../../lib/roles')
const defaultThresholds = require('../../lib/defaultThresholds')

async function routes(fastify, opts) {
  fastify.get(
    '/api/admin/ambang-batas',
    { preHandler: [authenticate, requireRole(ROLES.ADMIN)] },
    async (req, reply) => {
      try {
        const thresholds = await prisma.ambangBatas.findMany({
          include: { skala: true },
        })
        return reply.send(thresholds)
      } catch (err) {
        return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
      }
    }
  )

  fastify.put(
    '/api/admin/ambang-batas/:id',
    { preHandler: [authenticate, requireRole(ROLES.ADMIN), validateIdParam] },
    async (req, reply) => {
      try {
        const { batas_normal_max, batas_borderline_max } = req.body
        const threshold = await prisma.ambangBatas.update({
          where: { id: req.params.id },
          data: { batas_normal_max, batas_borderline_max },
        })
        return reply.status(200).send(threshold)
      } catch (err) {
        return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
      }
    }
  )

  fastify.post(
    '/api/admin/ambang-batas/reset',
    { preHandler: [authenticate, requireRole(ROLES.ADMIN)] },
    async (req, reply) => {
      try {
        const thresholds = await prisma.$transaction(async (tx) => {
          await tx.ambangBatas.deleteMany()
          await tx.ambangBatas.createMany({ data: defaultThresholds })
          return tx.ambangBatas.findMany()
        })
        return reply.status(200).send(thresholds)
      } catch (err) {
        return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
      }
    }
  )
}

module.exports = routes
