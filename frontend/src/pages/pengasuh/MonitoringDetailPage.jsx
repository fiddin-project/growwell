import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { calculateAge } from '../../lib/scoring'
import * as api from '../../api/pengasuh'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { ArrowLeft, Eye, User, User2 } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { formatDate, getSkalaName } from '../../lib/utils'

function CustomTooltip({ active, payload, label }) {
  const { t } = useTranslation()
  if (active && payload && payload.length) {
    return (
      <div className="card p-2 text-sm" style={{ boxShadow: 'rgba(16,24,40,0.04) 0px 1px 4px' }}>
        <p className="text-caption">{label}</p>
        <p className="text-body-strong">
          {t('screening_total_score')}: {payload[0].value}
        </p>
      </div>
    )
  }
  return null
}

export default function MonitoringDetailPage() {
  const { t, i18n } = useTranslation()
  const { childId } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [child, setChild] = useState(null)
  const [screenings, setScreenings] = useState([])
  const [selectedScreening, setSelectedScreening] = useState(null)
  const [skalaList, setSkalaList] = useState([])
  const [thresholds, setThresholds] = useState([])

  useEffect(() => {
    let cancelled = false
    async function fetchMonitoring() {
      try {
        const data = await api.getMonitoring(parseInt(childId))
        if (data && !cancelled) {
          if (data.anak) setChild(data.anak)
          if (data.threshold_total) {
            setThresholds([{ id_skala: null, ...data.threshold_total }])
          }
          if (data.riwayat) {
            const sorted = [...data.riwayat].sort(
              (a, b) => new Date(a.tanggal_skrining) - new Date(b.tanggal_skrining)
            )
            setScreenings(sorted)
          }
        }
      } catch (err) {
        console.error('Failed to load monitoring data:', err)
        if (!cancelled) {
          setChild(null)
          setScreenings([])
        }
      }

      try {
        const skala = await api.getSkala()
        if (skala && !cancelled) setSkalaList(skala)
      } catch (err) {
        console.error('Failed to load skala:', err)
      }

    }
    fetchMonitoring().finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [childId])

  const chartData = useMemo(
    () =>
      screenings.map((s) => ({
        date: new Date(s.tanggal_skrining).toISOString().split('T')[0],
        score: s.total_score,
        fullDate: s.tanggal_skrining,
      })),
    [screenings, i18n.language]
  )

  const totalThreshold = useMemo(() => {
    const t = thresholds.find((th) => th.id_skala === null)
    return t || { batas_normal_max: 13, batas_borderline_max: 16 }
  }, [thresholds])

  const columns = [
    {
      header: t('screening_date'),
      accessor: 'tanggal_skrining',
      sortable: true,
      render: (row) => formatDate(row.tanggal_skrining),
    },
    {
      header: t('screening_total_score'),
      accessor: 'total_score',
      sortable: true,
      render: (row) => <span className="font-medium">{row.total_score}</span>,
    },
    {
      header: t('category_distribution'),
      accessor: 'kategori_total',
      sortable: true,
      render: (row) => <Badge variant={row.kategori_total}>{t((row.kategori_total || '').toLowerCase())}</Badge>,
    },
  ]

  if (loading) {
    return (
      <div className="page-enter">
        <button className="btn-ghost mb-4" onClick={() => navigate('/pengasuh/monitoring')}>
          <ArrowLeft size={16} aria-hidden="true" />
          {t('cancel')}
        </button>
        <LoadingSpinner fullPage />
      </div>
    )
  }

  if (!child) {
    return (
      <div className="empty-state page-enter">
        <div className="empty-state-icon">
          <User size={48} aria-hidden="true" />
        </div>
        <p className="empty-state-text">{t('no_children')}</p>
      </div>
    )
  }

  const age = calculateAge(child.tanggal_lahir)

  const genderIcon = child.jenis_kelamin === 'L' ? User : User2

  return (
    <div className="page-enter">
      <PageHeader
        icon={genderIcon}
        title={child.nama}
        subtitle={`${formatDate(child.tanggal_lahir)} · ${age} ${t('years')}`}
        backTo="/pengasuh/monitoring"
        gradient
      />

      {screenings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Eye size={48} aria-hidden="true" />
          </div>
          <p className="empty-state-text">{t('no_data')}</p>
        </div>
      ) : (
        <>
          <div className="chart-container mb-6">
            <h2 className="text-subhead mb-4" style={{ color: '#8B6914' }}>{t('monitoring_score_trend')}</h2>
            {chartData.length > 0 ? (
              <div aria-label={t('monitoring_score_trend')}>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid vertical={false} strokeDasharray="0" stroke="#dedee5" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#dedee5" />
                    <YAxis domain={[0, 40]} tick={{ fontSize: 12 }} stroke="#dedee5" />
                    <Tooltip content={CustomTooltip} />
                    <ReferenceLine y={totalThreshold.batas_normal_max} stroke="rgba(20,158,97,0.3)" strokeDasharray="4 4" strokeWidth={1} />
                    <ReferenceLine y={totalThreshold.batas_borderline_max} stroke="rgba(230,126,34,0.3)" strokeDasharray="4 4" strokeWidth={1} />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#004349"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#ffffff', stroke: '#004349', strokeWidth: 3 }}
                      activeDot={{ r: 5, fill: '#ffffff', stroke: '#004349', strokeWidth: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-caption text-center py-8">{t('no_data')}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-fine-print">
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-green-500" />
                <span>{t('normal')} (0-{totalThreshold.batas_normal_max})</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-amber-500" />
                <span>{t('borderline')} ({totalThreshold.batas_normal_max + 1}-{totalThreshold.batas_borderline_max})</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-red-600" />
                <span>{t('abnormal')} ({totalThreshold.batas_borderline_max + 1}-40)</span>
              </div>
            </div>
          </div>

          <div className="table-container mb-6">
            <div className="p-6">
              <h2 className="text-subhead mb-4" style={{ color: '#8B6914' }}>{t('monitoring_history')}</h2>
              <DataTable
                columns={columns}
                data={screenings}
                searchable={false}
                pageSize={10}
                actions={(row) => (
                  <button
                    className="btn-ghost px-2 py-1 text-xs"
                    onClick={() => setSelectedScreening(row)}
                    aria-label={t('screening_result_title')}
                  >
                    <Eye size={14} aria-hidden="true" />
                    {t('screening_detail')}
                  </button>
                )}
              />
            </div>
          </div>
        </>
      )}

      <Modal
        open={!!selectedScreening}
        onClose={() => setSelectedScreening(null)}
        title={t('monitoring_sub_scores')}
        size="lg"
      >
        {selectedScreening && (
          <div>
            <p className="text-caption mb-3">
              {formatDate(selectedScreening.tanggal_skrining)} &middot;{' '}
              <Badge variant={selectedScreening.kategori_total}>
                {t((selectedScreening.kategori_total || '').toLowerCase())}
              </Badge>
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline">
                  <th className="text-left py-2 font-medium text-ink-muted">{t('field_scale')}</th>
                  <th className="text-center py-2 font-medium text-ink-muted">{t('screening_total_score')}</th>
                  <th className="text-right py-2 font-medium text-ink-muted">{t('category_distribution')}</th>
                </tr>
              </thead>
              <tbody>
                {selectedScreening.per_skala.map((ps) => (
                  <tr key={ps.id_skala} className="border-b border-divider">
                    <td className="py-2">{getSkalaName(ps.id_skala, skalaList, i18n)}</td>
                    <td className="py-2 text-center font-medium">{ps.skor}</td>
                    <td className="py-2 text-right">
                      <Badge variant={ps.kategori}>{t(ps.kategori.toLowerCase())}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  )
}
