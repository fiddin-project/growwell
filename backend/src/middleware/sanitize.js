const sanitizeHtml = require('sanitize-html')

const MAX_LENGTHS = {
  username: 50,
  nama_lengkap: 100,
  password: 128,
  nama: 100,
  judul: 255,
  judul_en: 255,
  deskripsi: 5000,
  deskripsi_en: 5000,
  spesialisasi: 200,
  spesialisasi_en: 200,
  pesan_default: 500,
  pesan_default_en: 500,
  nomor_whatsapp: 20,
  teks_pertanyaan: 500,
  teks_pertanyaan_en: 500,
  nama_skala: 100,
  nama_skala_en: 100,
  id_skala: 10,
  url_atau_file: 500,
}

function sanitizeString(str) {
  if (typeof str !== 'string') return str
  return sanitizeHtml(str, { allowedTags: [], allowedAttributes: {} }).trim()
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj
  const sanitized = Array.isArray(obj) ? [...obj] : { ...obj }
  for (const key of Object.keys(sanitized)) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key])
      const maxLen = MAX_LENGTHS[key]
      if (maxLen && sanitized[key].length > maxLen) {
        sanitized[key] = sanitized[key].substring(0, maxLen)
      }
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key])
    }
  }
  return sanitized
}

async function sanitize(req, reply) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body)
  }
}

module.exports = sanitize
module.exports.sanitizeString = sanitizeString
module.exports.MAX_LENGTHS = MAX_LENGTHS
