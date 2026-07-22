const crypto = require('node:crypto')

function revisionFor({ questions, scales, thresholds }) {
  const scoringData = {
    questions: questions.map((question) => ({
      id: question.id,
      urutan: question.urutan,
      id_skala: question.id_skala,
      skor_tidak_benar: question.skor_tidak_benar,
      skor_agak_benar: question.skor_agak_benar,
      skor_selalu_benar: question.skor_selalu_benar,
    })),
    scales: scales.map((scale) => scale.id_skala),
    thresholds: thresholds.map((threshold) => ({
      id_skala: threshold.id_skala,
      batas_normal_max: threshold.batas_normal_max,
      batas_borderline_max: threshold.batas_borderline_max,
      is_reversed: threshold.is_reversed,
    })),
  }
  const hash = crypto.createHash('sha256').update(JSON.stringify(scoringData)).digest('hex')
  return `sha256:${hash}`
}

async function getScreeningForm(prisma) {
  const [questions, scales, thresholds] = await Promise.all([
    prisma.pertanyaan.findMany({ orderBy: [{ urutan: 'asc' }, { id: 'asc' }] }),
    prisma.skala.findMany({ orderBy: { id_skala: 'asc' } }),
    prisma.ambangBatas.findMany({ orderBy: [{ id_skala: 'asc' }, { id: 'asc' }] }),
  ])
  return {
    instrument_revision: revisionFor({ questions, scales, thresholds }),
    scales,
    questions,
    thresholds,
    answer_options: ['tidak_benar', 'agak_benar', 'selalu_benar'],
  }
}

module.exports = { getScreeningForm, revisionFor }
