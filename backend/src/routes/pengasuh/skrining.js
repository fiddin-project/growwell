const prisma = require('../../lib/prisma')
const authenticate = require('../../middleware/authenticate')
const requireRole = require('../../middleware/requireRole')
const validateIdParam = require('../../middleware/validateIdParam')
const ROLES = require('../../lib/roles')
const { determineKategori } = require('../../services/scoring')

async function routes(fastify, opts) {
  fastify.get('/api/pengasuh/skrining/:anakId', { preHandler: [authenticate, requireRole(ROLES.PENGASUH)] }, async (req, reply) => {
    try {
      const { anakId } = req.params

      const anak = await prisma.anak.findUnique({ where: { id: parseInt(anakId) } })
      if (!anak || anak.created_by !== req.user.id) {
        return reply.status(404).send({ error: 'Data anak tidak ditemukan' })
      }

      const skrining = await prisma.skrining.findMany({
        where: {
          anak_id: parseInt(anakId),
          pengasuh_id: req.user.id,
        },
        orderBy: { tanggal_skrining: 'desc' },
      })

      return reply.send(skrining)
    } catch (err) {
      return reply.status(500).send({ error: 'Gagal mengambil data skrining' })
    }
  })

  fastify.get('/api/pengasuh/skrining/detail/:id', { preHandler: [authenticate, requireRole(ROLES.PENGASUH), validateIdParam] }, async (req, reply) => {
    try {
      const { id } = req.params

      const skrining = await prisma.skrining.findUnique({
        where: { id: parseInt(id) },
        include: {
          anak: true,
          hasilSkala: true,
          jawaban: {
            include: {
              pertanyaan: true,
            },
          },
        },
      })

      if (!skrining) {
        return reply.status(404).send({ error: 'Data skrining tidak ditemukan' })
      }
      if (skrining.pengasuh_id !== req.user.id) {
        return reply.status(403).send({ error: 'Akses ditolak' })
      }

      const result = {
        id: skrining.id,
        anak_id: skrining.anak_id,
        tanggal_skrining: skrining.tanggal_skrining,
        total_score: skrining.total_score,
        kategori_total: skrining.kategori_total,
        per_skala: skrining.hasilSkala.map(hs => ({
          id_skala: hs.id_skala,
          skor: hs.skor,
          kategori: hs.kategori,
        })),
      }

      return reply.send(result)
    } catch (err) {
      return reply.status(500).send({ error: 'Gagal mengambil detail skrining' })
    }
  })

  fastify.post('/api/pengasuh/skrining', { preHandler: [authenticate, requireRole(ROLES.PENGASUH)] }, async (req, reply) => {
    try {
      const { anak_id, jawaban } = req.body

      if (!anak_id || !jawaban || !Array.isArray(jawaban) || jawaban.length === 0) {
        return reply.status(400).send({ error: 'anak_id dan jawaban wajib diisi' })
      }

      const anak = await prisma.anak.findUnique({ where: { id: parseInt(anak_id) } })
      if (!anak) {
        return reply.status(404).send({ error: 'Data anak tidak ditemukan' })
      }
      if (anak.created_by !== req.user.id) {
        return reply.status(403).send({ error: 'Akses ditolak' })
      }

      const ambangBatas = await prisma.ambangBatas.findMany()

      const pertanyaanIds = jawaban.map(item => parseInt(item.id_pertanyaan))
      const pertanyaanList = await prisma.pertanyaan.findMany({
        where: { id: { in: pertanyaanIds } },
        include: { skala: true },
      })

      const pertanyaanMap = {}
      for (const p of pertanyaanList) {
        pertanyaanMap[p.id] = p
      }

      const skalaScores = {}
      const jawabanRecords = []

      for (const item of jawaban) {
        const pertanyaan = pertanyaanMap[parseInt(item.id_pertanyaan)]

        if (!pertanyaan) {
          return reply.status(400).send({ error: `Pertanyaan dengan id ${item.id_pertanyaan} tidak ditemukan` })
        }

        let skorDiberikan
        const jwb = item.jawaban
        if (jwb === 'tidak_benar') skorDiberikan = pertanyaan.skor_tidak_benar
        else if (jwb === 'agak_benar') skorDiberikan = pertanyaan.skor_agak_benar
        else if (jwb === 'selalu_benar') skorDiberikan = pertanyaan.skor_selalu_benar
        else {
          return reply.status(400).send({ error: `Jawaban tidak valid: ${jwb}. Gunakan tidak_benar, agak_benar, atau selalu_benar` })
        }

        if (!skalaScores[pertanyaan.id_skala]) {
          skalaScores[pertanyaan.id_skala] = 0
        }
        skalaScores[pertanyaan.id_skala] += skorDiberikan

        jawabanRecords.push({
          id_pertanyaan: pertanyaan.id,
          jawaban: jwb,
          skor_diberikan: skorDiberikan,
        })
      }

      let totalScore = 0
      const skalaTotalExclude = ['Pro']
      for (const [idSkala, skor] of Object.entries(skalaScores)) {
        if (!skalaTotalExclude.includes(idSkala)) {
          totalScore += skor
        }
      }

      const perSkala = []
      for (const [idSkala, skor] of Object.entries(skalaScores)) {
        const ambang = ambangBatas.find(a => a.id_skala === idSkala)
        let kategori = 'Unknown'
        if (ambang) {
          kategori = determineKategori(skor, ambang, ambang.is_reversed)
        } else if (idSkala === 'Pro') {
          const totalAmbang = ambangBatas.find(a => a.id_skala === null)
          if (totalAmbang) {
            kategori = determineKategori(skor, totalAmbang, false)
          }
        }
        perSkala.push({ id_skala: idSkala, skor, kategori })
      }

      let kategoriTotal = 'Unknown'
      const totalAmbang = ambangBatas.find(a => a.id_skala === null)
      if (totalAmbang) {
        kategoriTotal = determineKategori(totalScore, totalAmbang, false)
      }

      const result = await prisma.$transaction(async (tx) => {
        const skrining = await tx.skrining.create({
          data: {
            anak_id: parseInt(anak_id),
            pengasuh_id: req.user.id,
            total_score: totalScore,
            kategori_total: kategoriTotal,
          },
        })

        const hasilSkalaRecords = perSkala.map(ps => ({
          skrining_id: skrining.id,
          id_skala: ps.id_skala,
          skor: ps.skor,
          kategori: ps.kategori,
        }))

        if (hasilSkalaRecords.length > 0) {
          await tx.hasilSkala.createMany({ data: hasilSkalaRecords })
        }

        const jawabanToCreate = jawabanRecords.map(j => ({
          skrining_id: skrining.id,
          id_pertanyaan: j.id_pertanyaan,
          jawaban: j.jawaban,
          skor_diberikan: j.skor_diberikan,
        }))

        if (jawabanToCreate.length > 0) {
          await tx.jawaban.createMany({ data: jawabanToCreate })
        }

        return {
          id: skrining.id,
          anak_id: skrining.anak_id,
          total_score: skrining.total_score,
          kategori_total: skrining.kategori_total,
          per_skala: perSkala,
          jawaban: jawabanRecords,
        }
      })

      return reply.status(201).send(result)
    } catch (err) {
      return reply.status(500).send({ error: 'Gagal menyimpan data skrining' })
    }
  })
}

module.exports = routes
