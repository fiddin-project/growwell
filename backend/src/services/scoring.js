function calculateAge(tanggalLahir) {
  const today = new Date()
  const birth = new Date(tanggalLahir)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

function determineKategori(score, ambang, isReversed) {
  if (isReversed) {
    if (score > ambang.batas_borderline_max) return 'Normal'
    if (score > ambang.batas_normal_max) return 'Borderline'
    return 'Abnormal'
  }
  if (score <= ambang.batas_normal_max) return 'Normal'
  if (score <= ambang.batas_borderline_max) return 'Borderline'
  return 'Abnormal'
}

module.exports = { calculateAge, determineKategori }
