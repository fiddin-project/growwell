import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { mockEdukasi } from '../../data/mockData'
import * as api from '../../api/pengasuh'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { FileText, Video, ExternalLink, BookOpen, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '../../components/ui/PageHeader'
import SearchBar from '../../components/ui/SearchBar'

const FILTERS = [
  { key: 'all', label: 'edu_filter_all' },
  { key: 'pdf', label: 'type_pdf' },
  { key: 'gambar', label: 'type_image' },
  { key: 'youtube', label: 'type_youtube' },
]

export default function EdukasiPage() {
  const { t, i18n } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [edukasiList, setEdukasiList] = useState([])

  useEffect(() => {
    let cancelled = false
    async function fetchEdukasi() {
      try {
        const data = await api.getEdukasi()
        if (Array.isArray(data)) {
          if (!cancelled) setEdukasiList(data)
          return
        }
      } catch (err) {
        console.error('Failed to load education:', err)
        if (!cancelled) setEdukasiList(mockEdukasi)
      }
    }
    fetchEdukasi().finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const filteredEdukasi = edukasiList.filter((e) => {
    const matchFilter = filter === 'all' || e.tipe === filter
    const matchSearch = !search || e.judul.toLowerCase().includes(search.toLowerCase()) || e.judul_en.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const getTitle = (item) => (i18n.language === 'id' ? item.judul : item.judul_en)
  const getDesc = (item) => (i18n.language === 'id' ? item.deskripsi : item.deskripsi_en)

  const handlePdfClick = (item) => {
    window.open(item.url_atau_file, '_blank', 'noopener,noreferrer')
  }

  const handleYoutubeClick = (item) => {
    window.open(item.url_atau_file, '_blank', 'noopener,noreferrer')
  }

  const getTypeMeta = (tipe) => {
    if (tipe === 'pdf') return { icon: FileText, label: t('type_pdf'), badgeClass: 'badge-info', actionLabel: t('edu_open_pdf') }
    if (tipe === 'gambar') return { icon: ImageIcon, label: t('type_image'), badgeClass: 'badge-warning', actionLabel: t('edu_open_image') }
    return { icon: Video, label: t('type_youtube'), badgeClass: 'badge-error', actionLabel: t('edu_watch') }
  }

  return (
    <div className="page-enter">
      <PageHeader
        icon={BookOpen}
        title={t('nav_education')}
        subtitle={t('pengasuh_edukasi_subtitle')}
        gradient
      />

      <SearchBar value={search} onChange={setSearch} onClear={setSearch}>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-lg border transition-colors text-on-surface ${
                filter === f.key
                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                  : 'border-outline-variant/50 hover:bg-surface-container-low'
              }`}
            >
              <span className="font-label-sm text-label-sm">{t(f.label)}</span>
            </button>
          ))}
        </div>
      </SearchBar>

      {loading ? (
        <LoadingSpinner fullPage />
      ) : filteredEdukasi.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FileText size={48} aria-hidden="true" />
          </div>
          <p className="empty-state-text">{t('no_data')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEdukasi.map((item) => (
            <div key={item.id} className="card flex flex-col">
              {item.tipe === 'gambar' && (
                <div className="mb-3 overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-low">
                  <img src={item.url_atau_file} alt={getTitle(item)} className="h-40 w-full object-cover" />
                </div>
              )}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {(() => {
                    const meta = getTypeMeta(item.tipe)
                    const TypeIcon = meta.icon
                    return <TypeIcon size={20} className="text-primary" aria-hidden="true" />
                  })()}
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${getTypeMeta(item.tipe).badgeClass}`}>
                    {getTypeMeta(item.tipe).label}
                  </span>
                </div>
              </div>
              <h3 className="text-body-strong mb-2 line-clamp-2">{getTitle(item)}</h3>
              <p className="text-caption mb-4 flex-1 line-clamp-3">{getDesc(item)}</p>
              <button
                className="btn-secondary w-full justify-center"
                onClick={() => (item.tipe === 'youtube' ? handleYoutubeClick(item) : handlePdfClick(item))}
              >
                {item.tipe === 'pdf' ? <FileText size={16} aria-hidden="true" /> : item.tipe === 'gambar' ? <ImageIcon size={16} aria-hidden="true" /> : <ExternalLink size={16} aria-hidden="true" />}
                {getTypeMeta(item.tipe).actionLabel}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
