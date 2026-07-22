import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Stethoscope, BookOpen, LineChart, MessageCircle, LayoutDashboard } from 'lucide-react'
import * as api from '../../api/pengasuh'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import PageHeader from '../../components/ui/PageHeader'
import { formatDate, getCategoryColor } from '../../lib/utils'

const menuCards = [
  { key: 'screening', icon: Stethoscope, to: '/pengasuh/screening', label: 'dashboard_menu_screening', desc: 'dashboard_menu_screening_desc' },
  { key: 'education', icon: BookOpen, to: '/pengasuh/edukasi', label: 'dashboard_menu_education', desc: 'dashboard_menu_education_desc' },
  { key: 'monitoring', icon: LineChart, to: '/pengasuh/monitoring', label: 'dashboard_menu_monitoring', desc: 'dashboard_menu_monitoring_desc' },
  { key: 'psychologist', icon: MessageCircle, to: '/pengasuh/psikolog', label: 'dashboard_menu_psychologist', desc: 'dashboard_menu_psychologist_desc' },
]

export default function DashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => {
    let cancelled = false
    async function fetchDashboard() {
      try {
        const data = await api.getDashboard()
        if (data && data.recentScreenings) {
          if (!cancelled) setRecentActivity(data.recentScreenings.slice(0, 3))
          return
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err)
        if (!cancelled) setRecentActivity([])
      }
    }
    fetchDashboard().finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user.id])

  const getChildName = (screening) => {
    if (screening.anak?.nama) return screening.anak.nama
    return '-'
  }

  const handleKeyDown = (e, to) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      navigate(to)
    }
  }

  return (
    <div className="page-enter">
      <PageHeader
        icon={LayoutDashboard}
        title={<>{t('greeting_hello')}, {user?.nama_lengkap}!</>}
        subtitle={t('dashboard_subtitle')}
        gradient
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {menuCards.map((item) => (
          <button
            key={item.key}
            className="card cursor-pointer text-left w-full"
            onClick={() => navigate(item.to)}
            aria-label={t(item.label)}
          >
            <div className="flex flex-col items-center text-center py-4">
              <div className="p-3 rounded-full bg-primary/10 text-primary mb-3">
                <item.icon size={28} aria-hidden="true" />
              </div>
              <h3 className="text-body-strong">{t(item.label)}</h3>
              <p className="text-caption mt-1">{t(item.desc)}</p>
            </div>
          </button>
        ))}
      </div>

      <div>
        <h2 className="font-headline-md text-headline-md mb-4" style={{ color: '#8B6914' }}>{t('recent_activity')}</h2>
        {loading ? (
          <LoadingSpinner fullPage />
        ) : recentActivity.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Stethoscope size={40} aria-hidden="true" />
            </div>
            <p className="empty-state-text">{t('no_data')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((screening) => (
              <div
                key={screening.id}
                className="card flex items-center justify-between cursor-pointer"
                onClick={() => navigate(`/pengasuh/monitoring/${screening.anak_id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => handleKeyDown(e, `/pengasuh/monitoring/${screening.anak_id}`)}
              >
                <div>
                  <p className="text-body-strong">{getChildName(screening)}</p>
                  <p className="text-caption">{formatDate(screening.tanggal_skrining)}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${getCategoryColor(screening.kategori_total)}`}>
                  {t((screening.kategori_total || '').toLowerCase())}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
