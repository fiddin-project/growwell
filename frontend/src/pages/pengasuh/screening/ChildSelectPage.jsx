import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { mockAnak, mockSkrining } from '../../../data/mockData'
import { calculateAge } from '../../../lib/scoring'
import * as api from '../../../api/pengasuh'
import toast from 'react-hot-toast'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { Plus, User, User2, CalendarDays, Stethoscope } from 'lucide-react'
import Button from '../../../components/ui/Button'
import PageHeader from '../../../components/ui/PageHeader'
import SearchBar from '../../../components/ui/SearchBar'
import { formatDate, getCategoryColor } from '../../../lib/utils'

export default function ChildSelectPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [children, setChildren] = useState([])
  const [lastScreenings, setLastScreenings] = useState({})

  useEffect(() => {
    let cancelled = false
    async function fetchChildren() {
      let childrenList = []
      try {
        const data = await api.getChildren()
        if (Array.isArray(data)) {
          childrenList = data
        }
      } catch {
        childrenList = mockAnak
        toast.error(t('toast_error_api'))
      }

      const screeningsMap = {}
      await Promise.all(
        childrenList.map(async (child) => {
          try {
            const screenings = await api.getScreenings(child.id)
            if (Array.isArray(screenings) && screenings.length > 0) {
              screeningsMap[child.id] = screenings.sort(
                (a, b) => new Date(b.tanggal_skrining) - new Date(a.tanggal_skrining)
              )[0]
            }
          } catch {
            const fallback = mockSkrining
              .filter((s) => s.anak_id === child.id)
              .sort((a, b) => new Date(b.tanggal_skrining) - new Date(a.tanggal_skrining))
            if (fallback[0]) screeningsMap[child.id] = fallback[0]
          }
        })
      )

      if (!cancelled) {
        setChildren(childrenList)
        setLastScreenings(screeningsMap)
      }
    }
    fetchChildren().finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user.id])

  const filteredChildren = children.filter((child) =>
    !search || child.nama.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="page-enter">
        <PageHeader
          icon={Stethoscope}
          title={t('screening_select_child')}
          subtitle={t('pengasuh_screening_subtitle')}
          action={<Button onClick={() => navigate('/pengasuh/screening/new-child')} className="shrink-0"><Plus size={20} />{t('screening_new_child')}</Button>}
          gradient
        />
        <LoadingSpinner fullPage />
      </div>
    )
  }

  if (children.length === 0) {
    return (
      <div className="page-enter">
        <PageHeader
          icon={Stethoscope}
          title={t('screening_select_child')}
          subtitle={t('pengasuh_screening_subtitle')}
          action={<Button onClick={() => navigate('/pengasuh/screening/new-child')} className="shrink-0"><Plus size={20} />{t('screening_new_child')}</Button>}
          gradient
        />
        <div className="empty-state">
          <div className="empty-state-icon">
            <User size={48} aria-hidden="true" />
          </div>
          <p className="empty-state-text">{t('no_children')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-enter">
      <PageHeader
        icon={Stethoscope}
        title={t('screening_select_child')}
        subtitle={t('pengasuh_screening_subtitle')}
        action={<Button onClick={() => navigate('/pengasuh/screening/new-child')} className="shrink-0"><Plus size={20} />{t('screening_new_child')}</Button>}
        gradient
      />

      <SearchBar value={search} onChange={setSearch} onClear={setSearch} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredChildren.map((child) => {
          const age = calculateAge(child.tanggal_lahir)
          const lastScreening = lastScreenings[child.id] || null

          return (
            <div key={child.id} className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2.5 rounded-full ${child.jenis_kelamin === 'L' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                  {child.jenis_kelamin === 'L' ? <User size={22} aria-hidden="true" /> : <User2 size={22} aria-hidden="true" />}
                </div>
                <div>
                  <h3 className="text-body-strong">{child.nama}</h3>
                  <p className="text-caption">
                    {t('age')}: {age} {t('years')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-caption mb-4">
                <CalendarDays size={14} aria-hidden="true" />
                <span>
                  {t('screening_last')}:{' '}
                  {lastScreening ? formatDate(lastScreening.tanggal_skrining) : '-'}
                </span>
                {lastScreening && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${getCategoryColor(lastScreening.kategori_total)}`}>
                    {t((lastScreening.kategori_total || '').toLowerCase())}
                  </span>
                )}
              </div>
              <button
                className="btn-primary w-full justify-center"
                onClick={() => navigate(`/pengasuh/screening/${child.id}`)}
              >
                {t('screening_start')}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
