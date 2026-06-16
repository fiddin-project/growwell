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

module.exports = { determineKategori }
