const prisma = require('../../lib/prisma')
const authenticate = require('../../middleware/authenticate')
const requireRole = require('../../middleware/requireRole')
const ROLES = require('../../lib/roles')

async function routes(fastify, opts) {
  fastify.get(
    '/api/admin/dashboard',
    { preHandler: [authenticate, requireRole(ROLES.ADMIN)] },
    async (req, reply) => {
      try {
        const totalPengasuh = await prisma.user.count({ where: { role: ROLES.PENGASUH } })
        const totalSkrining = await prisma.skrining.count()

        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

        const skriningPerBulan = await prisma.$queryRaw`
          SELECT DATE_FORMAT(tanggal_skrining, '%Y-%m') as bulan, COUNT(*) as count
          FROM Skrining
          WHERE tanggal_skrining >= ${sixMonthsAgo}
          GROUP BY DATE_FORMAT(tanggal_skrining, '%Y-%m')
          ORDER BY bulan ASC
        `

        const serializedSkriningPerBulan = skriningPerBulan.map((row) => ({
          bulan: row.bulan,
          count: Number(row.count),
        }))

        const kategoriGroups = await prisma.skrining.groupBy({
          by: ['kategori_total'],
          _count: { kategori_total: true },
        })

        const distribusiKategori = { Normal: 0, Borderline: 0, Abnormal: 0 }
        for (const group of kategoriGroups) {
          if (distribusiKategori.hasOwnProperty(group.kategori_total)) {
            distribusiKategori[group.kategori_total] = group._count.kategori_total
          }
        }

        return reply.send({
          totalPengasuh,
          totalSkrining,
          skriningPerBulan: serializedSkriningPerBulan,
          distribusiKategori,
        })
      } catch (err) {
        return reply.status(500).send({ error: 'Terjadi kesalahan pada server' })
      }
    }
  )
}

module.exports = routes
