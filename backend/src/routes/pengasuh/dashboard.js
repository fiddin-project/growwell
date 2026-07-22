const prisma = require('../../lib/prisma')
const authenticate = require('../../middleware/authenticate')
const requireRole = require('../../middleware/requireRole')
const ROLES = require('../../lib/roles')

async function routes(fastify, opts) {
  fastify.get('/api/pengasuh/dashboard', { preHandler: [authenticate, requireRole(ROLES.PENGASUH)] }, async (req, reply) => {
    try {
      const recentScreenings = await prisma.skrining.findMany({
        include: {
          anak: {
            select: { id: true, nama: true },
          },
          pengasuh: {
            select: { id: true, nama_lengkap: true },
          },
        },
        orderBy: { tanggal_skrining: 'desc' },
        take: 5,
      })

      const result = recentScreenings.map(s => ({
        id: s.id,
        anak_id: s.anak_id,
        tanggal_skrining: s.tanggal_skrining,
        total_score: s.total_score,
        kategori_total: s.kategori_total,
        performer: s.pengasuh,
        anak: {
          id: s.anak.id,
          nama: s.anak.nama,
        },
      }))

      return reply.send({ recentScreenings: result })
    } catch (err) {
      return reply.status(500).send({ error: 'Gagal mengambil data dashboard' })
    }
  })
}

module.exports = routes
