import { mockSkala } from '../data/mockData'

export const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toISOString().split('T')[0]
}

export const formatDateLocale = (dateStr, locale = 'id-ID') => {
  if (!dateStr) return '\u2014'
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale, { month: 'short', day: '2-digit', year: 'numeric' })
}

export const getCategoryColor = (kategori) => {
  switch (kategori) {
    case 'Normal': return 'badge-success'
    case 'Borderline': return 'badge-neutral'
    case 'Abnormal': return 'badge-error'
    default: return 'badge-neutral'
  }
}

export const getSkalaName = (idSkala, i18n) => {
  const skala = mockSkala.find((s) => s.id_skala === idSkala)
  if (!skala) return idSkala
  return i18n.language === 'id' ? skala.nama_skala : skala.nama_skala_en
}

export const getField = (item, field, i18n) =>
  i18n.language === 'id' ? item[field] : item[`${field}_en`]
