import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import * as api from '../../api/pengasuh'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { MessageCircle, MessageCircleMore } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import toast from 'react-hot-toast'
import SearchBar from '../../components/ui/SearchBar'

export default function PsikologPage() {
  const { t, i18n } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [psikologList, setPsikologList] = useState([])

  useEffect(() => {
    let cancelled = false
    async function fetchPsikolog() {
      try {
        const data = await api.getPsikolog()
        if (Array.isArray(data)) {
          if (!cancelled) setPsikologList(data)
          return
        }
      } catch (err) {
        console.error('Failed to load psychologists:', err)
        if (!cancelled) setPsikologList([])
        toast.error(t('toast_error_api'))
      }
    }
    fetchPsikolog().finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [t])

  const getSpecialization = (item) =>
    i18n.language === 'id' ? item.spesialisasi : item.spesialisasi_en

  const getPesan = (item) =>
    i18n.language === 'id' ? item.pesan_default : item.pesan_default_en

  const handleChat = (item) => {
    const message = encodeURIComponent(getPesan(item))
    const url = `https://wa.me/${item.nomor_whatsapp}?text=${message}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const filteredPsikolog = psikologList.filter((p) =>
    !search || p.nama.toLowerCase().includes(search.toLowerCase()) || p.spesialisasi.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page-enter">
      <PageHeader
        icon={MessageCircleMore}
        title={t('nav_psychologist')}
        subtitle={t('pengasuh_psikolog_subtitle')}
        gradient
      />

      <SearchBar value={search} onChange={setSearch} onClear={setSearch} />

      {loading ? (
        <LoadingSpinner fullPage />
      ) : filteredPsikolog.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <MessageCircle size={48} aria-hidden="true" />
          </div>
          <p className="empty-state-text">{t('no_data')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPsikolog.map((item) => (
            <div key={item.id} className="card">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
                  {item.nama.charAt(0)}
                </div>
                <div>
                  <h3 className="text-body-strong">{item.nama}</h3>
                  <p className="text-caption">{getSpecialization(item)}</p>
                </div>
              </div>
              <button
                className="btn-primary w-full justify-center"
                onClick={() => handleChat(item)}
                aria-label={t('psikolog_chat') + ': ' + item.nama}
              >
                <MessageCircle size={16} aria-hidden="true" />
                {t('psikolog_chat')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
