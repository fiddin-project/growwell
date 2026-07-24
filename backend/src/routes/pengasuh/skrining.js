const prisma = require('../../lib/prisma')
const authenticate = require('../../middleware/authenticate')
const requireRole = require('../../middleware/requireRole')
const validateIdParam = require('../../middleware/validateIdParam')
const ROLES = require('../../lib/roles')
const { determineKategori } = require('../../services/scoring')
const crypto = require('node:crypto')
const { getScreeningForm } = require('../../services/screeningForm')

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function submissionHash(anakId, revision, answers) {
  const normalized = [...answers]
    .map((item) => ({ id_pertanyaan: Number(item.id_pertanyaan), jawaban: item.jawaban }))
    .sort((a, b) => a.id_pertanyaan - b.id_pertanyaan)
  return crypto.createHash('sha256')
    .update(JSON.stringify({ anak_id: Number(anakId), instrument_revision: revision || null, jawaban: normalized }))
    .digest('hex')
}

function storedScreeningResponse(screening, replayed = false) {
  return {
    id: screening.id,
    anak_id: screening.anak_id,
    client_submission_id: screening.client_submission_id,
    tanggal_skrining: screening.tanggal_skrining,
    total_score: screening.total_score,
    kategori_total: screening.kategori_total,
    instrument_revision: screening.instrument_revision,
    per_skala: (screening.hasilSkala || []).map((item) => ({
      id_skala: item.id_skala,
      skor: item.skor,
      kategori: item.kategori,
    })),
    jawaban: (screening.jawaban || []).map((item) => ({
      id_pertanyaan: item.id_pertanyaan,
      jawaban: item.jawaban,
      skor_diberikan: item.skor_diberikan,
    })),
    replayed,
  }
}

async function routes(fastify, opts) {
  fastify.get('/api/pengasuh/skrining/:anakId', { preHandler: [authenticate, requireRole(ROLES.PENGASUH)] }, async (req, reply) => {
    try {
      const { anakId } = req.params

      const anak = await prisma.anak.findUnique({ where: { id: parseInt(anakId) } })
      if (!anak) {
        return reply.status(404).send({ error: 'Data anak tidak ditemukan' })
      }

      const skrining = await prisma.skrining.findMany({
        where: { anak_id: parseInt(anakId) },
        include: {
          pengasuh: { select: { id: true, nama_lengkap: true } },
        },
        orderBy: { tanggal_skrining: 'desc' },
      })

      return reply.send(skrining.map(({ pengasuh, ...item }) => ({ ...item, performer: pengasuh })))
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
          pengasuh: { select: { id: true, nama_lengkap: true } },
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
      const result = {
        id: skrining.id,
        anak_id: skrining.anak_id,
        tanggal_skrining: skrining.tanggal_skrining,
        total_score: skrining.total_score,
        kategori_total: skrining.kategori_total,
        performer: skrining.pengasuh,
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
      const { anak_id, jawaban, client_submission_id, instrument_revision } = req.body || {}

      if (!anak_id || !jawaban || !Array.isArray(jawaban) || jawaban.length === 0) {
        return reply.status(400).send({ error: 'anak_id dan jawaban wajib diisi' })
      }
      if (client_submission_id && !UUID_PATTERN.test(client_submission_id)) {
        return reply.status(400).send({ error: 'client_submission_id tidak valid', code: 'INVALID_SUBMISSION_ID' })
      }

      const currentHash = submissionHash(anak_id, instrument_revision, jawaban)
      if (client_submission_id) {
        const existingSubmission = await prisma.skrining.findUnique({
          where: { client_submission_id },
          include: { hasilSkala: true, jawaban: true },
        })
        if (existingSubmission) {
          if (existingSubmission.submission_hash !== currentHash) {
            return reply.status(409).send({ error: 'Submission ID telah digunakan untuk payload lain', code: 'IDEMPOTENCY_CONFLICT' })
          }
          return reply.status(200).send(storedScreeningResponse(existingSubmission, true))
        }
      }

      const [anak, screeningForm] = await Promise.all([
        prisma.anak.findUnique({ where: { id: parseInt(anak_id) } }),
        getScreeningForm(prisma),
      ])
      if (!anak) {
        return reply.status(404).send({ error: 'Data anak tidak ditemukan' })
      }
      if (instrument_revision && instrument_revision !== screeningForm.instrument_revision) {
        return reply.status(409).send({ error: 'Instrumen skrining telah berubah', code: 'INSTRUMENT_REVISION_STALE' })
      }
      const ambangBatas = screeningForm.thresholds

      const pertanyaanIds = jawaban.map(item => parseInt(item.id_pertanyaan))
      const uniqueQuestionIds = new Set(pertanyaanIds)
      const expectedQuestionIds = new Set(screeningForm.questions.map((item) => item.id))
      if (
        jawaban.length !== screeningForm.questions.length ||
        uniqueQuestionIds.size !== jawaban.length ||
        [...uniqueQuestionIds].some((id) => !expectedQuestionIds.has(id))
      ) {
        return reply.status(400).send({
          error: 'Semua pertanyaan harus dijawab tepat satu kali',
          code: 'ANSWERS_INCOMPLETE_OR_DUPLICATE',
        })
      }
      const pertanyaanList = screeningForm.questions

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
            client_submission_id: client_submission_id || null,
            submission_hash: client_submission_id ? currentHash : null,
            instrument_revision: screeningForm.instrument_revision,
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
          client_submission_id: skrining.client_submission_id,
          tanggal_skrining: skrining.tanggal_skrining,
          total_score: skrining.total_score,
          kategori_total: skrining.kategori_total,
          instrument_revision: screeningForm.instrument_revision,
          per_skala: perSkala,
          jawaban: jawabanRecords,
          replayed: false,
        }
      })

      return reply.status(201).send(result)
    } catch (err) {
      if (err?.code === 'P2002' && req.body?.client_submission_id) {
        const existingSubmission = await prisma.skrining.findUnique({
          where: { client_submission_id: req.body.client_submission_id },
          include: { hasilSkala: true, jawaban: true },
        })
        const hash = submissionHash(req.body.anak_id, req.body.instrument_revision, req.body.jawaban || [])
        if (existingSubmission?.submission_hash === hash) {
          return reply.status(200).send(storedScreeningResponse(existingSubmission, true))
        }
        return reply.status(409).send({ error: 'Submission ID telah digunakan untuk payload lain', code: 'IDEMPOTENCY_CONFLICT' })
      }
      req.log.error({ err }, 'Gagal menyimpan data skrining')
      return reply.status(500).send({ error: 'Gagal menyimpan data skrining' })
    }
  })
}

module.exports = routes
