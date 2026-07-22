const prisma = require('../../lib/prisma')
const bcrypt = require('bcryptjs')
const authenticate = require('../../middleware/authenticate')
const requireRole = require('../../middleware/requireRole')
const validateIdParam = require('../../middleware/validateIdParam')
const ROLES = require('../../lib/roles')
const { parsePagination } = require('../../lib/pagination')

const MAX_PAGE_SIZE = 100

async function routes(fastify, opts) {
  fastify.get(
    '/api/admin/users',
    { preHandler: [authenticate, requireRole(ROLES.ADMIN)] },
    async (req, reply) => {
      try {
        const { search, role } = req.query
        const pagination = parsePagination(req.query, { defaultLimit: MAX_PAGE_SIZE, maxLimit: MAX_PAGE_SIZE })
        if (!pagination) {
          return reply.status(400).send({
            error: `page harus bilangan bulat positif dan limit harus antara 1-${MAX_PAGE_SIZE}`,
            code: 'INVALID_PAGINATION',
          })
        }
        const { page, limit: take, skip } = pagination

        const where = {}
        if (role) where.role = role
        if (search) {
          where.OR = [
            { username: { contains: search } },
            { nama_lengkap: { contains: search } },
          ]
        }

        const [users, total] = await Promise.all([
          prisma.user.findMany({
            where,
            select: { id: true, username: true, nama_lengkap: true, role: true, created_at: true },
            skip,
            take,
          }),
          prisma.user.count({ where }),
        ])

        return reply.send({ data: users, total, page, limit: take })
      } catch (err) {
        return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
      }
    }
  )

  fastify.get(
    '/api/admin/users/:id',
    { preHandler: [authenticate, requireRole(ROLES.ADMIN), validateIdParam] },
    async (req, reply) => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: req.params.id },
          select: { id: true, username: true, nama_lengkap: true, role: true, created_at: true },
        })
        if (!user) {
          return reply.status(404).send({ error: 'User tidak ditemukan' })
        }
        return reply.send(user)
      } catch (err) {
        return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
      }
    }
  )

  fastify.post(
    '/api/admin/users',
    { preHandler: [authenticate, requireRole(ROLES.ADMIN)] },
    async (req, reply) => {
      try {
        const { username, nama_lengkap, password } = req.body
        if (!username || !nama_lengkap || !password) {
          return reply.status(400).send({ error: 'username, nama_lengkap, dan password wajib diisi' })
        }

        if (typeof username !== 'string' || username.length < 3 || username.length > 50) {
          return reply.status(400).send({ error: 'username harus 3-50 karakter' })
        }
        if (typeof nama_lengkap !== 'string' || nama_lengkap.length < 2 || nama_lengkap.length > 100) {
          return reply.status(400).send({ error: 'nama_lengkap harus 2-100 karakter' })
        }
        if (typeof password !== 'string' || password.length < 6 || password.length > 128) {
          return reply.status(400).send({ error: 'password harus 6-128 karakter' })
        }

        const existing = await prisma.user.findUnique({ where: { username } })
        if (existing) {
          return reply.status(400).send({ error: 'Username sudah digunakan' })
        }

        const password_hash = await bcrypt.hash(password, 10)
        const user = await prisma.user.create({
          data: { username, nama_lengkap, password_hash, role: ROLES.PENGASUH },
          select: { id: true, username: true, nama_lengkap: true, role: true, created_at: true },
        })

        return reply.status(201).send(user)
      } catch (err) {
        return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
      }
    }
  )

  fastify.put(
    '/api/admin/users/:id',
    { preHandler: [authenticate, requireRole(ROLES.ADMIN), validateIdParam] },
    async (req, reply) => {
      try {
        const id = req.params.id
        const existing = await prisma.user.findUnique({ where: { id } })
        if (!existing) {
          return reply.status(404).send({ error: 'User tidak ditemukan' })
        }

        const data = {}
        if (req.body.nama_lengkap) data.nama_lengkap = req.body.nama_lengkap
        if (req.body.username) {
          const dup = await prisma.user.findFirst({ where: { username: req.body.username, id: { not: id } } })
          if (dup) {
            return reply.status(400).send({ error: 'Username sudah digunakan' })
          }
          data.username = req.body.username
        }
        if (req.body.password) {
          data.password_hash = await bcrypt.hash(req.body.password, 10)
        }

        const user = await prisma.user.update({
          where: { id },
          data,
          select: { id: true, username: true, nama_lengkap: true, role: true, created_at: true },
        })

        return reply.status(200).send(user)
      } catch (err) {
        return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
      }
    }
  )

  fastify.delete(
    '/api/admin/users/:id',
    { preHandler: [authenticate, requireRole(ROLES.ADMIN), validateIdParam] },
    async (req, reply) => {
      try {
        const id = req.params.id

        const existing = await prisma.user.findUnique({ where: { id } })
        if (!existing) {
          return reply.status(404).send({ error: 'User tidak ditemukan' })
        }

        if (id === Number(req.user.id)) {
          return reply.status(400).send({ error: 'Tidak dapat menghapus akun Anda sendiri' })
        }

        await prisma.user.delete({ where: { id } })
        return reply.send({ message: 'User berhasil dihapus' })
      } catch (err) {
        return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
      }
    }
  )
}

module.exports = routes
