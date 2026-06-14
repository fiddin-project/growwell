const prisma = require('../../lib/prisma')
const authenticate = require('../../middleware/authenticate')
const requireRole = require('../../middleware/requireRole')
const ROLES = require('../../lib/roles')

async function routes(fastify, opts) {
  fastify.get('/api/pengasuh/monitoring/:anakId', { preHandler: [authenticate, requireRole(ROLES.PENGASUH)] }, async (req, reply) => {
    try {
      const { anakId } = req.params

      const anak = await prisma.anak.findUnique({
        where: { id: parseInt(anakId) },
      })
      if (!anak || anak.created_by !== req.user.id) {
        return reply.status(404).send({ error: 'Data anak tidak ditemukan' })
      }

      const skriningList = await prisma.skrining.findMany({
        where: {
          anak_id: parseInt(anakId),
          pengasuh_id: req.user.id,
        },
        include: {
          hasilSkala: {
            include: {
              skala: true,
            },
          },
        },
        orderBy: { tanggal_skrining: 'desc' },
      })

      const riwayat = skriningList.map(s => ({
        id: s.id,
        tanggal_skrining: s.tanggal_skrining,
        total_score: s.total_score,
        kategori_total: s.kategori_total,
        per_skala: s.hasilSkala.map(hs => ({
          id_skala: hs.id_skala,
          skor: hs.skor,
          kategori: hs.kategori,
          nama_skala: hs.skala.nama_skala,
        })),
      }))

      return reply.send({
        anak: {
          nama: anak.nama,
          tanggal_lahir: anak.tanggal_lahir,
          jenis_kelamin: anak.jenis_kelamin,
        },
        riwayat,
      })
    } catch (err) {
      return reply.status(500).send({ error: 'Gagal mengambil data monitoring' })
    }
  })
}

module.exports = routes
